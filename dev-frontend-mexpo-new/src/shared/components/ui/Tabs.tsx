// src/shared/components/ui/Tabs.tsx
// Komponen tab navigasi generik

'use client';

import { useState } from 'react';
import { cn } from '@/shared/utils/cn';

export interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onTabChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '');

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div
      className={cn(
        'flex gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50',
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
