import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, PlusSquare, MessageSquare, User, LogOut, Bell, GraduationCap, Menu, X } from "lucide-react";
import { initials, timeAgo } from "@/lib/utils-format";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-strong rounded-2xl px-6 py-4 text-sm text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  const role = profile.role;
  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(role === "student" ? [{ to: "/queries/new", label: "Create Query", icon: PlusSquare }] : []),
    { to: "/chats", label: "Chats", icon: MessageSquare },
    { to: "/settings", label: "Profile", icon: User },
  ] as const;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed md:static z-30 inset-y-0 left-0 w-64 glass-strong border-r border-border/40 transform ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-200`}>
        <div className="p-5 flex items-center gap-2 border-b border-border/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hero shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-gradient">Alumni Hub</span>
        </div>
        <nav className="p-3 space-y-1">
          {items.map((it) => <NavItem key={it.to} to={it.to} label={it.label} Icon={it.icon} onClick={() => setOpen(false)} />)}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border/40">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-hero text-primary-foreground text-xs font-semibold">
              {initials(profile.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{profile.name}</div>
              <div className="text-[11px] text-muted-foreground capitalize">{role}</div>
            </div>
            <button onClick={() => signOut()} title="Sign out" className="p-2 rounded-md hover:bg-muted transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="glass sticky top-0 z-20 border-b border-border/40 px-4 md:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setOpen((v) => !v)} className="md:hidden p-2 rounded-md hover:bg-muted transition">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <NotificationBar />
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, label, Icon, onClick }: { to: string; label: string; Icon: any; onClick: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to || path.startsWith(to + "/");
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition group ${
        active ? "gradient-hero text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "" : "group-hover:scale-110 transition"}`} />
      {label}
    </Link>
  );
}

function NotificationBar() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((i) => !i.read).length;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15);
      setItems(data ?? []);
    };
    load();
    const ch = supabase.channel("notif-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (p) => {
        setItems((cur) => [p.new as any, ...cur]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((cur) => cur.map((i) => ({ ...i, read: true })));
  };

  return (
    <div className="ml-auto relative">
      <button
        onClick={() => { setOpen((v) => !v); if (!open) markRead(); }}
        className="relative rounded-full p-2 hover:bg-muted transition"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-strong rounded-xl border border-border/40 shadow-card overflow-hidden z-30">
          <div className="px-4 py-2.5 border-b border-border/40 text-sm font-semibold flex items-center justify-between">
            Notifications
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
            ) : items.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/50 transition">
                <div className="text-sm">{n.message}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
