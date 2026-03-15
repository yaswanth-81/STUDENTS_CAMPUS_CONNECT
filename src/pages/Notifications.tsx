import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  ShoppingBag,
  MessageSquare,
  Briefcase,
  CheckCheck,
  Check,
  Zap,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch, authHeader } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type Notif = {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  refId?: string;
  refType?: string;
  createdAt: string;
};

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  application:       { icon: Briefcase,     color: "text-primary bg-primary/10",       label: "Application" },
  applicationAccepted: { icon: Star,        color: "text-accent bg-accent/10",         label: "Accepted" },
  directAssign:      { icon: Zap,           color: "text-amber-500 bg-amber-500/10",   label: "Job Request" },
  message:           { icon: MessageSquare, color: "text-secondary bg-secondary/10",   label: "Message" },
  orderCompleted:    { icon: ShoppingBag,   color: "text-accent bg-accent/10",         label: "Order" },
};

const filters = ["all", "application", "applicationAccepted", "directAssign", "message", "orderCompleted"];
const filterLabels: Record<string, string> = {
  all: "All",
  application: "Applications",
  applicationAccepted: "Accepted",
  directAssign: "Job Requests",
  message: "Messages",
  orderCompleted: "Orders",
};

export default function Notifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch<{ notifications: Notif[] }>("/api/notifications/my", {
        headers: { ...authHeader() },
      });
      setNotifications(data.notifications || []);
    } catch (err: any) {
      toast({ title: "Error", description: "Could not load notifications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear the popup tracking so user won't see repeated popups for things they've now seen
    localStorage.removeItem("sc_last_popup_notif");
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    try {
      await apiFetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { ...authHeader() },
      });
    } catch {}
  };

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      await apiFetch("/api/notifications/mark-all-read", {
        method: "PATCH",
        headers: { ...authHeader() },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to mark all read", variant: "destructive" });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (notif: Notif) => {
    await markRead(notif._id);
    // Deep-link navigation
    if (notif.refId && notif.refType) {
      if (notif.refType === "order" || notif.refType === "chat") {
        navigate(`/dashboard/orders/${notif.refId}`);
      } else if (notif.refType === "work") {
        navigate(`/dashboard/my-services/${notif.refId}/applicants`);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={markAllRead}
            disabled={markingAll}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {markingAll ? "Marking..." : "Mark all read"}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filters.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "gradient-bg text-primary-foreground border-0 shrink-0"
                : "shrink-0"
            }
          >
            {filterLabels[f]}
          </Button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card animate-pulse h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No notifications found.</p>
          </div>
        ) : (
          filtered.map((notif, i) => {
            const cfg = typeConfig[notif.type] || typeConfig.message;
            const Icon = cfg.icon;
            const isClickable = !!(notif.refId && notif.refType);
            return (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleClick(notif)}
                className={cn(
                  "p-4 rounded-xl border bg-card flex items-start gap-3 transition-all",
                  isClickable ? "cursor-pointer hover:card-shadow-hover" : "cursor-default",
                  notif.read ? "border-border" : "border-primary/30 bg-primary/[0.02]"
                )}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {cfg.label}
                    </span>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className={cn("text-sm mt-0.5 leading-snug", !notif.read && "font-medium")}>
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">{timeAgo(notif.createdAt)}</p>
                    {isClickable && (
                      <span className="text-xs text-primary">Tap to view →</span>
                    )}
                  </div>
                </div>
                {!notif.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 w-8 p-0"
                    onClick={(e) => { e.stopPropagation(); markRead(notif._id); }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
