import { redirect } from "next/navigation";

import { RoleManager } from "@/components/admin/RoleManager";
import { getViewerAccess } from "@/lib/contributions/access";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  const access = await getViewerAccess();
  if (!access.isSuperAdmin) redirect("/admin");
  return <RoleManager currentUserId={access.userId ?? ""} />;
}
