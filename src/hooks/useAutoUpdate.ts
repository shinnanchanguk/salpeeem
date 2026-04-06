import { useState, useEffect, useCallback } from 'react';

interface UpdateInfo {
  version: string;
  body: string;
  date: string;
}

interface UpdateState {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  progress: number;
  info: UpdateInfo | null;
  error: string | null;
}

export function useAutoUpdate() {
  const [state, setState] = useState<UpdateState>({
    checking: false,
    available: false,
    downloading: false,
    progress: 0,
    info: null,
    error: null,
  });

  const checkForUpdate = useCallback(async () => {
    setState((s) => ({ ...s, checking: true, error: null }));
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (update) {
        setState((s) => ({
          ...s,
          checking: false,
          available: true,
          info: {
            version: update.version,
            body: update.body ?? '',
            date: update.date ?? '',
          },
        }));
        return update;
      } else {
        setState((s) => ({ ...s, checking: false, available: false }));
        return null;
      }
    } catch (err) {
      console.warn('[updater] Check failed:', err);
      setState((s) => ({
        ...s,
        checking: false,
        error: err instanceof Error ? err.message : String(err),
      }));
      return null;
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    setState((s) => ({ ...s, downloading: true, progress: 0, error: null }));
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (!update) return;

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          contentLength = event.data.contentLength ?? 0;
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          const percent = contentLength > 0 ? Math.round((downloaded / contentLength) * 100) : 0;
          setState((s) => ({ ...s, progress: percent }));
        } else if (event.event === 'Finished') {
          setState((s) => ({ ...s, progress: 100 }));
        }
      });

      // Relaunch after install
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      console.error('[updater] Download failed:', err);
      setState((s) => ({
        ...s,
        downloading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  const dismiss = useCallback(() => {
    setState((s) => ({ ...s, available: false, info: null }));
  }, []);

  // Auto-check on mount (with a small delay to not block app startup)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdate();
    }, 3000);
    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  return { ...state, checkForUpdate, downloadAndInstall, dismiss };
}
