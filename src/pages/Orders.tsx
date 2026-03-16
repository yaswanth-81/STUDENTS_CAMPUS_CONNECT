import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle2, XCircle, Zap, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, authHeader } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  request_sent: {
    label: "Request Sent",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  assigned_to_others: {
    label: "Assigned to Others",
    icon: XCircle,
    className: "bg-slate-500/10 text-slate-600 border-slate-500/30",
  },
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
  payment_pending: {
    label: "Payment Pending",
    icon: Clock,
    className: "bg-orange-500/10 text-orange-600 border-orange-500/30",
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
        const [data, me, appsData] = await Promise.all([
          apiFetch<{ orders: any[] }>("/api/orders/my", { headers }),
          apiFetch<{ _id: string }>("/api/profile/me", { headers }).catch(() => null),
          apiFetch<{ applications: any[] }>("/api/application/my", { headers }).catch(() => ({ applications: [] })),
        ]);

        const rawOrders: any[] = data.orders || [];
        const rawApplications: any[] = appsData.applications || [];
        const meId = me?._id ? String(me._id) : null;

        // Show worker-side orders: where I am the worker
        const workerOrders = meId
          ? rawOrders.filter((o: any) => {
              const workerId = o.workerId?._id ?? o.workerId;
              return workerId && String(workerId) === meId;
            })
          : rawOrders;

        const workerOrderItems = workerOrders.map((o: any) => ({
          ...o,
          itemType: "order",
        }));

        const applicationItems = rawApplications
          .filter((app: any) => app?.workId)
          .filter((app: any) => app.status === "pending" || app.status === "assigned_to_others")
          .map((app: any) => ({
            _id: `application-${app._id}`,
            itemType: "application",
            status: app.status === "assigned_to_others" ? "assigned_to_others" : "request_sent",
            createdAt: app.createdAt,
            applicationId: app._id,
            workId: app.workId,
            originalWorkId: app.workId?._id,
            clientId: app.workId?.postedBy,
            price: app.workId?.budget ?? 0,
            deadline: app.workId?.deadline,
          }));

        const merged = [...workerOrderItems, ...applicationItems].sort(
          (a: any, b: any) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        setOrders(merged);
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
      ? orders.filter(
          (o) =>
            o.status === "active" ||
            o.status === "pending" ||
            o.status === "request_sent" ||
            (o.itemType === "order" && o.status === "completed" && o.paymentStatus === "unpaid")
        )
      : tab === "completed"
      ? orders.filter((o) => o.status === "completed" && o.paymentStatus !== "unpaid")
      : tab === "cancelled"
      ? orders.filter((o) => o.status === "cancelled" || o.status === "assigned_to_others")
      : orders;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-muted-foreground">Your assigned work and sent requests</p>
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
              const displayStatus =
                order.itemType === "order" && order.status === "completed" && order.paymentStatus === "unpaid"
                  ? "payment_pending"
                  : order.status;
              const config = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.active;
              const Icon = config.icon;
              const title = order.workId?.title || "Order";
              const deadline = order.deadline ? new Date(order.deadline).toLocaleDateString() : "";
              const price = order.price ?? order.workId?.budget ?? 0;
              const clientName =
                order.itemType === "application"
                  ? order.status === "assigned_to_others"
                    ? "This work was given to another student"
                    : "Awaiting client response"
                  : order.clientId?.fullName || order.clientId?.rollNumber || "Client";

              const destination =
                order.itemType === "application"
                  ? `/dashboard/work/${order.originalWorkId}/apply`
                  : `/dashboard/orders/${order._id}`;

              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={destination}>
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
                          {order.itemType === "application" ? "Status:" : "From:"} {clientName}
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
