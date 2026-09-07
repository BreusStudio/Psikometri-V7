import { supabase, resilientUpsert } from '../../supabase';
import { Student } from '../../types';
import { StoreDataState, saveLocalStorageState } from '../storageSync';
import { mapDatabaseRowToStudent } from '../dbMappers';
import { mapStudentToDbRow, mapStudentToCoreDbRow } from '../supabaseSync';

export async function syncStudentsData(state: StoreDataState): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: studentsData, error: studError } = await supabase.from('students').select('*');
    if (!studError && Array.isArray(studentsData)) {
      state.students = studentsData.map(row => mapDatabaseRowToStudent(row));
      saveLocalStorageState(state);
      return true;
    }
  } catch (err) {
    console.warn("Failed to fetch students from Supabase:", err);
  }
  return false;
}

export async function pushStudentsData(students: Student[]): Promise<boolean> {
  if (!supabase || students.length === 0) return true;
  try {
    const rows = students.map(s => mapStudentToDbRow(s));
    const { error } = await resilientUpsert(supabase, 'students', rows, { onConflict: 'id' });
    if (error) {
      // Fallback to core columns
      const coreRows = students.map(s => mapStudentToCoreDbRow(s));
      await resilientUpsert(supabase, 'students', coreRows, { onConflict: 'id' });
    }
    return true;
  } catch (err) {
    console.warn("Failed to push students to Supabase:", err);
    return false;
  }
}
