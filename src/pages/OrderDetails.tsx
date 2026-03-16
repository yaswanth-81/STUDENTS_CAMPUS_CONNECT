import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Send, CheckCheck, Check, XCircle, CheckCircle2,
  QrCode, Users, Calendar, DollarSign, AlertCircle, Loader2, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch, authHeader } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type Msg = {
  _id: string;
  senderId: { _id: string; fullName?: string; rollNumber?: string } | null;
  message: string;
  messageType: "text" | "system" | "payment_qr" | "payment_meeting" | "payment_done";
  seenBy: string[];
  timestamp: string;
};

function normalizePhoneForWhatsApp(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  // If user saved local 10-digit Indian number, prepend country code.
  if (digits.length === 10) return `91${digits}`;
  if (digits.length > 10) return digits;
  return null;
}

// ── Chat bubble ───────────────────────────────────────────────────────────────

function Bubble({ msg, myId }: { msg: Msg; myId: string }) {
  // System / payment-event messages → centered pill
  const isSystem =
    !msg.senderId ||
    msg.messageType === "system" ||
    msg.messageType === "payment_qr" ||
    msg.messageType === "payment_meeting" ||
    msg.messageType === "payment_done";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-4 py-2 rounded-full bg-muted text-xs text-muted-foreground text-center max-w-sm leading-relaxed">
          {msg.message}
        </span>
      </div>
    );
  }

  // ⚠️ Compare as strings — Mongo ObjectId.toString() === JWT decoded id string
  const senderIdStr = String(msg.senderId._id);
  const isMine = senderIdStr === myId;

  // A message is "seen" if at least one other user is in seenBy[]
  const seen = (msg.seenBy || []).some((id) => String(id) !== senderIdStr);

  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex mb-2", isMine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed",
          isMine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {/* Show sender name only for their messages (not mine) */}
        {!isMine && (
          <p className="text-[10px] font-semibold mb-0.5 opacity-60">
            {msg.senderId?.fullName || msg.senderId?.rollNumber || "User"}
          </p>
        )}
        <p>{msg.message}</p>
        <div
          className={cn(
            "flex items-center gap-1 mt-0.5 justify-end",
            isMine ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          <span className="text-[10px]">{time}</span>
          {isMine && (
            seen
              ? <CheckCheck className="h-3 w-3 text-blue-300" />
              : <Check className="h-3 w-3" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    active: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    completed: "bg-accent/15 text-accent border-accent/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  };
  const label: Record<string, string> = {
    pending: "Pending",
    active: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return (
    <Badge variant="outline" className={map[status] || "bg-muted"}>
      {label[status] || status}
    </Badge>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  // myId: fetched from /api/profile/me for reliable comparison
  const [myId, setMyId] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Cancel reason flow
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Fetch logged-in user id FIRST (reliable, from JWT via profile endpoint)
  useEffect(() => {
    apiFetch<any>("/api/profile/me", { headers: { ...authHeader() } })
      .then((me) => setMyId(String(me._id)))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!orderId) return;
    try {
      if (!silent) setLoading(true);
      const res = await apiFetch<any>(`/api/chat/${orderId}`, {
        headers: { ...authHeader() },
      });
      setData(res);
      setMessages(res.messages || []);
    } catch (err: any) {
      if (!silent) {
        toast({ title: "Error", description: err?.message || "Failed to load order", variant: "destructive" });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId, toast]);

  // Initial load
  useEffect(() => { fetchData(false); }, [fetchData]);

  // Poll every 3 seconds for real-time feel
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Send user message ────────────────────────────────────────────────────

  const sendMsg = async (text?: string) => {
    const msgText = (text ?? messageText).trim();
    if (!msgText || !orderId) return;
    setSending(true);
    if (!text) setMessageText("");
    try {
      await apiFetch("/api/chat/message", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, message: msgText }),
      });
      await fetchData(true);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to send", variant: "destructive" });
      if (!text) setMessageText(msgText);
    } finally {
      setSending(false);
    }
  };

  // ── Generic action helper ────────────────────────────────────────────────

  const doAction = async (key: string, fn: () => Promise<any>) => {
    setActionLoading(key);
    try {
      await fn();
      // Fetch immediately (not silent) so UI updates right away
      await fetchData(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Action failed", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Loading / error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p>Order not found or you don't have access.</p>
      </div>
    );
  }

  // ── Role detection ───────────────────────────────────────────────────────
  // Use String() on both sides — clientId._id from Mongo is ObjectId, myId is a plain string
  const order = data.order;
  const clientUser = data.client;
  const workerUser = data.worker;

  const clientIdStr = String(clientUser?._id || "");
  const workerIdStr = String(workerUser?._id || "");

  const isClient = myId !== "" && clientIdStr === myId;
  const isWorker = myId !== "" && workerIdStr === myId;

  // "Other person" = the one I'm chatting with
  const otherUser = isClient ? workerUser : clientUser;
  const otherLabel = isClient ? "Worker Details" : "Client Details";
  const otherUserIdStr = isClient ? workerIdStr : clientIdStr;

  const otherInitials = (otherUser?.fullName || otherUser?.rollNumber || "?")
    .charAt(0)
    .toUpperCase();

  const myUser = isClient ? clientUser : workerUser;
  const myWaNumber = normalizePhoneForWhatsApp(myUser?.phoneNumber);
  const otherWaNumber = normalizePhoneForWhatsApp(otherUser?.phoneNumber);
  const canConnectOnWhatsApp = Boolean(myWaNumber && otherWaNumber);

  const myDisplayName = myUser?.fullName || myUser?.rollNumber || "Student";
  const otherDisplayName = otherUser?.fullName || otherUser?.rollNumber || "Student";
  const bothMissingPhone = !myWaNumber && !otherWaNumber;
  const myPhoneMissing = !myWaNumber;
  const otherPhoneMissing = !otherWaNumber;
  const whatsappMessage = encodeURIComponent(
    `Hi ${otherDisplayName}, this is ${myDisplayName} from StudentsConnect regarding the order \"${order?.workId?.title || "work"}\". Let's coordinate the details here.`
  );
  const whatsappUrl = otherWaNumber ? `https://wa.me/${otherWaNumber}?text=${whatsappMessage}` : "";

  const orderStatus = order?.status ?? "pending";
  const paymentStatus = order?.paymentStatus ?? "unpaid";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold truncate">
            {order?.workId?.title || "Order"}
          </h1>
          <p className="text-xs text-muted-foreground font-mono">{orderId}</p>
        </div>
        <StatusBadge status={orderStatus} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* ── Left: Order info + actions ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Other person's details */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {otherLabel}
            </p>
            <div className="flex items-center gap-3">
              {otherUser?.profilePhotoUrl ? (
                <img
                  src={otherUser.profilePhotoUrl}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="h-12 w-12 rounded-full gradient-bg flex items-center justify-center text-lg font-bold text-primary-foreground">
                  {otherInitials}
                </div>
              )}
              <div>
                <p className="font-display font-bold">{otherUser?.fullName || "User"}</p>
                <p className="text-sm text-muted-foreground">Roll: {otherUser?.rollNumber}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {otherUser?.email && <div>📧 {otherUser.email}</div>}
              {otherUser?.phoneNumber && <div>📞 {otherUser.phoneNumber}</div>}
              {(otherUser?.branch || otherUser?.course) && (
                <div>🎓 {[otherUser.branch, otherUser.course].filter(Boolean).join(" · ")}</div>
              )}
              {(otherUser?.classYear != null || otherUser?.semester != null) && (
                <div>
                  📅
                  {otherUser.classYear != null ? ` Year ${otherUser.classYear}` : ""}
                  {otherUser.classYear != null && otherUser.semester != null ? " · " : ""}
                  {otherUser.semester != null ? `Sem ${otherUser.semester}` : ""}
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-border space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold text-foreground">₹{order?.price}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Due: {order?.deadline ? new Date(order.deadline).toLocaleDateString() : "—"}</span>
              </div>
            </div>

            {canConnectOnWhatsApp ? (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
              >
                <span className="h-5 w-5 rounded-full bg-green-500 inline-flex items-center justify-center">
                  <MessageCircle className="h-3.5 w-3.5 text-white" />
                </span>
                Connect through WhatsApp
              </Button>
            ) : (
              <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-2">
                {bothMissingPhone
                  ? "Both users need mobile numbers in profile to connect through WhatsApp."
                  : myPhoneMissing
                  ? "Add your mobile number in profile to connect through WhatsApp."
                  : otherPhoneMissing
                  ? "The other person has not added a mobile number yet, so WhatsApp connect is unavailable."
                  : "Update mobile number in profile to connect through WhatsApp."}
                {myPhoneMissing && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/profile")}
                      className="underline font-medium"
                    >
                      Go to Profile
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Action buttons (role-based) ──────────────────────────────── */}
          <div className="space-y-3">

            {/* WORKER ONLY: Mark as Completed */}
            {isWorker && (orderStatus === "active" || orderStatus === "pending") && (
              <Button
                className="w-full gradient-bg text-primary-foreground border-0 gap-2"
                disabled={actionLoading === "complete"}
                onClick={() =>
                  doAction("complete", () =>
                    apiFetch(`/api/orders/${orderId}/status`, {
                      method: "PATCH",
                      headers: { ...authHeader(), "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "completed" }),
                    })
                  )
                }
              >
                {actionLoading === "complete"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />}
                Mark as Completed
              </Button>
            )}

            {/* CLIENT ONLY: Payment options (only when completed + unpaid) */}
            {isClient && orderStatus === "completed" && paymentStatus === "unpaid" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl border-2 border-accent/40 bg-accent/5 space-y-3"
              >
                <p className="font-display font-bold text-sm text-accent flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Work completed! Choose how to pay:
                </p>

                {/* Option 1: Pay by QR */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={actionLoading === "pay-qr"}
                    onClick={() =>
                      doAction("pay-qr", () =>
                        apiFetch(`/api/orders/${orderId}/payment-method`, {
                          method: "PATCH",
                          headers: { ...authHeader(), "Content-Type": "application/json" },
                          body: JSON.stringify({ method: "qr" }),
                        })
                      )
                    }
                  >
                    {actionLoading === "pay-qr"
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <QrCode className="h-4 w-4" />}
                    Pay Online via QR Code
                  </Button>

                  {/* QR code shown when method is qr */}
                  {order?.paymentMethod === "qr" && (
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted">
                      {workerUser?.qrCodeUrl ? (
                        <>
                          <p className="text-xs text-muted-foreground">Scan to pay ₹{order?.price} to {workerUser?.fullName || "Worker"}</p>
                          <img
                            src={workerUser.qrCodeUrl}
                            alt="Payment QR"
                            className="h-44 w-44 rounded-lg object-contain border border-border bg-white p-1"
                          />
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center">
                          Worker hasn't uploaded a QR code yet. Ask them to add it in their Profile page.
                        </p>
                      )}
                      <Button
                        className="w-full gradient-bg text-primary-foreground border-0 gap-2 mt-1"
                        disabled={actionLoading === "pay-done"}
                        onClick={() =>
                          doAction("pay-done", async () => {
                            await apiFetch(`/api/orders/${orderId}/payment-done`, {
                              method: "PATCH",
                              headers: { ...authHeader(), "Content-Type": "application/json" },
                            });
                            // Auto-send a quick message
                            await apiFetch("/api/chat/message", {
                              method: "POST",
                              headers: { ...authHeader(), "Content-Type": "application/json" },
                              body: JSON.stringify({
                                orderId,
                                message: `✅ Payment done bro! Let's meet at a place convenient for you to collect the assignment. Let me know where and when! 🤝`,
                              }),
                            });
                          })
                        }
                      >
                        {actionLoading === "pay-done"
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <CheckCircle2 className="h-4 w-4" />}
                        Payment Done ✓
                      </Button>
                    </div>
                  )}
                </div>

                {/* Option 2: Pay by Meeting */}
                {order?.paymentMethod !== "qr" && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      disabled={actionLoading === "pay-meeting"}
                      onClick={() =>
                        doAction("pay-meeting", async () => {
                          await apiFetch(`/api/orders/${orderId}/payment-method`, {
                            method: "PATCH",
                            headers: { ...authHeader(), "Content-Type": "application/json" },
                            body: JSON.stringify({ method: "meeting" }),
                          });
                          await apiFetch("/api/chat/message", {
                            method: "POST",
                            headers: { ...authHeader(), "Content-Type": "application/json" },
                            body: JSON.stringify({
                              orderId,
                              message: `💵 I'll pay by meeting bro! Let's meet up — I'll bring the cash and take the assignment directly. Let me know when and where you're free! 📍`,
                            }),
                          });
                        })
                      }
                    >
                      {actionLoading === "pay-meeting"
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Users className="h-4 w-4" />}
                      Pay by Meeting
                    </Button>

                    {order?.paymentMethod === "meeting" && (
                      <Button
                        className="w-full gradient-bg text-primary-foreground border-0 gap-2"
                        disabled={actionLoading === "pay-done"}
                        onClick={() =>
                          doAction("pay-done", async () => {
                            await apiFetch(`/api/orders/${orderId}/payment-done`, {
                              method: "PATCH",
                              headers: { ...authHeader(), "Content-Type": "application/json" },
                            });
                            await apiFetch("/api/chat/message", {
                              method: "POST",
                              headers: { ...authHeader(), "Content-Type": "application/json" },
                              body: JSON.stringify({
                                orderId,
                                message: `✅ Payment done bro! I'll pay by meeting and take the assignment directly. Let's fix a place to meet — let me know! 🤝📍`,
                              }),
                            });
                          })
                        }
                      >
                        {actionLoading === "pay-done"
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <CheckCircle2 className="h-4 w-4" />}
                        Payment Done ✓
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Payment confirmed banner */}
            {paymentStatus && paymentStatus !== "unpaid" && (
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 text-sm text-accent flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {paymentStatus === "paid_online"
                  ? "Payment confirmed via QR ✓"
                  : "Payment confirmed at meeting ✓"}
              </div>
            )}

            {/* Cancel Order — both parties, only while active/pending */}
            {(orderStatus === "active" || orderStatus === "pending") && (
              <div className="space-y-2">
                {!cancelMode ? (
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:text-destructive gap-2"
                    onClick={() => setCancelMode(true)}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Order
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border-2 border-destructive/30 bg-destructive/5 space-y-3"
                  >
                    <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Why are you cancelling?
                    </p>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Enter reason (e.g. found another writer, budget issue, deadline changed...)"
                      rows={3}
                      className="w-full text-sm bg-muted rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-destructive/30 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => { setCancelMode(false); setCancelReason(""); }}
                      >
                        Go Back
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 gap-1"
                        disabled={!cancelReason.trim() || actionLoading === "cancel"}
                        onClick={() =>
                          doAction("cancel", async () => {
                            // 1. Send reason as a chat message so both parties see it
                            const cancellerName = isClient
                              ? (clientUser?.fullName || clientUser?.rollNumber || "Client")
                              : (workerUser?.fullName || workerUser?.rollNumber || "Worker");
                            await apiFetch("/api/chat/message", {
                              method: "POST",
                              headers: { ...authHeader(), "Content-Type": "application/json" },
                              body: JSON.stringify({
                                orderId,
                                message: `❌ Order cancelled by ${cancellerName}.\nReason: ${cancelReason.trim()}\n\nThe job has been reopened for others to apply.`,
                              }),
                            });
                            // 2. Cancel the order
                            await apiFetch(`/api/orders/${orderId}/status`, {
                              method: "PATCH",
                              headers: { ...authHeader(), "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "cancelled" }),
                            });
                            setCancelMode(false);
                            setCancelReason("");
                          })
                        }
                      >
                        {actionLoading === "cancel"
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <XCircle className="h-4 w-4" />}
                        Confirm Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Chat ───────────────────────────────────────────────── */}
        <div
          className="lg:col-span-3 flex flex-col rounded-2xl border border-border bg-card overflow-hidden"
          style={{ minHeight: "520px", maxHeight: "calc(100vh - 200px)" }}
        >
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0 bg-card">
            {otherUser?.profilePhotoUrl ? (
              <img
                src={otherUser.profilePhotoUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
                {otherInitials}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">
                Chat with {otherUser?.fullName || otherUser?.rollNumber}
              </p>
              <p className="text-xs text-accent">● Auto-refreshing</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {myId === "" ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading chat...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No messages yet. Say hello! 👋
              </div>
            ) : (
              messages.map((msg) => (
                <Bubble key={msg._id} msg={msg} myId={myId} />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {orderStatus !== "cancelled" ? (
            <div className="px-4 py-3 border-t border-border flex items-center gap-2 shrink-0 bg-card">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMsg();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <button
                onClick={() => sendMsg()}
                disabled={sending || !messageText.trim()}
                className="h-9 w-9 rounded-full gradient-bg flex items-center justify-center text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all shrink-0"
              >
                {sending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-border text-center text-sm text-muted-foreground bg-card shrink-0">
              This order has been cancelled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
