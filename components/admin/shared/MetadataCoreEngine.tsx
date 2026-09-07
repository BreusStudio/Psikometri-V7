'use client';

import React, { useState, useMemo, useCallback, useContext } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Printer,
  AlertCircle,
  Sparkles,
  Trash2,
  BookOpen,
  HelpCircle,
  Info,
  Check
} from 'lucide-react';
import SearchBar, { ActionConfig, FilterConfig } from './SearchBar';
import DataTable, { ColumnMetadata } from './DataTable';
import Pagination from './Pagination';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import FormGenerator, { FormFieldMetadata } from './FormGenerator';
import { ToastContext } from '../../shared/ToastContext';

export interface FilterMetadata<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  filterFn: (item: T, selectedValue: string) => boolean;
  dependsOn?: string;
  getOptions?: (parentValue: string, allFilterValues: Record<string, string>) => { value: string; label: string }[];
}

interface MetadataCoreEngineProps<T> {
  resourceName: string;
  resourceIcon?: React.ReactNode;
  description: string;
  data: T[];
  columns: ColumnMetadata<T>[];
  fields: FormFieldMetadata[];
  idField: keyof T;
  canEdit: boolean;
  
  // Searching
  searchPlaceholder?: string;
  searchFn: (item: T, searchTerm: string) => boolean;
  
  // Filtering
  filters?: FilterMetadata<T>[];
  
  // Sorting defaults
  defaultSortField: string;
  defaultSortOrder?: 'asc' | 'desc';
  sortFn?: (a: T, b: T, field: string, order: 'asc' | 'desc') => number;

  // CRUD events
  onAdd: (values: Record<string, any>) => boolean | string | Promise<boolean | string>;
  onUpdate: (id: string, values: Record<string, any>) => boolean | string | Promise<boolean | string>;
  onDelete: (id: string) => void | Promise<void>;
  onRefresh: () => void;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  mapInitialValues?: (item: T) => Record<string, any>;

  // Excel / CSV integration (optional)
  excelTemplateData?: Record<string, any>[];
  excelGuideData?: Record<string, any>[];
  excelTemplateFileName?: string;
  excelExportFileName?: string;
  excelExportMapper?: (item: T) => Record<string, any>;
  onImportExcel?: (rows: any[]) => { successCount: number; errors: string[] } | Promise<{ successCount: number; errors: string[] }> | any;
  onCustomImportRows?: (rows: any[]) => void | Promise<void>;
  onClearAll?: () => void | Promise<void>;
  clearAllConfirmMessage?: string;
  modalSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  customFormRender?: (props: {
    editingRecord: T | null;
    initialValues: Record<string, any>;
    onSubmit: (values: Record<string, any>) => void;
    onCancel: () => void;
    errorMessage: string;
    fields: FormFieldMetadata[];
  }) => React.ReactNode;
  extraRowActions?: (item: T) => React.ReactNode;
  topContent?: React.ReactNode;
  resetKey?: any;
}

