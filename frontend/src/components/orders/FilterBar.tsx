'use client';

import React from 'react';
import { CATEGORY_META, OrderCategory } from '@/types';
import { cn } from '@/lib/utils';
import { LayoutGrid } from 'lucide-react';

interface Props {
  activeCategory: OrderCategory | '';
  onCategoryChange: (cat: OrderCategory | '') => void;
}

const FILTERS: { label: string; value: OrderCategory | ''; icon: React.ReactNode }[] = [
  { label: 'All', value: '' as const, icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  ...(['food', 'print', 'notes', 'ride', 'assessment', 'project', 'coaching', 'design', 'event', 'marketplace', 'others'] as OrderCategory[]).map((c) => {
    const Icon = CATEGORY_META[c].icon;
    return {
      label: CATEGORY_META[c].label.split(' ')[0],
      value: c,
      icon: <Icon className="w-3.5 h-3.5" />,
    };
  }),
];

export default function FilterBar({ activeCategory, onCategoryChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onCategoryChange(f.value as OrderCategory | '')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all shrink-0',
            activeCategory === f.value
              ? 'bg-primary/10 border-primary/40 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground bg-secondary/30'
          )}
        >
          {f.icon}
          {f.label}
        </button>
      ))}
    </div>
  );
}
