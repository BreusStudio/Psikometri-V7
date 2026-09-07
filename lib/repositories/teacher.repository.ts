import { BaseRepository } from './base.repository';
import { Teacher } from '../types';

export class TeacherRepository extends BaseRepository<Teacher> {
  getAll(): Teacher[] {
    return this.store.getTeachers();
  }

  getById(id: string): Teacher | undefined {
    return this.store.getTeachers().find(t => t.id === id);
  }

  getWaliKelas(): Teacher[] {
    return this.getAll().filter(t => (t.role || '').toLowerCase() === 'wali kelas');
  }

  getKakomli(): Teacher[] {
    return this.getAll().filter(t => (t.role || '').toLowerCase() === 'kakomli');
  }

  add(teacherData: Partial<Teacher>): boolean | string {
    if (!teacherData.id || !teacherData.name) {
      return 'ID / Username dan Nama Pengguna wajib diisi.';
    }
    const existing = this.getById(teacherData.id);
    if (existing) {
      return `Pengguna dengan ID ${teacherData.id} sudah terdaftar.`;
    }

    const newTeacher: Teacher = {
      id: teacherData.id,
      name: teacherData.name,
      password: teacherData.password || '123456',
      role: teacherData.role || 'Guru',
      managed_class: teacherData.managed_class || '',
      managed_major: teacherData.managed_major || '',
      school_origin: teacherData.school_origin || teacherData.context || '',
      context: teacherData.context || teacherData.school_origin || '',
      applicableContexts: Array.isArray(teacherData.applicableContexts) ? teacherData.applicableContexts : (teacherData.context ? [teacherData.context] : [])
    };

    return this.store.saveTeacher(newTeacher);
  }

  update(id: string, updates: Partial<Teacher>): boolean | string {
    const existing = this.getById(id);
    if (!existing) {
      return `Pengguna dengan ID ${id} tidak ditemukan.`;
    }

    const updatedTeacher: Teacher = {
      ...existing,
      ...updates,
      id
    };

    return this.store.saveTeacher(updatedTeacher);
  }

  delete(id: string): boolean {
    return this.store.deleteTeacher(id);
  }
}
