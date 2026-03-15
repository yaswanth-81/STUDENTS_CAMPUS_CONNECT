import { NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Search, PlusCircle, User, Settings, LogOut, X, GraduationCap,
  Users, BarChart3, Flag, FileText, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const USER_NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Find Work", to: "/dashboard/find-work", icon: Search },
  { label: "Post Work", to: "/dashboard/post-work", icon: PlusCircle },
  { label: "Profile", to: "/dashboard/profile", icon: User },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

const ADMIN_NAV = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Services", to: "/admin/services", icon: ShoppingBag },
  { label: "Jobs", to: "/admin/jobs", icon: FileText },
  { label: "Orders", to: "/admin/orders", icon: ShoppingBag },
  { label: "Reports", to: "/admin/reports", icon: Flag },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: "user" | "admin";
}

export function AppSidebar({ isOpen, onClose, variant = "user" }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const items = variant === "admin" ? ADMIN_NAV : USER_NAV;

  const handleLogout = () => {
    localStorage.removeItem("sc_token");
    localStorage.removeItem("sc_user");
    toast({ title: "Logged out", description: "You have been logged out successfully." });
    navigate("/login");
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/*
        KEY FIX: h-screen + flex-col + overflow-hidden on the aside root.
        nav gets flex-1 + overflow-y-auto + min-h-0 so it scrolls if needed.
        logout wrapper gets SHRINK-0 so it is ALWAYS visible at the bottom,
        never pushed off screen regardless of nav item count or screen height.
      */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border",
          "flex flex-col overflow-hidden",
          "transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header — fixed height, never shrinks */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-sm">
              {variant === "admin" ? "Admin Panel" : "StudentsConnect"}
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav — scrollable, gets all remaining space */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
          {items.map((item) => {
            const active =
              item.to === "/dashboard" || item.to === "/admin"
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
            return (
              <RouterNavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </RouterNavLink>
            );
          })}
        </nav>

        {/* Logout — ALWAYS pinned at bottom, shrink-0 prevents it from disappearing */}
        <div className="shrink-0 p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
