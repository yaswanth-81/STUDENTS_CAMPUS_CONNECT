import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

export default function Signup() {
  const [showPass, setShowPass] = useState(false);
  const [showAttendancePass, setShowAttendancePass] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [attendancePassword, setAttendancePassword] = useState("");
  const [password, setPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleVerifyAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rollNumber || !attendancePassword) {
      toast({ title: "Missing fields", description: "Please enter roll number and attendance password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{
        message: string;
        verificationToken: string;
        requiresPasswordSetup: boolean;
        user: { fullName?: string };
      }>("/api/auth/verify-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: rollNumber.toUpperCase(), attendancePassword }),
      });

      if (!data.requiresPasswordSetup) {
        toast({
          title: "Account already exists",
          description: "Use your StudentsConnect password on the login page.",
        });
        navigate("/login");
        return;
      }

      setVerificationToken(data.verificationToken);
      setVerifiedName(data.user?.fullName || "");
      setVerified(true);
      toast({ title: "Attendance verified", description: "Now set your StudentsConnect password." });
    } catch (err: any) {
      toast({ title: "Verification failed", description: err?.message || "Invalid attendance credentials.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verified || !verificationToken) {
      toast({ title: "Verify attendance first", description: "Complete JNTUA attendance verification before signup.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ message: string; token: string }>("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: rollNumber.toUpperCase(), password, verificationToken }),
      });

      if (data?.token) {
        localStorage.setItem("token", data.token);
        toast({ title: "Account created!", description: data.message });
        navigate("/dashboard");
      } else {
        toast({ title: "Signup failed", description: "Invalid response from server.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Signup failed", description: err?.message || "Could not connect to server.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_hsl(0_0%_100%_/_0.08),_transparent_60%)]" />
        <div className="relative text-center px-12">
          <div className="h-16 w-16 rounded-2xl bg-card/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">Join your campus</h2>
          <p className="text-primary-foreground/70 max-w-sm">
            Create an account to start offering and finding services within your college community.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-lg gradient-bg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">StudentsConnect</span>
          </Link>

          <h1 className="font-display text-2xl font-bold mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground mb-6">Verify your JNTUA attendance account, then set StudentsConnect password</p>

          <form className="space-y-4" onSubmit={handleVerifyAttendance}>
            <div className="space-y-1.5">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                placeholder="e.g. 21A91A0501"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="attendancePassword">Attendance Password</Label>
              <div className="relative">
                <Input
                  id="attendancePassword"
                  type={showAttendancePass ? "text" : "password"}
                  placeholder="Attendance portal password"
                  value={attendancePassword}
                  onChange={(e) => setAttendancePassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowAttendancePass(!showAttendancePass)} className="absolute right-3 top-2.5 text-muted-foreground">
                  {showAttendancePass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" variant="outline" disabled={loading}>
              {loading ? "Verifying..." : "Verify Attendance"}
            </Button>
          </form>

          <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            {verified ? (
              <p className="text-sm text-muted-foreground">Verified as <span className="font-medium text-foreground">{verifiedName || rollNumber}</span></p>
            ) : (
              <p className="text-sm text-muted-foreground">Complete attendance verification to continue.</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="password">StudentsConnect Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-muted-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gradient-bg text-primary-foreground border-0" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
