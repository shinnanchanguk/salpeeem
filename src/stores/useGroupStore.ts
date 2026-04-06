import { create } from 'zustand';
import type { Group } from '@/types';
import {
  getGroups,
  getGroupTree,
  addGroup as dbAddGroup,
  updateGroup as dbUpdateGroup,
  deleteGroup as dbDeleteGroup,
  moveGroup as dbMoveGroup,
} from '@/lib/database';

interface GroupStore {
  groups: Group[];
  groupTree: Group[];
  selectedGroupId: number | null; // null = 인박스
  loading: boolean;
  fetchGroups: () => Promise<void>;
  addGroup: (name: string, parentId?: number | null, byte_limit?: number) => Promise<void>;
  updateGroup: (id: number, name: string, byte_limit?: number) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  moveGroup: (id: number, newParentId: number | null) => Promise<void>;
  setSelectedGroup: (id: number | null) => void;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  groupTree: [],
  selectedGroupId: null,
  loading: false,

  fetchGroups: async () => {
    set({ loading: true });
    try {
      const [groups, groupTree] = await Promise.all([getGroups(), getGroupTree()]);
      set({ groups, groupTree });
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      set({ loading: false });
    }
  },

  addGroup: async (name, parentId, byte_limit) => {
    try {
      await dbAddGroup(name, parentId, undefined, byte_limit);
      await get().fetchGroups();
    } catch (error) {
      console.error('Failed to add group:', error);
    }
  },

  updateGroup: async (id, name, byte_limit) => {
    try {
      await dbUpdateGroup(id, name, byte_limit);
      await get().fetchGroups();
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  },

  deleteGroup: async (id) => {
    try {
      await dbDeleteGroup(id);
      const { selectedGroupId } = get();
      if (selectedGroupId === id) {
        set({ selectedGroupId: null });
      }
      await get().fetchGroups();
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  },

  moveGroup: async (id, newParentId) => {
    try {
      await dbMoveGroup(id, newParentId);
      await get().fetchGroups();
    } catch (error) {
      console.error('Failed to move group:', error);
    }
  },

  setSelectedGroup: (id) => {
    set({ selectedGroupId: id });
  },
}));
