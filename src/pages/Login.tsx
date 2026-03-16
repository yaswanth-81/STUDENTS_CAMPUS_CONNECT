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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="pt-6 px-6 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2 mb-6 w-fit">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">StudentsConnect</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Content */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-sm">
              Log in with your JNTUA credentials to access campus services
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Roll Number */}
            <div className="space-y-2">
              <Label htmlFor="attendanceRoll" className="text-gray-700 text-sm font-medium">
                Roll Number
              </Label>
              <Input
                id="attendanceRoll"
                placeholder="e.g. 21A91A0501"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                className="border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="attendancePassword" className="text-gray-700 text-sm font-medium">
                Attendance Password
              </Label>
              <div className="relative">
                <Input
                  id="attendancePassword"
                  type={showAttendancePass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={attendancePassword}
                  onChange={(e) => setAttendancePassword(e.target.value)}
                  className="border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAttendancePass(!showAttendancePass)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showAttendancePass ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg border-0 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Login"}
            </Button>
          </form>

          {/* Info Text */}
          <p className="text-center text-gray-500 text-xs mt-8">
            Use only official JNTUA attendance credentials for secure login
          </p>
        </motion.div>
      </div>
    </div>
  );
}
