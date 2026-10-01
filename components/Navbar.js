"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { faBell, faMagnifyingGlass, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
  compact = false,
  displayName,
  homeStyle = false,
  isScrolled = false,
  onClick,
}) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "N";

  return (
    <Link
      aria-label={`Abrir perfil de ${displayName}`}
      className={homeStyle
        ? `inline-flex size-9 shrink-0 items-center justify-center transition hover:opacity-75 focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDFDFF] ${isScrolled ? "text-[#823038]" : "text-[#FDFDFF]"}`
        : `group inline-flex min-w-0 items-center gap-2 rounded-full border border-[#FDFDFF]/40 bg-[#FDFDFF]/10 p-1.5 transition hover:border-[#FDFDFF] hover:bg-[#FDFDFF] hover:text-[#823038] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDFDFF] ${isScrolled ? "text-[#823038]" : "text-[#FDFDFF]"} ${compact ? "pr-1.5" : "pr-3"}`}
      href="/profile"
      onClick={onClick}
      title={displayName}
    >
      {avatarUrl ? (
        <Image
          alt=""
          className={`${homeStyle ? "size-9" : "size-7 border border-[#FDFDFF]/60"} shrink-0 rounded-full object-cover`}
          height={36}
          referrerPolicy="no-referrer"
          src={avatarUrl}
          unoptimized
          width={36}
        />
      ) : (
        homeStyle ? (
          <FontAwesomeIcon aria-hidden="true" className="size-6" icon={faUser} />
        ) : (
          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-[#FDFDFF] text-xs font-bold text-[#823038]">
            {initial}
          </span>
        )
      )}
      {!homeStyle && !compact ? (
        <span className="max-w-28 truncate text-sm font-semibold sm:max-w-36">{displayName}</span>
      ) : null}
    </Link>
  );
}

function DesktopLinks({ links, isScrolled, pathname }) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#EEEEEE]/25 bg-[#FDFDFF]/10 p-1 shadow-sm">
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
  );
}

