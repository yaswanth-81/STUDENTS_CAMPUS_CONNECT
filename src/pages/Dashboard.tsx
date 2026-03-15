import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Search, PlusCircle, ArrowRight, ShoppingBag, Briefcase, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { apiFetch, authHeader } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [orderCount, setOrderCount] = useState(0);
  const [myJobsCount, setMyJobsCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [availableForWork, setAvailableForWork] = useState(false);
  const [toggling, setToggling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const headers = { ...authHeader() };
        const [ordersRes, workRes, me] = await Promise.all([
          apiFetch<{ count: number; orders: any[] }>("/api/orders/my", { headers }).catch(() => ({ count: 0, orders: [] })),
          apiFetch<{ count: number; works: any[] }>("/api/work/my", { headers }).catch(() => ({ count: 0, works: [] })),
          apiFetch<any>("/api/profile/me", { headers }).catch(() => null),
        ]);

        if (me?.availableForWork !== undefined) {
          setAvailableForWork(me.availableForWork);
        }

        const meId = me?._id ? String(me._id) : null;
        const myOrdersOnly = meId
          ? (ordersRes.orders || []).filter((o: any) => {
              const clientId = o.clientId?._id ?? o.clientId;
              return clientId && String(clientId) !== meId;
            })
          : ordersRes.orders || [];

        setOrderCount(myOrdersOnly.length);
        setRecentOrders(myOrdersOnly.slice(0, 3));
        setMyJobsCount(workRes.count);
      } catch {
        // ignore
      }
    };

    load();
  }, []);

  const handleToggleAvailable = async () => {
    try {
      setToggling(true);
      const newValue = !availableForWork;
      await apiFetch<any>("/api/profile/me", {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ availableForWork: newValue }),
      });
      setAvailableForWork(newValue);
      toast({
        title: newValue ? "You are now available for work! 🎯" : "You are now unavailable",
        description: newValue
          ? "Clients can now find and send you direct work requests."
          : "Your profile is hidden from the interested-students list.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update", variant: "destructive" });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold">Welcome back! 👋</h1>
        <p className="text-sm text-muted-foreground">What would you like to do today?</p>
      </div>

      {/* ── Available for Work Toggle ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <button
          disabled={toggling}
          onClick={handleToggleAvailable}
          className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group ${
            availableForWork
              ? "border-accent bg-accent/5 shadow-[0_0_24px_-4px_hsl(var(--accent)/0.3)]"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          {/* Toggle knob */}
          <div
            className={`h-7 w-14 rounded-full flex items-center px-1 transition-all duration-300 shrink-0 ${
              availableForWork ? "bg-accent justify-end" : "bg-muted justify-start"
            }`}
          >
            <div className="h-5 w-5 rounded-full bg-white shadow-sm" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${availableForWork ? "text-accent" : "text-muted-foreground"}`} />
              <p className={`font-display font-bold text-sm ${availableForWork ? "text-accent" : "text-foreground"}`}>
                Available for Work
              </p>
              {availableForWork && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium animate-pulse">
                  ON
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {availableForWork
                ? "Clients can find and send you direct work requests"
                : "Toggle ON so clients can discover you and send work requests"}
            </p>
          </div>
        </button>
      </motion.div>

      {/* Two primary action cards */}
      <div className="grid sm:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <Link to="/dashboard/find-work" className="block">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:card-shadow-hover transition-all group h-full">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-display text-xl font-bold mb-2">Find Work</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Browse jobs and services posted by other students. Apply to tasks that match your skills.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  Browse opportunities <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <Link to="/dashboard/post-work" className="block">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:card-shadow-hover transition-all group h-full">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-accent/5 -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-colors" />
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/15 transition-colors">
                  <PlusCircle className="h-7 w-7 text-accent" />
                </div>
                <h2 className="font-display text-xl font-bold mb-2">Post Work</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Need help with something? Post a task and let talented students come to you.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all">
                  Post a task <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "My Orders", to: "/dashboard/orders", icon: ShoppingBag, count: orderCount },
          { label: "My Services", to: "/dashboard/my-services", icon: Briefcase, count: myJobsCount },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Link
              to={item.to}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:card-shadow-hover transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.count} items</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold">Recent Orders</h3>
            <Link to="/dashboard/orders" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {recentOrders.map((order, i) => (
            <motion.div
              key={order._id || order.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            >
              <Link
                to={`/dashboard/orders/${order._id || order.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:card-shadow-hover transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {order.workId?.title || "Order"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due: {order.deadline ? new Date(order.deadline).toLocaleDateString() : "—"}
                  </p>
                </div>
                <Badge variant="outline" className={
                  order.status === "active" ? "bg-secondary/10 text-secondary border-secondary/30" :
                  order.status === "completed" ? "bg-accent/10 text-accent border-accent/30" :
                  "bg-amber-500/10 text-amber-600 border-amber-500/30"
                }>
                  {order.status}
                </Badge>
                <p className="font-display font-bold text-sm">₹{order.price}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
