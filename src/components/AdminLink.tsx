"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";

/** Header entry to the /admin area, shown only to moderators. Visibility is resolved from the
 * server (GET /api/admin/access → user_roles), never from a client claim; enforcement of the
 * area itself is server-side in the admin layout/routes. */
export function AdminLink() {
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
    <Link
      href="/admin"
      className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {t("nav.admin")}
    </Link>
  );
}
