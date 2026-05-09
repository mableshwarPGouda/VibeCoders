import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { extractTopicAndDomain, matchAlumniIds } from "@/lib/ai-match";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/queries/new")({
  component: CreateQuery,
});

function CreateQuery() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (profile && profile.role !== "student") {
    return <div className="glass-strong rounded-2xl p-6">Only students can create queries.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    try {
      const { topic, domain } = extractTopicAndDomain(`${title} ${description}`);
      const alumniIds = await matchAlumniIds(domain);
      const { data, error } = await supabase.from("queries").insert({
        student_id: profile.id, title, description, topic, domain, assigned_alumni_ids: alumniIds,
      }).select().single();
      if (error) throw error;
      toast.success(`AI matched your query to ${alumniIds.length} alumni in "${domain}"`);
      nav({ to: "/queries/$id", params: { id: data!.id } });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={() => nav({ to: "/dashboard" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="glass-strong rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">AI-routed query</span>
        </div>
        <h1 className="text-2xl font-bold">Ask an alumnus</h1>
        <p className="text-sm text-muted-foreground mt-1">We'll match your question with alumni in the right domain.</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
            <input
              required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140}
              placeholder="e.g. How to crack ML interviews?"
              className="w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea
              required value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={2000}
              placeholder="Be specific — what's your context and what advice do you need?"
              className="w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
            />
          </div>
          <button
            type="submit" disabled={submitting}
            className="w-full rounded-lg gradient-hero text-primary-foreground py-2.5 text-sm font-semibold hover-lift disabled:opacity-60 flex items-center justify-center gap-2 transition"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit query
          </button>
        </form>
      </div>
    </div>
  );
}
