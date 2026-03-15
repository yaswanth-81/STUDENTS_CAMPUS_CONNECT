import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle2, XCircle, Zap, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, authHeader } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  pending: {
    label: "In Progress",
    icon: Clock,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  active: {
    label: "In Progress",
    icon: Zap,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-accent/10 text-accent border-accent/30",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

export default function Orders() {
  const [tab, setTab] = useState("all");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const headers = { ...authHeader() };
        const [data, me] = await Promise.all([
          apiFetch<{ orders: any[] }>("/api/orders/my", { headers }),
          apiFetch<{ _id: string }>("/api/profile/me", { headers }).catch(() => null),
        ]);

        const rawOrders: any[] = data.orders || [];
        const meId = me?._id ? String(me._id) : null;

        // Show worker-side orders: where I am the worker
        const workerOrders = meId
          ? rawOrders.filter((o: any) => {
              const workerId = o.workerId?._id ?? o.workerId;
              return workerId && String(workerId) === meId;
            })
          : rawOrders;

        setOrders(workerOrders);
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "Failed to load orders", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const filtered =
    tab === "all"
      ? orders
      : tab === "active"
      ? orders.filter((o) => o.status === "active" || o.status === "pending")
      : tab === "completed"
      ? orders.filter((o) => o.status === "completed")
      : tab === "cancelled"
      ? orders.filter((o) => o.status === "cancelled")
      : orders;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-muted-foreground">Work assigned to you</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading orders...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No orders found.</p>
          ) : (
            filtered.map((order, i) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.active;
              const Icon = config.icon;
              const title = order.workId?.title || "Order";
              const deadline = order.deadline ? new Date(order.deadline).toLocaleDateString() : "";
              const price = order.price ?? order.workId?.budget ?? 0;
              const clientName = order.clientId?.fullName || order.clientId?.rollNumber || "Client";

              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/dashboard/orders/${order._id}`}>
                    <div className="p-4 rounded-xl border border-border bg-card hover:card-shadow-hover transition-all flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={config.className}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm truncate">{title}</p>
                        <p className="text-xs text-muted-foreground">
                          From: {clientName}
                          {deadline ? ` · Due: ${deadline}` : ""}
                        </p>
                      </div>
                      <p className="font-display font-bold text-sm shrink-0">₹{price}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
