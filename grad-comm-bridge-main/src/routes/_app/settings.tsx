import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { initials } from "@/lib/utils-format";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
});

function Settings() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [projects, setProjects] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio);
      setExperience(profile.experience);
      setProjects(profile.projects);
      setLinkedin(profile.linkedin_url);
      setGithub(profile.github_url);
    }
  }, [profile]);

  if (!profile) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name, bio, experience, projects, linkedin_url: linkedin, github_url: github,
      }).eq("id", profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated!");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl gradient-hero flex items-center justify-center text-primary-foreground font-bold shadow-glow">
          {initials(profile.name)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-sm text-muted-foreground capitalize">{profile.role} {profile.usn ? `• ${profile.usn}` : ""}</p>
        </div>
      </div>

      <form onSubmit={save} className="glass-strong rounded-2xl p-6 md:p-8 space-y-5">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </Field>
        <Field label="Bio">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="Tell others about yourself…" />
        </Field>
        <Field label="Experience">
          <textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="Roles, internships, achievements…" />
        </Field>
        <Field label="Projects">
          <textarea value={projects} onChange={(e) => setProjects(e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="What have you built?" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="LinkedIn URL">
            <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={inputClass} placeholder="https://linkedin.com/in/…" />
          </Field>
          <Field label="GitHub URL">
            <input value={github} onChange={(e) => setGithub(e.target.value)} className={inputClass} placeholder="https://github.com/…" />
          </Field>
        </div>

        <button
          type="submit" disabled={saving}
          className="rounded-lg gradient-hero text-primary-foreground px-6 py-2.5 text-sm font-semibold hover-lift disabled:opacity-60 inline-flex items-center gap-2 transition"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </form>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
