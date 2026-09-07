'use client';

import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Columns, 
  X, 
  Copy, 
  CheckCircle2,
  Info,
  RotateCcw,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';

export interface ColumnMetadata<T> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  priority?: 'high' | 'medium' | 'low'; // high = always visible, medium = sm/md+, low = lg+
  hidden?: boolean;
  fullWidth?: boolean; // Card view: spans full width (1 row)
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnMetadata<T>[];
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  emptyMessage?: string;
  className?: string;
  title?: string;
  onResetFilter?: () => void;
  totalRecords?: number;
}

export default function DataTable<T>({
  data,
  columns,
  sortField,
  sortOrder,
  onSort,
  emptyMessage = 'Tidak ada data untuk ditampilkan.',
  className = '',
  title,
  onResetFilter,
  totalRecords = 0
}: DataTableProps<T>) {
  // Column visibility picker state
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<Record<string, boolean>>({});

  // View Mode: auto (responsive cards on mobile, table on desktop), table, or grid
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'grid'>('auto');

  // Detail Inspector Modal State
  const [selectedInspectItem, setSelectedInspectItem] = useState<T | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSortClick = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  // Toggle custom column visibility
  const toggleColumnVisibility = (key: string) => {
    setHiddenKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Determine responsive visibility CSS classes based on column index / priority
  const getResponsiveClass = (col: ColumnMetadata<T>, index: number) => {
    if (hiddenKeys[col.key]) return 'hidden';

    // If explicit priority is provided
    if (col.priority === 'high') return '';
    if (col.priority === 'medium') return 'hidden sm:table-cell';
    if (col.priority === 'low') return 'hidden md:table-cell';

    // Default heuristic for standard tables:
    if (index <= 1 || index === columns.length - 1 || col.key === 'actions' || col.key === 'viewReport') {
      return '';
    }
    if (index <= 3) {
      return 'hidden sm:table-cell';
    }
    return 'hidden lg:table-cell';
  };

  const handleCopyValue = (textVal: string, keyName: string) => {
    navigator.clipboard.writeText(textVal);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Identify primary and action columns for Mobile Card View
  const actionsCol = columns.find(c => c.key === 'actions');
  const dataColumns = columns.filter(c => c.key !== 'actions' && c.key !== 'select');
  const primaryCol = dataColumns[0];
  const secondaryCol = dataColumns[1];
  const remainingCols = dataColumns.slice(2);

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* Table Header Bar with Data Counter, View Mode Toggle & Column Selector */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-2">
          {title && <span className="font-bold text-slate-800">{title}</span>}
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/60">
            Total: <strong className="text-slate-800 font-bold">{data.length}</strong> data
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View Mode Toggle (Auto / Grid / Table) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={viewMode === 'grid' ? 'Beralih ke Tampilan Tabel' : 'Beralih ke Tampilan Kartu'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'table' || viewMode === 'auto'
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Standar"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Column Picker Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
              title="Kelola Kolom Tabel"
            >
              <Columns className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Kolom</span>
            </button>

            {/* Column Picker Popover */}
            {showColumnPicker && (
              <div className="absolute right-0 top-9 z-40 w-56 bg-white rounded-xl border border-slate-200 shadow-xl p-2.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-left">
                <div className="flex items-center justify-between pb-1.5 px-2 border-b border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Tampilkan Kolom
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowColumnPicker(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-0.5 text-[11px] pt-1">
                  {columns.map((col, idx) => {
                    if (!col.key) return null;
                    const isVisible = !hiddenKeys[col.key];
                    const headerText = typeof col.header === 'string' ? col.header : `Kolom ${idx + 1}`;
                    return (
                      <label 
                        key={col.key || idx} 
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 font-medium select-none"
                      >
                        <input 
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleColumnVisibility(col.key)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate">{headerText}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Mobile Card Grid View (Active when viewMode is 'grid' or auto on small screens < 768px) */}
      <div className={`${viewMode === 'grid' ? 'block' : viewMode === 'table' ? 'hidden' : 'block md:hidden'} space-y-3`}>
        {data.map((item, rowIdx) => (
          <div 
            key={rowIdx}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-indigo-200 transition-all space-y-3 text-left"
          >
            {/* Card Header Row */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex-1 min-w-0">
                {primaryCol && (
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {primaryCol.render ? primaryCol.render(item, rowIdx) : String((item as any)[primaryCol.key] || '-')}
                  </div>
                )}
                {secondaryCol && (
                  <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {secondaryCol.render ? secondaryCol.render(item, rowIdx) : String((item as any)[secondaryCol.key] || '-')}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedInspectItem(item)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/60 transition-all cursor-pointer shrink-0"
                title="Lihat Detail Lengkap"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card Attributes Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {remainingCols.map((col, cIdx) => {
                if (hiddenKeys[col.key]) return null;
                const headerLabel = typeof col.header === 'string' ? col.header : col.key;
                const isFull = Boolean(col.fullWidth);
                return (
                  <div 
                    key={cIdx} 
                    className={`bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/80 ${
                      isFull ? 'col-span-2' : 'col-span-1'
                    }`}
                  >
                    <span className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                      {headerLabel}
                    </span>
                    <div className={`font-semibold text-slate-700 ${isFull ? 'break-words leading-relaxed' : 'truncate'}`}>
                      {col.render ? col.render(item, rowIdx) : String((item as any)[col.key] || '-')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Card Action Row */}
            {actionsCol && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                {actionsCol.render ? actionsCol.render(item, rowIdx) : null}
              </div>
            )}
          </div>
        ))}

        {data.length === 0 && (
          <div className="p-8 rounded-2xl border border-slate-200/90 bg-white text-center text-slate-400 font-medium shadow-xs">
            <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-600 mb-1">{emptyMessage}</p>
            {totalRecords > 0 && onResetFilter && (
              <button
                type="button"
                onClick={onResetFilter}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Desktop Table View (Active when viewMode is 'table' or auto on md+ screens) */}
      <div className={`${viewMode === 'grid' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'} overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-800 border-collapse text-left">
            <thead className="bg-slate-50/90 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/90">
              <tr>
                {/* Dedicated Detail Inspection Header */}
                <th className="px-3 py-3 w-9 text-center">
                  <span className="sr-only">Detail</span>
                </th>

                {columns.map((col, idx) => {
                  if (hiddenKeys[col.key]) return null;
                  const isSortActive = sortField === col.key;
                  const alignClass = alignClasses[col.align || 'left'];
                  const responsiveClass = getResponsiveClass(col, idx);

                  return (
                    <th
                      key={col.key || idx}
                      className={`px-3.5 py-3 font-extrabold ${alignClass} ${responsiveClass} ${
                        col.sortable && onSort ? 'cursor-pointer select-none hover:bg-slate-100 hover:text-slate-800 transition-colors' : ''
                      }`}
                      onClick={() => col.sortable && onSort && handleSortClick(col.key)}
                    >
                      <div className={`flex items-center gap-1.5 ${
                        col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>{col.header}</span>
                        {col.sortable && onSort && (
                          <span className="text-slate-400">
                            {isSortActive ? (
                              sortOrder === 'asc' ? (
                                <ChevronUp className="w-3.5 h-3.5 text-indigo-600 font-bold" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-indigo-600 font-bold" />
                              )
                            ) : (
                              <div className="flex flex-col -space-y-1 opacity-40">
                                <ChevronUp className="w-2.5 h-2.5" />
                                <ChevronDown className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {data.map((item, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Eye Icon Trigger for Detail Inspection Modal */}
                  <td className="px-2 py-2.5 text-center align-middle w-9">
                    <button
                      type="button"
                      onClick={() => setSelectedInspectItem(item)}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
                      title="Klik icon mata untuk melihat detail lengkap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>

                  {columns.map((col, colIdx) => {
                    if (hiddenKeys[col.key]) return null;
                    const alignClass = alignClasses[col.align || 'left'];
                    const responsiveClass = getResponsiveClass(col, colIdx);

                    return (
                      <td
                        key={col.key || colIdx}
                        className={`px-3.5 py-2.5 align-middle ${alignClass} ${responsiveClass}`}
                      >
                        {col.render 
                          ? col.render(item, rowIdx) 
                          : (item as any)[col.key] !== undefined && (item as any)[col.key] !== null
                            ? String((item as any)[col.key]) 
                            : '-'
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-12 text-center text-slate-400 font-medium bg-slate-50/20">
                    <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500 mb-1">{emptyMessage}</p>
                    {totalRecords > 0 && onResetFilter && (
                      <div className="mt-3 flex flex-col items-center justify-center">
                        <p className="text-xs text-slate-400 mb-2">
                          Ada {totalRecords} total data tersimpan, namun tidak cocok dengan filter / pencarian saat ini.
                        </p>
                        <button
                          type="button"
                          onClick={onResetFilter}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset Semua Filter & Pencarian
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Eye Inspector Modal */}
      {selectedInspectItem && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden text-left font-sans animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Detail Data Lengkap
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {(selectedInspectItem as any).name || (selectedInspectItem as any).id || 'Informasi Record'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInspectItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Key-Value Properties Grid */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(selectedInspectItem as any).map(([k, v]) => {
                  if (v === undefined || v === null) return null;
                  if (typeof v === 'function') return null;

                  let displayValue = String(v);
                  if (typeof v === 'object') {
                    try {
                      displayValue = JSON.stringify(v, null, 2);
                    } catch {
                      displayValue = String(v);
                    }
                  }

                  const formattedLabel = k
                    .replace(/_/g, ' ')
                    .replace(/([A-Z])/g, ' $1')
                    .toUpperCase();

                  let renderContent: React.ReactNode = null;
                  
                  if (Array.isArray(v)) {
                    const isChoicesList = v.length > 0 && typeof v[0] === 'object' && v[0] !== null && ('text' in v[0] || 'scoreValue' in v[0] || 'label' in v[0]);
                    if (isChoicesList) {
                      renderContent = (
                        <ul className="space-y-1.5 list-none pl-0 text-xs w-full mt-1">
                          {v.map((choice: any, idx: number) => {
                            const choiceText = choice.text || choice.label || choice.textVal || '';
                            const score = choice.scoreValue !== undefined ? choice.scoreValue : choice.score ?? 0;
                            const hType = choice.hollandType ? ` [${choice.hollandType}]` : '';
                            return (
                              <li key={idx} className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-slate-100 shadow-3xs font-semibold text-slate-700">
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-extrabold uppercase shrink-0">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="grow break-words text-[11px] leading-snug mt-0.5 text-slate-700">{choiceText}</span>
                                <span className="shrink-0 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  Skor: {score}{hType}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      );
                    } else {
                      renderContent = (
                        <div className="font-mono text-[10px] text-slate-700 bg-slate-100/50 p-2 rounded-lg border border-slate-200/50 whitespace-pre-wrap leading-tight break-all mt-1 w-full">
                          {displayValue}
                        </div>
                      );
                    }
                  } else {
                    renderContent = (
                      <div className="font-semibold text-slate-800 break-words text-xs mt-1">
                        {String(v) || '-'}
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={k} 
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1 hover:border-slate-200 transition-colors col-span-1 sm:col-span-2 md:col-span-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                          {formattedLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyValue(displayValue, k)}
                          className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors cursor-pointer"
                          title="Salin Nilai"
                        >
                          {copiedKey === k ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {renderContent}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInspectItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
