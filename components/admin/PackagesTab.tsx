'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Package as PackageIcon } from 'lucide-react';
import { Package } from '../../lib/types';
import { PsychometricStore } from '../../lib/mockData';
import MetadataCoreEngine from './shared/MetadataCoreEngine';
import { PackageRepository } from '../../lib/repositories';
import {
  getPackagesColumns,
  getPackagesFormFields,
  packagesSearchFn
} from '../../lib/metadata';

function PackagesCustomForm({
  editingRecord,
  initialValues,
  onSubmit,
  onCancel,
  errorMessage,
  fields
}: any) {
  const [values, setValues] = useState<Record<string, any>>(initialValues || {});

  const handleFieldChange = (key: string, val: any) => {
    setValues(prev => {
      const next = { ...prev, [key]: val };
      
      // Auto calculate price logic
      if (key === 'pricePerAccount' || key === 'quota' || key === 'discountPercentage') {
        const ppa = Number(next.pricePerAccount) || 0;
        const q = Number(next.quota) || 0;
        let disc = Number(next.discountPercentage) || 0;
        
        // Auto tier discount if quota changed and we want to auto-apply it
        if (key === 'quota' && ppa > 0) {
          if (q >= 5000) disc = 40;
          else if (q >= 1000) disc = 30;
          else if (q >= 500) disc = 20;
          else if (q >= 100) disc = 10;
          else if (q >= 50) disc = 5;
          else disc = 0;
          next.discountPercentage = disc;
        }

        const basePrice = ppa * q;
        const totalDiscount = basePrice * (disc / 100);
        next.price = Math.max(0, Math.round(basePrice - totalDiscount));
      }
      
      return next;
    });
  };

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-sm mb-4">
          {errorMessage}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field: any) => {
          if (field.key === 'testTypeId') {
            return (
              <div key={field.key} className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {field.options?.map((opt: any) => {
                    const currentValues = Array.isArray(values[field.key]) 
                      ? values[field.key] 
                      : (values[field.key] ? String(values[field.key]).split(',').map(s=>s.trim()) : []);
                    const isChecked = currentValues.includes(String(opt.value));
                    return (
                      <label key={opt.value} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let nextArr = [...currentValues];
                            if (e.target.checked) nextArr.push(String(opt.value));
                            else nextArr = nextArr.filter(v => v !== String(opt.value));
                            handleFieldChange(field.key, nextArr);
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          }
          if (field.type === 'select') {
            return (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                <select
                  value={values[field.key] || ''}
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="" disabled>Pilih {field.label}...</option>
                  {field.options?.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            );
          }
          if (field.type === 'textarea') {
            return (
              <div key={field.key} className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  value={values[field.key] || ''}
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>
            );
          }
          
          return (
            <div key={field.key} className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {field.label} {field.required && <span className="text-rose-500">*</span>}
              </label>
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={values[field.key] !== undefined ? values[field.key] : ''}
                onChange={e => handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={field.placeholder}
                disabled={field.disabled}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={() => onSubmit(values)}
          className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          {editingRecord ? 'Perbarui Data' : 'Tambah Baru'}
        </button>
      </div>
    </div>
  );
}

interface PackagesTabProps {
  store: PsychometricStore;
  packages: Package[];
  onRefresh: () => void;
  session: any;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PackagesTab({
  store,
  packages,
  onRefresh,
  session,
  showNotification
}: PackagesTabProps) {
  const repository = useMemo(() => new PackageRepository(store), [store]);
  const canEdit = Boolean(
    session?.role === 'Superadmin' ||
    session?.role === 'Admin' ||
    session?.role === 'admin' ||
    session?.role === 'superadmin' ||
    session?.role === 'Guru BK' ||
    session?.role === 'bk'
  );

  const testTypes = useMemo(() => {
    return store.getTestTypes().map(t => ({ value: t.id, label: t.name }));
  }, [store]);

  const columns = useMemo(() => getPackagesColumns(), []);
  const fields = useMemo(() => getPackagesFormFields(testTypes), [testTypes]);

  const handleAdd = (values: Record<string, any>) => {
    const rawTypes = values.testTypeId;
    const testTypeIdVal = Array.isArray(rawTypes) ? rawTypes.join(', ') : (rawTypes || 'all');
    return repository.add({
      ...values,
      testTypeId: testTypeIdVal,
      popular: values.popular === 'true' || values.popular === true
    });
  };

  const handleUpdate = (id: string, values: Record<string, any>) => {
    const rawTypes = values.testTypeId;
    const testTypeIdVal = Array.isArray(rawTypes) ? rawTypes.join(', ') : (rawTypes || 'all');
    return repository.update(id, {
      ...values,
      testTypeId: testTypeIdVal,
      popular: values.popular === 'true' || values.popular === true
    });
  };

  const handleDelete = (id: string) => {
    repository.delete(id);
  };

  return (
    <div className="space-y-6">
      {/* QUICK PRICE PER USER CONFIGURATOR BANNER */}
      {canEdit && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-900/50 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-bold uppercase tracking-wider">
                  Sistem Kalkulasi Otomatis
                </span>
              </div>
              <h3 className="text-lg font-bold mt-1 text-left">
                Pengaturan Harga Per User (Price / Account)
              </h3>
              <p className="text-slate-300 text-xs mt-0.5 text-left">
                Saat menerbitkan lisensi, admin cukup memasukkan <strong>Jumlah User</strong>. Total tagihan akan dihitung secara otomatis berdasarkan tarif per user di bawah ini.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {packages.map(pkg => {
              const ppa = pkg.pricePerAccount || Math.round((pkg.price || 0) / (pkg.quota || 1));
              return (
                <div key={pkg.id} className="bg-white/5 border border-white/10 hover:border-indigo-500/40 p-3.5 rounded-xl transition-all space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-100 line-clamp-1">{pkg.name}</span>
                    {pkg.popular && (
                      <span className="bg-amber-400/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-400/30 shrink-0">
                        Populer
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-slate-400">Harga / User:</span>
                    <span className="font-mono text-sm font-black text-indigo-300">
                      Rp {ppa.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between border-t border-white/5 pt-1.5">
                    <span>Base Kuota: {pkg.quota || 100} user</span>
                    <span className="font-mono text-emerald-400">
                      Rp {(pkg.price || ppa * (pkg.quota || 100)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MetadataCoreEngine<Package>
        resourceName="Paket & Lisensi Tes"
        resourceIcon={<PackageIcon className="w-5 h-5 text-indigo-600" />}
        description="Pengaturan paket harga lisensi per user, kuota voucher, dan paket rekomendasi tes."
        data={packages}
        columns={columns}
        fields={fields}
        idField="id"
        canEdit={canEdit}
        searchPlaceholder="Cari nama paket atau harga..."
        searchFn={packagesSearchFn}
        defaultSortField="name"
        defaultSortOrder="asc"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={onRefresh}
        showNotification={showNotification}
        customFormRender={PackagesCustomForm}
        excelTemplateData={[
          { name: 'Paket Sekolah Lengkap', pricePerAccount: 15000, quota: 100, price: 1500000, popular: 'true' }
        ]}
        excelExportFileName="data_paket.xlsx"
        excelExportMapper={(p) => ({
          'ID Paket': p.id,
          'Nama Paket': p.name,
          'Harga Per User (Rp)': p.pricePerAccount || Math.round((p.price || 0) / (p.quota || 1)),
          'Kuota Base': p.quota || 0,
          'Total Harga Base (Rp)': p.price,
          'Status Populer': p.popular ? 'Ya' : 'Tidak'
        })}
      />
    </div>
  );
}
