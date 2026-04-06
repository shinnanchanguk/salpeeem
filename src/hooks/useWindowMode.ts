import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';

export type WindowMode = 'full' | 'side' | 'bar';

const FULL_WIDTH = 1280;
const FULL_HEIGHT = 800;
const SIDE_WIDTH = 400;
const BAR_WIDTH = 600;
const BAR_HEIGHT = 80;

function isTauriEnv(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function getTauriWindow() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  return getCurrentWindow();
}

async function getMonitorSize(): Promise<{ width: number; height: number }> {
  try {
    const { currentMonitor } = await import('@tauri-apps/api/window');
    const monitor = await currentMonitor();
    if (monitor) {
      return { width: monitor.size.width, height: monitor.size.height };
    }
  } catch {
    // fallback
  }
  return { width: 1920, height: 1080 };
}

async function applyFullMode() {
  const appWindow = await getTauriWindow();
  const { LogicalSize } = await import('@tauri-apps/api/dpi');
  await appWindow.setAlwaysOnTop(false);
  await appWindow.setResizable(true);
  await appWindow.setDecorations(true);
  await appWindow.setMinSize(new LogicalSize(900, 600));
  await appWindow.setSize(new LogicalSize(FULL_WIDTH, FULL_HEIGHT));
  await appWindow.center();
}

async function applySideMode() {
  const appWindow = await getTauriWindow();
  const { LogicalSize, LogicalPosition } = await import('@tauri-apps/api/dpi');
  const monitor = await getMonitorSize();
  const scaleFactor = await appWindow.scaleFactor();
  const screenWidth = monitor.width / scaleFactor;
  const screenHeight = monitor.height / scaleFactor;

  await appWindow.setDecorations(false);
  await appWindow.setResizable(false);
  await appWindow.setMinSize(null);
  await appWindow.setSize(new LogicalSize(SIDE_WIDTH, screenHeight));
  await appWindow.setPosition(new LogicalPosition(screenWidth - SIDE_WIDTH, 0));
  await appWindow.setAlwaysOnTop(true);
  await appWindow.setFocus();
}

async function applyBarMode() {
  const appWindow = await getTauriWindow();
  const { LogicalSize, LogicalPosition } = await import('@tauri-apps/api/dpi');
  const monitor = await getMonitorSize();
  const scaleFactor = await appWindow.scaleFactor();
  const screenWidth = monitor.width / scaleFactor;
  const screenHeight = monitor.height / scaleFactor;

  await appWindow.setDecorations(false);
  await appWindow.setResizable(false);
  await appWindow.setMinSize(null);
  await appWindow.setSize(new LogicalSize(BAR_WIDTH, BAR_HEIGHT));
  await appWindow.setPosition(
    new LogicalPosition(
      (screenWidth - BAR_WIDTH) / 2,
      screenHeight - BAR_HEIGHT - 40,
    ),
  );
  await appWindow.setAlwaysOnTop(true);
  await appWindow.setFocus();
}

const modeAppliers: Record<WindowMode, () => Promise<void>> = {
  full: applyFullMode,
  side: applySideMode,
  bar: applyBarMode,
};

export function useWindowMode() {
  const [currentMode, setCurrentMode] = useState<WindowMode>('full');
  const shortcutCleanupRef = useRef<(() => void) | null>(null);

  const settings = useSettingsStore((s) => s.settings);

  const setMode = useCallback(async (mode: WindowMode) => {
    if (!isTauriEnv()) {
      setCurrentMode(mode);
      return;
    }
    try {
      await modeAppliers[mode]();
      setCurrentMode(mode);
    } catch (err) {
      console.error(`Failed to switch to ${mode} mode:`, err);
    }
  }, []);

  const cycleMode = useCallback(() => {
    setCurrentMode((prev) => {
      const next: WindowMode =
        prev === 'full' ? 'side' : prev === 'side' ? 'bar' : 'full';
      // Fire async mode switch without blocking
      if (isTauriEnv()) {
        modeAppliers[next]().catch((err) =>
          console.error(`Failed to cycle to ${next} mode:`, err),
        );
      }
      return next;
    });
  }, []);

  // Register global shortcuts
  useEffect(() => {
    if (!isTauriEnv()) return;

    let cancelled = false;

    async function registerShortcuts() {
      try {
        const { register, unregisterAll } = await import(
          '@tauri-apps/plugin-global-shortcut'
        );

        if (cancelled) return;

        // Clean up any previously registered shortcuts
        await unregisterAll();

        const shortcutMap: Array<{ key: string; mode: WindowMode }> = [
          { key: settings.shortcut_full, mode: 'full' },
          { key: settings.shortcut_side, mode: 'side' },
          { key: settings.shortcut_bar, mode: 'bar' },
        ];

        for (const { key, mode } of shortcutMap) {
          if (!key) continue;
          try {
            await register(key, (event) => {
              if (event.state === 'Pressed') {
                modeAppliers[mode]()
                  .then(() => setCurrentMode(mode))
                  .catch((err) =>
                    console.error(`Shortcut ${key} failed:`, err),
                  );
              }
            });
          } catch (err) {
            console.error(`Failed to register shortcut "${key}":`, err);
          }
        }

        // Register focus shortcut (brings window to front in current mode)
        if (settings.shortcut_focus) {
          try {
            await register(settings.shortcut_focus, async (event) => {
              if (event.state === 'Pressed') {
                try {
                  const appWindow = await getTauriWindow();
                  await appWindow.setFocus();
                } catch (err) {
                  console.error('Focus shortcut failed:', err);
                }
              }
            });
          } catch (err) {
            console.error(
              `Failed to register focus shortcut "${settings.shortcut_focus}":`,
              err,
            );
          }
        }

        shortcutCleanupRef.current = () => {
          unregisterAll().catch((err) =>
            console.error('Failed to unregister shortcuts:', err),
          );
        };
      } catch (err) {
        console.error('Failed to initialize global shortcuts:', err);
      }
    }

    registerShortcuts();

    return () => {
      cancelled = true;
      if (shortcutCleanupRef.current) {
        shortcutCleanupRef.current();
        shortcutCleanupRef.current = null;
      }
    };
  }, [
    settings.shortcut_full,
    settings.shortcut_side,
    settings.shortcut_bar,
    settings.shortcut_focus,
  ]);

  return { currentMode, setMode, cycleMode };
}
