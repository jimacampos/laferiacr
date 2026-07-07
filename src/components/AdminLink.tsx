"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import { NavLink } from "./NavLink";

/** Header entry to the /admin area, shown only to moderators. Visibility is resolved from the
 * server (GET /api/admin/access → user_roles), never from a client claim; enforcement of the
 * area itself is server-side in the admin layout/routes. */
export function AdminLink({
  variant,
  onNavigate,
}: {
  variant?: "pill" | "row";
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const { status } = useSession();
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    fetch("/api/admin/access")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setIsModerator(Boolean(data.isModerator));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [status]);

  if (status !== "authenticated" || !isModerator) return null;

  return (
    <NavLink href="/admin" variant={variant} onNavigate={onNavigate}>
      {t("nav.admin")}
    </NavLink>
  );
}
