import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { initials, timeAgo } from "@/lib/utils-format";
import { MessageSquareText } from "lucide-react";

export default function ChatList() {
  const { profile } = useAuth();
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const col = profile.role === "student" ? "student_id" : "alumnus_id";
      const otherCol = profile.role === "student" ? "alumnus_id" : "student_id";
      const { data } = await supabase
        .from("chats")
        .select(`*, other:profiles!chats_${otherCol}_fkey(id,name,avatar_url,role)`)
        .eq(col, profile.id)
        .order("last_message_at", { ascending: false });
      setChats(data ?? []);
    })();
  }, [profile]);

  return (
    <div className="glass-strong rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MessageSquareText className="h-5 w-5" /> Conversations
      </h2>
      {chats.length === 0 ? (
        <div className="text-sm text-muted-foreground py-10 text-center">
          No chats yet. Start one from a profile page.
        </div>
      ) : (
        <ul className="space-y-2">
          {chats.map((c) => (
            <li key={c.id}>
              <Link
                to="/chats/$id" params={{ id: c.id }}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/60 transition group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-hero text-primary-foreground text-sm font-semibold shrink-0">
                  {initials(c.other?.name ?? "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate group-hover:text-primary transition">{c.other?.name}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(c.last_message_at)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{c.last_message || "Say hi 👋"}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
