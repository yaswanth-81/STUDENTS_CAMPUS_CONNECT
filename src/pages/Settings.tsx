import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, authHeader } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Loader2, Shield, Bell, Palette, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ── Profile / Account state ────────────────────────────────────────────────
  const [college, setCollege] = useState("");
  const [savingCollege, setSavingCollege] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ── Delete account ─────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteBox, setShowDeleteBox] = useState(false);

  // Load profile on mount
  useEffect(() => {
    apiFetch<any>("/api/profile/me", { headers: authHeader() })
      .then((u) => setCollege(u.college || "JNTUA"))
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  // Save college
  const saveCollege = async () => {
    setSavingCollege(true);
    try {
      await apiFetch("/api/profile/me", {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ college }),
      });
      toast({ title: "College updated ✓", description: `Your college is now set to ${college}.` });
    } catch {
      toast({ title: "Error", description: "Could not update college.", variant: "destructive" });
    } finally {
      setSavingCollege(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirm.toLowerCase() !== "confirm") {
      toast({ title: 'Type "confirm" to proceed', variant: "destructive" });
      return;
    }
    setDeletingAccount(true);
    try {
      await apiFetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: authHeader(),
      });
      localStorage.removeItem("sc_token");
      localStorage.removeItem("sc_user");
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      navigate("/");
    } catch (err: any) {
      toast({ title: err?.message || "Could not delete account", variant: "destructive" });
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const COLLEGES = [
    "JNTUA", "JNTUH", "JNTUK", "VTU", "OSMANIA", "OU",
    "Andhra University", "SRM", "VIT", "MIT", "Anna University", "Other",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl w-full mx-auto space-y-5 pb-10"
    >
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      {/* ── Appearance ─────────────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
      </section>

      {/* ── Account / College ───────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold">Account</h2>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Your College</label>
          <select
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            {COLLEGES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            ⚠️ You can only see and work with students from the same college.
          </p>
          <Button
            size="sm"
            disabled={savingCollege}
            onClick={saveCollege}
            className="mt-1 gradient-bg text-primary-foreground border-0"
          >
            {savingCollege ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
            Save College
          </Button>
        </div>
      </section>

      {/* ── Notifications ──────────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold">Notifications</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          In-app notifications are sent for all order and chat events automatically.
        </p>
        {["New orders", "Messages", "Order updates"].map((item) => (
          <div key={item} className="flex items-center justify-between">
            <span className="text-sm">{item}</span>
            <Switch defaultChecked />
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className="text-sm">Marketing</span>
          <Switch defaultChecked={false} />
        </div>
      </section>

      {/* ── Danger Zone ─────────────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl border border-destructive/30 bg-destructive/5 space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          <h2 className="font-display font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Once you delete your account, all your data, jobs, orders and chats are permanently removed.{" "}
          <strong className="text-foreground">There is no going back.</strong>
        </p>

        {!showDeleteBox ? (
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteBox(true)}>
            Delete Account
          </Button>
        ) : (
          <div className="space-y-3 border border-destructive/40 rounded-xl p-4 bg-background">
            <p className="text-sm font-medium text-destructive">
              Type <strong className="font-mono">confirm</strong> below to permanently delete your account:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Type "confirm" here'
              className="border-destructive/50 focus:ring-destructive/30"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => { setShowDeleteBox(false); setDeleteConfirm(""); }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                disabled={deleteConfirm.toLowerCase() !== "confirm" || deletingAccount}
                onClick={handleDeleteAccount}
              >
                {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
}
