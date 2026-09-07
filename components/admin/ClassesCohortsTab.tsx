'use client';

import React, { useMemo } from 'react';
import { Layers, GraduationCap } from 'lucide-react';
import { PsychometricStore } from '../../lib/mockData';
import MetadataCoreEngine from './shared/MetadataCoreEngine';
import { ClassesRepository } from '../../lib/repositories';
import {
  getClassColumns,
  getClassFormFields,
  classSearchFn,
  getCohortColumns,
  getCohortFormFields,
  cohortSearchFn,
  RegisteredClassItem,
  RegisteredCohortItem,
  getContextLabels
} from '../../lib/metadata';

interface ClassesCohortsTabProps {
  store: PsychometricStore;
  onRefresh: () => void;
  session: any;
  refreshTrigger?: number;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeContextId?: string;
}

export default function ClassesCohortsTab({
  store,
  onRefresh,
  session,
  refreshTrigger,
  showNotification,
  activeContextId
}: ClassesCohortsTabProps) {
  const repository = useMemo(() => new ClassesRepository(store), [store]);
  const ctx = useMemo(() => getContextLabels(activeContextId), [activeContextId]);
  const canEdit = Boolean(
    session?.role === 'Superadmin' ||
    session?.role === 'Admin' ||
    session?.role === 'superadmin' ||
    session?.role === 'admin'
  );

  const classesData: RegisteredClassItem[] = useMemo(() => {
    return repository.getClasses().map(c => ({ id: c, name: c }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, store, refreshTrigger]);

  const cohortsData: RegisteredCohortItem[] = useMemo(() => {
    return repository.getCohorts().map(c => ({ id: String(c), year: c }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, store, refreshTrigger]);

  const classCols = useMemo(() => getClassColumns(), []);
  const classFields = useMemo(() => getClassFormFields(), []);

  const cohortCols = useMemo(() => getCohortColumns(), []);
  const cohortFields = useMemo(() => getCohortFormFields(), []);

  // Handlers for Classes
  const handleAddClass = (values: Record<string, any>) => {
    const success = repository.addClass(values.name);
    if (!success) return 'Kelas tersebut sudah terdaftar.';
    return true;
  };

  const handleUpdateClass = (id: string, values: Record<string, any>) => {
    repository.deleteClass(id);
    repository.addClass(values.name);
    return true;
  };

  const handleDeleteClass = (id: string) => {
    repository.deleteClass(id);
  };

  // Handlers for Cohorts
  const handleAddCohort = (values: Record<string, any>) => {
    const year = Number(values.year);
    if (isNaN(year)) return 'Tahun angkatan harus berupa angka.';
    const success = repository.addCohort(year);
    if (!success) return 'Tahun angkatan tersebut sudah terdaftar.';
    return true;
  };

  const handleUpdateCohort = (id: string, values: Record<string, any>) => {
    const oldYear = Number(id);
    const newYear = Number(values.year);
    repository.deleteCohort(oldYear);
    repository.addCohort(newYear);
    return true;
  };

  const handleDeleteCohort = (id: string) => {
    repository.deleteCohort(Number(id));
  };

  return (
    <div className="space-y-8">
      {/* Panel 1: Master Kelas / Kelompok */}
      <MetadataCoreEngine<RegisteredClassItem>
        resourceName={ctx.classLabel}
        resourceIcon={<Layers className="w-5 h-5 text-cyan-600" />}
        description={`Master data ${ctx.classLabel.toLowerCase()} terdaftar dalam instansi.`}
        data={classesData}
        columns={classCols}
        fields={classFields}
        idField="id"
        canEdit={canEdit}
        searchPlaceholder={`Cari ${ctx.classShortLabel.toLowerCase()}...`}
        searchFn={classSearchFn}
        defaultSortField="name"
        defaultSortOrder="asc"
        onAdd={handleAddClass}
        onUpdate={handleUpdateClass}
        onDelete={handleDeleteClass}
        onRefresh={onRefresh}
        showNotification={showNotification}
        excelTemplateData={[{ name: ctx.isSchool ? 'X-RPL-1' : 'Divisi A' }]}
        excelExportFileName={`data_${ctx.classShortLabel.toLowerCase()}.xlsx`}
        excelExportMapper={(c) => ({ [ctx.classLabel]: c.name })}
      />

      {/* Panel 2: Master Angkatan / Tahun */}
      <MetadataCoreEngine<RegisteredCohortItem>
        resourceName={ctx.cohortLabel}
        resourceIcon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
        description={`Master data ${ctx.cohortLabel.toLowerCase()} peserta tes.`}
        data={cohortsData}
        columns={cohortCols}
        fields={cohortFields}
        idField="id"
        canEdit={canEdit}
        searchPlaceholder={`Cari ${ctx.cohortShortLabel.toLowerCase()}...`}
        searchFn={cohortSearchFn}
        defaultSortField="year"
        defaultSortOrder="desc"
        onAdd={handleAddCohort}
        onUpdate={handleUpdateCohort}
        onDelete={handleDeleteCohort}
        onRefresh={onRefresh}
        showNotification={showNotification}
        excelTemplateData={[{ year: 2025 }, { year: 2026 }]}
        excelExportFileName={`data_${ctx.cohortShortLabel.toLowerCase()}.xlsx`}
        excelExportMapper={(c) => ({ [ctx.cohortLabel]: c.year })}
      />
    </div>
  );
}
