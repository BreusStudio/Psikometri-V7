'use client';

import React, { useState } from 'react';
import { 
  Search, 
  X, 
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Filter,
  Check
} from 'lucide-react';
import Modal from './Modal';

export interface FilterConfig {
  key: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  widthClass?: string;
}

export interface ActionConfig {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  actions?: ActionConfig[];
  useModalFilter?: boolean;
}

export default function SearchBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  filters = [],
  actions = [],
  useModalFilter = true
}: SearchBarProps) {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showInlineFilters, setShowInlineFilters] = useState(false);

  // Count active filters (not set to 'All')
  const activeFilters = filters.filter(f => f.value && f.value !== 'All');
  const activeFilterCount = activeFilters.length;

  // Clear all filters handler
  const handleResetFilters = () => {
    filters.forEach(f => f.onChange('All'));
    onSearchChange('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs font-sans text-xs space-y-3 animate-fade-in text-left">
      {/* 3-Zone Standardized Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        
        {/* Zone 1: Search Input Box & Filter Trigger */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9.5 pr-8 py-2 text-xs border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/60 focus:bg-white text-slate-800 font-medium placeholder-slate-400 transition-all h-9.5"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                title="Bersihkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Modal Trigger Button */}
          {filters.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (useModalFilter) {
                  setShowFilterModal(true);
                } else {
                  setShowInlineFilters(!showInlineFilters);
                }
              }}
              className={`flex items-center justify-center gap-1.5 px-3.5 h-9.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200/90 hover:bg-slate-100'
              }`}
              title="Filter Data"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Zone 3: Symmetrical Action Buttons Bar */}
        {actions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0 justify-start md:justify-end">
            {actions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.label}
                aria-label={action.label}
                className={`relative group px-3 h-9.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs whitespace-nowrap ${
                  action.className || 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {action.icon}
                <span className="text-[11px] font-semibold">{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zone 2: Active Filter Badges / Chips */}
      {(activeFilterCount > 0 || searchTerm) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mr-1">
            Filter Aktif:
          </span>

          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <span className="opacity-75">Cari:</span> &quot;{searchTerm}&quot;
              <button 
                type="button"
                onClick={() => onSearchChange('')} 
                className="hover:text-indigo-900 p-0.5 rounded hover:bg-indigo-100 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeFilters.map(f => {
            const selectedOpt = f.options.find(o => o.value === f.value);
            return (
              <span 
                key={f.key} 
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                <span className="text-slate-500">{f.label || f.key}:</span> {selectedOpt?.label || f.value}
                <button 
                  type="button"
                  onClick={() => f.onChange('All')} 
                  className="hover:text-slate-900 p-0.5 rounded hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 ml-auto text-[10px] font-bold text-rose-600 hover:text-rose-700 px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-100"
            title="Reset Semua Filter"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filter
          </button>
        </div>
      )}

      {/* Standardized Filter Modal Popup */}
      {filters.length > 0 && (
        <Modal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          title="Filter Data Terpadu"
          size="md"
        >
          <div className="space-y-4 text-left font-sans text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-600 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
              <p className="text-xs">
                Sesuaikan kriteria filter untuk menyaring data yang relevan secara instan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filters.map((filter, idx) => (
                <div key={filter.key || idx} className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {filter.label || filter.key}
                  </label>
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 cursor-pointer font-semibold shadow-2xs"
                  >
                    {filter.options.map((opt, optIdx) => (
                      <option key={optIdx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setShowFilterModal(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer border border-rose-100"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filter
              </button>

              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-900/20"
              >
                <Check className="w-3.5 h-3.5" />
                Terapkan Filter
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
