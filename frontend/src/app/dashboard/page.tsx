import { redirect } from "next/navigation";

import { ClosetPanel } from "@/components/dashboard/ClosetPanel";
import { FitDetailsStrip } from "@/components/dashboard/FitDetailsStrip";
import { MarketplacePanel } from "@/components/dashboard/MarketplacePanel";
import { TaskBar } from "@/components/dashboard/TaskBar";
import { TopBar } from "@/components/dashboard/TopBar";
import { TryOnPanel } from "@/components/dashboard/TryOnPanel";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const username =
    profile?.username ??
    user.user_metadata?.username ??
    user.email?.split("@")[0] ??
    "guest";

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <TopBar username={username} active="browse" />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-4 p-4 flex-1 min-h-0 overflow-hidden">
        <MarketplacePanel />
        <TryOnPanel />
        <ClosetPanel />
      </div>

      <FitDetailsStrip />

      <TaskBar />
    </main>
  );
}
