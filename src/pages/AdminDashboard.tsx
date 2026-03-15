import { motion } from "framer-motion";
import { Users, Briefcase, ShoppingBag, AlertTriangle, TrendingUp, Ban, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ADMIN_STATS = [
  { label: "Total Users", value: "1,247", icon: Users, change: "+124 this month", color: "text-primary bg-primary/10" },
  { label: "Active Services", value: "342", icon: Briefcase, change: "+28 this week", color: "text-secondary bg-secondary/10" },
  { label: "Total Orders", value: "856", icon: ShoppingBag, change: "+67 this month", color: "text-accent bg-accent/10" },
  { label: "Reports", value: "5", icon: AlertTriangle, change: "3 pending review", color: "text-destructive bg-destructive/10" },
];

const RECENT_USERS = [
  { name: "Vikram S.", college: "VJIT", dept: "CSE", status: "active" },
  { name: "Ananya R.", college: "JNTUA", dept: "ECE", status: "active" },
  { name: "Ravi K.", college: "SVNIT", dept: "IT", status: "suspended" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ADMIN_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-xl bg-card border border-border card-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {stat.change}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="p-6 rounded-xl bg-card border border-border card-shadow">
        <h3 className="font-display font-semibold mb-4">Recent Users</h3>
        <div className="space-y-3">
          {RECENT_USERS.map((u, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <div className="h-9 w-9 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.college} · {u.dept}</p>
              </div>
              <Badge variant="outline" className={u.status === "active" ? "bg-accent/10 text-accent border-accent/30" : "bg-destructive/10 text-destructive border-destructive/30"}>
                {u.status}
              </Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm"><Ban className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
