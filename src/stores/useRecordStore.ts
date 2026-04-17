import { create } from 'zustand';
import type { Record, RecordSource, Importance } from '@/types';
import {
  getRecords,
  getInboxRecords,
  getRecordsByGroupRecursive,
  addRecord as dbAddRecord,
  updateRecordAssignment,
  updateRecordImportance,
  updateRecordText as dbUpdateRecordText,
  deleteRecord as dbDeleteRecord,
  getRecordsByFilter,
} from '@/lib/database';

interface RecordStore {
  records: Record[];
  inboxRecords: Record[];
  groupRecords: Record[];
  loading: boolean;
  fetchRecords: () => Promise<void>;
  fetchInboxRecords: () => Promise<void>;
  fetchGroupRecords: (groupId: number) => Promise<void>;
  addRecord: (
    raw_input: string,
    generated_sentence: string,
    student_id?: number | null,
    group_id?: number | null,
    source?: RecordSource,
    importance?: Importance,
    assignment_folder_id?: number | null,
  ) => Promise<void>;
  assignRecord: (id: number, student_id: number, group_id: number) => Promise<void>;
  updateImportance: (id: number, importance: Importance) => Promise<void>;
  updateRecordText: (id: number, raw_input: string, generated_sentence: string, is_edited: boolean) => Promise<void>;
  deleteRecord: (id: number) => Promise<void>;
  getFilteredRecords: (studentIds?: number[], groupIds?: number[]) => Promise<Record[]>;
}

export const useRecordStore = create<RecordStore>((set, get) => ({
  records: [],
  inboxRecords: [],
  groupRecords: [],
  loading: false,

  fetchRecords: async () => {
    set({ loading: true });
    try {
      const records = await getRecords();
      set({ records });
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchInboxRecords: async () => {
    set({ loading: true });
    try {
      const inboxRecords = await getInboxRecords();
      set({ inboxRecords });
    } catch (error) {
      console.error('Failed to fetch inbox records:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchGroupRecords: async (groupId: number) => {
    set({ loading: true });
    try {
      // Recursive: parent group shows its own + all descendants' records
      const groupRecords = await getRecordsByGroupRecursive(groupId);
      set({ groupRecords });
    } catch (error) {
      console.error('Failed to fetch group records:', error);
    } finally {
      set({ loading: false });
    }
  },

  addRecord: async (raw_input, generated_sentence, student_id, group_id, source, importance, assignment_folder_id) => {
    try {
      await dbAddRecord(raw_input, generated_sentence, student_id, group_id, source, importance, assignment_folder_id);
      await get().fetchRecords();
      await get().fetchInboxRecords();
    } catch (error) {
      console.error('Failed to add record:', error);
    }
  },

  assignRecord: async (id, student_id, group_id) => {
    try {
      await updateRecordAssignment(id, student_id, group_id);
      // Drop from current group list if it no longer belongs here; inbox refetch
      // will restore orphans. Full refetch ensures join fields (student_name/
      // group_name) come back fresh from SQL.
      await get().fetchRecords();
      await get().fetchInboxRecords();
      set((state) => ({
        groupRecords: state.groupRecords.filter((r) => r.id !== id),
      }));
    } catch (error) {
      console.error('Failed to assign record:', error);
    }
  },

  updateImportance: async (id, importance) => {
    try {
      await updateRecordImportance(id, importance);
      // Optimistic local update so UI reflects change immediately in the
      // currently visible list without requiring a full refetch.
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? { ...r, importance } : r)),
        inboxRecords: state.inboxRecords.map((r) =>
          r.id === id ? { ...r, importance } : r,
        ),
        groupRecords: state.groupRecords.map((r) =>
          r.id === id ? { ...r, importance } : r,
        ),
      }));
    } catch (error) {
      console.error('Failed to update importance:', error);
    }
  },

  updateRecordText: async (id, raw_input, generated_sentence, is_edited) => {
    try {
      await dbUpdateRecordText(id, raw_input, generated_sentence, is_edited);
      await get().fetchRecords();
      await get().fetchInboxRecords();
    } catch (error) {
      console.error('Failed to update record text:', error);
    }
  },

  deleteRecord: async (id) => {
    try {
      await dbDeleteRecord(id);
      await get().fetchRecords();
      await get().fetchInboxRecords();
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  },

  getFilteredRecords: async (studentIds, groupIds) => {
    try {
      return await getRecordsByFilter(studentIds, groupIds);
    } catch (error) {
      console.error('Failed to get filtered records:', error);
      return [];
    }
  },
}));
