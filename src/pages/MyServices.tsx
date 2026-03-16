import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, authHeader } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function MyServices() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const data = await apiFetch<{ works: any[] }>("/api/work/my", {
          method: "GET",
          headers: { ...authHeader() },
        });
        setJobs(data.works || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const handleView = async (job: any) => {
    // completed or in-progress → go straight to the order page
    const isActive = job.status === "in-progress" || job.status === "assigned" || job.status === "completed";
    if (isActive) {
      try {
        const order = await apiFetch<any>(`/api/orders/by-work/${job._id}`, {
          headers: { ...authHeader() },
        });
        if (order && order._id) {
          navigate(`/dashboard/orders/${order._id}`);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch order for work, falling back:", err);
      }
    }
    navigate(`/dashboard/my-services/${job._id}/applicants`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">My Jobs</h1>
          <p className="text-sm text-muted-foreground">Jobs you have posted on StudentsConnect</p>
        </div>
        <Link to="/dashboard/post-work">
          <Button className="gradient-bg text-primary-foreground border-0 gap-2">
            <Plus className="h-4 w-4" /> Post New Job
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
            You have not posted any jobs yet. Click{" "}
            <span className="font-medium">Post New Job</span> to create your first listing.
          </div>
        ) : (
          jobs.map((job, i) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="p-5 rounded-xl border border-border bg-card hover:card-shadow-hover transition-all flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-20 w-28 rounded-lg hero-gradient flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold gradient-text opacity-40">
                    {(job.category || "").toString().toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleView(job)}
                    className="font-display font-semibold text-sm truncate text-left hover:underline"
                    title="View applicants / order"
                  >
                    {job.title}
                  </button>
                  <p className="text-xs text-muted-foreground line-clamp-1">{job.description}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> ₹{job.budget}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(job.deadline).toLocaleDateString()}
                    </span>
                    {!(job.status === "in-progress" || job.status === "assigned") && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {(job.applications?.length ?? 0)} applications
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-2 flex items-center gap-1 w-max ${
                      job.status === "completed"
                        ? "bg-accent/10 text-accent border-accent/30"
                        : job.status === "in-progress" || job.status === "assigned"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                        : "bg-accent/10 text-accent border-accent/30"
                    }`}
                  >
                    <BadgeCheck className="h-3 w-3" />
                    {(() => {
                      if (job.status === "completed") return "Completed ✓";
                      if (job.status === "in-progress" || job.status === "assigned") return "In progress";
                      const count = job.applications?.length ?? 0;
                      if (count === 0) return "Open";
                      if (count === 1) return "1 application";
                      if (count > 1) return "Multiple applications";
                      return job.status || "open";
                    })()}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={job.status === "in-progress" || job.status === "assigned"}
                    title={job.status === "in-progress" ? "Can't edit while assigned" : "Edit"}
                    onClick={() =>
                      navigate("/dashboard/post-work", {
                        state: { jobToEdit: job },
                      })
                    }
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === job._id || job.status === "in-progress" || job.status === "assigned"}
                    title={job.status === "in-progress" ? "Can't delete while assigned — cancel the order first" : "Delete"}
                    onClick={async () => {
                      try {
                        setDeletingId(job._id);
                        await apiFetch(`/api/work/${job._id}`, {
                          method: "DELETE",
                          headers: { ...authHeader() },
                        });
                        setJobs((prev) => prev.filter((j) => j._id !== job._id));
                        toast({ title: "Job deleted", description: "Your job has been removed." });
                      } catch (err: any) {
                        toast({
                          title: "Error",
                          description: err?.message || "Failed to delete job",
                          variant: "destructive",
                        });
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
