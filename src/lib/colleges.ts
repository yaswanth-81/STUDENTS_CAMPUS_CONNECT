export const COLLEGES = [
  { id: "jntua", name: "Jawaharlal Nehru Technological University Anantapur (JNTUA)", short: "JNTUA" },
  { id: "vjit", name: "Vidya Jyothi Institute of Technology (VJIT)", short: "VJIT" },
  { id: "veltech", name: "Vel Tech Rangarajan Dr. Sagunthala R&D Institute", short: "Vel Tech" },
  { id: "svnit", name: "Sardar Vallabhbhai National Institute of Technology (SVNIT)", short: "SVNIT" },
  { id: "dsu-c1", name: "Dayananda Sagar University – Bangalore Campus 1", short: "DSU Campus 1" },
  { id: "dsu-c2", name: "Dayananda Sagar University – Bangalore Campus 2", short: "DSU Campus 2" },
  { id: "dsu-c3", name: "Dayananda Sagar University – Bangalore Campus 3", short: "DSU Campus 3" },
] as const;

export type CollegeId = (typeof COLLEGES)[number]["id"];
