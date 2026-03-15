import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOCK_MESSAGES } from "@/lib/mock-data";

export default function Messages() {
  const [activeChat, setActiveChat] = useState(MOCK_MESSAGES[0].id);
  const [message, setMessage] = useState("");

  const chat = MOCK_MESSAGES.find((c) => c.id === activeChat)!;

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="font-display text-2xl font-bold mb-4">Messages</h1>
      <div className="flex h-[calc(100%-3rem)] rounded-xl border border-border bg-card overflow-hidden">
        {/* Conversation list */}
        <div className="w-72 border-r border-border shrink-0 hidden md:block">
          <div className="p-3 border-b border-border">
            <Input placeholder="Search chats..." className="h-9" />
          </div>
          <div className="overflow-y-auto">
            {MOCK_MESSAGES.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveChat(conv.id)}
                className={cn(
                  "w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors",
                  activeChat === conv.id && "bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                    {conv.user.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{conv.user}</p>
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="h-5 w-5 rounded-full gradient-bg text-primary-foreground text-xs flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border flex items-center gap-3">
            <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
              {chat.user.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{chat.user}</p>
              <p className="text-xs text-accent">Online</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", msg.sender === "me" ? "justify-end" : "")}
              >
                <div className={cn(
                  "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm",
                  msg.sender === "me"
                    ? "gradient-bg text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}>
                  <p>{msg.text}</p>
                  <p className={cn("text-xs mt-1", msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                    {msg.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-3 border-t border-border flex items-center gap-2">
            <Button variant="ghost" size="sm"><Paperclip className="h-4 w-4" /></Button>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && setMessage("")}
            />
            <Button size="sm" className="gradient-bg text-primary-foreground border-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
