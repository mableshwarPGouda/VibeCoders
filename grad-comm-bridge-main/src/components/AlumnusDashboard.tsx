import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import ChatList from "./ChatList";
import { timeAgo } from "@/lib/utils-format";
import { Inbox, MessageSquare } from "lucide-react";

export default function AlumnusDashboard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<"queries" | "chats">("queries");
  const [queries, setQueries] = useState<any[]>([]);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: qs } = await supabase
        .from("queries")
        .select("*, student:profiles!queries_student_id_fkey(name)")
        .contains("assigned_alumni_ids", [profile.id])
        .order("created_at", { ascending: false });
      setQueries(qs ?? []);
      const { data: rs } = await supabase
        .from("query_responses")
        .select("query_id")
        .eq("alumnus_id", profile.id);
      setRespondedIds(new Set((rs ?? []).map((r) => r.query_id)));
    })();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {profile?.name.split(" ")[0]} 🎓</h1>
        <p className="text-muted-foreground mt-1">Queries matched to your domain — <span className="font-semibold text-primary">{profile?.domain}</span>.</p>
      </div>

      <div className="flex gap-2 glass-strong rounded-xl p-1 max-w-sm">
        {(["queries", "chats"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
              tab === t ? "gradient-hero text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "queries" ? <Inbox className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            {t === "queries" ? "Queries" : "Chats"}
          </button>
        ))}
      </div>

      {tab === "queries" ? (
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Your Inbox</h2>
          {queries.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              No queries assigned yet. Update your domain in Profile if needed.
            </div>
          ) : (
            <ul className="space-y-2">
              {queries.map((q) => {
                const responded = respondedIds.has(q.id);
                return (
                  <li key={q.id}>
                    <Link
                      to="/queries/$id" params={{ id: q.id }}
                      className={`block rounded-xl p-4 hover-lift transition glass ${
                        responded ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className={`truncate ${responded ? "font-medium text-muted-foreground" : "font-bold text-foreground"}`}>
                            {q.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{q.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span>From: {q.student?.name ?? "Student"}</span>
                            <span>•</span>
                            <span>{q.domain}</span>
                            <span>•</span>
                            <span>{timeAgo(q.created_at)}</span>
                          </div>
                        </div>
                        {!responded && <span className="shrink-0 inline-block h-2.5 w-2.5 rounded-full bg-primary mt-1" />}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <ChatList />
      )}
    </div>
  );
}
