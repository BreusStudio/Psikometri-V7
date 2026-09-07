'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  totalRecords?: number;
  limitOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
  totalRecords,
  limitOptions = [10, 25, 50, 100]
}: PaginationProps) {
  const pageRange = React.useMemo(() => {
    const range = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }, [currentPage, totalPages]);

  const startIndex = limit && totalRecords ? (currentPage - 1) * limit + 1 : null;
  const endIndex = limit && totalRecords ? Math.min(currentPage * limit, totalRecords) : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 sm:px-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl font-sans text-xs">
      {/* Information & Limit Selector */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-slate-500 w-full sm:w-auto">
        {startIndex !== null && endIndex !== null && totalRecords !== undefined && (
          <span className="font-medium text-[11px]">
            Menampilkan <strong className="text-slate-800 font-bold">{startIndex}</strong> - <strong className="text-slate-800 font-bold">{endIndex}</strong> dari <strong className="text-slate-800 font-bold">{totalRecords}</strong> data
          </span>
        )}

        {onLimitChange && limit !== undefined && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Baris:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 text-[11px] border border-slate-200 rounded-lg bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all cursor-pointer shadow-2xs"
          title="Halaman Pertama"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all cursor-pointer shadow-2xs"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Mobile Page indicator */}
        <div className="sm:hidden px-2.5 py-1 font-bold text-slate-700 text-[11px] bg-white border border-slate-200 rounded-lg">
          {currentPage} / {Math.max(1, totalPages)}
        </div>

        {/* Desktop Number Buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {pageRange[0] > 1 && (
            <>
              <button
                type="button"
                onClick={() => onPageChange(1)}
                className={`w-7.5 h-7.5 flex items-center justify-center rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                  currentPage === 1
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                1
              </button>
              {pageRange[0] > 2 && <span className="px-0.5 text-slate-400 font-bold text-xs">...</span>}
            </>
          )}

          {pageRange.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-7.5 h-7.5 flex items-center justify-center rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                currentPage === p
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              {p}
            </button>
          ))}

          {pageRange[pageRange.length - 1] < totalPages && (
            <>
              {pageRange[pageRange.length - 1] < totalPages - 1 && <span className="px-0.5 text-slate-400 font-bold text-xs">...</span>}
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                className={`w-7.5 h-7.5 flex items-center justify-center rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                  currentPage === totalPages
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all cursor-pointer shadow-2xs"
          title="Halaman Selanjutnya"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all cursor-pointer shadow-2xs"
          title="Halaman Terakhir"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
