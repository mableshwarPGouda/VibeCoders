import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Users, Sparkles, MessageSquare, Brain } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [loading, user, nav]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-20 border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hero shadow-glow">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">Alumni Hub</span>
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-foreground/5 px-4 py-2 text-sm font-medium hover:bg-foreground/10 transition"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI-powered query routing
        </div>
        <h1 className="mt-6 text-5xl md:text-6xl font-extrabold tracking-tight">
          Where students meet <span className="text-gradient">alumni who get it.</span>
        </h1>
        <p className="mt-5 mx-auto max-w-2xl text-lg text-muted-foreground">
          Ask a question — our AI matches it with the right alumni based on domain & expertise.
          Real-time chat, mentorship, opportunities. All in one place.
        </p>

        {/* Login as */}
        <div className="mt-12">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-5">Login as</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              to="/login"
              search={{ as: "student" }}
              className="group glass-strong hover-lift rounded-2xl px-10 py-6 min-w-[220px] flex flex-col items-center gap-3 transition-all hover:shadow-glow"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <GraduationCap className="h-7 w-7" />
              </div>
              <span className="text-lg font-semibold">Student</span>
              <span className="text-xs text-muted-foreground">USN + Date of Birth</span>
            </Link>
            <Link
              to="/login"
              search={{ as: "alumnus" }}
              className="group glass-strong hover-lift rounded-2xl px-10 py-6 min-w-[220px] flex flex-col items-center gap-3 transition-all hover:shadow-glow"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7" />
              </div>
              <span className="text-lg font-semibold">Alumnus</span>
              <span className="text-xs text-muted-foreground">Email + Password</span>
            </Link>
          </div>
        </div>
      </section>

      {/* About / features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "Smart matching", desc: "Your question gets routed to alumni working in that exact domain — no more cold-DMing strangers." },
            { icon: MessageSquare, title: "Real-time chat", desc: "Once an alumnus replies, start a conversation instantly. WhatsApp-style messaging with live updates." },
            { icon: Users, title: "Authentic profiles", desc: "Browse experience, projects, LinkedIn & GitHub. Connect with people who've walked the path." },
          ].map((f, i) => (
            <div key={i} className="glass-strong rounded-2xl p-6 hover-lift">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-hero text-primary-foreground mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-8 mt-10 text-center">
          <h2 className="text-2xl font-bold">Built for college campuses</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Alumni Hub bridges the gap between current students and graduates. Whether you need career advice,
            project mentorship, or industry insights — find the right alumni in seconds, not months.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Alumni Hub
      </footer>
    </div>
  );
}
