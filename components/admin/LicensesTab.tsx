'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Coins, 
  DollarSign, 
  Sparkles, 
  RefreshCw
} from 'lucide-react';
import { PsychometricStore, Voucher, ReferralCode, Commission, Purchase, Package } from '../../lib/mockData';

// Modular child components
import OverviewSubTab from './licenses/OverviewSubTab';
import VouchersSubTab from './licenses/VouchersSubTab';
import ReferralsSubTab from './licenses/ReferralsSubTab';
import TransactionsSubTab from './licenses/TransactionsSubTab';
import SubscriptionsSubTab from './licenses/SubscriptionsSubTab';
import PackagesTab from './PackagesTab';
import WhatsAppSandbox, { SimulatedEmail } from './licenses/WhatsAppSandbox';
import FinancialSubTab from './licenses/FinancialSubTab';

import SubTestPriceConfig from './licenses/SubTestPriceConfig';

interface LicensesTabProps {
  store: PsychometricStore;
  onRefresh: () => void;
  session: { role: string; name: string; id: string; managed_class?: string };
}

export default function LicensesTab({ store, onRefresh, session }: LicensesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'subscriptions' | 'packages' | 'financial'>('subscriptions');
  const [financialInnerTab, setFinancialInnerTab] = useState<'financial' | 'vouchers' | 'referrals' | 'transactions' | 'overview'>('financial');
  
  const roleLower = (session?.role || '').toLowerCase().trim();
  const isSuperAdmin = roleLower === 'superadmin' || roleLower === 'admin';

  // Centralized state syncing from PsychometricStore
  const [vouchers, setVouchers] = useState<Voucher[]>(() => store.getVouchers());
  const [referrals, setReferrals] = useState<ReferralCode[]>(() => store.getReferrals());
  const [commissions, setCommissions] = useState<Commission[]>(() => store.getCommissions());
  const [purchases, setPurchases] = useState<Purchase[]>(() => store.getPurchases());
  const [packages, setPackages] = useState<Package[]>(() => store.getPackages());
  const quotaInfo = store.getQuotaInfo();

  // Email simulation list
  const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('psychometric_simulated_emails');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);
  const [isEmailInboxOpen, setIsEmailInboxOpen] = useState(false);

  // Refresh lists helper
  const refreshLocalState = () => {
    setVouchers(store.getVouchers());
    setReferrals(store.getReferrals());
    setCommissions(store.getCommissions());
    setPurchases(store.getPurchases());
    setPackages(store.getPackages());
    onRefresh();
  };

  // Helper to generate WhatsApp message body
  const generateWhatsAppText = (v: Voucher, buyerName?: string, pkgName?: string, platform?: string) => {
    const isGroup = (v.testCount || 1) > 1;
    const testList = v.testTypes && v.testTypes.length > 0 ? v.testTypes.join(', ') : 'Semua Sub-Tes';
    const bName = buyerName || 'Koordinator BK / Pelanggan';
    const pName = pkgName || 'Voucher Mandiri';
    const plat = platform || 'Manual Admin';

    let accountsText = '';
    if (!isGroup) {
      const acc = v.generatedAccounts?.[0];
      accountsText = `*🔑 Kredensial Login Siswa (Personal):*\n• *Username:* ${acc?.username || `SISWA_${v.code}`}\n• *Password:* ${acc?.password || 'TERDAPAT DI DASHBOARD'}`;
    } else {
      accountsText = `*🔑 Kredensial Admin Konselor / BK (Sekolah):*\n• *Username Admin:* ${v.adminUsername || `ADMIN_${v.code}`}\n• *Password Admin:* ${v.adminPassword || 'TERDAPAT DI DASHBOARD'}\n\n_Gunakan akun Admin di atas untuk login ke portal guru guna mendownload seluruh ${v.testCount} akun siswa._`;
    }

    return `*CBT PSIKOMETRIK* ✅\n*BUKTI AKSES & KODE VOUCHER UJIAN*\n\nHalo *${bName}*,\n\nTerima kasih telah memesan paket ujian psikometrik kami. Transaksi Anda via *${plat}* untuk paket *${pName}* telah sukses diproses.\n\n--------------------------------------------------\n*🏷️ KODE VOUCHER REDEEM:*\n👉 *${v.code}* 👈\n--------------------------------------------------\n• *Kapasitas:* ${v.testCount || 1} Pengguna / Akun\n• *Sub-Tes Aktif:* ${testList}\n\n${accountsText}\n\n*📖 Petunjuk Penggunaan:*\n1. Buka portal utama *CBT Psikometrik*.\n2. Masuk menggunakan *Username* & *Password* di atas (Siswa / Guru BK).\n3. Klik *Masuk Ujian* untuk memulai pengerjaan CBT.\n4. Sub-tes yang akan tersaji otomatis: *${testList}*.\n\n_Pesan ini dikirimkan otomatis oleh sistem CBT Psikometrik CBT Core._\n_Jika ada kendala akses, silakan hubungi tim teknis kami._`;
  };

  // Helper to trigger WhatsApp simulation save & modal view
  const sendSimulatedWhatsApp = (phone: string, title: string, content: string, voucherCode?: string) => {
    const newMsg: SimulatedEmail = {
      id: 'WA-' + Math.floor(100000 + Math.random() * 900000),
      to: phone,
      subject: title,
      body: content,
      date: new Date().toISOString(),
      voucherCode
    };
    
    let currentMsgs: SimulatedEmail[] = [];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('psychometric_simulated_emails');
      currentMsgs = saved ? JSON.parse(saved) : [];
    }
    const updated = [newMsg, ...currentMsgs];
    setSimulatedEmails(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('psychometric_simulated_emails', JSON.stringify(updated));
    }
    setSelectedEmail(newMsg);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500 opacity-10 rounded-full blur-3xl"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-mono px-3 py-1 rounded-full border border-emerald-500/30 font-bold uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {isSuperAdmin ? 'KONSOL SAAS HQ' : 'PORTAL LISENSI SEKOLAH'}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-left">
            {isSuperAdmin ? 'Sistem Paket, Lisensi & Kemitraan' : 'Status Lisensi & Kuota Ujian Sekolah'}
          </h2>
          <p className="text-slate-400 text-xs mt-1 text-left">
            {isSuperAdmin 
              ? 'Kelola voucher promosi, kode referal mitra, sisa kuota, dan lacak omset penjualan otomatis via TikTok, Shopee & QRIS.'
              : 'Pantau sisa kuota pengerjaan tes, status paket aktif instansi, dan kredensial login peserta didik sekolah Anda.'}
          </p>
        </div>
      </div>

      {/* DYNAMIC QUOTA & FINANCE SUMMARY METERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* QUOTA REMAINING */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {isSuperAdmin ? 'Sisa Kuota Ujian Global' : 'Sisa Kuota Sekolah'}
              </span>
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 text-left">Sisa / Total Kuota</h3>
            <p className="text-3xl font-black text-slate-800 font-mono mt-2 text-left">
              {quotaInfo.remaining} <span className="text-xs text-slate-400 font-medium">/ {quotaInfo.total} Siswa</span>
            </p>
          </div>
          <div className="mt-4 space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${(quotaInfo.used / quotaInfo.total) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{quotaInfo.used} Terpakai</span>
              <span>{quotaInfo.purchased} dari Pembelian</span>
            </div>
          </div>
        </div>

        {isSuperAdmin ? (
          <>
            {/* TOTAL SALES VALUE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Total Penjualan</span>
                  <Coins className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-sm font-medium text-slate-500 text-left">Omset Masuk</h3>
                <p className="text-3xl font-black text-slate-800 font-mono mt-2 text-left">
                  Rp {purchases.reduce((acc, p) => acc + p.amount, 0).toLocaleString('id-ID')}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-left">Tercatat dari simulasi Shopee, TikTok, QRIS</p>
            </div>

            {/* COMMISSIONS PAID / PENDING */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Komisi Referral</span>
                  <DollarSign className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-sm font-medium text-slate-500 text-left">Total Komisi (Flat 30%)</h3>
                <p className="text-3xl font-black text-slate-800 font-mono mt-2 text-left">
                  Rp {commissions.reduce((acc, c) => acc + c.commissionAmount, 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 border-t pt-2 border-slate-100">
                <span>Pending: Rp {commissions.filter(c => c.status === 'Pending').reduce((acc,c) => acc+c.commissionAmount, 0).toLocaleString('id-ID')}</span>
                <span className="text-emerald-600 font-bold">Paid: Rp {commissions.filter(c => c.status === 'Paid').reduce((acc,c) => acc+c.commissionAmount, 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* MONETIZATION HEALTH */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Kemitraan Aktif</span>
                  <Sparkles className="w-5 h-5 text-cyan-500" />
                </div>
                <h3 className="text-sm font-medium text-slate-500 text-left">Mitra & Voucher</h3>
                <p className="text-3xl font-black text-slate-800 font-mono mt-2 text-left">
                  {referrals.length} <span className="text-xs text-slate-400 font-medium">Mitra</span>
                  <span className="text-slate-300 mx-2">/</span>
                  {vouchers.length} <span className="text-xs text-slate-400 font-medium">Voucher</span>
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-left">Promo manual transfer diaudit admin</p>
            </div>
          </>
        ) : (
          <>
            {/* SCHOOL ACTIVE PACKAGE STATUS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Paket Aktif Instansi</span>
                  <Coins className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-sm font-medium text-slate-500 text-left">Status Lisensi</h3>
                <p className="text-lg font-black text-slate-800 font-sans mt-2 text-left truncate">
                  Paket Peminatan Sekolah
                </p>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-2 text-left flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Masa Aktif Berlaku
              </p>
            </div>

            {/* TOTAL REGISTERED STUDENTS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Siswa Terdaftar</span>
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-sm font-medium text-slate-500 text-left">Total Akun Diterbitkan</h3>
                <p className="text-3xl font-black text-slate-800 font-mono mt-2 text-left">
                  {store.getStudents().length} <span className="text-xs text-slate-400 font-medium">Siswa</span>
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-left">Siap dikirim via WhatsApp / Cetak</p>
            </div>

            {/* TEST COMPLETION PROGRESS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Progres Ujian</span>
                  <Sparkles className="w-5 h-5 text-cyan-500" />
                </div>
                <h3 className="text-sm font-medium text-slate-500 text-left">Pengerjaan Selesai</h3>
                <p className="text-3xl font-black text-slate-800 font-mono mt-2 text-left">
                  {store.getStudents().filter(s => s.testCompleted).length} <span className="text-xs text-slate-400 font-medium">Siswa</span>
                </p>
              </div>
              <p className="text-[10px] text-cyan-600 font-semibold mt-2 text-left">
                {store.getStudents().filter(s => s.testStarted && !s.testCompleted).length} sedang mengerjakan CBT
              </p>
            </div>
          </>
        )}

      </div>

      {/* PRIMARY SUB-TABS SELECTOR */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50 p-1.5 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('subscriptions')}
          className={`flex-1 min-w-[200px] px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
            activeSubTab === 'subscriptions' 
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200 font-extrabold' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'
          }`}
        >
          🏢 {isSuperAdmin ? 'Kelola Klien & Lisensi Ujian' : 'Lisensi & Akun Sekolah Saya'}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('packages')}
          className={`flex-1 min-w-[200px] px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
            activeSubTab === 'packages' 
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200 font-extrabold' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'
          }`}
        >
          ⚙️ {isSuperAdmin ? 'Setting Harga Sub-Tes & Paket' : 'Katalog Paket Ujian'}
        </button>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveSubTab('financial')}
            className={`flex-1 min-w-[200px] px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
              activeSubTab === 'financial' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'
            }`}
          >
            📊 Keuangan, Voucher & Referral
          </button>
        )}
      </div>

      {/* SUB-TAB 1: SUBSCRIPTIONS & CLIENT DIRECTORY */}
      {activeSubTab === 'subscriptions' && (
        <SubscriptionsSubTab
          store={store}
          purchases={purchases}
          vouchers={vouchers}
          packages={packages}
          onRefresh={refreshLocalState}
          sendSimulatedWhatsApp={sendSimulatedWhatsApp}
          generateWhatsAppText={generateWhatsAppText}
          session={session}
        />
      )}

      {/* SUB-TAB 2: CONFIGURATION HARGA SUB-TES & PAKET PRESETS */}
      {activeSubTab === 'packages' && (
        <div className="space-y-8 animate-fade-in">
          {/* A. Dynamic Sub-Test Pricing & Live Simulator */}
          <SubTestPriceConfig
            store={store}
            packages={packages}
            onRefresh={refreshLocalState}
            canEdit={isSuperAdmin}
            onSelectForSubscription={() => {
              setActiveSubTab('subscriptions');
            }}
          />

          {/* B. Presets Package Manager */}
          <div className="border-t border-slate-200 pt-8">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4 text-left">
              Daftar Catalog Preset Paket Ujian
            </h4>
            <PackagesTab 
              store={store} 
              packages={packages} 
              onRefresh={refreshLocalState} 
              session={session} 
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FINANCIAL, VOUCHER, REFERRAL & MARKETPLACE */}
      {isSuperAdmin && activeSubTab === 'financial' && (
        <div className="space-y-6 animate-fade-in">
          {/* INNER NAV PILLS FOR FINANCIAL SUB-TAB */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setFinancialInnerTab('financial')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                financialInnerTab === 'financial'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              📈 Laporan Laba Rugi & Komisi
            </button>
            <button
              type="button"
              onClick={() => setFinancialInnerTab('vouchers')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                financialInnerTab === 'vouchers'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              🏷️ Kode Voucher Promo
            </button>
            <button
              type="button"
              onClick={() => setFinancialInnerTab('referrals')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                financialInnerTab === 'referrals'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              🤝 Referral & Komisi Mitra
            </button>
            <button
              type="button"
              onClick={() => setFinancialInnerTab('transactions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                financialInnerTab === 'transactions'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              💳 Log Transaksi Shopee & TikTok
            </button>
            <button
              type="button"
              onClick={() => setFinancialInnerTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                financialInnerTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              🏪 Ikhtisar Toko & Penjualan
            </button>
          </div>

          {/* INNER VIEW CONTENT */}
          {financialInnerTab === 'financial' && (
            <FinancialSubTab
              store={store}
              purchases={purchases}
              commissions={commissions}
              referrals={referrals}
              onRefresh={refreshLocalState}
            />
          )}

          {financialInnerTab === 'vouchers' && (
            <VouchersSubTab
              store={store}
              vouchers={vouchers}
              onRefresh={refreshLocalState}
              sendSimulatedWhatsApp={sendSimulatedWhatsApp}
              generateWhatsAppText={generateWhatsAppText}
            />
          )}

          {financialInnerTab === 'referrals' && (
            <ReferralsSubTab
              store={store}
              referrals={referrals}
              onRefresh={refreshLocalState}
            />
          )}

          {financialInnerTab === 'transactions' && (
            <TransactionsSubTab
              purchases={purchases}
            />
          )}

          {financialInnerTab === 'overview' && (
            <OverviewSubTab
              store={store}
              packages={packages}
              vouchers={vouchers}
              referrals={referrals}
              commissions={commissions}
              onRefresh={refreshLocalState}
              sendSimulatedWhatsApp={sendSimulatedWhatsApp}
              generateWhatsAppText={generateWhatsAppText}
            />
          )}
        </div>
      )}

      {/* WHATSAPP SANDBOX CHAT DISPLAY SIMULATOR (SUPERADMIN ONLY) */}
      {isSuperAdmin && (
        <WhatsAppSandbox
          simulatedEmails={simulatedEmails}
          setSimulatedEmails={setSimulatedEmails}
          isEmailInboxOpen={isEmailInboxOpen}
          setIsEmailInboxOpen={setIsEmailInboxOpen}
          selectedEmail={selectedEmail}
          setSelectedEmail={setSelectedEmail}
        />
      )}

    </div>
  );
}
