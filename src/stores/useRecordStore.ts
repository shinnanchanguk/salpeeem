import { create } from 'zustand';
import type { Record, RecordSource, Importance } from '@/types';
import {
  getRecords,
  getInboxRecords,
  getRecordsByGroup,
  addRecord as dbAddRecord,
  updateRecordAssignment,
  updateRecordImportance,
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
  ) => Promise<void>;
  assignRecord: (id: number, student_id: number, group_id: number) => Promise<void>;
  updateImportance: (id: number, importance: Importance) => Promise<void>;
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
      const groupRecords = await getRecordsByGroup(groupId);
      set({ groupRecords });
    } catch (error) {
      console.error('Failed to fetch group records:', error);
    } finally {
      set({ loading: false });
    }
  },

  addRecord: async (raw_input, generated_sentence, student_id, group_id, source, importance) => {
    try {
      await dbAddRecord(raw_input, generated_sentence, student_id, group_id, source, importance);
      await get().fetchRecords();
      await get().fetchInboxRecords();
    } catch (error) {
      console.error('Failed to add record:', error);
    }
  },

  assignRecord: async (id, student_id, group_id) => {
    try {
      await updateRecordAssignment(id, student_id, group_id);
      await get().fetchRecords();
      await get().fetchInboxRecords();
    } catch (error) {
      console.error('Failed to assign record:', error);
    }
  },

  updateImportance: async (id, importance) => {
    try {
      await updateRecordImportance(id, importance);
      await get().fetchRecords();
    } catch (error) {
      console.error('Failed to update importance:', error);
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
