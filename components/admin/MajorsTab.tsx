'use client';

import React, { useMemo } from 'react';
import { GraduationCap } from 'lucide-react';
import { SchoolMajor } from '../../lib/types';
import { PsychometricStore } from '../../lib/mockData';
import MetadataCoreEngine from './shared/MetadataCoreEngine';
import { MajorRepository } from '../../lib/repositories';
import {
  getMajorsColumns,
  getMajorsFormFields,
  majorsSearchFn,
  getContextLabels
} from '../../lib/metadata';

interface MajorsTabProps {
  store: PsychometricStore;
  majors: SchoolMajor[];
  onRefresh: () => void;
  session: any;
  refreshTrigger?: number;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeContextId?: string;
}

export default function MajorsTab({
  store,
  majors,
  onRefresh,
  session,
  showNotification,
  activeContextId
}: MajorsTabProps) {
  const repository = useMemo(() => new MajorRepository(store), [store]);
  const ctx = useMemo(() => getContextLabels(activeContextId), [activeContextId]);

  const canEdit = Boolean(
    session?.role === 'Superadmin' ||
    session?.role === 'Admin' ||
    session?.role === 'admin' ||
    session?.role === 'superadmin' ||
    session?.role === 'Guru BK' ||
    session?.role === 'bk'
  );

  const columns = useMemo(() => getMajorsColumns(activeContextId), [activeContextId]);
  const fields = useMemo(() => getMajorsFormFields(activeContextId), [activeContextId]);

  // CRUD handlers
  const handleAdd = (values: Record<string, any>) => {
    const payload = {
      ...values,
      applicableContexts: Array.isArray(values.applicableContexts) && values.applicableContexts.length > 0
        ? values.applicableContexts
        : (activeContextId && activeContextId !== 'superadmin' ? [activeContextId] : [])
    };
    return repository.add(payload);
  };

  const handleUpdate = (id: string, values: Record<string, any>) => {
    return repository.update(id, values);
  };

  const handleDelete = (id: string) => {
    repository.delete(id);
  };

  return (
    <MetadataCoreEngine<SchoolMajor>
      resourceName={ctx.majorLabel}
      resourceIcon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
      description={`Kelola daftar ${ctx.majorLabel.toLowerCase()} dalam instansi.`}
      data={majors}
      columns={columns}
      fields={fields}
      idField="code"
      canEdit={canEdit}
      searchPlaceholder={`Cari kode atau nama ${ctx.majorShortLabel.toLowerCase()}...`}
      searchFn={majorsSearchFn}
      defaultSortField="code"
      defaultSortOrder="asc"
      mapInitialValues={(isEdit) => isEdit ? {} : { 
        applicableContexts: activeContextId && activeContextId !== 'superadmin' ? [activeContextId] : [] 
      }}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onRefresh={onRefresh}
      showNotification={showNotification}
      excelTemplateData={[
        { code: ctx.isSchool ? 'RPL' : 'DEV', name: ctx.isSchool ? 'Rekayasa Perangkat Lunak' : 'Divisi / Posisi Operasional', description: 'Deskripsi unit / program' }
      ]}
      excelExportFileName={`data_${ctx.majorShortLabel.toLowerCase()}.xlsx`}
      excelExportMapper={(m) => ({
        [`Kode ${ctx.majorShortLabel}`]: m.code,
        [`Nama ${ctx.majorShortLabel}`]: m.name,
        'Konteks Instansi': Array.isArray(m.applicableContexts) && m.applicableContexts.length > 0 ? m.applicableContexts.join(', ') : 'Semua Konteks',
        'Deskripsi': m.description || '-'
      })}
      onClearAll={() => store.clearAllSchoolMajors()}
    />
  );
}
