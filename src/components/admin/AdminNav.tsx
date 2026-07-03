"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTranslation } from "@/i18n/I18nProvider";

interface NavItem {
  href: string;
  key: string;
  superOnly?: boolean;
}

const ITEMS: NavItem[] = [
  { href: "/admin", key: "admin.nav.dashboard" },
  { href: "/admin/reports", key: "admin.nav.reports" },
  { href: "/admin/attention", key: "admin.nav.attention" },
  { href: "/admin/roles", key: "admin.nav.roles", superOnly: true },
  { href: "/admin/settings", key: "admin.nav.settings", superOnly: true },
  { href: "/admin/audit", key: "admin.nav.audit" },
];

/** Top navigation + role badge for the /admin area. Super-Admin-only tabs are hidden for
 * Community Safety moderators (the routes also enforce this server-side). */
export function AdminNav({
  role,
  isSuperAdmin,
}: {
  role: "community_safety" | "super_admin";
  isSuperAdmin: boolean;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const items = ITEMS.filter((item) => !item.superOnly || isSuperAdmin);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">{t("admin.title")}</h1>
          <p className="text-sm text-stone-500">{t("admin.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
            {t("admin.yourRole")}: {t(`role.${role}`)}
          </span>
          <Link
            href="/"
            className="text-sm font-medium text-stone-500 hover:text-stone-700"
          >
            {t("admin.backToSite")}
          </Link>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-stone-200">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
