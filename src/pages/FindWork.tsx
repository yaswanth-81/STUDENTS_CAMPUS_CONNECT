import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ArrowLeft, Calendar, DollarSign, Users, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, authHeader } from "@/lib/api";

export default function FindWork() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [workPosts, setWorkPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch work posts from backend
  useEffect(() => {
    const fetchWorkPosts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        if (activeCategory) {
          params.append("category", activeCategory);
        }
        if (search) {
          params.append("search", search);
        }

        const data = await apiFetch<{ works: any[] }>(`/api/work?${params.toString()}`);
        setWorkPosts(data.works || []);
      } catch (error) {
        console.error("Error fetching work posts:", error);
        toast({ title: "Error", description: "Failed to load work posts", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkPosts();
  }, [search, activeCategory, toast]);

  // Fetch current user profile (if logged in) so we can hide their own jobs
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const me = await apiFetch<any>("/api/profile/me", {
          headers: { ...authHeader() },
        });
        if (me && me._id) {
          setCurrentUserId(me._id);
        }
      } catch {
        // ignore if not logged in or request fails
      }
    };

    fetchMe();
  }, []);

  const handleApply = (_jobTitle: string, jobId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Error", description: "Please login to apply for work", variant: "destructive" });
      navigate("/login");
      return;
    }

    navigate(`/dashboard/work/${jobId}/apply`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">Find Work</h1>
          <p className="text-sm text-muted-foreground">Browse all available opportunities</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search services and jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Button variant={!activeCategory ? "default" : "outline"} size="sm" onClick={() => setActiveCategory(null)}
            className={!activeCategory ? "gradient-bg text-primary-foreground border-0" : ""}>All</Button>
          {CATEGORIES.map((cat) => (
            <Button key={cat.id} variant={activeCategory === cat.id ? "default" : "outline"} size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id ? "gradient-bg text-primary-foreground border-0 whitespace-nowrap" : "whitespace-nowrap"}>
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Jobs list */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading work posts...</p>
          </div>
        ) : workPosts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Jobs (
              {
                workPosts.filter(
                  (job) =>
                    !currentUserId ||
                    !job.postedBy ||
                    job.postedBy._id !== currentUserId
                ).length
              }
              )
            </h3>
            <div className="space-y-3">
              {workPosts
                .filter(
                  (job) =>
                    // Hide jobs posted by the currently logged-in user
                    !currentUserId ||
                    !job.postedBy ||
                    job.postedBy._id !== currentUserId
                )
                .map((job, i) => (
                  <JobCard key={job._id} job={job} index={i} onApply={handleApply} />
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">No results found. Try a different search or category.</p>
    </div>
  );
}

function JobCard({ job, index, onApply }: { job: any; index: number; onApply: (title: string, id: string) => void }) {
  const deadline = new Date(job.deadline);
  const today = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-5 rounded-xl border border-border bg-card hover:card-shadow-hover transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs">
              {job.category}
            </Badge>
            {daysLeft > 0 ? (
              <span className="text-xs text-green-600 dark:text-green-400">Open</span>
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400">Expired</span>
            )}
          </div>
          <h3 className="font-display font-semibold text-base line-clamp-1 mb-1">{job.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ₹{job.budget}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {job.applications?.length || 0} applications
            </span>
            {Array.isArray(job.attachments) && job.attachments.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {job.attachments[0].fileName || "Attachment"}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => onApply(job.title, job._id)}
          className="gradient-bg text-primary-foreground border-0 shrink-0"
        >
          Apply Now
        </Button>
      </div>
    </motion.div>
  );
}
