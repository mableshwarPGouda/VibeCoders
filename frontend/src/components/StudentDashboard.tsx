import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, Search, PlusCircle } from "lucide-react";
import { timeAgo } from "@/lib/utils-format";
import CircularProgress from "./CircularProgress";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [queries, setQueries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase.from("queries").select("*").eq("student_id", profile.id).order("created_at", { ascending: false })
      .then(({ data }) => { setQueries(data ?? []); setLoading(false); });
  }, [profile]);

  const solved = queries.filter((q) => q.status === "answered").length;
  const unsolved = queries.length - solved;
  const filtered = queries.filter((q) =>
    !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hello, {profile?.name.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's how your queries are performing.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Solved Queries" value={solved} total={queries.length || 1} color="success" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Pending Queries" value={unsolved} total={queries.length || 1} color="warning" />
      </div>

      <div className="glass-strong rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
          <h2 className="text-xl font-semibold">Your Queries</h2>
          <Link to="/queries/new" className="inline-flex items-center gap-2 rounded-lg gradient-hero px-4 py-2 text-sm font-medium text-primary-foreground hover-lift">
            <PlusCircle className="h-4 w-4" /> New query
          </Link>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your queries…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background/60 border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground py-10 text-center">
            {queries.length === 0 ? "No queries yet. Create your first one!" : "No queries match your search."}
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((q) => (
              <li key={q.id}>
                <Link
                  to="/queries/$id" params={{ id: q.id }}
                  className="block glass rounded-xl p-4 hover-lift transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate group-hover:text-primary transition">{q.title}</h3>
                        <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                          q.status === "answered" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                        }`}>{q.status}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{q.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span>{q.domain || "General"}</span>
                        <span>•</span>
                        <span>{timeAgo(q.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, total, color }: { icon: React.ReactNode; label: string; value: number; total: number; color: "success" | "warning" }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="glass-strong rounded-2xl p-6 flex items-center gap-5 hover-lift">
      <CircularProgress value={pct} color={color} />
      <div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon}{label}</div>
        <div className="text-3xl font-bold mt-1">{value}</div>
      </div>
    </div>
  );
}
