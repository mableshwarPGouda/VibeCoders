import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { initials, timeAgo } from "@/lib/utils-format";
import { ArrowLeft, Send } from "lucide-react";

export const Route = createFileRoute("/_app/chats/$id")({
  component: ChatPage,
});

function ChatPage() {
  const { id } = Route.useParams();
  const { profile } = useAuth();
  const nav = useNavigate();
  const [chat, setChat] = useState<any>(null);
  const [other, setOther] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: c } = await supabase.from("chats").select("*").eq("id", id).maybeSingle();
      if (!c) { nav({ to: "/chats" }); return; }
      setChat(c);
      const otherId = c.student_id === profile.id ? c.alumnus_id : c.student_id;
      const { data: o } = await supabase.from("profiles").select("id,name,avatar_url,role,domain").eq("id", otherId).maybeSingle();
      setOther(o);
      const { data: m } = await supabase.from("messages").select("*").eq("chat_id", id).order("created_at", { ascending: true });
      setMessages(m ?? []);
    })();
  }, [id, profile, nav]);

  useEffect(() => {
    if (!profile) return;
    const ch = supabase.channel("chat-" + id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${id}` }, (p) => {
        setMessages((cur) => cur.some((m) => m.id === (p.new as any).id) ? cur : [...cur, p.new as any]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, profile]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !profile) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({ chat_id: id, sender_id: profile.id, content });
    if (error) console.error(error);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
      <Link to="/chats" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-3">
        <ArrowLeft className="h-4 w-4" /> All chats
      </Link>

      <div className="glass-strong rounded-2xl flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {other && (
          <Link to="/profile/$id" params={{ id: other.id }} className="flex items-center gap-3 px-5 py-4 border-b border-border/40 hover:bg-muted/40 transition">
            <div className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center text-xs font-bold text-primary-foreground">
              {initials(other.name)}
            </div>
            <div>
              <div className="font-semibold">{other.name}</div>
              <div className="text-[11px] text-muted-foreground capitalize">
                {other.role}{other.domain ? ` • ${other.domain}` : ""}
              </div>
            </div>
          </Link>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-2 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No messages yet — say hi 👋</div>
          ) : messages.map((m) => {
            const mine = m.sender_id === profile?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine ? "gradient-hero text-primary-foreground rounded-br-sm shadow-glow" : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {timeAgo(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer */}
        <form onSubmit={send} className="border-t border-border/40 p-3 flex gap-2">
          <input
            value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-full bg-background/60 border border-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
          <button
            type="submit"
            className="rounded-full gradient-hero text-primary-foreground p-2.5 hover-lift disabled:opacity-50 transition"
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
