import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { initials, timeAgo } from "@/lib/utils-format";
import { ArrowLeft, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/queries/$id")({
  component: QueryDetail,
});

function QueryDetail() {
  const { id } = Route.useParams();
  const { profile } = useAuth();
  const nav = useNavigate();
  const [query, setQuery] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data: q } = await supabase
      .from("queries")
      .select(`*, student:profiles!queries_student_id_fkey(id,name,avatar_url)`)
      .eq("id", id).maybeSingle();
    setQuery(q);
    const { data: rs } = await supabase
      .from("query_responses")
      .select(`*, alumnus:profiles!query_responses_alumnus_id_fkey(id,name,avatar_url,domain)`)
      .eq("query_id", id).order("created_at", { ascending: true });
    setResponses(rs ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>;
  if (!query) return <div className="glass-strong rounded-2xl p-6">Query not found.</div>;

  const isAlumnus = profile?.role === "alumnus";
  const alreadyResponded = isAlumnus && responses.some((r) => r.alumnus_id === profile?.id);

  const submitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("query_responses").insert({
        query_id: id, alumnus_id: profile.id, response_text: text,
      });
      if (error) throw error;
      setText("");
      toast.success("Response posted");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => nav({ to: "/dashboard" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="glass-strong rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 text-primary mb-2 text-xs font-medium uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" /> {query.domain || "General"} • {query.topic}
        </div>
        <h1 className="text-2xl font-bold">{query.title}</h1>
        <p className="mt-3 text-foreground/80 whitespace-pre-wrap">{query.description}</p>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          {isAlumnus ? (
            <Link to="/profile/$id" params={{ id: query.student.id }} className="flex items-center gap-2 hover:text-foreground transition">
              <div className="h-7 w-7 rounded-full gradient-hero flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                {initials(query.student.name)}
              </div>
              {query.student.name}
            </Link>
          ) : (
            <span>Asked by you</span>
          )}
          <span>•</span>
          <span>{timeAgo(query.created_at)}</span>
          <span className={`ml-auto text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
            query.status === "answered" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
          }`}>{query.status}</span>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Responses ({responses.length})</h2>
        {responses.length === 0 ? (
          <div className="glass rounded-xl p-6 text-sm text-center text-muted-foreground">
            No responses yet. {isAlumnus ? "Be the first to help!" : "Hang tight — alumni are on it."}
          </div>
        ) : (
          responses.map((r) => (
            <div key={r.id} className="glass-strong rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Link to="/profile/$id" params={{ id: r.alumnus.id }} className="shrink-0">
                  <div className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center text-xs font-bold text-primary-foreground hover:scale-110 transition">
                    {initials(r.alumnus.name)}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to="/profile/$id" params={{ id: r.alumnus.id }} className="font-semibold hover:text-primary transition">
                      {r.alumnus.name}
                    </Link>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold">{r.alumnus.domain}</span>
                    <span className="text-[11px] text-muted-foreground">• {timeAgo(r.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{r.response_text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isAlumnus && !alreadyResponded && (
        <form onSubmit={submitResponse} className="glass-strong rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold">Your response</h3>
          <textarea
            required value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000}
            placeholder="Share your experience and advice…"
            className="w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
          />
          <button
            type="submit" disabled={submitting}
            className="rounded-lg gradient-hero text-primary-foreground px-5 py-2 text-sm font-semibold hover-lift disabled:opacity-60 flex items-center gap-2 transition"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post response
          </button>
        </form>
      )}
      {isAlumnus && alreadyResponded && (
        <div className="glass rounded-xl p-4 text-sm text-center text-muted-foreground">
          ✓ You've already responded to this query.
        </div>
      )}
    </div>
  );
}
