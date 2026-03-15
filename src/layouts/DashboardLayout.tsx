import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Sun, Moon, Bell, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/components/AppSidebar";
import { useTheme } from "@/context/ThemeContext";
import { apiFetch, authHeader } from "@/lib/api";

interface DashboardLayoutProps {
  variant?: "user" | "admin";
}

export function DashboardLayout({ variant = "user" }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  const [newNotifPopup, setNewNotifPopup] = useState<string | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Profile avatar
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileInitial, setProfileInitial] = useState("A");

  // Load profile once on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await apiFetch<any>("/api/profile/me", {
          headers: { ...authHeader() },
        });
        if (user?.profilePhotoUrl) setProfilePhoto(user.profilePhotoUrl);
        if (user?.fullName) setProfileInitial(user.fullName.charAt(0).toUpperCase());
        else if (user?.rollNumber) setProfileInitial(user.rollNumber.charAt(0).toUpperCase());
      } catch {}
    };
    loadProfile();
  }, []);

  // Poll unread count every 12 seconds
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await apiFetch<{ count: number }>("/api/notifications/unread-count", {
          headers: { ...authHeader() },
        });
        const count = data.count ?? 0;
        setUnreadCount(count);

        // Only show popup for a NEW unread notification the user hasn't seen yet
        if (count > 0) {
          try {
            const notifData = await apiFetch<{ notifications: any[] }>("/api/notifications/my", {
              headers: { ...authHeader() },
            });
            const latest = notifData.notifications?.find((n: any) => !n.read);
            if (latest) {
              // Use localStorage to track which notification was last shown
              const shownId = localStorage.getItem("sc_last_popup_notif");
              if (shownId !== latest._id) {
                localStorage.setItem("sc_last_popup_notif", latest._id);
                setNewNotifPopup(latest.message);
                if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
                popupTimerRef.current = setTimeout(() => setNewNotifPopup(null), 6000);
              }
            }
          } catch {}
        }

        prevCountRef.current = count;
      } catch {}
    };

    fetchCount();
    const interval = setInterval(fetchCount, 12000);
    return () => {
      clearInterval(interval);
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} variant={variant} />
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* ── New notification popup banner ──────────────────────────── */}
        <AnimatePresence>
          {newNotifPopup && (
            <motion.div
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="absolute top-[4.5rem] right-4 z-50 w-[calc(100%-2rem)] max-w-sm"
            >
              <div
                className="flex items-start gap-3 p-4 rounded-2xl border border-primary/30 bg-card shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.25)] cursor-pointer"
                onClick={() => {
                  setNewNotifPopup(null);
                  navigate("/dashboard/notifications");
                }}
              >
                {/* Animated bell */}
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-primary animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary mb-0.5">New Notification</p>
                  <p className="text-sm text-foreground leading-snug line-clamp-2">{newNotifPopup}</p>
                  <span className="text-xs text-primary flex items-center gap-1 mt-1">
                    Tap to view <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
                <button
                  className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
                  onClick={(e) => { e.stopPropagation(); setNewNotifPopup(null); }}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Top header ────────────────────────────────────────────── */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-card shrink-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">

            {/* Bell with live badge */}
            <button
              onClick={() => navigate("/dashboard/notifications")}
              className="p-2 rounded-lg hover:bg-muted relative transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center px-1 leading-none"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </motion.span>
              )}
            </button>

            {/* Theme toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Profile avatar with real photo */}
            <button
              onClick={() => navigate("/dashboard/profile")}
              className="h-8 w-8 rounded-full overflow-hidden ml-2 ring-2 ring-border hover:ring-primary/40 transition-all"
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {profileInitial}
                </div>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
