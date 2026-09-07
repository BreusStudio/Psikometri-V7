'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, Scale, Sparkles, RefreshCw, AlertCircle, X, Check } from 'lucide-react';
import { Dimension } from '@/lib/core/types';
import { PsychometricStore } from '@/lib/store/psychometricStore';
import MetadataCoreEngine from './shared/MetadataCoreEngine';
import { DimensionRepository } from '@/lib/repositories';
import {
  getDimensionsColumns,
  getDimensionsFormFields,
  dimensionsSearchFn
} from '@/lib/metadata';
import { DimensionNormsModal } from './DimensionNormsModal';

interface DimensionsTabProps {
  store: PsychometricStore;
  dimensions: Dimension[];
  onRefresh: () => void;
  session: any;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  presetTestType?: string;
}

export default function DimensionsTab({
  store,
  dimensions,
  onRefresh,
  session,
  showNotification,
  presetTestType
}: DimensionsTabProps) {
  const repository = useMemo(() => new DimensionRepository(store), [store]);
  const [selectedDimensionForNorms, setSelectedDimensionForNorms] = useState<Dimension | null>(null);
  const [isStandardizeModalOpen, setIsStandardizeModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const canEdit = Boolean(
    session?.role === 'Superadmin' ||
    session?.role === 'Admin' ||
    session?.role === 'admin' ||
    session?.role === 'superadmin' ||
    session?.role === 'Guru BK' ||
    session?.role === 'bk'
  );

  const testTypes = useMemo(() => {
    return (store.getTestTypes() || []).map(t => t.name);
  }, [store]);

  const filteredDimensions = useMemo(() => {
    if (presetTestType) {
      return (dimensions || []).filter(d => d.testType === presetTestType);
    }
    return dimensions || [];
  }, [dimensions, presetTestType]);

  const columns = useMemo(() => getDimensionsColumns(), []);
  const fields = useMemo(() => {
    const baseFields = getDimensionsFormFields(testTypes);
    if (presetTestType) {
      return baseFields.map(field => {
        if (field.key === 'testType') {
          return {
            ...field,
            defaultValue: presetTestType,
            type: 'hidden' as const
          };
        }
        return field;
      });
    }
    return baseFields;
  }, [testTypes, presetTestType]);

  const handleAdd = (values: Record<string, any>) => {
    if (presetTestType) {
      values.testType = presetTestType;
    }
    return repository.add(values);
  };

  const handleUpdate = (id: string, values: Record<string, any>) => {
    return repository.update(id, values);
  };

  const handleDelete = (id: string) => {
    repository.delete(id);
  };

  const handleSaveNorms = (updated: Dimension) => {
    store.saveDimension(updated);
    onRefresh();
    showNotification?.(`Norma & rubrik penilaian untuk dimensi "${updated.name}" berhasil disimpan.`, 'success');
  };

  const executeStandardize = () => {
    setIsProcessing(true);
    try {
      const res = store.standardizeDimensions();
      onRefresh();
      showNotification?.(`Berhasil standarisasi! Master dimensi diatur menjadi ${res.totalDimensions} dimensi resmi, dan ${res.relinkedQuestions} butir soal berhasil dipetakan ulang.`, 'success');
      setIsStandardizeModalOpen(false);
    } catch (e: any) {
      showNotification?.(`Gagal standarisasi: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <MetadataCoreEngine<Dimension>
        resourceName="Dimensi Evaluasi (Kepribadian/RIASEC)"
        resourceIcon={<BookOpen className="w-5 h-5 text-indigo-600" />}
        description="Konfigurasi indikator dimensi kecerdasan, bakat, norma interval, dan tipe Holland RIASEC."
        topContent={
          <div className="mb-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border border-indigo-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Standarisasi Master Dimensi Psikologi (18 Dimensi Resmi)</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Eliminasi duplikasi dimensi legacy/AI ad-hoc, kunci ke standar Wechsler & RIASEC resmi, serta petakan otomatis seluruh bank soal & skor siswa.
                </p>
              </div>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsStandardizeModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sinkronkan ke 18 Dimensi Resmi</span>
              </button>
            )}
          </div>
        }
        data={filteredDimensions}
        columns={columns}
        fields={fields}
        idField="id"
        canEdit={canEdit}
        searchPlaceholder="Cari jenis tes atau nama dimensi..."
        searchFn={dimensionsSearchFn}
        defaultSortField="id"
        defaultSortOrder="asc"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={onRefresh}
        showNotification={showNotification}
        extraRowActions={(dim) => (
          <button
            type="button"
            onClick={() => setSelectedDimensionForNorms(dim)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
            title="Konfigurasi Interval Norma & Metode Standarisasi"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Rubrik Norma</span>
          </button>
        )}
        excelTemplateData={[
          { id: 'R', name: 'Realistic', testType: 'Holland RIASEC', description: 'Praktikal, fisik, dan mekanikal' }
        ]}
        excelExportFileName="data_dimensi.xlsx"
        excelExportMapper={(d) => ({
          'ID': d.id,
          'Jenis Tes': d.testType || '-',
          'Nama Dimensi': d.name,
          'Metode Penilai': d.scoringMethod || 'percentage',
          'Deskripsi': d.description || '-'
        })}
        onImportExcel={(rows) => store.importFromDataGrid('dimensions', rows)}
        onClearAll={() => store.clearAllDimensions()}
      />

      {/* Dimension Norms Configuration Modal */}
      {selectedDimensionForNorms && (
        <DimensionNormsModal
          isOpen={Boolean(selectedDimensionForNorms)}
          dimension={selectedDimensionForNorms}
          onClose={() => setSelectedDimensionForNorms(null)}
          onSave={handleSaveNorms}
        />
      )}

      {/* 18 Dimensions Standardization Confirmation Modal */}
      {isStandardizeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-150 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-mono">Standarisasi 18 Dimensi Resmi</h3>
                  <p className="text-xs text-slate-500 font-medium">Penyelarasan Baku Psikometrik & RIASEC</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStandardizeModalOpen(false)}
                disabled={isProcessing}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900">Tindakan ini akan menjalankan otomasi:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Mengunci master ke <strong>18 Dimensi Resmi</strong> (IQ, EQ, Holland RIASEC, Kepribadian, Kerja, Validitas).</li>
                <li>Membersihkan dimensi ad-hoc atau duplikasi tidak standar.</li>
                <li>Memetakan ulang seluruh butir soal ke dimensi baku yang bersesuaian.</li>
                <li>Menghitung ulang dan menyelaraskan skor seluruh siswa.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsStandardizeModalOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeStandardize}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ya, Standarisasikan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

