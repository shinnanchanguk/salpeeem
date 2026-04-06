import { create } from 'zustand';
import type { Student } from '@/types';
import {
  getStudents,
  addStudent as dbAddStudent,
  updateStudent as dbUpdateStudent,
  deleteStudent as dbDeleteStudent,
} from '@/lib/database';

interface StudentStore {
  students: Student[];
  loading: boolean;
  fetchStudents: () => Promise<void>;
  addStudent: (name: string, grade: string, class_name: string, student_no?: number) => Promise<void>;
  updateStudent: (id: number, name: string, grade: string, class_name: string, student_no?: number) => Promise<void>;
  deleteStudent: (id: number) => Promise<void>;
}

export const useStudentStore = create<StudentStore>((set, get) => ({
  students: [],
  loading: false,

  fetchStudents: async () => {
    set({ loading: true });
    try {
      const students = await getStudents();
      set({ students });
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      set({ loading: false });
    }
  },

  addStudent: async (name, grade, class_name, student_no = 0) => {
    try {
      await dbAddStudent(name, grade, class_name, student_no);
      await get().fetchStudents();
    } catch (error) {
      console.error('Failed to add student:', error);
    }
  },

  updateStudent: async (id, name, grade, class_name, student_no = 0) => {
    try {
      await dbUpdateStudent(id, name, grade, class_name, student_no);
      await get().fetchStudents();
    } catch (error) {
      console.error('Failed to update student:', error);
    }
  },

  deleteStudent: async (id) => {
    try {
      await dbDeleteStudent(id);
      await get().fetchStudents();
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  },
}));
