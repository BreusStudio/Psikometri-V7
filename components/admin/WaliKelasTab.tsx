'use client';

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { Teacher } from '../../lib/types';
import { PsychometricStore } from '../../lib/mockData';
import MetadataCoreEngine from './shared/MetadataCoreEngine';
import { TeacherRepository } from '../../lib/repositories';
import {
  getWaliKelasColumns,
  getWaliKelasFormFields,
  getWaliKelasFilters,
  waliKelasSearchFn,
  getContextLabels
} from '../../lib/metadata';

interface WaliKelasTabProps {
  store: PsychometricStore;
  teachers: Teacher[];
  onRefresh: () => void;
  session: any;
  refreshTrigger?: number;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeContextId?: string;
}

export default function WaliKelasTab({
  store,
  teachers,
  onRefresh,
  session,
  refreshTrigger,
  showNotification,
  activeContextId
}: WaliKelasTabProps) {
  const repository = useMemo(() => new TeacherRepository(store), [store]);
  const ctx = useMemo(() => getContextLabels(activeContextId), [activeContextId]);
  const canEdit = Boolean(
    session?.role === 'Superadmin' ||
    session?.role === 'Admin' ||
    session?.role === 'superadmin' ||
    session?.role === 'admin'
  );

  const waliList = useMemo(() => {
    return repository.getWaliKelas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, teachers, refreshTrigger]);

  const registeredClasses = useMemo(() => {
    return [...store.getRegisteredClasses()];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  const eligibleUsers = useMemo(() => {
    return teachers.filter(t => t.role !== 'Wali Kelas' && t.role !== 'Kakomli' && t.role !== 'Superadmin');
  }, [teachers]);

  const columns = useMemo(() => getWaliKelasColumns(activeContextId), [activeContextId]);
  const fields = useMemo(() => getWaliKelasFormFields(eligibleUsers, registeredClasses, activeContextId), [eligibleUsers, registeredClasses, activeContextId]);
  const filters = useMemo(() => getWaliKelasFilters(registeredClasses, activeContextId), [registeredClasses, activeContextId]);

  const handleAdd = (values: Record<string, any>) => {
    return repository.add({
      ...values,
      role: 'Wali Kelas'
    });
  };

  const handleUpdate = (id: string, values: Record<string, any>) => {
    return repository.update(id, {
      ...values,
      role: 'Wali Kelas'
    });
  };

  const handleDelete = (id: string) => {
    repository.delete(id);
  };

  const supervisorRoleTitle = ctx.isSchool ? 'Wali Kelas' : 'Supervisor / Pembina';

  return (
    <MetadataCoreEngine<Teacher>
      resourceName={supervisorRoleTitle}
      resourceIcon={<Users className="w-5 h-5 text-cyan-600" />}
      description={`Pengelolaan akun penanggung jawab dan pembina per ${ctx.classShortLabel.toLowerCase()}.`}
      data={waliList}
      columns={columns}
      fields={fields}
      filters={filters}
      idField="id"
      canEdit={canEdit}
      searchPlaceholder={`Cari nama, ID, atau ${ctx.classShortLabel.toLowerCase()}...`}
      searchFn={waliKelasSearchFn}
      defaultSortField="id"
      defaultSortOrder="asc"
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onRefresh={onRefresh}
      showNotification={showNotification}
      excelTemplateData={[
        { id: 'spv.01', name: 'Budi Santoso', password: '123', managed_class: 'X-1' }
      ]}
      excelExportFileName={`data_${supervisorRoleTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.xlsx`}
      excelExportMapper={(w) => ({
        'Username': w.id,
        'Nama Lengkap': w.name,
        [`${ctx.classShortLabel} Diampu`]: w.managed_class || '-',
        'Password': w.password
      })}
    />
  );
}
