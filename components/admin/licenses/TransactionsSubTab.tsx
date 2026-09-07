'use client';

import React from 'react';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import { Purchase } from '../../../lib/mockData';

interface TransactionsSubTabProps {
  purchases: Purchase[];
}

export default function TransactionsSubTab({
  purchases
}: TransactionsSubTabProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
            <ShoppingBag className="w-4 h-4 text-emerald-500" /> Log Transaksi CBT Otomatis
          </h3>
          <p className="text-xs text-slate-500 mt-1">Laporan omset penjualan, voucher, dan referral dari TikTok, Shopee, QRIS, dan Manual.</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('psychometric_purchases');
            localStorage.removeItem('psychometric_commissions');
            localStorage.removeItem('psychometric_quota_added');
            window.location.reload();
          }}
          className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 border px-2.5 py-1 rounded-lg cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Log & Quota
        </button>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
              <th className="p-3">ID Transaksi</th>
              <th className="p-3">Waktu</th>
              <th className="p-3">Platform</th>
              <th className="p-3">Nama Paket</th>
              <th className="p-3">Nama Sekolah / Pembeli</th>
              <th className="p-3">Voucher Used</th>
              <th className="p-3">Total Bayar</th>
              <th className="p-3 text-right">Quota Diperoleh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="p-3 font-mono text-slate-500">{p.id}</td>
                <td className="p-3 text-slate-500">{new Date(p.date).toLocaleString('id-ID')}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.platform === 'TikTok' ? 'bg-slate-900 text-white' :
                    p.platform === 'Shopee' ? 'bg-orange-100 text-orange-800' :
                    p.platform === 'QRIS' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {p.platform}
                  </span>
                </td>
                <td className="p-3 font-medium text-slate-800">{p.packageName}</td>
                <td className="p-3">
                  <div>
                    <div className="font-semibold text-slate-700">{p.buyerName}</div>
                    <div className="text-[10px] text-slate-400">{p.buyerEmail}</div>
                  </div>
                </td>
                <td className="p-3 font-mono text-indigo-600 font-bold">{p.voucherUsed || '-'}</td>
                <td className="p-3 font-mono font-bold text-slate-800">Rp {p.amount.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-mono font-bold text-emerald-600">+{p.quotaAdded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
