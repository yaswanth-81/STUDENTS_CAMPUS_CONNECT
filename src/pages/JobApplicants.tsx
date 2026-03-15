import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Star,
  Phone,
  Mail,
  Building2,
  GraduationCap,
  CheckCircle,
  Briefcase,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch, authHeader } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ── Applicant card ──────────────────────────────────────────────────────────
function ApplicantCard({
  user,
  status,
  message,
  onAssign,
  assigning,
  applicationId,
}: {
  user: any;
  status: string;
  message?: string;
  onAssign?: () => void;
  assigning: boolean;
  applicationId?: string;
}) {
  const canAssign = status === "pending" && !!onAssign;
  const initials = (user?.fullName || user?.rollNumber || "?").charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row gap-4"
    >
      {/* Avatar */}
      <div className="shrink-0">
        {user?.profilePhotoUrl ? (
          <img
            src={user.profilePhotoUrl}
            alt={user.fullName || "Student"}
            className="h-16 w-16 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="h-16 w-16 rounded-full gradient-bg flex items-center justify-center text-xl font-bold text-primary-foreground border-2 border-border">
            {initials}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-display font-bold text-base">
              {user?.fullName || user?.rollNumber || "Student"}
            </p>
            <p className="text-sm text-muted-foreground">{user?.rollNumber}</p>
          </div>
          {status && (
            <Badge
              variant="outline"
              className={
                status === "accepted" || status === "assigned"
                  ? "bg-accent/10 text-accent border-accent/30"
                  : status === "assigned_to_others"
                  ? "bg-muted text-muted-foreground"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
              }
            >
              {status === "pending"
                ? "Pending"
                : status === "accepted"
                ? "Assigned"
                : status === "assigned_to_others"
                ? "Assigned to others"
                : status}
            </Badge>
          )}
        </div>

        {/* Contact & academic info */}
        <div className="grid sm:grid-cols-2 gap-1.5 text-sm text-muted-foreground">
          {user?.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          {user?.phoneNumber && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{user.phoneNumber}</span>
            </div>
          )}
          {(user?.branch || user?.course) && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>{[user.branch, user.course].filter(Boolean).join(" · ")}</span>
            </div>
          )}
          {(user?.classYear != null || user?.semester != null) && (
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span>
                {user.classYear != null ? `Year ${user.classYear}` : ""}
                {user.classYear != null && user.semester != null ? " · " : ""}
                {user.semester != null ? `Sem ${user.semester}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Cover message */}
        {message && (
          <div className="p-3 rounded-xl bg-muted text-sm text-foreground/80 leading-relaxed">
            "{message}"
          </div>
        )}
      </div>

      {/* Action */}
      {onAssign && (
        <div className="shrink-0 self-center">
          <Button
            disabled={!canAssign || assigning}
            onClick={onAssign}
            className="gradient-bg text-primary-foreground border-0 gap-2 min-w-[130px]"
          >
            {assigning ? (
              "Assigning..."
            ) : status === "accepted" ? (
              <>
                <CheckCircle className="h-4 w-4" /> Assigned
              </>
            ) : status === "assigned_to_others" ? (
              "Assigned to others"
            ) : (
              "Assign Work"
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function JobApplicants() {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [work, setWork] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // IDs of people who already applied (to exclude from Section 2)
  const appliedUserIds = new Set(
    applications.map((a) => String(a.applicantId?._id || a.applicantId))
  );

  // Load work + applicants + available students in parallel
  useEffect(() => {
    const load = async () => {
      if (!workId) return;
      try {
        setLoading(true);
        const headers = { ...authHeader() };

        const [workRes, appsRes, availRes] = await Promise.all([
          apiFetch<any>(`/api/work/${workId}`, { headers }),
          apiFetch<{ applications: any[] }>(`/api/application/work/${workId}`, { headers }),
          apiFetch<{ users: any[] }>("/api/profile/available", { headers }),
        ]);

        setWork(workRes);
        setApplications(appsRes.applications || []);
        setAvailableUsers(availRes.users || []);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load applicants",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workId, toast]);

  // Assign someone who applied
  const handleAssignApplicant = async (applicationId: string) => {
    try {
      setAssigningId(applicationId);
      const res = await apiFetch<{ message: string; order: any }>(
        `/api/application/${applicationId}/accept`,
        {
          method: "POST",
          headers: { ...authHeader(), "Content-Type": "application/json" },
        }
      );
      toast({ title: "Work assigned!", description: res.message });
      if (res.order?._id) {
        navigate(`/dashboard/orders/${res.order._id}`);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to assign", variant: "destructive" });
    } finally {
      setAssigningId(null);
    }
  };

  // Send request to an interested (availableForWork) student
  const handleSendRequest = async (workerUserId: string) => {
    if (!workId) return;
    try {
      setAssigningId(workerUserId);
      const res = await apiFetch<{ message: string; order: any }>(
        "/api/application/assign-interested",
        {
          method: "POST",
          headers: { ...authHeader(), "Content-Type": "application/json" },
          body: JSON.stringify({ workId, workerId: workerUserId }),
        }
      );
      toast({ title: "Request sent!", description: "The student has been notified and can view the order." });
      if (res.order?._id) {
        navigate(`/dashboard/orders/${res.order._id}`);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to send request", variant: "destructive" });
    } finally {
      setAssigningId(null);
    }
  };

  // Interested students = availableForWork=true AND not already applied AND not me (the client)
  const meId = work?.postedBy?._id ?? work?.postedBy;
  const interestedStudents = availableUsers.filter(
    (u) => !appliedUserIds.has(String(u._id)) && String(u._id) !== String(meId)
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground animate-pulse">
        Loading applicants...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold truncate">
            {work?.title || "Applicants"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Review applicants and interested students
          </p>
        </div>
        {/* Job summary chips */}
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            ₹{work?.budget}
          </Badge>
          <Badge variant="outline" className="bg-card">
            {work?.category}
          </Badge>
        </div>
      </div>

      {/* ── SECTION 1: Applied for this job ─────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Applied for this Job</h2>
            <p className="text-xs text-muted-foreground">
              {applications.length} application{applications.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-25" />
            No one has applied for this job yet.
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicantCard
                key={app._id}
                user={app.applicantId}
                status={app.status}
                message={app.message}
                applicationId={app._id}
                assigning={assigningId === app._id}
                onAssign={
                  app.status === "pending"
                    ? () => handleAssignApplicant(app._id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="relative flex items-center gap-4">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground bg-background px-2">OR</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* ── SECTION 2: Interested Students ──────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Star className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Interested Students</h2>
            <p className="text-xs text-muted-foreground">
              Students who are open to work — send them a request directly
            </p>
          </div>
        </div>

        {interestedStudents.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-25" />
            No students are currently marked as available for work.
          </div>
        ) : (
          <div className="space-y-3">
            {interestedStudents.map((u) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row gap-4"
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {u.profilePhotoUrl ? (
                    <img
                      src={u.profilePhotoUrl}
                      alt={u.fullName || "Student"}
                      className="h-16 w-16 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full gradient-bg flex items-center justify-center text-xl font-bold text-primary-foreground border-2 border-border">
                      {(u.fullName || u.rollNumber || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold text-base">
                        {u.fullName || u.rollNumber || "Student"}
                      </p>
                      <p className="text-sm text-muted-foreground">{u.rollNumber}</p>
                    </div>
                    <Badge className="bg-accent/10 text-accent border-accent/30 border gap-1">
                      <CheckCircle className="h-3 w-3" /> Available for Work
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-1.5 text-sm text-muted-foreground">
                    {u.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                    )}
                    {u.phoneNumber && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{u.phoneNumber}</span>
                      </div>
                    )}
                    {(u.branch || u.course) && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{[u.branch, u.course].filter(Boolean).join(" · ")}</span>
                      </div>
                    )}
                    {(u.classYear != null || u.semester != null) && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {u.classYear != null ? `Year ${u.classYear}` : ""}
                          {u.classYear != null && u.semester != null ? " · " : ""}
                          {u.semester != null ? `Sem ${u.semester}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Request Button */}
                <div className="shrink-0 self-center">
                  <Button
                    disabled={assigningId === u._id}
                    onClick={() => handleSendRequest(u._id)}
                    className="gradient-bg text-primary-foreground border-0 gap-2 min-w-[130px]"
                  >
                    {assigningId === u._id ? "Assigning..." : "Assign Work"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
