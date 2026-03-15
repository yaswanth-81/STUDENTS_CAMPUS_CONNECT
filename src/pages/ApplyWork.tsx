import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, DollarSign, Users, FileText, Send, Phone, School, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, authHeader, downloadFile } from "@/lib/api";

type WorkWithOwner = {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  applications?: { userId: string }[];
  postedBy: {
    _id: string;
    rollNumber?: string;
  };
};

export default function ApplyWork() {
  const { workId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [work, setWork] = useState<WorkWithOwner | null>(null);
  const [owner, setOwner] = useState<any | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const workRes = await apiFetch<WorkWithOwner>(`/api/work/${workId}`);
        setWork(workRes);

        // Load current user id (to know if already applied)
        const me = await apiFetch<any>("/api/profile/me", {
          headers: { ...authHeader() },
        }).catch(() => null);
        if (me?._id) setMeId(me._id);

        // Load full owner profile from users collection
        if (workRes.postedBy?._id) {
          const ownerProfile = await apiFetch<any>(`/api/profile/${workRes.postedBy._id}`);
          setOwner(ownerProfile);
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [workId, toast]);

  const hasApplied =
    !!meId && !!work?.applications?.some((a: any) => a.userId?.toString() === meId);

  const handleApply = async () => {
    if (!workId) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/work/${workId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      toast({
        title: "Application Sent!",
        description: `You applied for "${work?.title}".`,
      });
      navigate("/dashboard/orders");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to apply.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !work) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors mb-4">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-sm text-muted-foreground">Loading work details...</p>
      </div>
    );
  }

  const deadline = new Date(work.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">Apply for Work</h1>
          <p className="text-sm text-muted-foreground">Review the details before sending your request.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Owner full profile */}
        <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
          <h3 className="font-display font-semibold text-sm">Owner Details</h3>
          <div className="flex items-center gap-3">
            {owner?.profilePhotoUrl ? (
              <img
                src={owner.profilePhotoUrl}
                alt="Profile"
                className="h-12 w-12 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="h-12 w-12 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-primary-foreground">
                {(owner?.fullName || work.postedBy.rollNumber || "?")
                  .toString()
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {owner?.fullName || "Student"}
              </p>
              <p className="text-xs text-muted-foreground">
                Roll: {work.postedBy.rollNumber || "N/A"}
              </p>
              {owner?.email && (
                <p className="text-xs text-muted-foreground">{owner.email}</p>
              )}
              {owner?.phoneNumber && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {owner.phoneNumber}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground mt-3">
            {(owner?.branch || owner?.course) && (
              <p className="flex items-center gap-1">
                <School className="h-3 w-3" />
                {[owner?.branch, owner?.course].filter(Boolean).join(" · ")}
              </p>
            )}
            {(owner?.classYear || owner?.semester) && (
              <p>
                {owner?.classYear}
                {owner?.semester ? ` · Sem ${owner.semester}` : ""}
              </p>
            )}
          </div>
          {owner?.qrCodeUrl && (
            <div className="mt-3">
              <p className="text-xs font-medium mb-1">Payment QR (if needed)</p>
              <div className="h-24 w-24 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/40 overflow-hidden">
                <img
                  src={owner.qrCodeUrl}
                  alt="Payment QR"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Job full details */}
        <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {work.category}
            </Badge>
            <span className="text-xs text-green-600 dark:text-green-400">Open</span>
          </div>
          <h2 className="font-display text-lg font-bold">{work.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> Budget:
              <span className="text-foreground font-medium">₹{work.budget}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Deadline:
              <span className="text-foreground font-medium">
                {deadline.toLocaleDateString()}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {work.applications?.length || 0} applications
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
            <FileText className="h-4 w-4 mt-0.5" />
            <p>{work.description}</p>
          </div>
          {Array.isArray((work as any).attachments) && (work as any).attachments.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium">Attachments</p>
              {(work as any).attachments.map((att: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => downloadFile(att.fileUrl, att.fileName || `attachment-${idx + 1}`)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 underline break-all text-left"
                >
                  <Download className="h-3 w-3 flex-shrink-0" />
                  {att.fileName || `Attachment ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="lg"
          className="gradient-bg text-primary-foreground border-0 gap-2"
          disabled={submitting || hasApplied}
          onClick={handleApply}
        >
          <Send className="h-4 w-4" />
          {hasApplied ? "Already Applied" : submitting ? "Sending..." : "Apply Now"}
        </Button>
      </div>
    </motion.div>
  );
}

