import { create } from 'zustand';
import type { CompletedRecord } from '@/types';
import {
  getCompletedRecords,
  getCompletedRecord as dbGetCompletedRecord,
  upsertCompletedRecord,
  confirmCompletedRecord,
  getRecordsByFilter,
} from '@/lib/database';
import { generateAreaDraft } from '@/lib/ai-service';
import { getByteLength } from '@/types';
import { useStudentStore } from './useStudentStore';
import { useGroupStore } from './useGroupStore';

interface CompletionStore {
  completedRecords: CompletedRecord[];
  loading: boolean;
  generatingIds: Set<string>;
  fetchCompletedRecords: () => Promise<void>;
  generateDraft: (student_id: number, group_id: number) => Promise<void>;
  confirmRecord: (id: number) => Promise<void>;
  getCompletedRecord: (student_id: number, group_id: number) => Promise<CompletedRecord | null>;
}

function makeKey(student_id: number, group_id: number): string {
  return `${student_id}-${group_id}`;
}

export const useCompletionStore = create<CompletionStore>((set, get) => ({
  completedRecords: [],
  loading: false,
  generatingIds: new Set(),

  fetchCompletedRecords: async () => {
    set({ loading: true });
    try {
      const completedRecords = await getCompletedRecords();
      set({ completedRecords });
    } catch (error) {
      console.error('Failed to fetch completed records:', error);
    } finally {
      set({ loading: false });
    }
  },

  generateDraft: async (student_id, group_id) => {
    const key = makeKey(student_id, group_id);
    set((state) => ({
      generatingIds: new Set(state.generatingIds).add(key),
    }));
    try {
      const students = useStudentStore.getState().students;
      const groups = useGroupStore.getState().groups;
      const student = students.find((s) => s.id === student_id);
      const group = groups.find((g) => g.id === group_id);
      if (!student || !group) throw new Error('Student or group not found');

      const records = await getRecordsByFilter([student_id], [group_id]);
      const sentences = records.map((r) => ({
        content: r.generated_sentence,
        importance: r.importance,
        source: r.source,
      }));

      const draft = await generateAreaDraft(
        student.name,
        group.name,
        sentences,
        group.byte_limit
      );
      const byteCount = getByteLength(draft);
      await upsertCompletedRecord(student_id, group_id, draft, byteCount, '미완성');
      await get().fetchCompletedRecords();
    } catch (error) {
      console.error('Failed to generate draft:', error);
    } finally {
      set((state) => {
        const next = new Set(state.generatingIds);
        next.delete(key);
        return { generatingIds: next };
      });
    }
  },

  confirmRecord: async (id) => {
    try {
      await confirmCompletedRecord(id);
      await get().fetchCompletedRecords();
    } catch (error) {
      console.error('Failed to confirm record:', error);
    }
  },

  getCompletedRecord: async (student_id, group_id) => {
    try {
      return await dbGetCompletedRecord(student_id, group_id);
    } catch (error) {
      console.error('Failed to get completed record:', error);
      return null;
    }
  },
}));
