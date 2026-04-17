import { create } from 'zustand';
import type { AppSettings } from '@/types';
import { getAllSettings, setSetting, getDefaultSubmissionRoot } from '@/lib/database';
import { setAIConfig } from '@/lib/ai-service';

const defaultSettings: AppSettings = {
  openrouter_api_key: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  openrouter_model: import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.5-flash',
  use_custom_key: false,
  shortcut_full: 'Ctrl+Shift+F',
  shortcut_side: 'Ctrl+Shift+S',
  shortcut_bar: 'Ctrl+Shift+B',
  shortcut_focus: 'Ctrl+Shift+R',
  student_id_pattern: 'G1C1N2',
  submission_root_path: '',
};

interface SettingsStore {
  settings: AppSettings;
  loading: boolean;
  initialized: boolean;
  fetchSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  saveAllSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...defaultSettings },
  loading: false,
  initialized: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const rows = await getAllSettings();
      const saved: Partial<AppSettings> = {};
      for (const row of rows) {
        if (row.key === 'use_custom_key') {
          (saved as any)[row.key] = row.value === 'true';
        } else {
          (saved as any)[row.key] = row.value;
        }
      }
      const merged = { ...defaultSettings, ...saved };
      // First-run: populate submission root to ~/Documents/살핌/제출물
      if (!merged.submission_root_path) {
        const fallback = await getDefaultSubmissionRoot();
        if (fallback) {
          merged.submission_root_path = fallback;
          await setSetting('submission_root_path', fallback);
        }
      }
      set({ settings: merged, initialized: true });
      // Sync AI config
      if (merged.use_custom_key && merged.openrouter_api_key) {
        setAIConfig(merged.openrouter_api_key, merged.openrouter_model);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  updateSetting: (key, value) => {
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    }));
  },

  saveAllSettings: async () => {
    set({ loading: true });
    try {
      const settings = get().settings;
      for (const [key, value] of Object.entries(settings)) {
        await setSetting(key, String(value));
      }
      // Sync AI config
      if (settings.use_custom_key && settings.openrouter_api_key) {
        setAIConfig(settings.openrouter_api_key, settings.openrouter_model);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
