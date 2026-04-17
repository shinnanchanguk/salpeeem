import { create } from 'zustand';
import type { Submission } from '@/types';
import { getSubmissionsByFolder } from '@/lib/database';

interface SubmissionStore {
  byFolder: Record<number, Submission[]>;
  loading: boolean;
  fetchForFolder: (folderId: number) => Promise<void>;
  getFor: (folderId: number) => Submission[];
  reset: (folderId: number) => void;
}

export const useSubmissionStore = create<SubmissionStore>((set, get) => ({
  byFolder: {},
  loading: false,
  fetchForFolder: async (folderId) => {
    set({ loading: true });
    try {
      const rows = await getSubmissionsByFolder(folderId);
      set((s) => ({ byFolder: { ...s.byFolder, [folderId]: rows } }));
    } finally {
      set({ loading: false });
    }
  },
  getFor: (folderId) => get().byFolder[folderId] ?? [],
  reset: (folderId) => {
    set((s) => {
      const copy = { ...s.byFolder };
      delete copy[folderId];
      return { byFolder: copy };
    });
  },
}));
