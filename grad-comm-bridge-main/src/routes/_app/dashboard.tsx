import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import StudentDashboard from "@/components/StudentDashboard";
import AlumnusDashboard from "@/components/AlumnusDashboard";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardSwitch,
});

function DashboardSwitch() {
  const { profile } = useAuth();
  if (!profile) return null;
  return profile.role === "student" ? <StudentDashboard /> : <AlumnusDashboard />;
}
