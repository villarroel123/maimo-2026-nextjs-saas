"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/dashboard/actions";

function isActivePath(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ hasIndicator = false, href, label, onClick, pathname }) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      className={`relative inline-flex min-h-10 items-center rounded-full px-3.5 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038] ${
        active
          ? "bg-[#EEEEEE] text-[#823038] shadow-sm"
          : "text-[#EEEEEE] hover:bg-[#EEEEEE] hover:text-[#823038]"
      }`}
      href={href}
      onClick={onClick}
    >
      <span className="relative inline-flex">
        {label}
        {hasIndicator ? (
          <span
            aria-label="Hay notificaciones sin leer"
            className="absolute -right-2 -top-1.5 size-2.5 rounded-full bg-[#EEEEEE] ring-2 ring-[#0D1821]"
          />
        ) : null}
      </span>
    </Link>
  );
}

function ProfileLink({ avatarUrl, displayName, onClick, compact = false }) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "N";

  return (
    <Link
      aria-label="Abrir Mi agenda"
      className={`group inline-flex min-w-0 items-center gap-2 rounded-full border border-[#EEEEEE]/40 bg-[#EEEEEE]/10 p-1.5 text-[#EEEEEE] transition hover:border-[#EEEEEE] hover:bg-[#EEEEEE] hover:text-[#823038] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EEEEEE] ${
        compact ? "pr-1.5" : "pr-3"
      }`}
      href="/profile"
      onClick={onClick}
      title="Mi agenda"
    >
      {avatarUrl ? (
        <img
          alt=""
          className="size-7 shrink-0 rounded-full border border-[#EEEEEE]/60 object-cover"
          referrerPolicy="no-referrer"
          src={avatarUrl}
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-[#EEEEEE] text-xs font-bold text-[#823038]"
        >
          {initial}
        </span>
      )}
      {compact ? null : (
        <span className="max-w-28 truncate text-sm font-semibold sm:max-w-36">{displayName}</span>
      )}
    </Link>
  );
}

export default function Navbar({ actions, hasUnreadNotifications = false, profile, user }) {
  const pathname = usePathname();
  const [openMenuForPath, setOpenMenuForPath] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const isOpen = openMenuForPath === pathname;
  const displayName = profile?.displayName || user?.name || user?.email?.split("@")[0] || "Mi agenda";
  const avatarUrl = profile?.photoURL || user?.picture || "";
  const links = [
    { href: "/", label: "Home" },
    { href: "/votaciones", label: "Votaciones" },
    ...(user
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/notifications", label: "Notificaciones", hasIndicator: hasUnreadNotifications },
        ]
      : []),
  ];

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 12);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  function closeMenu() {
    setOpenMenuForPath(null);
  }

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
        isScrolled
          ? "border-[#823038] bg-[#823038]/95 shadow-[0_10px_30px_rgba(13,24,33,0.24)] backdrop-blur"
          : "border-[#0D1821] bg-[#0D1821]/95 backdrop-blur"
      }`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between gap-3 transition-[min-height,padding] duration-300 ${
            isScrolled ? "min-h-14 py-2" : "min-h-16 py-3"
          }`}
        >
          <Link
            className="group flex min-w-0 items-center gap-2.5 rounded-full pr-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#823038]"
            href="/"
            onClick={closeMenu}
          >
            <Image
              alt="Narabi"
              className={`h-auto shrink-0 transition-[width] duration-300 ${isScrolled ? "w-8" : "w-9"}`}
              height={36}
              priority
              src="/items/narabi_logo.png"
              width={36}
            />
            <span
              className="min-w-0 overflow-wrap-anywhere text-sm uppercase tracking-[0.14em] text-[#EEEEEE] transition-colors group-hover:text-white"
            >
              Narabi
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 lg:flex">
            <div className="flex min-w-0 items-center gap-1 rounded-full border border-[#EEEEEE]/25 bg-[#EEEEEE]/10 p-1 shadow-sm">
              {links.map((link) => (
                <NavLink
                  hasIndicator={link.hasIndicator}
                  href={link.href}
                  key={link.href}
                  label={link.label}
                  pathname={pathname}
                />
              ))}
            </div>

            <div className="flex min-w-0 items-center justify-end gap-2">
              {actions}
              {user ? (
                <>
                  <ProfileLink avatarUrl={avatarUrl} displayName={displayName} />
                  <form action={logout}>
                    <button
                      className="inline-flex h-10 items-center justify-center rounded-full border border-[#EEEEEE] bg-transparent px-4 text-sm font-semibold text-[#EEEEEE] transition hover:bg-[#EEEEEE] hover:text-[#823038] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EEEEEE]"
                      type="submit"
                    >
                      Cerrar sesión
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#EEEEEE] px-4 text-sm font-semibold text-[#823038] shadow-sm transition hover:bg-[#0D1821] hover:text-[#EEEEEE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EEEEEE]"
                  href="/login"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {user ? (
              <ProfileLink
                avatarUrl={avatarUrl}
                compact
                displayName={displayName}
                onClick={closeMenu}
              />
            ) : null}
            <button
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
              className="grid size-10 place-items-center rounded-full border border-[#EEEEEE]/50 bg-transparent text-[#EEEEEE] transition hover:border-[#EEEEEE] hover:bg-[#EEEEEE] hover:text-[#823038] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EEEEEE]"
              onClick={() => setOpenMenuForPath((value) => (value === pathname ? null : pathname))}
              type="button"
            >
              <span className="grid gap-1.5" aria-hidden="true">
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
              </span>
            </button>
          </div>
        </div>

        <div
          className={`grid overflow-hidden transition-[grid-template-rows,padding] duration-300 lg:hidden ${
            isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr] pb-0"
          }`}
          id="mobile-menu"
        >
          <div className="min-h-0 overflow-hidden">
            <div className="grid gap-1 border-t border-[#EEEEEE]/25 pt-3">
              {links.map((link) => (
                <NavLink
                  hasIndicator={link.hasIndicator}
                  href={link.href}
                  key={link.href}
                  label={link.label}
                  onClick={closeMenu}
                  pathname={pathname}
                />
              ))}
            </div>

            <div className="mt-3 grid min-w-0 gap-3 border-t border-[#EEEEEE]/25 pt-3">
              {actions}
              {user ? (
                <ProfileLink avatarUrl={avatarUrl} displayName={displayName} onClick={closeMenu} />
              ) : null}
            </div>

            {user ? (
              <form action={logout} className="mt-3">
                <button
                  className="h-10 w-full rounded-full border border-[#EEEEEE] bg-transparent px-4 text-sm font-semibold text-[#EEEEEE] transition hover:bg-[#EEEEEE] hover:text-[#823038] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EEEEEE]"
                  type="submit"
                >
                  Cerrar sesión
                </button>
              </form>
            ) : (
              <Link
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full bg-[#EEEEEE] px-4 text-sm font-semibold text-[#823038] shadow-sm transition hover:bg-[#0D1821] hover:text-[#EEEEEE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EEEEEE]"
                href="/login"
                onClick={closeMenu}
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
