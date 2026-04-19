import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let dashboardUser = {
    username: "guest",
    displayName: "Guest",
    avatarUrl: null as string | null,
  };
  let accessToken: string | null = null;
  let shouldRedirect = false;

  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      shouldRedirect = true;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const metadataUsername =
        typeof user.user_metadata?.username === "string" && user.user_metadata.username.trim()
          ? user.user_metadata.username.trim()
          : null;
      const profileUsername =
        typeof profile?.username === "string" && profile.username.trim()
          ? profile.username.trim()
          : null;
      const effectiveProfileUsername =
        profileUsername && !/^user_[0-9a-f]{8}$/i.test(profileUsername)
          ? profileUsername
          : metadataUsername ?? profileUsername;
      const username =
        effectiveProfileUsername ??
        user.email?.split("@")[0] ??
        "guest";
      const displayName =
        profile?.display_name ??
        user.user_metadata?.display_name ??
        username;
      const avatarUrl =
        user.user_metadata?.avatar_url ??
        user.user_metadata?.picture ??
        null;

      dashboardUser = {
        username,
        displayName,
        avatarUrl,
      };
      accessToken = session?.access_token ?? null;
    }
  }

  if (shouldRedirect) {
    redirect("/login");
  }

  return <DashboardShell user={dashboardUser} accessToken={accessToken} />;
}
