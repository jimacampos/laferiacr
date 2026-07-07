"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Shared pill styling for header controls (nav links, toggles, auth buttons). */
export const navPillBase =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export const navPillInactive =
  "border-white/30 bg-white/10 text-white hover:bg-white/20";

export const navPillActive =
  "border-white/60 bg-white/25 text-white shadow-sm";

/** Full-width list-row styling used inside the mobile menu. A left accent bar + tinted
 * background marks the active route, giving the drawer a solid, app-like feel. */
export const navRowBase =
  "flex w-full items-center gap-2 border-l-4 px-4 py-3 text-base font-medium text-white transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white";

export const navRowInactive =
  "border-transparent hover:bg-white/10";

export const navRowActive =
  "border-white bg-white/10 font-semibold";

/** Returns whether `href` matches the current path. Home (`exact`) matches only `/`; other
 * links match the path itself or any nested route (e.g. `/help` also matches `/help/faq`). */
export function useIsActive(href: string, exact = false): boolean {
  const pathname = usePathname() ?? "/";
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavLinkProps = {
  href: string;
  children: ReactNode;
  exact?: boolean;
  variant?: "pill" | "row";
  className?: string;
  onNavigate?: () => void;
};

export function NavLink({
  href,
  children,
  exact = false,
  variant = "pill",
  className = "",
  onNavigate,
}: NavLinkProps) {
  const isActive = useIsActive(href, exact);

  const styles =
    variant === "row"
      ? `${navRowBase} ${isActive ? navRowActive : navRowInactive}`
      : `${navPillBase} ${isActive ? navPillActive : navPillInactive}`;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={`${styles} ${className}`}
    >
      {children}
    </Link>
  );
}
