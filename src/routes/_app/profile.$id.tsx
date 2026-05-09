import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { initials } from "@/lib/utils-format";
import { ArrowLeft, MessageSquare, Linkedin, Github, Briefcase, FolderGit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile/$id")({
  component: ProfileView,
});

function ProfileView() {
  const { id } = Route.useParams();
  const { profile: me } = useAuth();
  const nav = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", id).maybeSingle().then(({ data }) => setUser(data));
  }, [id]);

  if (!user) return <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>;

  const startChat = async () => {
    if (!me) return;
    if (me.id === user.id) return toast.error("That's you!");
    if (me.role === user.role) return toast.error("Chat is between students and alumni only.");
    setStarting(true);
    try {
      const studentId = me.role === "student" ? me.id : user.id;
      const alumnusId = me.role === "alumnus" ? me.id : user.id;
      const { data: existing } = await supabase
        .from("chats").select("id")
        .eq("student_id", studentId).eq("alumnus_id", alumnusId).maybeSingle();
      let chatId = existing?.id;
      if (!chatId) {
        const { data, error } = await supabase
          .from("chats").insert({ student_id: studentId, alumnus_id: alumnusId })
          .select("id").single();
        if (error) throw error;
        chatId = data.id;
      }
      nav({ to: "/chats/$id", params: { id: chatId! } });
    } catch (e: any) { toast.error(e.message); } finally { setStarting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => window.history.back()} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="glass-strong rounded-2xl overflow-hidden">
        <div className="h-32 gradient-hero" />
        <div className="px-6 md:px-8 pb-8 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="h-24 w-24 rounded-2xl gradient-hero ring-4 ring-card flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
              {initials(user.name)}
            </div>
            <div className="flex-1 min-w-0 sm:pb-2">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-sm text-muted-foreground capitalize">
                {user.role === "alumnus" ? `${user.domain} • Class of ${user.graduation_year}` : `Student • USN ${user.usn}`}
              </p>
            </div>
            {me?.id !== user.id && me?.role !== user.role && (
              <button
                onClick={startChat} disabled={starting}
                className="rounded-lg gradient-hero text-primary-foreground px-5 py-2.5 text-sm font-semibold hover-lift flex items-center gap-2 disabled:opacity-60 transition"
              >
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Start chat
              </button>
            )}
          </div>

          <div className="mt-6 space-y-5">
            {user.bio && <Section title="About">{user.bio}</Section>}
            {user.experience && <Section title="Experience" icon={<Briefcase className="h-4 w-4" />}>{user.experience}</Section>}
            {user.projects && <Section title="Projects" icon={<FolderGit2 className="h-4 w-4" />}>{user.projects}</Section>}

            <div className="flex flex-wrap gap-2 pt-2">
              {user.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 px-4 py-2 text-sm font-medium transition">
                  <Linkedin className="h-4 w-4 text-[#0A66C2]" /> LinkedIn
                </a>
              )}
              {user.github_url && (
                <a href={user.github_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 px-4 py-2 text-sm font-medium transition">
                  <Github className="h-4 w-4" /> GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {icon}{title}
      </div>
      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{children}</p>
    </div>
  );
}
