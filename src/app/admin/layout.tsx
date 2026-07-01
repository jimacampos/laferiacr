import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { getViewerAccess } from "@/lib/contributions/access";

export const dynamic = "force-dynamic";

// Server-side gate for the whole /admin area: only moderators (Community Safety or higher,
// resolved from user_roles) may enter. Everyone else is redirected home. Individual routes
// still re-check their own capability server-side.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getViewerAccess();
  if (!access.isModerator) redirect("/");

  const role = access.isSuperAdmin ? "super_admin" : "community_safety";

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:py-6">
      <AdminNav role={role} isSuperAdmin={access.isSuperAdmin} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
