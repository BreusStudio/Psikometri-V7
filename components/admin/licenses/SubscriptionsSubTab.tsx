'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  User, 
  Building, 
  Search, 
  PlusCircle, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  FileText, 
  PhoneCall, 
  QrCode, 
  ShoppingCart,
  Sparkles,
  RefreshCw,
  Eye,
  Mail,
  Edit3,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Archive
} from 'lucide-react';
import { PsychometricStore, Voucher, Purchase, Package, Student } from '../../../lib/mockData';

import AddSubscriptionModal from './AddSubscriptionModal';
import EditSubscriptionModal, { SubscriptionEditData } from './EditSubscriptionModal';

interface SubscriptionsSubTabProps {
  store: PsychometricStore;
  purchases: Purchase[];
  vouchers: Voucher[];
  packages: Package[];
  onRefresh: () => void;
  sendSimulatedWhatsApp: (phone: string, title: string, content: string, voucherCode?: string) => void;
  generateWhatsAppText: (v: Voucher, buyerName?: string, pkgName?: string, platform?: string) => string;
  session?: { role: string; name: string; id: string; managed_class?: string };
}

export default function SubscriptionsSubTab({
  store,
  purchases,
  vouchers,
  packages,
  onRefresh,
  sendSimulatedWhatsApp,
  generateWhatsAppText,
  session
}: SubscriptionsSubTabProps) {
  const roleLower = (session?.role || '').toLowerCase().trim();
  const isSuperAdmin = roleLower === 'superadmin' || roleLower === 'admin';
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'personal' | 'school' | 'government' | 'corporate'>('all');
  const [expandedVoucherCode, setExpandedVoucherCode] = useState<string | null>(null);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Dynamic Test Types from DB Store
  const dynamicTestOptions = useMemo(() => {
    const typesFromStore = store.getTestTypes();
    if (typesFromStore && typesFromStore.length > 0) {
      return typesFromStore.map(t => ({ id: t.name || t.id, label: t.name }));
    }
    return [
      { id: 'IQ', label: 'Potensi Kognitif (IQ)' },
      { id: 'EQ', label: 'Regulasi Emosional (EQ)' },
      { id: 'Holland', label: 'Minat Karir Holland (RIASEC)' },
      { id: 'Kepribadian', label: 'Kepribadian (Big Five & Virtues)' },
      { id: 'Validitas', label: 'Validitas & Konsistensi' },
    ];
  }, [store]);

  // Manual addition form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [clientCategory, setClientCategory] = useState<'personal' | 'school' | 'government' | 'corporate'>('school');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || '');
  const [customQuota, setCustomQuota] = useState<number>(50);
  const [selectedTests, setSelectedTests] = useState<string[]>(() => dynamicTestOptions.map(t => t.id));
  const [pricePerAccount, setPricePerAccount] = useState<number>(25000);
  const [customPrice, setCustomPrice] = useState<number>(1125000);

  // Progressive volume discount based on quota (up to 25% max cap)
  const discountPercentage = useMemo(() => {
    if (customQuota >= 501) return 25; // Max 25% cap
    if (customQuota >= 251) return 20;
    if (customQuota >= 101) return 15;
    if (customQuota >= 51) return 10;
    if (customQuota >= 26) return 5;
    return 0;
  }, [customQuota]);

  // Compute base price per account automatically from selected Sub-Tests
  const computedSubTestsBasePrice = useMemo(() => {
    const testTypesList = store.getTestTypes();
    const typePriceMap: Record<string, number> = {};
    testTypesList.forEach(t => {
      const p = t.pricePerUser ?? 0;
      typePriceMap[t.id] = p;
      if (t.name) typePriceMap[t.name] = p;
    });

    if (!selectedTests || selectedTests.length === 0) return pricePerAccount;

    const sum = selectedTests.reduce((acc, testId) => {
      return acc + (typePriceMap[testId] || 5000);
    }, 0);

    return sum > 0 ? sum : pricePerAccount;
  }, [selectedTests, store, pricePerAccount]);

  // Update pricePerAccount whenever selected sub-tests change
  React.useEffect(() => {
    setPricePerAccount(computedSubTestsBasePrice);
  }, [computedSubTestsBasePrice]);

  // Sync customPrice whenever customQuota or pricePerAccount changes
  const autoCalculatedPrice = useMemo(() => {
    const baseTotal = pricePerAccount * customQuota;
    return Math.round(baseTotal * (1 - discountPercentage / 100));
  }, [pricePerAccount, customQuota, discountPercentage]);

  React.useEffect(() => {
    setCustomPrice(autoCalculatedPrice);
  }, [autoCalculatedPrice]);
  const [paymentPlatform, setPaymentPlatform] = useState<'TikTok' | 'Shopee' | 'QRIS' | 'Manual'>('Manual');
  const [selectedReferral, setSelectedReferral] = useState<string>('');
  const referrals = store.getReferrals();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom modal / alert states
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Edit Subscription State
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionEditData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEditModal = (sub: any) => {
    setEditingSubscription({
      voucherCode: sub.voucher.code,
      purchaseId: sub.purchase?.id,
      buyerName: sub.buyerName,
      buyerContact: sub.buyerContact,
      packageName: sub.packageName,
      category: sub.category,
      totalQuota: sub.voucher.testCount || sub.totalAccounts || 1,
      selectedTests: sub.voucher.testTypes || dynamicTestOptions.map(t => t.id),
      pricePaid: sub.pricePaid || 0,
      platform: sub.platform || 'Manual',
      voucherActive: sub.voucher.active ?? true,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditSubscription = (updatedData: SubscriptionEditData) => {
    // Update Purchase
    if (updatedData.purchaseId) {
      const pList = store.getPurchases();
      const p = pList.find(item => item.id === updatedData.purchaseId);
      if (p) {
        p.buyerName = updatedData.buyerName;
        p.buyerEmail = updatedData.buyerContact;
        p.packageName = updatedData.packageName;
        p.amount = updatedData.pricePaid;
        p.platform = updatedData.platform;
        p.quotaAdded = updatedData.totalQuota;
        store.updatePurchase(p);
      }
    }

    // Update Voucher
    const vList = store.getVouchers();
    const v = vList.find(item => item.code.toUpperCase() === updatedData.voucherCode.toUpperCase());
    if (v) {
      v.active = updatedData.voucherActive;
      v.testCount = updatedData.totalQuota;
      v.testTypes = updatedData.selectedTests;
      store.saveVoucher(v);
    } else {
      store.saveLocalStorageOnly();
    }

    onRefresh();
    setIsEditModalOpen(false);
    showToast(`Data lisensi ${updatedData.buyerName} berhasil diperbarui!`);
  };

  // Archive (Soft Delete) Subscription Logic
  const handleArchiveSubscription = (sub: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Arsipkan Lisensi & Klien',
      message: `Apakah Anda yakin ingin mengarsipkan lisensi "${sub.buyerName}" (${sub.voucher.code})? Data klien dan voucher akan di-nonaktifkan, dan akun peserta terkait akan dikunci ke status Draft.`,
      onConfirm: () => {
        const key = sub.purchase?.id || sub.voucher.code;
        store.archivePurchase(key);
        onRefresh();
        setConfirmModal(null);
        showToast(`Lisensi ${sub.buyerName} berhasil diarsipkan.`);
      }
    });
  };

  // Delete (Cascade Delete) Subscription Logic
  const handleDeleteSubscription = (sub: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'HAPUS PERMANEN (Cascade Delete)',
      message: `PERINGATAN! Apakah Anda yakin ingin menghapus PERMANEN lisensi "${sub.buyerName}" (${sub.voucher.code})? Seluruh data transaksi, voucher, akun peserta, dan lembar jawaban terkait akan DIHAPUS SEPENUHNYA dari sistem dan Supabase tanpa meninggalkan data yatim.`,
      onConfirm: () => {
        const key = sub.purchase?.id || sub.voucher.code;
        store.deletePurchaseCascade(key);
        onRefresh();
        setConfirmModal(null);
        showToast(`Langganan ${sub.buyerName} & seluruh data terkait berhasil dihapus permanen.`);
      }
    });
  };

  // Quick Toggle Active Status Logic
  const handleToggleVoucherActive = (voucherCode: string, currentActive: boolean) => {
    const vList = store.getVouchers();
    const v = vList.find(item => item.code.toUpperCase() === voucherCode.toUpperCase());
    if (v) {
      v.active = !currentActive;
      store.saveVoucher(v);
      onRefresh();
      showToast(`Status voucher ${voucherCode} diubah menjadi ${!currentActive ? 'AKTIF' : 'NON-AKTIF'}`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync capacity and pricing whenever package selection changes
  const handlePackageChange = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const pkg = packages.find(p => p.id === pkgId);
    if (pkg) {
      const quota = pkg.testCount || pkg.quota || 100;
      setCustomQuota(quota);
      const basePricePerAcc = Math.round(pkg.price / quota);
      setPricePerAccount(basePricePerAcc);
      if (pkg.testTypes && pkg.testTypes.length > 0) {
        setSelectedTests(pkg.testTypes);
      }
    }
  };

  // Toggle individual sub-test checkbox
  const handleToggleTest = (test: string) => {
    setSelectedTests(prev => 
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };

  // Reset a student account to allow them to re-test
  const handleResetStudentAccount = (voucherCode: string, studentUsername: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Akun Ujian Siswa',
      message: `Apakah Anda yakin ingin meriset akun "${studentUsername}"? Nilai jawaban dan status ujian akan dihapus agar siswa bisa mengulang dari awal.`,
      onConfirm: () => {
        // Find in store.students and reset progress
        const studentsList = store.getStudents();
        const student = studentsList.find((s: Student) => s.id === studentUsername);
        if (student) {
          student.testStarted = false;
          student.testCompleted = false;
          student.testStartedAt = null;
          student.testCompletedAt = null;
          student.currentQuestionIndex = 0;
          student.answers = {};
          student.cheatWarnings = 0;
          student.iqScore = null;
          student.eqScore = null;
          student.riasecScores = null;
          student.dimensionScores = null;
          student.aiAnalysis = null;
          student.completedTests = [];
        }

        // Mark as unredeemed in voucher's generated accounts
        const voucher = vouchers.find(v => v.code === voucherCode);
        if (voucher && voucher.generatedAccounts) {
          const acc = voucher.generatedAccounts.find(a => a.username === studentUsername);
          if (acc) {
            acc.redeemed = false;
            acc.redeemedBy = undefined;
            acc.classGroup = undefined;
          }
        }

        store.saveLocalStorageOnly();
        onRefresh();
        showToast(`Akun ${studentUsername} berhasil diriset ke kondisi awal!`);
        setConfirmModal(null);
      }
    });
  };

  // Create manual subscription logic
  const handleCreateManualSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!clientName.trim() || !clientContact.trim()) {
      setFormError('Mohon isi nama lengkap klien dan kontak WhatsApp.');
      return;
    }
    if (selectedTests.length === 0) {
      setFormError('Pilih minimal satu sub-tes kognitif/minat yang aktif.');
      return;
    }

    const txId = 'TX-MAN-' + Math.floor(100000 + Math.random() * 900000);
    const matchedPkg = packages.find(p => p.id === selectedPackageId);
    const packageName = matchedPkg 
      ? `${matchedPkg.name} (${clientCategory.toUpperCase()})` 
      : `Paket Manual Custom (${clientCategory.toUpperCase()})`;

    // Calculate commission if referral is selected
    let commissionEarned = 0;
    if (selectedReferral) {
      const matchedRef = referrals.find(r => r.code === selectedReferral);
      if (matchedRef) {
        const rate = matchedRef.commissionRate || 10;
        commissionEarned = Math.round(customPrice * (rate / 100));
      }
    }

    // Create purchase record
    const newPurchase: Purchase = {
      id: txId,
      platform: paymentPlatform,
      packageName,
      buyerName: clientName.trim(),
      buyerEmail: clientContact.trim(), // We use email field to store contact / WhatsApp phone number
      amount: customPrice,
      voucherUsed: null,
      referralUsed: selectedReferral || null,
      commissionEarned,
      date: new Date().toISOString(),
      status: 'Completed',
      quotaAdded: customQuota
    };

    // Add purchase triggers voucher creation internally
    store.addPurchase(newPurchase);

    // Look up the auto-generated voucher code in the list
    const generatedVCode = `VCHR-${txId.replace('TX-', '').toUpperCase()}`;
    const updatedVouchers = store.getVouchers();
    const autoV = updatedVouchers.find(v => v.code.toUpperCase() === generatedVCode);

    if (autoV) {
      // Set the custom test types selected by the superadmin
      autoV.testTypes = selectedTests;
      // Sync allowed tests in students
      if (autoV.generatedAccounts) {
        autoV.generatedAccounts.forEach(acc => {
          const s = store.getStudents().find((st: Student) => st.id === acc.username);
          if (s) {
            s.allowedTests = selectedTests;
          }
        });
      }
      
      // Save changes back to local storage and trigger update
      store.saveLocalStorageOnly();
      
      // Trigger WhatsApp simulation
      const waContent = generateWhatsAppText(autoV, clientName.trim(), packageName, paymentPlatform);
      sendSimulatedWhatsApp(
        clientContact.trim(),
        `WhatsApp - Pembelian Manual ${packageName}`,
        waContent,
        generatedVCode
      );
    }

    // Reset Form
    setClientName('');
    setClientContact('');
    setSelectedReferral('');
    setIsAddOpen(false);
    onRefresh();
    showToast(`Sukses mendaftarkan langganan manual untuk ${clientName.trim()}! Voucher ${generatedVCode} terbit.`);
  };

  // Compile full subscription records
  const compiledSubscriptions = useMemo(() => {
    return vouchers.map(v => {
      // Find matching purchase
      const matchedPurchase = purchases.find(p => p.generatedVoucher === v.code || v.code.includes(p.id.replace('TX-', '')));
      
      // Classify category based on test capacity, buyer name, or package category
      let category: 'personal' | 'school' | 'government' | 'corporate' = 'school';
      const nameLower = (matchedPurchase?.buyerName || '').toLowerCase();
      const pkgNameLower = (matchedPurchase?.packageName || '').toLowerCase();
      
      if (v.testCount === 1 || pkgNameLower.includes('personal') || pkgNameLower.includes('mandiri')) {
        category = 'personal';
      } else if (
        pkgNameLower.includes('government') || 
        pkgNameLower.includes('pemerintahan') || 
        nameLower.includes('dinas') || 
        nameLower.includes('kementerian') || 
        nameLower.includes('pemprov') || 
        nameLower.includes('pemkab') || 
        nameLower.includes('pemda') || 
        nameLower.includes('bumn')
      ) {
        category = 'government';
      } else if (
        pkgNameLower.includes('corporate') || 
        pkgNameLower.includes('perusahaan') || 
        nameLower.includes('pt ') || 
        nameLower.includes('cv ') || 
        nameLower.includes('corporation') || 
        nameLower.includes('bsh') || 
        nameLower.includes('perusahaan')
      ) {
        category = 'corporate';
      } else {
        category = 'school';
      }

      // Calculate statistics of voucher logins
      const generatedAccs = v.generatedAccounts || [];
      const totalAccounts = generatedAccs.length;
      
      // Count completed exams by looking up student status in the store
      const studentsList = store.getStudents();
      let completedCount = 0;
      let startedCount = 0;
      
      generatedAccs.forEach(acc => {
        const studentInfo = studentsList.find((s: Student) => s.id === acc.username);
        if (studentInfo) {
          if (studentInfo.testCompleted) completedCount++;
          else if (studentInfo.testStarted) startedCount++;
        }
      });

      return {
        voucher: v,
        purchase: matchedPurchase,
        category,
        totalAccounts,
        completedCount,
        startedCount,
        buyerName: matchedPurchase?.buyerName || `Pelanggan Mandiri #${v.code}`,
        buyerContact: matchedPurchase?.buyerEmail || '-',
        packageName: matchedPurchase?.packageName || (v.testCount === 1 ? 'Paket Mandiri Personal' : 'Paket Kuota Sekolah'),
        pricePaid: matchedPurchase?.amount ?? 0,
        platform: matchedPurchase?.platform || 'Manual',
        date: matchedPurchase?.date || new Date().toISOString()
      };
    });
  }, [vouchers, purchases, store]);

  // Apply Search & Tab Filters
  const filteredSubscriptions = useMemo(() => {
    return compiledSubscriptions.filter(sub => {
      // Tab Category filter
      if (activeCategory !== 'all' && sub.category !== activeCategory) {
        return false;
      }

      // Text search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          sub.voucher.code.toLowerCase().includes(q) ||
          sub.buyerName.toLowerCase().includes(q) ||
          sub.buyerContact.toLowerCase().includes(q) ||
          sub.packageName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [compiledSubscriptions, activeCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in" id="subscriptions-subtab-container">
      
      {/* ACTIONS & FILTERS HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama klien, voucher, atau no WA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeCategory === 'all' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Semua Akun
            </button>
            <button
              onClick={() => setActiveCategory('personal')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${activeCategory === 'personal' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <User className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Personal
            </button>
            <button
              onClick={() => setActiveCategory('school')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${activeCategory === 'school' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Building className="w-3.5 h-3.5 text-purple-500 shrink-0" /> Instansi / Sekolah
            </button>
            <button
              onClick={() => setActiveCategory('government')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${activeCategory === 'government' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Building2 className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Pemerintahan / BUMN
            </button>
            <button
              onClick={() => setActiveCategory('corporate')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${activeCategory === 'corporate' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Perusahaan
            </button>
          </div>
        </div>

        {/* ADD MANUAL ACCOUNT OR REQUEST QUOTA BUTTON */}
        {isSuperAdmin ? (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Daftarkan Langganan Manual
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setClientName(session?.name || 'Konselor BK Sekolah');
              setClientContact('081234567890');
              setIsAddOpen(true);
            }}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-100 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Minta / Tambah Kuota Ujian
          </button>
        )}
      </div>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg font-semibold text-xs fixed bottom-6 right-6 z-50 animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SUBSCRIPTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-750 tracking-wider font-mono flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" /> Pengelolaan Akun Hasil Pembelian
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Lacak keaktifan, reset password siswa, bagikan link WA dan monitor progres ujian pelanggan.</p>
          </div>
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
            Total {filteredSubscriptions.length} Pembelian
          </span>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Klien berlangganan tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba gunakan filter lain atau daftarkan langganan manual di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-6">Klien / Pembeli</th>
                  <th className="p-4">Jenis Paket</th>
                  <th className="p-4">Kode Voucher</th>
                  <th className="p-4 text-center">Progres Kuota</th>
                  <th className="p-4">Platform / Nilai</th>
                  <th className="p-4">Tgl Pembelian</th>
                  <th className="p-4 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredSubscriptions.map(sub => {
                  const isExpanded = expandedVoucherCode === sub.voucher.code;
                  
                  // Category badge style
                  let badgeStyle = "bg-purple-50 text-purple-700 border-purple-100";
                  if (sub.category === 'personal') badgeStyle = "bg-blue-50 text-blue-700 border-blue-100";
                  if (sub.category === 'government') badgeStyle = "bg-rose-50 text-rose-700 border-rose-100";
                  if (sub.category === 'corporate') badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";

                  return (
                    <React.Fragment key={sub.voucher.code}>
                      <tr className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                              {sub.category === 'personal' ? (
                                <User className="w-4 h-4 text-blue-600" />
                              ) : sub.category === 'school' ? (
                                <Building className="w-4 h-4 text-purple-600" />
                              ) : sub.category === 'government' ? (
                                <Building2 className="w-4 h-4 text-rose-600" />
                              ) : (
                                <Building2 className="w-4 h-4 text-amber-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm leading-tight">{sub.buyerName}</p>
                              <div className="flex items-center gap-1.5 text-slate-400 mt-0.5 text-[10px] font-mono">
                                <PhoneCall className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{sub.buyerContact}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-700">{sub.packageName}</span>
                            <div className="flex gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${badgeStyle}`}>
                                {sub.category === 'personal' ? 'Personal' : sub.category === 'school' ? 'Instansi / Sekolah' : sub.category === 'government' ? 'Pemerintahan / Dinas' : 'Perusahaan / Swasta'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                Shield CBT Lock
                              </span>
                              {sub.category !== 'personal' ? (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-150">
                                  Proctor Live Stream
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-150">
                                  Instant PDF
                                </span>
                              )}
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-150">
                                Audit Log
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold border ${
                                sub.voucher.active !== false 
                                  ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                                  : 'bg-rose-50 border-rose-200 text-rose-700'
                              }`}>
                                {sub.voucher.code}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(sub.voucher.code);
                                  setCopiedVoucher(sub.voucher.code);
                                  setTimeout(() => setCopiedVoucher(null), 2000);
                                }}
                                className="text-slate-400 hover:text-indigo-600 shrink-0 cursor-pointer"
                                title="Salin Kode Voucher"
                              >
                                {copiedVoucher === sub.voucher.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            {sub.voucher.active === false ? (
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                NON-AKTIF
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                AKTIF
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-block space-y-1 font-mono">
                            <div className="flex items-center justify-center gap-1 font-bold text-slate-800">
                              <span>{sub.completedCount} selesai</span>
                              <span className="text-slate-300">/</span>
                              <span className="text-indigo-600">{sub.totalAccounts} Akun</span>
                            </div>
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 mx-auto overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${(sub.completedCount / sub.totalAccounts) * 100}%` }}
                              ></div>
                            </div>
                            {sub.startedCount > 0 && (
                              <p className="text-[9px] text-amber-500 font-semibold font-sans">{sub.startedCount} sedang ujian</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-0.5 font-mono">
                            <p className="font-bold text-slate-800">Rp {sub.pricePaid.toLocaleString('id-ID')}</p>
                            <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              {sub.platform}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-500">
                          {new Date(sub.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* DETAIL TOGGLE */}
                            <button
                              type="button"
                              onClick={() => setExpandedVoucherCode(isExpanded ? null : sub.voucher.code)}
                              className={`px-2.5 py-1.5 rounded-xl border font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition-all ${
                                isExpanded 
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm'
                              }`}
                              title="Lihat Kredensial & Progres Akun"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{isExpanded ? 'Tutup' : 'Detail'}</span>
                            </button>

                            {/* EDIT BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(sub)}
                              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              title="Edit Data Klien & Kuota Ujian"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>

                            {/* ARCHIVE / SOFT DELETE BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleArchiveSubscription(sub)}
                              className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-all cursor-pointer shadow-sm"
                              title="Arsipkan / Soft Delete Klien & Voucher"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>

                            {/* CASCADE DELETE BUTTON */}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSubscription(sub)}
                                className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer shadow-sm"
                                title="Hapus Permanen (Cascade Delete) Klien & Seluruh Peserta"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED SECTION */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="p-6 border-t border-b border-slate-200/80">
                            <div className="space-y-5 max-w-5xl mx-auto text-left">
                              
                              {/* EXPORTER & QUICK SHARER */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 text-white p-4 rounded-2xl">
                                <div>
                                  <h4 className="text-xs font-bold flex items-center gap-1.5 text-indigo-300">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    Manajemen Kredensial Login Pelanggan
                                  </h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Bagikan kredensial di bawah atau reset jika peserta mengalami kesalahan teknis.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => handleOpenEditModal(sub)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" /> Edit Lisensi
                                  </button>
                                  <button
                                    onClick={() => {
                                      let copyText = `*PORTAL UJIAN CBT PSIKOMETRIK*\n`;
                                      copyText += `*KLIEN:* ${sub.buyerName}\n`;
                                      copyText += `*VOUCHER:* ${sub.voucher.code}\n`;
                                      copyText += `*SUB-TES AKTIF:* ${(sub.voucher.testTypes || []).join(', ')}\n\n`;
                                      
                                      if (sub.category !== 'personal' && sub.voucher.adminUsername) {
                                        copyText += `*🔑 PORTAL GURU BK / KOORDINATOR:*\n`;
                                        copyText += `• Link Login: ${window.location.origin}/login\n`;
                                        copyText += `• Username: ${sub.voucher.adminUsername}\n`;
                                        copyText += `• Password: ${sub.voucher.adminPassword}\n\n`;
                                      }

                                      copyText += `*🔑 DAFTAR AKUN LOGIN SISWA / PESERTA:*\n`;
                                      (sub.voucher.generatedAccounts || []).forEach((acc, idx) => {
                                        copyText += `${idx+1}. User: *${acc.username}* | Pass: *${acc.password}*\n`;
                                      });
                                      
                                      navigator.clipboard.writeText(copyText);
                                      showToast("Seluruh akun login tersalin!");
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" /> Salin Format WA
                                  </button>
                                  <button
                                    onClick={() => {
                                      let text = `AKUN LOGIN CBT - ${sub.buyerName.toUpperCase()}\n`;
                                      text += `Kategori: ${sub.packageName}\n`;
                                      text += `Kode Voucher: ${sub.voucher.code}\n`;
                                      text += `Sub-Tes Aktif: ${(sub.voucher.testTypes || []).join(', ')}\n\n`;
                                      
                                      if (sub.category !== 'personal' && sub.voucher.adminUsername) {
                                        text += `AKUN KONSOL GURU BK / KOORDINATOR:\n`;
                                        text += `Username: ${sub.voucher.adminUsername}\n`;
                                        text += `Password: ${sub.voucher.adminPassword}\n\n`;
                                      }

                                      text += `DAFTAR AKUN LOGIN PESERTA:\n`;
                                      (sub.voucher.generatedAccounts || []).forEach((acc, index) => {
                                        text += `[Peserta #${index + 1}] Username: ${acc.username} | Password: ${acc.password}\n`;
                                      });
                                      
                                      const blob = new Blob([text], { type: 'text/plain' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `Kredensial_CBT_${sub.voucher.code}.txt`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 border border-slate-700 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Download berkas (.txt)
                                  </button>
                                </div>
                              </div>

                              {/* GURU BK ACCOUNT (IF GROUP) */}
                              {sub.category !== 'personal' && sub.voucher.adminUsername && (
                                <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-indigo-600 text-white font-mono font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                      🛡️ AKUN PROKTOR / GURU BK
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      Klien dapat login ke panel guru eksternal untuk melacak progres siswa mereka secara mandiri (Sistem Pengawasan Proktor).
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center font-mono">
                                      <span className="text-slate-400 font-semibold">Username Proktor:</span>
                                      <span className="font-bold text-slate-800">{sub.voucher.adminUsername}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center font-mono">
                                      <span className="text-slate-400 font-semibold">Password Proktor:</span>
                                      <span className="font-bold text-slate-800">{sub.voucher.adminPassword}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* STUDENTS LIST ACCOUNTS */}
                              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-150 font-bold text-slate-700 text-[10px] uppercase flex justify-between items-center">
                                  <span className="flex items-center gap-1.5 text-slate-700">
                                    📋 KARTU LOGIN PESERTA / SISWA ({sub.totalAccounts} Akun CBT)
                                  </span>
                                  <span className="text-indigo-600 font-bold normal-case font-mono">Dapat didownload/dibagikan secara individu</span>
                                </div>
                                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                  {(sub.voucher.generatedAccounts || []).map((acc, idx) => {
                                    // Fetch current live progress of student from store
                                    const studentInfo = store.getStudents().find((s: Student) => s.id === acc.username);
                                    let statusColor = "text-slate-400 bg-slate-50 border-slate-100";
                                    let statusText = "Belum Mulai";
                                    
                                    if (studentInfo) {
                                      if (studentInfo.testCompleted) {
                                        statusColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
                                        statusText = "Selesai";
                                      } else if (studentInfo.testStarted) {
                                        statusColor = "text-amber-700 bg-amber-50 border-amber-100 font-bold";
                                        statusText = "Mengerjakan";
                                      }
                                    }

                                    return (
                                      <div key={acc.username} className="p-3 px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/40">
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                          <span className="font-mono text-slate-400 font-bold text-[10px]">#{idx+1}</span>
                                          <div className="font-mono text-xs">
                                            <span>Username: <strong className="text-slate-900 font-bold">{acc.username}</strong></span>
                                            <span className="mx-2 text-slate-300">|</span>
                                            <span>Password: <strong className="text-slate-900 font-bold">{acc.password}</strong></span>
                                          </div>
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusColor}`}>
                                            {statusText}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(`User: ${acc.username} | Pass: ${acc.password}`);
                                              setCopiedAccount(acc.username);
                                              setTimeout(() => setCopiedAccount(null), 2000);
                                            }}
                                            className="text-slate-500 hover:text-indigo-600 font-semibold text-[10px] px-2 py-1 rounded border hover:bg-indigo-50/50 cursor-pointer"
                                          >
                                            {copiedAccount === acc.username ? 'Disalin!' : 'Salin Akun'}
                                          </button>
                                          
                                          {studentInfo && (studentInfo.testStarted || studentInfo.testCompleted) && (
                                            <button
                                              onClick={() => handleResetStudentAccount(sub.voucher.code, acc.username)}
                                              className="text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-transparent font-semibold text-[10px] px-2 py-1 rounded cursor-pointer transition-all"
                                              title="Riset status pengerjaan siswa"
                                            >
                                              Riset Sesi Ujian
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD MANUAL SUBSCRIPTION MODAL DRAWER */}
      <AddSubscriptionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        isSuperAdmin={isSuperAdmin}
        formError={formError}
        clientCategory={clientCategory}
        setClientCategory={setClientCategory}
        clientName={clientName}
        setClientName={setClientName}
        clientContact={clientContact}
        setClientContact={setClientContact}
        selectedPackageId={selectedPackageId}
        packages={packages}
        handlePackageChange={handlePackageChange}
        customPrice={customPrice}
        setCustomPrice={setCustomPrice}
        customQuota={customQuota}
        setCustomQuota={setCustomQuota}
        pricePerAccount={pricePerAccount}
        setPricePerAccount={setPricePerAccount}
        discountPercentage={discountPercentage}
        selectedTests={selectedTests}
        handleToggleTest={handleToggleTest}
        availableTestTypes={dynamicTestOptions}
        paymentPlatform={paymentPlatform}
        setPaymentPlatform={setPaymentPlatform}
        handleCreateManualSubscription={handleCreateManualSubscription}
        referrals={referrals}
        selectedReferral={selectedReferral}
        setSelectedReferral={setSelectedReferral}
      />

      {/* EDIT SUBSCRIPTION MODAL */}
      <EditSubscriptionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        data={editingSubscription}
        availableTestTypes={dynamicTestOptions}
        onSave={handleSaveEditSubscription}
      />

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-150 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shadow-sm mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono text-indigo-600">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed text-center">{confirmModal.message}</p>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 bg-white hover:bg-slate-50 border text-slate-600 font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-100"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
