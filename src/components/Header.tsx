"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import { AdminLink } from "./AdminLink";
import { AuthStatus } from "./AuthStatus";
import { BrandMark } from "./BrandMark";
import { LanguageToggle } from "./LanguageToggle";
import { NavLink } from "./NavLink";

export function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile menu whenever the route changes (covers back/forward navigation too).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  // Lift the header with a stronger shadow once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const desktopLinks = (
    <>
      <NavLink href="/" exact onNavigate={closeMenu}>
        {t("nav.home")}
      </NavLink>
      <NavLink href="/markets/new" onNavigate={closeMenu}>
        {t("nav.addMarket")}
      </NavLink>
      <NavLink href="/markets/pending" onNavigate={closeMenu}>
        {t("nav.pending")}
      </NavLink>
      <NavLink href="/help" onNavigate={closeMenu}>
        {t("nav.help")}
      </NavLink>
      <NavLink href="/feedback" onNavigate={closeMenu}>
        {t("nav.feedback")}
      </NavLink>
      <AdminLink onNavigate={closeMenu} />
    </>
  );

  const mobileLinks = (
    <>
      <NavLink href="/" exact variant="row" onNavigate={closeMenu}>
        {t("nav.home")}
      </NavLink>
      <NavLink href="/markets/new" variant="row" onNavigate={closeMenu}>
        {t("nav.addMarket")}
      </NavLink>
      <NavLink href="/markets/pending" variant="row" onNavigate={closeMenu}>
        {t("nav.pending")}
      </NavLink>
      <NavLink href="/help" variant="row" onNavigate={closeMenu}>
        {t("nav.help")}
      </NavLink>
      <NavLink href="/feedback" variant="row" onNavigate={closeMenu}>
        {t("nav.feedback")}
      </NavLink>
      <AdminLink variant="row" onNavigate={closeMenu} />
    </>
  );

  return (
    <header
      className={`sticky top-0 z-40 bg-emerald-700 text-white transition-shadow ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:py-5">
        <Link
          href="/"
          aria-label={t("app.title")}
          onClick={closeMenu}
          className="flex items-center gap-3 rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
            <BrandMark className="size-6" />
          </span>
          <div>
            <span className="block text-lg font-bold leading-tight sm:text-xl">
              {t("app.title")}
            </span>
            <span className="hidden text-sm text-emerald-50/90 sm:block">
              {t("app.tagline")}
            </span>
          </div>
        </Link>

        <nav
          aria-label={t("nav.primary")}
          className="hidden items-center gap-2 sm:flex sm:gap-3"
        >
          {desktopLinks}
          <LanguageToggle />
          <AuthStatus />
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? t("nav.menu.close") : t("nav.menu.open")}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:hidden"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-menu"
          aria-label={t("nav.primary")}
          className="border-t border-white/15 bg-emerald-700 sm:hidden"
        >
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col py-2">{mobileLinks}</div>
            <div className="flex items-center gap-2 border-t border-white/15 px-4 py-4">
              <LanguageToggle />
              <AuthStatus />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
