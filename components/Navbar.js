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

function NavLink({
  hasIndicator = false,
  href,
  isScrolled = false,
  label,
  onClick,
  pathname,
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      className={`relative inline-flex min-h-10 items-center rounded-full px-3.5 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038] ${
        active
          ? "bg-[#FDFDFF] text-[#823038] shadow-sm"
          : isScrolled
            ? "text-[#823038] hover:bg-[#FDFDFF] hover:text-[#823038]"
            : "text-[#FDFDFF] hover:bg-[#FFE4F3] hover:text-[#823038]"
      }`}
      href={href}
      onClick={onClick}
    >
      <span className="relative inline-flex">
        {label}
        {hasIndicator ? (
          <span
            aria-label="Hay notificaciones sin leer"
            className="absolute -right-2 -top-1.5 size-2.5 rounded-full bg-[#FDFDFF] ring-2 ring-[#823038]"
          />
        ) : null}
      </span>
    </Link>
  );
}

function ProfileLink({
  avatarUrl,
  displayName,
  isScrolled = false,
  onClick,
  compact = false,
}) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "N";

  return (
    <Link
      aria-label="Abrir Mi agenda"
      className={`group inline-flex min-w-0 items-center gap-2 rounded-full border border-[#FDFDFF]/40 bg-[#FDFDFF]/10 p-1.5 transition hover:border-[#FDFDFF] hover:bg-[#FDFDFF] hover:text-[#823038] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDFDFF] ${
        isScrolled ? "text-[#823038]" : "text-[#FDFDFF]"
      } ${compact ? "pr-1.5" : "pr-3"}`}
      href="/profile"
      onClick={onClick}
      title="Mi agenda"
    >
      {avatarUrl ? (
        <img
          alt=""
          className="size-7 shrink-0 rounded-full border border-[#FDFDFF]/60 object-cover"
          referrerPolicy="no-referrer"
          src={avatarUrl}
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-[#FDFDFF] text-xs font-bold text-[#823038]"
        >
          {initial}
        </span>
      )}

      {compact ? null : (
        <span className="max-w-28 truncate text-sm font-semibold sm:max-w-36">
          {displayName}
        </span>
      )}
    </Link>
  );
}

export default function Navbar({
  actions,
  hasUnreadNotifications = false,
  profile,
  user,
}) {
  const pathname = usePathname();
  const [openMenuForPath, setOpenMenuForPath] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const isOpen = openMenuForPath === pathname;
  const displayName =
    profile?.displayName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Mi agenda";
  const avatarUrl = profile?.photoURL || user?.picture || "";

  const links = [
    { href: "/", label: "Home" },
    { href: "/votaciones", label: "Votaciones" },
    { href: "/fanbases", label: "Fanbases" },
    ...(user
      ? [
          { href: "/dashboard", label: "Dashboard" },
          {
            href: "/notifications",
            label: "Notificaciones",
            hasIndicator: hasUnreadNotifications,
          },
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
          ? "border-[#823038]/40 bg-[#FFE4F3]/60 shadow-[0_10px_30px_rgba(13,24,33,0.24)] backdrop-blur"
          : "border-[#823038] bg-[#823038]/95"
      }`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-14 items-center justify-between gap-3 py-2">
          <Link
            className="group flex min-w-0 items-center gap-2.5 rounded-full pr-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#823038]"
            href="/"
            onClick={closeMenu}
          >
            <Image
              alt="Narabi"
              className="h-auto w-8 shrink-0"
              height={36}
              priority
              src="/items/narabi_logo.png"
              width={36}
            />

            <span
              className={`min-w-0 overflow-wrap-anywhere text-sm uppercase tracking-[0.14em] transition-colors group-hover:text-white ${
                isScrolled ? "text-[#823038]" : "text-[#FDFDFF]"
              }`}
            >
              Narabi
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 lg:flex">
            <div className="flex min-w-0 items-center gap-1 rounded-full border border-[#EEEEEE]/25 bg-[#FDFDFF]/10 p-1 shadow-sm">
              {links.map((link) => (
                <NavLink
                  hasIndicator={link.hasIndicator}
                  href={link.href}
                  isScrolled={isScrolled}
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
                  <ProfileLink
                    avatarUrl={avatarUrl}
                    displayName={displayName}
                    isScrolled={isScrolled}
                  />

                  <form action={logout}>
                    <button
                      className={`inline-flex h-10 items-center justify-center rounded-full border border-[#FDFDFF] bg-transparent px-4 text-sm font-semibold transition hover:bg-[#FDFDFF] hover:text-[#823038] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDFDFF] ${
                        isScrolled
                          ? "text-[#823038]"
                          : "text-[#FDFDFF]"
                      }`}
                      type="submit"
                    >
                      Cerrar sesión
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#FDFDFF] px-4 text-sm font-semibold text-[#823038] shadow-sm transition hover:bg-[#0D1821] hover:text-[#FDFDFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDFDFF]"
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
                isScrolled={isScrolled}
                onClick={closeMenu}
              />
            ) : null}

            <button
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
              className={`grid size-10 place-items-center rounded-full border border-[#EEEEEE]/50 bg-transparent transition hover:border-[#EEEEEE] hover:bg-[#EEEEEE] hover:text-[#823038] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EEEEEE] ${
                isScrolled ? "text-[#823038]" : "text-[#EEEEEE]"
              }`}
              onClick={() =>
                setOpenMenuForPath((value) =>
                  value === pathname ? null : pathname,
                )
              }
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
            isOpen
              ? "grid-rows-[1fr] pb-4"
              : "grid-rows-[0fr] pb-0"
          }`}
          id="mobile-menu"
        >
          <div className="min-h-0 overflow-hidden">
            <div className="grid gap-1 border-t border-[#EEEEEE]/25 pt-3">
              {links.map((link) => (
                <NavLink
                  hasIndicator={link.hasIndicator}
                  href={link.href}
                  isScrolled={isScrolled}
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
                <ProfileLink
                  avatarUrl={avatarUrl}
                  displayName={displayName}
                  isScrolled={isScrolled}
                  onClick={closeMenu}
                />
              ) : null}
            </div>

            {user ? (
              <form action={logout} className="mt-3">
                <button
                  className={`h-10 w-full rounded-full border border-[#EEEEEE] bg-transparent px-4 text-sm font-semibold transition hover:bg-[#EEEEEE] hover:text-[#823038] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EEEEEE] ${
                    isScrolled
                      ? "text-[#823038]"
                      : "text-[#EEEEEE]"
                  }`}
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