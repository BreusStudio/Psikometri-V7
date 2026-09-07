'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { Sliders, BookOpen, SlidersHorizontal } from 'lucide-react';
import { TestType } from '../../lib/types';
import { PsychometricStore } from '../../lib/mockData';
import MetadataCoreEngine from './shared/MetadataCoreEngine';
import { TestTypeRepository } from '../../lib/repositories';
import Modal from './shared/Modal';
import QuestionsTab from './QuestionsTab';
import DimensionsTab from './DimensionsTab';
import {
  getTestTypesColumns,
  getTestTypesFormFields,
  testTypesSearchFn
} from '../../lib/metadata';

interface TestTypesTabProps {
  store: PsychometricStore;
  onRefresh: () => void;
  session: any;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TestTypesTab({
  store,
  onRefresh,
  session,
  showNotification
}: TestTypesTabProps) {
  const repository = useMemo(() => new TestTypeRepository(store), [store]);
  const [selectedTestTypeForQuestions, setSelectedTestTypeForQuestions] = useState<TestType | null>(null);
  const [selectedTestTypeForDimensions, setSelectedTestTypeForDimensions] = useState<TestType | null>(null);

  const canEdit = Boolean(
    session?.role === 'Superadmin' ||
    session?.role === 'Admin' ||
    session?.role === 'admin' ||
    session?.role === 'superadmin' ||
    session?.role === 'Guru BK' ||
    session?.role === 'bk'
  );

  const testTypes = useMemo(() => {
    return repository.getAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, store]);

  const columns = useMemo(() => getTestTypesColumns(), []);
  const fields = useMemo(() => getTestTypesFormFields(), []);

  const handleAdd = (values: Record<string, any>) => {
    return repository.add(values);
  };

  const handleUpdate = (id: string, values: Record<string, any>) => {
    return repository.update(id, values);
  };

  const handleDelete = (id: string) => {
    repository.delete(id);
  };

  const mapInitialValues = useCallback((t: TestType) => {
    return {
      ...t,
      duration: t.duration ?? t.durationMinutes ?? 15,
      questionLimit: t.questionLimit ?? t.totalQuestions ?? 10,
      scoringEngine: t.scoringEngine || (
        t.id === 'Holland' || t.name?.toLowerCase().includes('holland') || t.name?.toLowerCase().includes('riasec')
          ? 'riasec'
          : t.id === 'Gaya Belajar' || t.name?.toLowerCase().includes('gaya belajar')
          ? 'vak'
          : 'standard'
      )
    };
  }, []);

  const extraRowActions = useCallback((item: TestType) => {
    const qCount = store.getQuestions().filter(q => q.testType === item.name).length;
    const dCount = store.getDimensions().filter(d => d.testType === item.name).length;
    return (
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedTestTypeForDimensions(item)}
          className="px-2.5 py-1 text-[10px] font-bold text-indigo-750 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer border border-indigo-100 flex items-center gap-1.5"
          title="Kelola Dimensi Evaluasi untuk modul ini"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-650" />
          <span>Dimensi ({dCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedTestTypeForQuestions(item)}
          className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer border border-emerald-100 flex items-center gap-1.5"
          title="Kelola Bank Soal untuk modul ini"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-650" />
          <span>Soal ({qCount})</span>
        </button>
      </div>
    );
  }, [store]);

  return (
    <>
      <MetadataCoreEngine<TestType>
        resourceName="Jenis & Modul Tes"
        resourceIcon={<Sliders className="w-5 h-5 text-indigo-600" />}
        description="Konfigurasi modul tes psikotes, durasi pengerjaan, dan jumlah soal evaluasi."
        data={testTypes}
        columns={columns}
        fields={fields}
        idField="id"
        canEdit={canEdit}
        searchPlaceholder="Cari jenis tes atau deskripsi..."
        searchFn={testTypesSearchFn}
        defaultSortField="name"
        defaultSortOrder="asc"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={onRefresh}
        mapInitialValues={mapInitialValues}
        showNotification={showNotification}
        extraRowActions={extraRowActions}
        excelTemplateData={[
          { name: 'Tes Minat Karir', duration: 45, questionLimit: 10, description: 'Evaluasi minat bidang pekerjaan Holland RIASEC' }
        ]}
        excelExportFileName="data_jenis_tes.xlsx"
        excelExportMapper={(t) => ({
          'ID Jenis Tes': t.id,
          'Nama Jenis Tes': t.name,
          'Durasi (Menit)': t.duration || t.durationMinutes || 0,
          'Batas Jumlah Soal': t.questionLimit || t.totalQuestions || 0,
          'Mesin Scoring': t.scoringEngine || 'standard',
          'Deskripsi': t.description || '-'
        })}
      />

      {selectedTestTypeForQuestions && (
        <Modal
          isOpen={!!selectedTestTypeForQuestions}
          onClose={() => setSelectedTestTypeForQuestions(null)}
          title={`Kelola Soal: ${selectedTestTypeForQuestions.name}`}
          size="full"
        >
          <div className="bg-slate-50 min-h-[500px] rounded-xl overflow-hidden p-1">
            <QuestionsTab
              store={store}
              questions={store.getQuestions()}
              onRefresh={onRefresh}
              session={session}
              showNotification={showNotification}
              presetTestType={selectedTestTypeForQuestions.name}
            />
          </div>
        </Modal>
      )}

      {selectedTestTypeForDimensions && (
        <Modal
          isOpen={!!selectedTestTypeForDimensions}
          onClose={() => setSelectedTestTypeForDimensions(null)}
          title={`Kelola Dimensi Evaluasi: ${selectedTestTypeForDimensions.name}`}
          size="xl"
        >
          <div className="bg-slate-50 min-h-[400px] rounded-xl overflow-hidden p-1">
            <DimensionsTab
              store={store}
              dimensions={store.getDimensions()}
              onRefresh={onRefresh}
              session={session}
              showNotification={showNotification}
              presetTestType={selectedTestTypeForDimensions.name}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
