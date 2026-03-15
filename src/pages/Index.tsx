import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, ArrowRight, CheckCircle, Zap, FileText, Code, Palette,
  BookOpen, FileCheck, Rocket, Presentation, Users, Briefcase,
  TrendingUp, ShieldCheck, Clock, Star, Sparkles, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { apiFetch } from "@/lib/api";

// ── Animation variants ────────────────────────────────────────────────────────
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const fadeIn  = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } };

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "assignment", name: "Assignment Writing", icon: FileText, color: "from-blue-500 to-indigo-500" },
  { id: "resume",     name: "Resume Building",   icon: FileCheck, color: "from-purple-500 to-pink-500" },
  { id: "coding",     name: "Coding Help",        icon: Code,      color: "from-green-500 to-teal-500" },
  { id: "ppt",        name: "PPT Design",         icon: Presentation, color: "from-orange-500 to-amber-500" },
  { id: "design",     name: "Graphic Design",     icon: Palette,   color: "from-pink-500 to-rose-500" },
  { id: "miniproject",name: "Mini Projects",      icon: Rocket,    color: "from-cyan-500 to-blue-500" },
  { id: "notes",      name: "Notes & Study",      icon: BookOpen,  color: "from-amber-500 to-yellow-500" },
  { id: "other",      name: "Other Services",     icon: Sparkles,  color: "from-violet-500 to-purple-500" },
];

// ── Platform stats ────────────────────────────────────────────────────────────
const STATS = [
  { icon: Users,      label: "Students Joined",    value: "500+" },
  { icon: Briefcase,  label: "Jobs Completed",      value: "200+" },
  { icon: TrendingUp, label: "Avg. Rating",         value: "4.8★" },
  { icon: ShieldCheck,label: "Campus Verified",     value: "100%" },
];

// ── Why us cards ──────────────────────────────────────────────────────────────
const WHY_US = [
  {
    icon: ShieldCheck,
    color: "text-blue-500 bg-blue-500/10",
    title: "Campus Verified",
    desc: "Only your college peers can join — no strangers. Verified student IDs ensure trust.",
  },
  {
    icon: Clock,
    color: "text-amber-500 bg-amber-500/10",
    title: "Fast Turnaround",
    desc: "Students understand deadlines. Get your work done before your submission date.",
  },
  {
    icon: TrendingUp,
    color: "text-green-500 bg-green-500/10",
    title: "Earn While You Study",
    desc: "Turn your skills into income. Hundreds of students earn ₹5k–₹20k per month.",
  },
  {
    icon: Star,
    color: "text-purple-500 bg-purple-500/10",
    title: "Quality Guaranteed",
    desc: "Rate your worker after delivery. High ratings build trust across the campus network.",
  },
];

