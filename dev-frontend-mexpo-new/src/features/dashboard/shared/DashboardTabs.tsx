"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

export type SubTab = {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  content?: React.ReactNode;
};

export type TabGroup = {
  id: string;
  label: string;
  subTabs: SubTab[];
  content?: React.ReactNode;
};

interface DashboardTabsProps {
  groups: TabGroup[];
}

export default function DashboardTabs({ groups }: DashboardTabsProps) {
  const [activeGroup, setActiveGroup] = useState<string>(groups[0]?.id || "");
  const [activeSub, setActiveSub] = useState<string>(groups[0]?.subTabs[0]?.id || "");

  const currentGroup = groups.find((g) => g.id === activeGroup);
  const currentSub = currentGroup?.subTabs.find((s) => s.id === activeSub);

  const activeIndex = groups.findIndex((g) => g.id === activeGroup);

  return (
    <div className="w-full">
      {/* ── Top Level Tabs ── */}
      <div className="flex overflow-x-auto scrollbar-hide pt-2 relative z-10">
        {groups.map((group) => {
          const isActive = activeGroup === group.id;
          return (
            <button
              key={group.id}
              onClick={() => {
                setActiveGroup(group.id);
                if (group.subTabs.length > 0) {
                  setActiveSub(group.subTabs[0].id);
                } else {
                  setActiveSub("");
                }
              }}
              className={`px-6 py-3 text-sm font-semibold transition-colors rounded-t-xl whitespace-nowrap ${
                isActive
                  ? "bg-secondary text-white"
                  : "bg-transparent text-secondary hover:bg-brand-50"
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      {/* ── Sub Tabs Container ── */}
      {currentGroup && currentGroup.subTabs.length > 0 && (
        <div className={`bg-secondary overflow-hidden shadow-sm mb-6 ${activeIndex === 0 ? "rounded-b-xl rounded-tr-xl" : "rounded-xl"}`}>
          <div className="flex gap-6 px-6 pt-4 overflow-x-auto scrollbar-hide">
            {currentGroup.subTabs.map((sub) => {
              const isSubActive = activeSub === sub.id;
              
              const content = (
                <span className="flex items-center gap-2">
                  {sub.icon && <sub.icon className="w-4 h-4" />}
                  {sub.label}
                </span>
              );

              const className = `whitespace-nowrap text-sm font-medium transition-all pb-3 border-b-2 ${
                isSubActive
                  ? "text-white border-white"
                  : "text-brand-100 hover:text-white border-transparent"
              } ${sub.disabled ? "opacity-50 cursor-not-allowed" : ""}`;

              if (sub.href && !sub.disabled) {
                return (
                  <Link key={sub.id} href={sub.href} className={className}>
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={sub.id}
                  disabled={sub.disabled}
                  onClick={() => {
                    setActiveSub(sub.id);
                    if (sub.onClick) sub.onClick();
                  }}
                  className={className}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Content Area ── */}
      {(currentSub?.content || currentGroup?.content) && (
        <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {currentSub?.content || currentGroup?.content}
        </div>
      )}
    </div>
  );
}
