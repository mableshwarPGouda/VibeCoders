import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { GraduationCap, Users, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const search = z.object({
  as: z.enum(["student", "alumnus"]).catch("student"),
});

export const Route = createFileRoute("/login")({
  validateSearch: search,
  component: LoginPage,
});

function LoginPage() {
  const { as } = Route.useSearch();
  const nav = useNavigate();
  const { user, signInStudent, signInAlumnus } = useAuth();
  const [tab, setTab] = useState<"student" | "alumnus">(as);
  const [loading, setLoading] = useState(false);

  // student fields
  const [usn, setUsn] = useState("");
  const [dob, setDob] = useState("");
  // alumnus fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => { setTab(as); }, [as]);
  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "student") {
        await signInStudent(usn, dob);
      } else {
        await signInAlumnus(email, password);
      }
      toast.success("Welcome back!");
      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="glass-strong rounded-3xl p-8 shadow-card">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-hero shadow-glow mb-3">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to Alumni Hub</p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 rounded-xl bg-muted/60 p-1 mb-6">
            {(["student", "alumnus"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
                  tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "student" ? <GraduationCap className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {t === "student" ? "Student" : "Alumnus"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "student" ? (
              <>
                <Field label="USN">
                  <input
                    required value={usn} onChange={(e) => setUsn(e.target.value)}
                    placeholder="e.g. 1MS21CS001"
                    className="w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </Field>
                <Field label="Date of Birth">
                  <input
                    required type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Email">
                  <input
                    required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@alumni.com"
                    className="w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </Field>
                <Field label="Password">
                  <input
                    required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </Field>
              </>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-lg gradient-hero text-primary-foreground py-2.5 text-sm font-semibold hover-lift disabled:opacity-60 flex items-center justify-center gap-2 transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in as {tab}
            </button>
          </form>

          <details className="mt-6 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium hover:text-foreground transition">View test credentials</summary>
            <div className="mt-2 space-y-1 font-mono text-[11px] glass rounded-lg p-3">
              <div className="font-sans font-semibold text-foreground">Students (USN / DOB)</div>
              <div>1MS21CS001 / 2003-04-12 (Aarav)</div>
              <div>1MS21CS002 / 2003-07-23 (Priya)</div>
              <div>1MS21EC005 / 2003-09-30 (Karan)</div>
              <div className="font-sans font-semibold text-foreground mt-2">Alumni (email / password)</div>
              <div>anjali.rao@alumni.com / Password@123</div>
              <div>vikash.kumar@alumni.com / Password@123</div>
              <div>neha.singh@alumni.com / Password@123</div>
              <div>arjun.mehta@alumni.com / Password@123</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
