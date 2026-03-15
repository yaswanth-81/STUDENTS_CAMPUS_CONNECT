import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

export default function Login() {
  const [showAttendancePass, setShowAttendancePass] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [attendancePassword, setAttendancePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rollNumber || !attendancePassword) {
      toast({ title: "Missing fields", description: "Please enter roll number and attendance password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{
        message: string;
        token: string;
        user: { fullName?: string };
      }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: rollNumber.toUpperCase(), attendancePassword }),
      });

      if (data?.token) {
        localStorage.setItem("token", data.token);
        toast({
          title: "Login successful",
          description: data.user?.fullName ? `Welcome, ${data.user.fullName}` : "Attendance verified successfully.",
        });
        navigate("/dashboard");
      } else {
        toast({ title: "Login failed", description: "Invalid response from server.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err?.message || "Invalid attendance credentials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_hsl(0_0%_100%_/_0.08),_transparent_60%)]" />
        <div className="relative text-center px-12">
          <div className="h-16 w-16 rounded-2xl bg-card/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">Welcome back!</h2>
          <p className="text-primary-foreground/70 max-w-sm">
            Log in to access your campus marketplace and connect with fellow students.
          </p>
        </div>
      </div>

      {/* Form */}
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

          <h1 className="font-display text-2xl font-bold mb-1">Log in</h1>
          <p className="text-sm text-muted-foreground mb-6">Login only with your official JNTUA attendance credentials</p>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <Label htmlFor="attendanceRoll">Roll Number</Label>
              <Input
                id="attendanceRoll"
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
                <button
                  type="button"
                  onClick={() => setShowAttendancePass(!showAttendancePass)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                >
                  {showAttendancePass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gradient-bg text-primary-foreground border-0" disabled={loading}>
              {loading ? "Verifying..." : "Login with JNTUA"}
            </Button>
          </form>

        </motion.div>
      </div>
    </div>
  );
}
