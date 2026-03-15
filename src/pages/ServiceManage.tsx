import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Paperclip, MessageSquare, Star, ShoppingBag, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FEATURED_SERVICES, MOCK_ORDERS, MOCK_MESSAGES } from "@/lib/mock-data";

export default function ServiceManage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const service = FEATURED_SERVICES.find((s) => s.id === serviceId) || FEATURED_SERVICES[0];

  const [activeChatClient, setActiveChatClient] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState(MOCK_MESSAGES[0].messages);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setChatMessages([...chatMessages, { id: `m${Date.now()}`, sender: "me", text: message, time: "Just now" }]);
    setMessage("");
  };

  // Mock clients for this service
  const clients = MOCK_ORDERS.slice(0, 3);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold truncate">{service.title}</h1>
          <p className="text-sm text-muted-foreground">Manage service & client interactions</p>
        </div>
      </div>

      {/* Service stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Price", value: `₹${service.price}`, icon: DollarSign },
          { label: "Rating", value: `${service.seller.rating}`, icon: Star },
          { label: "Orders", value: `${service.seller.completedJobs}`, icon: ShoppingBag },
          { label: "Delivery", value: `${service.deliveryDays}d`, icon: Clock },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border border-border bg-card text-center">
            <stat.icon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="font-display font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Clients */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold">Client Orders</h3>
        {clients.map((client, i) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl border border-border bg-card"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                {client.buyer.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{client.buyer}</p>
                <p className="text-xs text-muted-foreground truncate">{client.title}</p>
              </div>
              <Badge variant="outline" className={
                client.status === "active" ? "bg-secondary/10 text-secondary border-secondary/30" :
                client.status === "completed" ? "bg-accent/10 text-accent border-accent/30" :
                "bg-amber-500/10 text-amber-600 border-amber-500/30"
              }>
                {client.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setActiveChatClient(activeChatClient === client.id ? null : client.id)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </Button>
            </div>

            {/* Inline Chat */}
            {activeChatClient === client.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 rounded-xl border border-border bg-background overflow-hidden"
              >
                <div className="h-64 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.sender === "me" ? "justify-end" : "")}>
                      <div className={cn(
                        "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                        msg.sender === "me"
                          ? "gradient-bg text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}>
                        <p>{msg.text}</p>
                        <p className={cn("text-xs mt-1", msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-border flex items-center gap-2">
                  <Button variant="ghost" size="sm"><Paperclip className="h-4 w-4" /></Button>
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button size="sm" className="gradient-bg text-primary-foreground border-0" onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
