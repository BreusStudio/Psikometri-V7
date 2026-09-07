import React from 'react';
import { ColumnMetadata } from '@/components/admin/shared/DataTable';

// Helper: Generic Column Render Builder
export function buildColumnRenderer<T>(renderConfig: any): (item: T) => React.ReactNode {
  if (!renderConfig) {
    return () => null;
  }

  const {
    type,
    className = '',
    fallback = '-',
    fallbackKey = '',
    prefix = '',
    suffix = '',
    numeratorKey = '',
    denominatorKey = '',
    trueLabel = 'Ya',
    falseLabel = 'Tidak',
    trueClassName = '',
    falseClassName = '',
    fallbackClassName = ''
  } = renderConfig;

  const RenderComponent = function RenderColumn(item: any) {
    const key = renderConfig.key;
    const val = item[key] !== undefined ? item[key] : '';

    switch (type) {
      case 'text':
        return (
          <span className={className}>
            {val || (fallbackKey && item[fallbackKey]) || fallback}
          </span>
        );

      case 'number':
        return (
          <span className={className}>
            {prefix}{typeof val === 'number' ? val.toLocaleString('id-ID') : (val || 0)}{suffix}
          </span>
        );

      case 'currency':
        return (
          <span className={className}>
            Rp {(typeof val === 'number' ? val : Number(val) || 0).toLocaleString('id-ID')}
          </span>
        );

      case 'badge': {
        const badgeMap = renderConfig.badgeMap || {};
        const bgClass = badgeMap[val] || fallbackClassName || 'bg-slate-100 text-slate-700';
        return (
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${bgClass} ${className}`}>
            {val || fallback}
          </span>
        );
      }

      case 'boolean': {
        const boolVal = Boolean(val);
        const boolClass = boolVal
          ? (trueClassName || 'bg-emerald-100 text-emerald-800')
          : (falseClassName || 'bg-slate-100 text-slate-600');
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${boolClass}`}>
            {boolVal ? trueLabel : falseLabel}
          </span>
        );
      }

      case 'teacher-role': {
        const role = String(val || 'Guru');
        const isSuper = role.toLowerCase().includes('super');
        const isAdmin = role.toLowerCase().includes('admin');
        const isWali = role.toLowerCase().includes('wali');
        const isKakomli = role.toLowerCase().includes('kakomli');

        const badgeColor = isSuper
          ? 'bg-purple-50 text-purple-700 border-purple-100'
          : isAdmin
          ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
          : isWali
          ? 'bg-cyan-50 text-cyan-700 border-cyan-100'
          : isKakomli
          ? 'bg-amber-50 text-amber-700 border-amber-100'
          : 'bg-slate-100 text-slate-700 border-slate-200';

        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badgeColor}`}>
            {role}
          </span>
        );
      }

      case 'student-test-status': {
        const isComplete = item.status === 'SELESAI' || !!item.completedAt;
        return (
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
              isComplete
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isComplete ? 'Selesai' : 'Belum Tes'}
          </span>
        );
      }

      case 'question-choices': {
        const choices = item.choices || [];
        if (choices.length === 0) {
          return <span className={fallbackClassName}>{fallback}</span>;
        }
        return (
          <div className="flex flex-col gap-1.5 w-full">
            {choices.map((c: any, i: number) => {
              const letter = String.fromCharCode(65 + i);
              const score = c.scoreValue !== undefined ? c.scoreValue : 0;
              return (
                <div
                  key={i}
                  className="flex items-start justify-between gap-2 p-1.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs text-[11px]"
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200 shrink-0 mt-0.5">
                      {letter}
                    </span>
                    <span className="text-slate-700 font-medium leading-relaxed break-words">
                      {c.text || '-'}
                    </span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200 shrink-0">
                    {`Skor: ${score}`}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }

      case 'context-badges': {
        const contexts: string[] = Array.isArray(val) ? val : (val ? [String(val)] : []);
        if (contexts.length === 0) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Semua Konteks
            </span>
          );
        }
        const contextLabelsMap: Record<string, string> = {
          sekolah_sd: 'SD/MI',
          sekolah_smp: 'SMP/MTs',
          sekolah_sma: 'SMA/MA',
          sekolah_smk: 'SMK',
          perusahaan: 'Perusahaan',
          instansi_pemerintah: 'Pemerintah',
          personal: 'Personal'
        };
        return (
          <div className="flex flex-wrap gap-1">
            {contexts.map((ctxKey, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
              >
                {contextLabelsMap[ctxKey] || ctxKey}
              </span>
            ))}
          </div>
        );
      }

      case 'fraction': {
        const num = item[numeratorKey] || 0;
        const den = item[denominatorKey] || 0;
        return (
          <span className={className}>
            {num} / {den}
          </span>
        );
      }

      default:
        return <span className={className}>{String(val || fallback)}</span>;
    }
  };

  RenderComponent.displayName = 'RenderComponent';
  return RenderComponent;
}

export function interpretColumns<T>(jsonColumns: any[]): ColumnMetadata<T>[] {
  if (!Array.isArray(jsonColumns)) return [];
  return jsonColumns.map(col => {
    const renderConfig = { ...col.render, key: col.key };
    return {
      key: col.key,
      header: col.header,
      sortable: !!col.sortable,
      align: col.align || 'left',
      priority: col.priority,
      fullWidth: col.fullWidth !== undefined ? Boolean(col.fullWidth) : undefined,
      render: buildColumnRenderer<T>(renderConfig)
    };
  });
}