export default function MetadataCoreEngine<T>({
  resourceName,
  resourceIcon,
  description,
  data,
  columns,
  fields,
  idField,
  canEdit,
  searchPlaceholder = 'Cari...',
  searchFn,
  filters = [],
  defaultSortField,
  defaultSortOrder = 'asc',
  sortFn,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
  showNotification,
  excelTemplateData,
  excelGuideData,
  excelTemplateFileName = `template_import_${resourceName.toLowerCase().replace(/\s+/g, '_')}.xlsx`,
  excelExportFileName = `data_${resourceName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
  excelExportMapper,
  onImportExcel,
  onCustomImportRows,
  onClearAll,
  clearAllConfirmMessage,
  mapInitialValues,
  modalSize = 'md',
  customFormRender,
  extraRowActions,
  topContent,
  resetKey
}: MetadataCoreEngineProps<T>) {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [formError, setFormError] = useState('');

  // Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Sorting states
  const [sortField, setSortField] = useState<string>(defaultSortField);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);

  // Filter values
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    filters.forEach(f => {
      initial[f.key] = 'All';
    });
    return initial;
  });

  // Reset key tracker
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== undefined && resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setSearchTerm('');
    setCurrentPage(1);
    const resetFilters: Record<string, string> = {};
    filters.forEach(f => {
      resetFilters[f.key] = 'All';
    });
    setFilterValues(resetFilters);
  }

  // Handler to reset all filters, search terms, and pagination
  const handleResetAllFilters = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
    const resetFilters: Record<string, string> = {};
    filters.forEach(f => {
      resetFilters[f.key] = 'All';
    });
    setFilterValues(resetFilters);
  }, [filters]);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Excel Guide modal state
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Filter & Search logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. Search term match
      if (searchTerm.trim() !== '') {
        if (!searchFn(item, searchTerm)) return false;
      }
      
      // 2. Dynamic filters match
      for (const filter of filters) {
        const val = filterValues[filter.key];
        if (val && val !== 'All') {
          if (!filter.filterFn(item, val)) return false;
        }
      }
      
      return true;
    });
  }, [data, searchTerm, searchFn, filters, filterValues]);

  // Sort logic
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      if (sortFn) {
        return sortFn(a, b, sortField, sortOrder);
      }
      
      const valA = (a as any)[sortField];
      const valB = (b as any)[sortField];
      
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortOrder, sortFn]);

  // Pagination calculation
  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginatedData = useMemo(() => {
    return sortedData.slice(startIndex, startIndex + perPage);
  }, [sortedData, startIndex, perPage]);

  // Sync page index on dataset size change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setPerPage(limit);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Excel template downloads
  const handleDownloadTemplate = () => {
    if (!excelTemplateData) return;
    const ws = XLSX.utils.json_to_sheet(excelTemplateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Soal");
    if (excelGuideData && excelGuideData.length > 0) {
      const wsGuide = XLSX.utils.json_to_sheet(excelGuideData);
      XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan & Master Reference");
    }
    XLSX.writeFile(wb, excelTemplateFileName);
  };

  // Excel export
  const handleExportExcel = () => {
    const dataToExport = excelExportMapper 
      ? sortedData.map(item => excelExportMapper(item))
      : sortedData.map(item => {
          // Fallback simple serialization of key-value properties
          const flatObj: Record<string, any> = {};
          Object.keys(item as any).forEach(k => {
            const v = (item as any)[k];
            if (typeof v !== 'object') {
              flatObj[k] = v;
            }
          });
          return flatObj;
        });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Export");
    XLSX.writeFile(wb, excelExportFileName);
  };

  // Excel / CSV file upload import
  const handleImportExcelFile = (file: File) => {
    if (!onImportExcel) return;
    const reader = new FileReader();
    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = async (e) => {
      try {
        let rows: any[] = [];
        if (isXlsx) {
          const bstr = e.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          rows = XLSX.utils.sheet_to_json<any>(ws);
        } else {
          const text = e.target?.result as string;
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length >= 2) {
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            rows = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.replace(/"/g, '').trim());
              const obj: any = {};
              headers.forEach((h, i) => { obj[h] = values[i] || ''; });
              return obj;
            });
          }
        }

        if (rows.length === 0) {
          setConfirmState({
            isOpen: true,
            title: 'Impor Kosong',
            message: 'Format berkas tidak valid atau tidak ada baris data.',
            onConfirm: () => {}
          });
          return;
        }

        if (onCustomImportRows) {
          await onCustomImportRows(rows);
          return;
        }

        const result = await onImportExcel(rows);
        const successCount = result?.successCount ?? rows.length;
        const errors = Array.isArray(result?.errors) ? result.errors : [];

        setConfirmState({
          isOpen: true,
          title: 'Impor Selesai',
          message: `Berhasil memproses ${successCount} data ${resourceName}.${
            errors.length > 0 
              ? ` Gagal memproses ${errors.length} baris data karena format tidak lengkap atau terduplikasi.` 
              : ''
          }`,
          onConfirm: () => {}
        });

        handleResetAllFilters();
        onRefresh();
      } catch (err: any) {
        setConfirmState({
          isOpen: true,
          title: 'Gagal Membaca File',
          message: 'Terjadi kegagalan membaca file impor: ' + err.message,
          onConfirm: () => {}
        });
      }
    };

    if (isXlsx) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Toast Handler Integration
  const toastCtx = useContext(ToastContext);
  const notify = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (showNotification) {
      showNotification(msg, type);
    } else if (toastCtx) {
      if (type === 'success') toastCtx.success(msg);
      else if (type === 'error') toastCtx.error(msg);
      else toastCtx.info(msg);
    }
  }, [showNotification, toastCtx]);

  // Edit event trigger
  const handleEditClick = useCallback((item: T) => {
    setEditingRecord(item);
    setFormError('');
    setIsModalOpen(true);
  }, []);

  // Delete event with custom confirmation
  const handleDeleteClick = useCallback((item: T) => {
    const id = String((item as any)[idField]);
    const displayLabel = (item as any).name || (item as any).code || id;
    
    setConfirmState({
      isOpen: true,
      title: `Hapus ${resourceName}`,
      message: `Apakah Anda yakin ingin menghapus data ${resourceName} "${displayLabel}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Data',
      isDanger: true,
      onConfirm: async () => {
        try {
          await onDelete(id);
          notify(`${resourceName} "${displayLabel}" berhasil dihapus!`, 'success');
          onRefresh();
        } catch (error: any) {
          notify(`Gagal menghapus: ${error.message || error}`, 'error');
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idField, onDelete, onRefresh, resourceName]);

  // Form submission dispatcher
  const handleFormSubmit = async (values: Record<string, any>) => {
    setFormError('');
    try {
      if (editingRecord) {
        const id = String((editingRecord as any)[idField]);
        const result = await onUpdate(id, values);
        if (typeof result === 'string') {
          setFormError(result);
          return;
        }
        if (result === false) {
          setFormError(`Gagal mengubah data ${resourceName}.`);
          return;
        }
        notify(`Data ${resourceName} "${values.name || id}" berhasil diubah!`, 'success');
      } else {
        const result = await onAdd(values);
        if (typeof result === 'string') {
          setFormError(result);
          return;
        }
        if (result === false) {
          setFormError(`Gagal menambahkan data ${resourceName}.`);
          return;
        }
        notify(`Data ${resourceName} "${values.name || values.id || 'baru'}" berhasil ditambahkan!`, 'success');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  // Auto-append Action columns to Table Columns if canEdit or extraRowActions is active
  const tableColumns = useMemo(() => {
    if (!canEdit && !extraRowActions) return columns;
    
    const columnsWithActions = [...columns];
    const hasActionsColumn = columnsWithActions.some(col => col.key === 'actions');
    
    if (!hasActionsColumn) {
      columnsWithActions.push({
        key: 'actions',
        header: 'Aksi',
        align: 'center',
        render: (item: T) => null // Overridden below
      });
    }
    
    return columnsWithActions;
  }, [columns, canEdit, extraRowActions]);

  // Adjust column schema for generic table rows rendering, resolving custom actions column placeholder
  const mappedTableColumns = useMemo(() => {
    return tableColumns.map(col => {
      if (col.key === 'actions') {
        return {
          ...col,
          render: (item: T) => (
            <div className="flex gap-1.5 justify-center items-center">
              {extraRowActions && extraRowActions(item)}
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => handleEditClick(item)}
                    className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer border border-indigo-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(item)}
                    className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all cursor-pointer border border-rose-100"
                  >
                    Hapus
                  </button>
                </>
              )}
            </div>
          )
        };
      }
      return col;
    });
  }, [tableColumns, canEdit, extraRowActions, handleEditClick, handleDeleteClick]);

  // Formatted Printable Window Generator
  const handlePrint = useCallback(function handlePrint() {
    const printTitle = `Laporan Data ${resourceName}`;
    const dateStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const visibleCols = tableColumns.filter(c => c.key !== 'actions' && c.key !== 'select');
    
    let tableHeadersHtml = visibleCols.map(c => 
      `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; background: #f1f5f9; font-size: 11px; font-weight: 700; text-align: left; text-transform: uppercase;">${c.header}</th>`
    ).join('');
    
    let tableRowsHtml = sortedData.map((item, idx) => {
      const cells = visibleCols.map(c => {
        let val = (item as any)[c.key];
        if (typeof val === 'object' && val !== null) {
          if (Array.isArray(val)) {
            val = val.join(', ');
          } else {
            val = JSON.stringify(val);
          }
        }
        if (val === undefined || val === null || val === '') val = '-';
        return `<td style="border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 11px; color: #334155;">${String(val)}</td>`;
      }).join('');
      return `<tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${cells}</tr>`;
    }).join('');

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <\x68tml>
        <head>
          <title>${printTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 24px; color: #0f172a; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; }
            .brand { font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; }
            .subtitle { font-size: 12px; color: #64748b; font-weight: 500; }
            .meta-box { text-align: right; font-size: 11px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            @media print {
              body { padding: 0; }
              @page { size: A4 landscape; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">${printTitle}</div>
              <div class="subtitle">Sistem Informasi Asesmen Psikotes & Minat Bakat (Psychometrics)</div>
            </div>
            <div class="meta-box">
              <div><strong>Tanggal Cetak:</strong> ${dateStr}</div>
              <div><strong>Jumlah Baris:</strong> ${sortedData.length} Data</div>
            </div>
          </div>
          <table>
            <thead><tr>${tableHeadersHtml}</tr></thead>
            <tbody>${tableRowsHtml}</tbody>
          </table>
          <div class="footer">
            Dicetak secara otomatis dari Platform Psychometrics • Tanggal: ${new Date().toLocaleString('id-ID')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 750);
            };
          </script>
        </body>
      </\x68tml>
    `);
    printWindow.document.close();
  }, [resourceName, tableColumns, sortedData]);

  // Setup Search Bar Actions
  const searchBarActions: ActionConfig[] = useMemo(() => {
    const acts: ActionConfig[] = [];
    if (canEdit) {
      acts.push({
        label: `Tambah ${resourceName}`,
        icon: <Plus className="w-3.5 h-3.5" />,
        onClick: () => {
          setEditingRecord(null);
          setFormError('');
          setIsModalOpen(true);
        },
        className: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
      });
    }

    if (excelTemplateData) {
      acts.push({
        label: 'Template Excel',
        icon: <Download className="w-3.5 h-3.5" />,
        onClick: handleDownloadTemplate,
        className: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
      });

      acts.push({
        label: 'Panduan Excel',
        icon: <BookOpen className="w-3.5 h-3.5" />,
        onClick: () => setIsGuideModalOpen(true),
        className: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
      });
    }

    if (onImportExcel && canEdit) {
      acts.push({
        label: 'Impor Excel',
        icon: <Upload className="w-3.5 h-3.5" />,
        onClick: () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.xlsx, .xls, .csv';
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) handleImportExcelFile(file);
          };
          input.click();
        },
        className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
      });
    }

    acts.push({
      label: 'Ekspor Excel',
      icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
      onClick: handleExportExcel,
      className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
    });

    acts.push({
      label: `Cetak ${resourceName}`,
      icon: <Printer className="w-3.5 h-3.5" />,
      onClick: handlePrint,
      className: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
    });

    if (onClearAll && canEdit) {
      acts.push({
        label: `Kosongkan ${resourceName}`,
        icon: <Trash2 className="w-3.5 h-3.5" />,
        onClick: () => {
          setConfirmState({
            isOpen: true,
            title: `Kosongkan Data ${resourceName}`,
            message: clearAllConfirmMessage || `Apakah Anda yakin ingin mengosongkan seluruh data ${resourceName}? Semua data yang tersimpan akan dihapus secara permanen dan tidak dapat dikembalikan.`,
            confirmText: 'Ya, Kosongkan Data',
            isDanger: true,
            onConfirm: async () => {
              try {
                await onClearAll();
                notify(`Berhasil mengosongkan seluruh data ${resourceName}.`, 'success');
                onRefresh();
              } catch (err: any) {
                notify(`Gagal mengosongkan data: ${err.message}`, 'error');
              }
            }
          });
        },
        className: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
      });
    }

    return acts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, excelTemplateData, onImportExcel, onClearAll, resourceName, paginatedData, handlePrint]);

  // Setup Search Bar Filters with Cascading Filter Support
  const searchBarFilters: FilterConfig[] = useMemo(() => {
    return filters.map(f => {
      let activeOptions = f.options;
      if (f.dependsOn && f.getOptions) {
        const parentVal = filterValues[f.dependsOn] || 'All';
        activeOptions = f.getOptions(parentVal, filterValues);
      }
      return {
        key: f.key,
        value: filterValues[f.key] || 'All',
        onChange: (val: string) => {
          setFilterValues(prev => {
            const next = { ...prev, [f.key]: val };
            // Reset dependent child filters if current selection is invalid under new parent value
            filters.forEach(child => {
              if (child.dependsOn === f.key && child.getOptions) {
                const childOpts = child.getOptions(val, next);
                const currentChildVal = next[child.key];
                if (currentChildVal !== 'All' && !childOpts.some(o => o.value === currentChildVal)) {
                  next[child.key] = 'All';
                }
              }
            });
            return next;
          });
          setCurrentPage(1);
        },
        options: [{ value: 'All', label: `Semua ${f.label}` }, ...activeOptions],
        label: f.label
      };
    });
  }, [filters, filterValues]);

  // Setup initial values for FormGenerator based on editing item
  const formInitialValues = useMemo(() => {
    if (editingRecord) {
      return mapInitialValues ? mapInitialValues(editingRecord) : editingRecord as any;
    }
    const defaultVals: Record<string, any> = {};
    fields.forEach(f => {
      if (f.defaultValue !== undefined) {
        defaultVals[f.key] = f.defaultValue;
      }
    });
    return defaultVals;
  }, [editingRecord, mapInitialValues, fields]);

  return (
    <div className="space-y-5 font-sans">
      {/* Tab Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-100">
        <div className="text-left">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            {resourceIcon || <Sparkles className="w-5 h-5 text-indigo-650" />}
            {resourceName} Core Panel
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {topContent}

      {/* Shared Search, Filters, and Operations Panel */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder={searchPlaceholder}
        filters={searchBarFilters}
        actions={searchBarActions}
      />

      {/* Central Interactive Data Grid */}
      <DataTable
        data={paginatedData}
        columns={mappedTableColumns}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyMessage={`Tidak ada data ${resourceName.toLowerCase()} yang sesuai.`}
        onResetFilter={handleResetAllFilters}
        totalRecords={data.length}
      />

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        limit={perPage}
        onLimitChange={handleLimitChange}
        totalRecords={totalRecords}
      />

      {/* Shared Reusable Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? `Edit ${resourceName}` : `Tambah ${resourceName} Baru`}
        size={modalSize}
      >
        <div className="mt-2">
          {customFormRender ? (
            customFormRender({
              editingRecord,
              initialValues: formInitialValues,
              onSubmit: handleFormSubmit,
              onCancel: () => setIsModalOpen(false),
              errorMessage: formError,
              fields
            })
          ) : (
            <FormGenerator
              fields={fields}
              initialValues={formInitialValues}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsModalOpen(false)}
              submitLabel={editingRecord ? 'Perbarui Data' : 'Tambah Baru'}
              cancelLabel="Kembali"
              errorMessage={formError}
            />
          )}
        </div>
      </Modal>

      {/* Shared Confirm Modal for Deletion Confirmation */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }}
        confirmText={confirmState.confirmText}
        isDanger={confirmState.isDanger}
      />

      {/* Interactive Excel Import Guide Modal */}
      <Modal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        title={`Panduan Pengisian Excel - ${resourceName}`}
        size="xl"
      >
        <div className="space-y-6 py-2 text-slate-700 text-sm">
          {/* Header Notice */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-950 text-sm">Aturan Umum Import Excel</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Gunakan template resmi yang telah disediakan agar struktur kolom dikenali oleh sistem secara presisi. Jangan mengubah nama header di baris pertama.
              </p>
            </div>
          </div>

          {/* Context & License Special Guide for Question Bank / Questions */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-200 pb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Petunjuk Kolom Khusus (Lisensi & Konteks Instansi)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">1. Lisensi_Khusus</span>
                <p className="text-slate-600 leading-relaxed">
                  Kode lisensi paket soal. Gunakan <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono">GLOBAL</code> agar soal dapat diakses seluruh instansi, atau isi ID lisensi khusus (misal: <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono">SMKN1_BDG</code>).
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">2. Konteks_Instansi</span>
                <p className="text-slate-600 leading-relaxed">
                  Konteks penggunaan soal (pisahkan koma jika lebih dari satu). Pilihan valid: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">sekolah_sd, sekolah_smp, sekolah_sma, sekolah_smk, personal, instansi_pemerintah, perusahaan</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Specification Columns Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-200 pb-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Spesifikasi Format Kolom Data {resourceName}
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5">Nama Header Excel</th>
                    <th className="p-2.5">Tipe Data</th>
                    <th className="p-2.5">Wajib/Opsional</th>
                    <th className="p-2.5">Petunjuk & Format Nilai Valid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {fields.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-mono font-bold text-indigo-700">{f.label}</td>
                      <td className="p-2.5 capitalize">{f.type}</td>
                      <td className="p-2.5">
                        {f.required ? (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">Wajib</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">Opsional</span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {f.options 
                          ? `Pilihan: ${f.options.map(o => o.label).join(', ')}`
                          : f.placeholder || 'Isi sesuai karakter/teks standar'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample Valid Row */}
          {excelTemplateData && excelTemplateData.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-200 pb-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Contoh Baris Data Valid
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-900 text-slate-100 p-3 font-mono text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700 text-indigo-300">
                      {Object.keys(excelTemplateData[0]).map((k, i) => (
                        <th key={i} className="p-1.5 whitespace-nowrap">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelTemplateData.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50">
                        {Object.values(row).map((val, ci) => (
                          <td key={ci} className="p-1.5 whitespace-nowrap text-emerald-400">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {excelTemplateData && (
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                Unduh Template Excel Baru
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all ml-auto"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
