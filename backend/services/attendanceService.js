const cheerio = require("cheerio");
const setCookieParser = require("set-cookie-parser");

const ATTENDANCE_BASE_URL = process.env.ATTENDANCE_BASE_URL || "https://jntuaceastudents.classattendance.in/";

function normalizeBaseUrl(url) {
  return url.endsWith("/") ? url : `${url}/`;
}

function normalizeRollNumber(input) {
  return String(input || "").trim().toUpperCase();
}

function getSetCookieValues(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const combined = headers.get("set-cookie");
  if (!combined) return [];
  return setCookieParser.splitCookiesString(combined);
}

function updateCookieJar(jar, headers) {
  const cookieHeaders = getSetCookieValues(headers);
  for (const cookieText of cookieHeaders) {
    const parsed = setCookieParser.parseString(cookieText);
    if (parsed?.name) {
      jar.set(parsed.name, parsed.value || "");
    }
  }
}

function cookieHeaderValue(jar) {
  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function extractStudentDetails(html) {
  const $ = cheerio.load(html || "");
  const details = {};

  $("div.card").each((_, card) => {
    const headerText = $(card).find("div.card-header").first().text().trim();
    if (!/my\s+details/i.test(headerText)) return;

    $(card)
      .find("li.list-group-item")
      .each((__, li) => {
        const key = $(li).find("strong").first().text().replace(/:/g, "").trim();
        const fullText = $(li).text().trim();
        const value = key ? fullText.replace($(li).find("strong").first().text(), "").trim() : "";
        if (key && value) {
          details[key] = value;
        }
      });
  });

  const inputValue = (name) => $("input[name='" + name + "']").attr("value")?.trim() || "";
  details.student_id = inputValue("roll_no") || inputValue("student_id") || inputValue("admission") || "";
  details.classname = inputValue("classname") || "";
  details.acad_year = inputValue("acad_year") || "";

  return details;
}

function pickFirst(details, keys) {
  for (const key of keys) {
    if (details[key]) return String(details[key]).trim();
  }
  return "";
}

function deriveStudentProfile(details, fallbackRollNumber) {
  const rollNumber = normalizeRollNumber(fallbackRollNumber);
  const adminNumber = pickFirst(details, ["Admin Number", "Admission Number", "student_id"]);

  const fullName = pickFirst(details, ["Name", "Student Name", "Full Name"]);
  const branch = pickFirst(details, ["Branch", "Department", "classname"]);
  const year = pickFirst(details, ["Year", "Academic Year", "acad_year"]);

  return {
    rollNumber,
    adminNumber,
    fullName,
    branch,
    year,
    college: "JNTUA",
  };
}

async function verifyAttendanceCredentials(rollNumber, attendancePassword) {
  const normalizedRoll = normalizeRollNumber(rollNumber);
  if (!normalizedRoll || !attendancePassword) {
    throw new Error("Roll number and attendance password are required");
  }

  const baseUrl = normalizeBaseUrl(ATTENDANCE_BASE_URL);
  const cookieJar = new Map();

  const loginPageRes = await fetch(baseUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!loginPageRes.ok) {
    throw new Error("Attendance portal is unavailable");
  }

  updateCookieJar(cookieJar, loginPageRes.headers);
  const loginHtml = await loginPageRes.text();
  const $ = cheerio.load(loginHtml || "");
  const secretcode = $("input[name='secretcode']").attr("value") || $("input#secretcode").attr("value") || "";

  const payload = new URLSearchParams();
  payload.set("username", normalizedRoll);
  payload.set("password", String(attendancePassword));
  if (secretcode) payload.set("secretcode", secretcode);

  const loginRes = await fetch(baseUrl, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeaderValue(cookieJar),
      Referer: baseUrl,
      Origin: baseUrl.replace(/\/$/, ""),
      "User-Agent": "Mozilla/5.0",
    },
    body: payload,
  });

  updateCookieJar(cookieJar, loginRes.headers);

  const location = loginRes.headers.get("location") || "";
  const resolvedLocation = location ? new URL(location, baseUrl).toString() : "";

  let finalUrl = loginRes.url || "";
  let loginBody = "";

  if (loginRes.status >= 300 && loginRes.status < 400 && resolvedLocation) {
    const redirected = await fetch(resolvedLocation, {
      method: "GET",
      headers: {
        Cookie: cookieHeaderValue(cookieJar),
        Referer: baseUrl,
        "User-Agent": "Mozilla/5.0",
      },
    });

    updateCookieJar(cookieJar, redirected.headers);
    finalUrl = redirected.url || resolvedLocation;
    loginBody = (await redirected.text()) || "";
  } else {
    loginBody = (await loginRes.text()) || "";
  }

  const loginSucceeded = /studenthome\.php/i.test(finalUrl) || /My\s+Details/i.test(loginBody);

  if (!loginSucceeded) {
    const err = new Error("Invalid attendance credentials");
    err.statusCode = 401;
    throw err;
  }

  const homeRes = await fetch(`${baseUrl}studenthome.php`, {
    method: "GET",
    headers: {
      Cookie: cookieHeaderValue(cookieJar),
      Referer: baseUrl,
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!homeRes.ok) {
    throw new Error("Could not fetch student details from attendance portal");
  }

  const homeHtml = await homeRes.text();
  const details = extractStudentDetails(homeHtml);
  return deriveStudentProfile(details, normalizedRoll);
}

module.exports = {
  verifyAttendanceCredentials,
};