// ── Job card for Featured section ─────────────────────────────────────────────
function JobCard({ job, index }: { job: any; index: number }) {
  const categoryColor = CATEGORIES.find((c) => c.id === job.category)?.color || "from-primary to-secondary";
  const initials = (job.postedBy?.fullName || job.postedBy?.rollNumber || "?").charAt(0).toUpperCase();

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="rounded-2xl border border-border bg-card overflow-hidden hover:card-shadow-hover transition-all"
    >
      {/* Colorful header */}
      <div className={`h-28 bg-gradient-to-br ${categoryColor} flex items-center justify-center relative overflow-hidden`}>
        <span className="text-white/25 text-4xl font-black uppercase tracking-widest select-none">
          {(job.category || "work").substring(0, 8)}
        </span>
        <span className="absolute top-2 right-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
          {job.category || "work"}
        </span>
      </div>

      <div className="p-4">
        {/* Poster */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-xs font-medium leading-none">{job.postedBy?.fullName || job.postedBy?.rollNumber || "Student"}</p>
            <p className="text-[10px] text-muted-foreground">{job.postedBy?.branch || "JNTUA"}</p>
          </div>
        </div>

        <p className="font-display font-semibold text-sm mb-2 line-clamp-2">{job.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{job.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Due {new Date(job.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
          <span className="font-display font-bold text-sm text-primary">₹{job.budget}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    apiFetch<any>("/api/work")
      .then((data) => {
        const jobs = Array.isArray(data) ? data : (data.works || []);
        // Only show open jobs, limit to 6
        const open = jobs.filter((j: any) => j.status === "open" || !j.status).slice(0, 6);
        setFeaturedJobs(open);
      })
      .catch(() => setFeaturedJobs([]))
      .finally(() => setLoadingJobs(false));
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-24 md:pt-36 md:pb-32 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-20 right-10 w-80 h-80 rounded-full bg-primary/8 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-secondary/8 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Zap className="h-3.5 w-3.5" />
              Campus-exclusive skill marketplace
            </motion.div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Get things done by
              <br />
              <span className="gradient-text">students you trust</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Connect with talented peers from your own college. Post jobs, offer services, and collaborate — all within your campus community.
            </p>

            {/* Functional Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="glass rounded-2xl p-2 max-w-xl mx-auto flex items-center gap-2 mb-8 shadow-lg"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search assignments, coding, PPT, notes..."
                  className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="gradient-bg text-primary-foreground border-0 rounded-xl px-5"
              >
                Search
              </Button>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              {["Free to join", "Campus verified", "Secure payments"].map((t) => (
                <span key={t} className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-accent" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto text-center"
          >
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} variants={fadeUp} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <p className="font-display font-extrabold text-2xl gradient-text">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-3">How it works</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-md mx-auto">Three simple steps to get started</motion.p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {[
              { step: "01", title: "Post a Job", desc: "Describe what you need — assignments, PPTs, coding help, or anything else." },
              { step: "02", title: "Find a Student", desc: "Browse verified student profiles from your own college and choose the best fit." },
              { step: "03", title: "Get Work Done", desc: "Collaborate, chat, track progress, and receive quality work on time." },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="text-center p-6 rounded-2xl border border-border bg-card hover:card-shadow-hover transition-all"
              >
                <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-primary-foreground font-display font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-3">Popular Categories</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground">Find the help you need — tap any category to browse</motion.p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {CATEGORIES.slice(0, 8).map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.div key={cat.id} variants={fadeUp} whileHover={{ y: -4, scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Link
                    to={`/browse?category=${cat.id}`}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-background hover:border-primary/30 hover:card-shadow-hover transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight">{cat.name}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED JOBS (dynamic from DB) ───────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold mb-1">Open Jobs</h2>
              <p className="text-muted-foreground text-sm">
                {loadingJobs ? "Loading..." : featuredJobs.length > 0 ? `${featuredJobs.length} jobs available right now` : "Be the first to post a job!"}
              </p>
            </div>
            <Link to="/browse">
              <Button variant="ghost" className="gap-1 text-primary">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingJobs ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                  <div className="h-28 bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredJobs.length > 0 ? (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {featuredJobs.map((job, i) => (
                <Link key={job._id} to="/signup">
                  <JobCard job={job} index={i} />
                </Link>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground mb-4">No open jobs yet — be the first to post one!</p>
              <Link to="/signup">
                <Button className="gradient-bg text-primary-foreground border-0">Get Started →</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── WHY US (replaces fake reviews) ────────────────────────────────── */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-3">Why StudentsConnect?</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-md mx-auto">
              Built for students, by students — your campus, your community
            </motion.p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {WHY_US.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 280 }}
                  className="p-6 rounded-2xl border border-border bg-background hover:card-shadow-hover transition-all"
                >
                  <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl gradient-bg p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(0_0%_100%_/_0.12),_transparent_60%)]" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to get started?
              </h2>
              <p className="text-primary-foreground/80 max-w-md mx-auto mb-8">
                Join your campus community on StudentsConnect — post jobs, find work, and earn money while studying.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 border-0 font-semibold shadow-lg">
                    Create Free Account
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button
                    size="lg"
                    className="bg-white/15 text-white border border-white/40 hover:bg-white/25 backdrop-blur-sm font-medium"
                  >
                    Browse Jobs <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