function SearchButton({ isScrolled, onClick }) {
  return (
    <button
      aria-label="Abrir búsqueda"
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full transition hover:bg-[#FDFDFF]/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDFDFF] ${isScrolled ? "text-[#823038]" : "text-[#FDFDFF]"}`}
      onClick={onClick}
      title="Buscar"
      type="button"
    >
      <FontAwesomeIcon aria-hidden="true" className="size-5" icon={faMagnifyingGlass} />
    </button>
  );
}

function NotificationsButton({ active, hasIndicator, isScrolled, onClick }) {
  return (
    <Link
      aria-label={hasIndicator ? "Notificaciones (hay sin leer)" : "Notificaciones"}
      className={`relative inline-flex size-9 shrink-0 items-center justify-center rounded-full transition hover:bg-[#FDFDFF]/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDFDFF] ${active ? "bg-[#FDFDFF]/15" : ""} ${isScrolled ? "text-[#823038]" : "text-[#FDFDFF]"}`}
      href="/notifications"
      onClick={onClick}
      title="Notificaciones"
    >
      <FontAwesomeIcon aria-hidden="true" className="size-5" icon={faBell} />
      {hasIndicator ? (
        <span
          aria-hidden="true"
          className={`absolute right-1 top-1 size-2.5 rounded-full ring-2 ${isScrolled ? "bg-[#823038] ring-[#FFE4F3]" : "bg-[#FDFDFF] ring-[#823038]"}`}
        />
      ) : null}
    </Link>
  );
}

function DesktopAccount({ avatarUrl, displayName, homeStyle, isScrolled, onClick, user }) {
  return user ? (
    <ProfileLink
      avatarUrl={avatarUrl}
      displayName={displayName}
      homeStyle={homeStyle}
      isScrolled={isScrolled}
      onClick={onClick}
    />
  ) : (
    <Link
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#FDFDFF] px-4 text-sm font-semibold text-[#823038] shadow-sm transition hover:bg-[#0D1821] hover:text-[#FDFDFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDFDFF]"
      href="/login"
      onClick={onClick}
    >
      Iniciar sesión
    </Link>
  );
}

export default function Navbar({
  hasUnreadNotifications = false,
  profile,
  user,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenuForPath, setOpenMenuForPath] = useState(null);
  const [openSearchForPath, setOpenSearchForPath] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const isSearchOpen = openSearchForPath === pathname;
  const isOpen = !isSearchOpen && openMenuForPath === pathname;
  const displayName =
    profile?.displayName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Mi agenda";
  const avatarUrl = profile?.photoURL || user?.picture || "";

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/votaciones", label: "Votaciones" },
    { href: "/fanbases", label: "Fanbases" },
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 12);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  function closeMenu() {
    setOpenMenuForPath(null);
  }

  function openSearch() {
    setSearchQuery(pathname === "/" ? new URLSearchParams(window.location.search).get("q") || "" : "");
    closeMenu();
    setOpenSearchForPath(pathname);
  }

  function closeSearch() {
    setOpenSearchForPath(null);
  }

  function submitSearch(event) {
    event.preventDefault();
    const query = searchQuery.trim().slice(0, 100);
    closeSearch();
    router.push(query ? `/?q=${encodeURIComponent(query)}#explorar` : "/#explorar");
  }

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
        isScrolled
          ? "border-[#823038]/40 bg-[#FFE4F3]/60 shadow-[0_10px_30px_rgba(13,24,33,0.24)] backdrop-blur"
          : "border-[#823038] bg-[#823038]/95"
      }`}
    >
      <div className={`mx-auto w-full ${pathname === "/" ? "max-w-7xl px-6 sm:px-10 lg:px-14 xl:px-16" : "max-w-6xl px-4 sm:px-6 lg:px-8"}`}>
        {/* Altura fija: 56px en mobile, 66px en xl, con o sin search abierto */}
        <div className="flex h-14 items-center justify-between gap-3 py-2 xl:h-[66px]">
          <Link
            className={`group shrink-0 items-center gap-2.5 rounded-full pr-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#823038] ${isSearchOpen ? "hidden xl:flex" : "flex"}`}
            href="/"
            onClick={() => { closeMenu(); closeSearch(); }}
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

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            {!isSearchOpen ? (
              <div className="hidden xl:flex">
                <DesktopLinks isScrolled={isScrolled} links={links} pathname={pathname} />
              </div>
            ) : null}

            {isSearchOpen ? (
              <form
                className="flex min-w-0 flex-1 items-center gap-2"
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeSearch();
                  }
                }}
                onSubmit={submitSearch}
                role="search"
              >
                <label className="sr-only" htmlFor="navbar-search">Buscar en Narabi</label>
                <div className={`flex h-10 min-w-0 flex-1 items-center rounded-full border bg-[#FDFDFF]/10 focus-within:ring-2 xl:h-[50px] ${isScrolled ? "border-[#823038]/35 text-[#823038] focus-within:ring-[#823038]/30" : "border-[#FDFDFF]/50 text-[#FDFDFF] focus-within:ring-[#FDFDFF]/35"}`}>
                  <input
                    autoComplete="off"
                    className={`h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none ${isScrolled ? "placeholder:text-[#823038]/60" : "placeholder:text-[#FDFDFF]/70"}`}
                    id="navbar-search"
                    maxLength={100}
                    name="q"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Buscar conciertos, fanprojects o fanbases"
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                  />
                  <button aria-label="Buscar" className="grid size-9 shrink-0 place-items-center rounded-full transition hover:bg-[#FDFDFF]/15" type="submit">
                    <FontAwesomeIcon aria-hidden="true" className="size-5" icon={faMagnifyingGlass} />
                  </button>
                </div>
                <button aria-label="Cerrar búsqueda" className={`grid size-9 shrink-0 place-items-center rounded-full text-xl transition hover:bg-[#FDFDFF]/15 ${isScrolled ? "text-[#823038]" : "text-[#FDFDFF]"}`} onClick={closeSearch} type="button">×</button>
              </form>
            ) : (
              <div className="flex shrink-0 items-center gap-1">
                <SearchButton isScrolled={isScrolled} onClick={openSearch} />
                {user ? (
                  <NotificationsButton
                    active={isActivePath(pathname, "/notifications")}
                    hasIndicator={hasUnreadNotifications}
                    isScrolled={isScrolled}
                    onClick={closeMenu}
                  />
                ) : null}
              </div>
            )}

            <div className="hidden shrink-0 xl:flex">
              <DesktopAccount avatarUrl={avatarUrl} displayName={displayName} homeStyle={pathname === "/"} isScrolled={isScrolled} onClick={closeSearch} user={user} />
            </div>

            {!isSearchOpen ? (
              <div className="flex items-center gap-2 xl:hidden">
                {user ? (
                  <ProfileLink
                    avatarUrl={avatarUrl}
                    compact
                    displayName={displayName}
                    homeStyle={pathname === "/"}
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
            ) : null}
          </div>

        </div>

        <div
          className={`grid overflow-hidden transition-[grid-template-rows,padding] duration-300 xl:hidden ${
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

            {!user ? (
              <Link
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full bg-[#EEEEEE] px-4 text-sm font-semibold text-[#823038] shadow-sm transition hover:bg-[#0D1821] hover:text-[#EEEEEE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EEEEEE]"
                href="/login"
                onClick={closeMenu}
              >
                Iniciar sesión
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}