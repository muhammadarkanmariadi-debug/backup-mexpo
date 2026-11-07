"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LucideIcon,
  ChevronRight,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

export type SidebarSubTab = {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  content?: React.ReactNode;
  href?: string;
  onClick?: () => void;
};

export type SidebarTabGroup = {
  id: string;
  label: string;
  subTabs: SidebarSubTab[];
  content?: React.ReactNode;
};

interface DashboardSidebarLayoutProps {
  groups: SidebarTabGroup[];
  defaultGroupId?: string;
  defaultSubTabId?: string;
  activeGroupId?: string;
  activeSubTabId?: string;
  onTabChange?: (groupId: string, subTabId: string) => void;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  topHeader?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

const SIDEBAR_STORAGE_KEY = "mexpo:dashboard-sidebar-open";
const DESKTOP_QUERY = "(min-width: 1024px)";

const isDesktopViewport = () =>
  typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;

export default function DashboardSidebarLayout({
  groups,
  defaultGroupId,
  defaultSubTabId,
  activeGroupId,
  activeSubTabId,
  onTabChange,
  sidebarHeader,
  sidebarFooter,
  topHeader,
  actions,
  backHref = "/dashboard",
  backLabel = "Kembali ke Dashboard",
}: DashboardSidebarLayoutProps) {
  const [internalGroup, setInternalGroup] = useState<string>(
    defaultGroupId || groups[0]?.id || ""
  );
  const [internalSub, setInternalSub] = useState<string>(
    defaultSubTabId || groups[0]?.subTabs[0]?.id || ""
  );

  // Two independent states so a drawer toggled on mobile never changes the
  // remembered desktop preference (and vice versa).
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  // Transitions only switch on after the saved preference has been restored,
  // so a reload with the sidebar hidden snaps shut instead of animating.
  const [animate, setAnimate] = useState(false);

  // Restore the desktop preference after mount (avoids a hydration mismatch).
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "0") {
        setDesktopOpen(false);
      }
    } catch {
      // storage unavailable (private mode etc.) — default to open
    }
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimate(true))
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  const persistDesktopOpen = useCallback((open: boolean) => {
    setDesktopOpen(open);
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, open ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const showSidebar = useCallback(() => {
    if (isDesktopViewport()) persistDesktopOpen(true);
    else setMobileOpen(true);
  }, [persistDesktopOpen]);

  const hideSidebar = useCallback(() => {
    if (isDesktopViewport()) persistDesktopOpen(false);
    else setMobileOpen(false);
  }, [persistDesktopOpen]);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const activeGroup = activeGroupId ?? internalGroup;
  const activeSub = activeSubTabId ?? internalSub;

  const currentGroup = groups.find((g) => g.id === activeGroup) || groups[0];
  const currentSub =
    currentGroup?.subTabs.find((s) => s.id === activeSub) ||
    currentGroup?.subTabs[0];

  const handleSelectSubTab = (group: SidebarTabGroup, sub: SidebarSubTab) => {
    if (activeGroupId === undefined) setInternalGroup(group.id);
    if (activeSubTabId === undefined) setInternalSub(sub.id);
    if (onTabChange) onTabChange(group.id, sub.id);
    if (sub.onClick) sub.onClick();
    setMobileOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex h-dvh w-full overflow-hidden bg-slate-50 text-slate-900 antialiased">
      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──
          Mobile : off-canvas drawer pinned to the LEFT edge (fixed, left-0).
          Desktop: in-flow column that slides fully out of view (width -> 0),
                   exactly like the Claude Code sidebar — no icon rail. */}
      <aside
        id="dashboard-sidebar"
        aria-label="Navigasi dashboard"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-hidden border-r border-slate-200/90 bg-white shadow-xl lg:static lg:z-auto lg:max-w-none lg:shrink-0 lg:shadow-none ${
          mobileOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        } ${
          animate
            ? "transition-[translate,width,visibility] duration-300 ease-in-out"
            : ""
        } ${
          desktopOpen
            ? "lg:visible lg:w-72 lg:translate-x-0"
            : "lg:invisible lg:w-0 lg:translate-x-0 lg:border-r-0"
        }`}
      >
        {/* Fixed-width inner column so content never reflows while the
            aside animates its width. */}
        <div className="flex h-full w-full flex-col lg:w-72">
          {/* Top row: hide toggle + brand (same spot Claude Code uses) */}
          <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-100 px-4">
            <button
              type="button"
              onClick={hideSidebar}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              title="Sembunyikan sidebar"
              aria-label="Sembunyikan sidebar"
              aria-controls="dashboard-sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
            <Image
              src="/logo/logo.png"
              alt="Mexpo"
              width={90}
              height={30}
              className="h-7 w-auto"
              priority
            />
          </div>

          {/* Identity / role / event badge */}
          {sidebarHeader && (
            <div className="shrink-0 border-b border-slate-100 p-4">
              {sidebarHeader}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
            {groups.map((group) => (
              <div key={group.id} className="space-y-1">
                <p className="truncate px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>

                <div className="space-y-1">
                  {group.subTabs.map((sub) => {
                    const isActive =
                      activeGroup === group.id && activeSub === sub.id;
                    const Icon = sub.icon;

                    const itemContent = (
                      <>
                        <div className="flex min-w-0 items-center gap-3">
                          {Icon && (
                            <Icon
                              className={`h-4 w-4 shrink-0 transition-colors ${
                                isActive ? "text-white" : "text-slate-400"
                              }`}
                            />
                          )}
                          <span className="truncate text-xs font-semibold">
                            {sub.label}
                          </span>
                        </div>

                        {sub.badge ? (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : sub.badgeColor || "bg-blue-50 text-secondary"
                            }`}
                          >
                            {sub.badge}
                          </span>
                        ) : isActive ? (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/80" />
                        ) : null}
                      </>
                    );

                    const itemClasses = `flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all ${
                      isActive
                        ? "bg-secondary font-bold text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    } ${sub.disabled ? "cursor-not-allowed opacity-40" : ""}`;

                    if (sub.href) {
                      return (
                        <Link
                          key={sub.id}
                          href={sub.href}
                          title={sub.label}
                          onClick={() => {
                            if (sub.onClick) sub.onClick();
                            setMobileOpen(false);
                          }}
                          className={itemClasses}
                        >
                          {itemContent}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        title={sub.label}
                        disabled={sub.disabled}
                        onClick={() => handleSelectSubTab(group, sub)}
                        className={itemClasses}
                      >
                        {itemContent}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer: contextual actions, then the "back" link at the very bottom */}
          <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 p-3">
            {sidebarFooter}
            <Link
              href={backHref}
              title={backLabel}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{backLabel}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
        <header className="z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white pl-4 pr-4 shadow-2xs sm:pr-6 lg:pr-8">
          <div className="flex min-w-0 items-center gap-3">
            {/* Show toggle: always on mobile, on desktop only while hidden —
                it takes the place of the in-sidebar toggle. */}
            <button
              type="button"
              onClick={showSidebar}
              className={`h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 ${
                desktopOpen ? "flex lg:hidden" : "flex"
              }`}
              title="Tampilkan sidebar"
              aria-label="Tampilkan sidebar"
              aria-controls="dashboard-sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="truncate">{currentGroup?.label}</span>
                <span>/</span>
                <span className="truncate text-secondary">
                  {currentSub?.label}
                </span>
              </div>
              <h2 className="truncate text-base font-black tracking-tight text-slate-900 sm:text-lg">
                {currentSub?.label}
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">{actions}</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {topHeader && <div className="w-full">{topHeader}</div>}

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {currentSub?.content || currentGroup?.content || (
                <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-400">
                  Pilih menu di sidebar untuk melihat konten.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
