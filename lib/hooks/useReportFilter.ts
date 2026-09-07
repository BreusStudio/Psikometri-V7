import { useState, useMemo, useEffect } from 'react';
import { Student, Package } from '../types';

export function useReportFilter(students: Student[], packages: Package[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [angkatanFilter, setAngkatanFilter] = useState('All');
  const [kelasFilter, setKelasFilter] = useState('All');
  const [showTroubledOnly, setShowTroubledOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [printTrigger, setPrintTrigger] = useState(0);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  useEffect(() => {
    if (printTrigger > 0) {
      window.print();
    }
  }, [printTrigger]);

  const selectedPackage = useMemo(() => {
    if (selectedPackageId) {
      return packages.find(p => p.id === selectedPackageId) || null;
    }
    return packages.length > 0 ? packages[0] : null;
  }, [packages, selectedPackageId]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const angkatanMatch = angkatanFilter === 'All' || String(s.angkatan) === angkatanFilter;
      const kelasMatch = kelasFilter === 'All' || s.classGroup === kelasFilter;
      
      let troubledMatch = true;
      if (showTroubledOnly) {
        troubledMatch = Boolean(s.testCompleted && (
          s.lockedOut || 
          s.cheatWarnings >= 2 || 
          (s.iqScore !== null && s.iqScore < 90) || 
          (s.eqScore !== null && s.eqScore < 90) ||
          s.aiAnalysis?.hasPotentialIssues === true
        ));
      }
      
      return nameMatch && angkatanMatch && kelasMatch && troubledMatch;
    });
  }, [students, searchTerm, angkatanFilter, kelasFilter, showTroubledOnly]);

  return {
    searchTerm,
    setSearchTerm,
    angkatanFilter,
    setAngkatanFilter,
    kelasFilter,
    setKelasFilter,
    showTroubledOnly,
    setShowTroubledOnly,
    selectedIds,
    setSelectedIds,
    printTrigger,
    setPrintTrigger,
    selectedPackageId,
    setSelectedPackageId,
    selectedPackage,
    filteredStudents
  };
}
