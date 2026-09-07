'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function CareerGuidanceTips() {
  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-3 text-left">
      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
        <ShieldAlert className="w-4 h-4 text-indigo-600" /> Panduan Pemetaan Karir Bimbingan Konseling (SMK):
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ul className="space-y-1.5 list-disc pl-4">
          <li><strong>Realistic (R):</strong> Konstruksi bangunan, perbengkelan motor/mobil, instalasi tenaga listrik, pemesinan logam.</li>
          <li><strong>Investigative (I):</strong> Rekayasa perangkat lunak, pemrograman komputer, sains laboratorium, farmasi klinis.</li>
          <li><strong>Artistic (A):</strong> Desain grafis komunikasi visual, tata busana/fesyen, multimedia animasi, seni kriya kreatif.</li>
        </ul>
        <ul className="space-y-1.5 list-disc pl-4">
          <li><strong>Social (S):</strong> Pelayanan keperawatan medik, asisten pekerjaan sosial, kepariwisataan & perhotelan.</li>
          <li><strong>Enterprising (E):</strong> Pemasaran retail digital, manajemen logistik pergudangan, kuliner/tata boga.</li>
          <li><strong>Conventional (C):</strong> Akuntansi keuangan lembaga, administrasi tata kelola perkantoran bisnis.</li>
        </ul>
      </div>
    </div>
  );
}
