import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, DollarSign, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, authHeader } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export default function JobBoard() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (activeCategory) params.append("category", activeCategory);
        if (search) params.append("search", search);
        const data = await apiFetch<{ works: any[] }>(`/api/work?${params.toString()}`);
        setJobs(data.works || []);
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "Failed to load jobs", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [activeCategory, search, toast]);

  const handleApply = async (jobId: string, jobTitle: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Please login", description: "Login is required to apply for jobs.", variant: "destructive" });
      navigate("/login");
      return;
    }

    try {
      await apiFetch(`/api/work/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
      });
      toast({ title: "Application Sent!", description: `You applied for "${jobTitle}".` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to apply", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Job Board</h1>
        <p className="text-sm text-muted-foreground">Browse jobs posted by buyers and apply</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          <Button variant={!activeCategory ? "default" : "outline"} size="sm" onClick={() => setActiveCategory(null)}
            className={!activeCategory ? "gradient-bg text-primary-foreground border-0" : ""}>All</Button>
          {CATEGORIES.slice(0, 5).map((cat) => (
            <Button key={cat.id} variant={activeCategory === cat.id ? "default" : "outline"} size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id ? "gradient-bg text-primary-foreground border-0 whitespace-nowrap" : "whitespace-nowrap"}>
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No jobs found. Try a different search.</p>
          </div>
        ) : (
          jobs.map((job, i) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-xl border border-border bg-card hover:card-shadow-hover transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs">
                      {CATEGORIES.find(c => c.id === job.category)?.name || job.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {job.postedBy?.rollNumber ? `Posted by ${job.postedBy.rollNumber}` : ""}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold mb-1">{job.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> ₹{job.budget}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(job.deadline).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {job.applications?.length || 0} applications</span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center gap-2 shrink-0">
                  <p className="font-display text-lg font-bold sm:text-right">₹{job.budget}</p>
                  <Button size="sm" className="gradient-bg text-primary-foreground border-0" onClick={() => handleApply(job._id, job.title)}>
                    Apply Now
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
