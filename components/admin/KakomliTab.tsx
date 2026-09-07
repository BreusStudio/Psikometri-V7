'use client';

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { Teacher } from '../../lib/types';
import { PsychometricStore } from '../../lib/mockData';
import MetadataCoreEngine from './shared/MetadataCoreEngine';
import { TeacherRepository } from '../../lib/repositories';
import {
  getKakomliColumns,
  getKakomliFormFields,
  getKakomliFilters,
  kakomliSearchFn,
  getContextLabels
} from '../../lib/metadata';

interface KakomliTabProps {
  store: PsychometricStore;
  teachers: Teacher[];
  onRefresh: () => void;
  session: any;
  refreshTrigger?: number;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeContextId?: string;
}

export default function KakomliTab({
  store,
  teachers,
  onRefresh,
  session,
  refreshTrigger,
  showNotification,
  activeContextId
}: KakomliTabProps) {
  const repository = useMemo(() => new TeacherRepository(store), [store]);
  const ctx = useMemo(() => getContextLabels(activeContextId), [activeContextId]);
  const canEdit = Boolean(
    session?.role === 'Superadmin' ||
    session?.role === 'Admin' ||
    session?.role === 'superadmin' ||
    session?.role === 'admin'
  );

  const kakomliList = useMemo(() => {
    return repository.getKakomli();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, teachers, refreshTrigger]);

  const schoolMajors = useMemo(() => {
    return store.getMajors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  const eligibleUsers = useMemo(() => {
    return teachers.filter(t => t.role !== 'Wali Kelas' && t.role !== 'Kakomli' && t.role !== 'Superadmin');
  }, [teachers]);

  const columns = useMemo(() => getKakomliColumns(activeContextId), [activeContextId]);
  const fields = useMemo(() => getKakomliFormFields(eligibleUsers, schoolMajors, activeContextId), [eligibleUsers, schoolMajors, activeContextId]);
  const filters = useMemo(() => getKakomliFilters(schoolMajors, activeContextId), [schoolMajors, activeContextId]);

  const handleAdd = (values: Record<string, any>) => {
    return repository.add({
      ...values,
      role: 'Kakomli'
    });
  };

  const handleUpdate = (id: string, values: Record<string, any>) => {
    return repository.update(id, {
      ...values,
      role: 'Kakomli'
    });
  };

  const handleDelete = (id: string) => {
    repository.delete(id);
  };

  const headRoleTitle = ctx.isSchool ? 'Kepala Program / Kakomli' : 'Kepala Departemen / Manajer';

  return (
    <MetadataCoreEngine<Teacher>
      resourceName={headRoleTitle}
      resourceIcon={<Users className="w-5 h-5 text-amber-600" />}
      description={`Pengelolaan akun penanggung jawab per ${ctx.majorLabel.toLowerCase()}.`}
      data={kakomliList}
      columns={columns}
      fields={fields}
      filters={filters}
      idField="id"
      canEdit={canEdit}
      searchPlaceholder={`Cari nama, ID, atau ${ctx.majorShortLabel.toLowerCase()}...`}
      searchFn={kakomliSearchFn}
      defaultSortField="id"
      defaultSortOrder="asc"
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onRefresh={onRefresh}
      showNotification={showNotification}
      excelTemplateData={[
        { id: 'mgr.01', name: 'Rudi Hartono', password: '123', managed_major: 'DEV' }
      ]}
      excelExportFileName={`data_${headRoleTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.xlsx`}
      excelExportMapper={(k) => ({
        'Username': k.id,
        'Nama Lengkap': k.name,
        [`${ctx.majorShortLabel} Diampu`]: k.managed_major || k.managed_class || '-',
        'Password': k.password
      })}
    />
  );
}
