import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, MonitorDown, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

import {
  checkAppUpdate,
  getAppUpdateDownloadUrl,
  getCurrentAppVersion,
  type AppUpdateCheckResult,
} from '../services/appUpdate';
import { openWindowsAppDownload } from '../services/windowsAppDownload';
import {
  checkForDesktopUpdate,
  installDesktopUpdate,
  listenDesktopUpdateStatus,
  isDesktopApp,
  type UpdateStatus,
} from '../services/desktopElectronUpdate';

type Tone = 'ok' | 'warn' | 'muted';

interface CombinedUpdateStatus {
  isDesktop: boolean;
  appState?: AppUpdateCheckResult | null;
  electronState?: UpdateStatus | null;
  checking?: boolean;
  downloading?: boolean;
}

function getStateLabel(status: CombinedUpdateStatus): string {
  const { isDesktop, electronState, appState } = status;
  
  if (isDesktop && electronState) {
    if (electronState.state === 'checking') return 'Đang kiểm tra...';
    if (electronState.state === 'downloading') return `Đang tải ${electronState.progress?.toFixed(0) || 0}%`;
    if (electronState.state === 'downloaded') return 'Sẵn sàng cập nhật';
    if (electronState.state === 'update-available') return 'Có bản mới';
    if (electronState.state === 'up-to-date') return 'Đang mới nhất';
    if (electronState.state === 'error') return `Lỗi: ${electronState.error}`;
  }

  if (!appState) return 'Chưa kiểm tra';
  if (appState.state === 'up-to-date') return 'Đang mới nhất';
  if (appState.state === 'update-available') return 'Có bản mới';
  if (appState.state === 'update-required') return 'Bắt buộc cập nhật';
  if (appState.state === 'feed-unavailable') return 'Chưa có kênh cập nhật';
  return 'Lỗi kiểm tra';
}

function getTone(status: CombinedUpdateStatus): Tone {
  const { isDesktop, electronState, appState } = status;
  
  if (isDesktop && electronState) {
    if (electronState.state === 'up-to-date') return 'ok';
    if (electronState.state === 'downloading' || electronState.state === 'update-available' || electronState.state === 'downloaded') return 'warn';
    if (electronState.state === 'error') return 'muted';
    return 'muted';
  }

  if (!appState) return 'muted';
  if (appState.state === 'up-to-date') return 'ok';
  if (appState.state === 'update-available' || appState.state === 'update-required') return 'warn';
  return 'muted';
}

export function DesktopAppUpdatePanel() {
  const [combined, setCombined] = useState<CombinedUpdateStatus>({
    isDesktop: isDesktopApp(),
    appState: null,
    electronState: null,
    checking: false,
    downloading: false,
  });

  const currentVersion = getCurrentAppVersion();

  // Setup electron-updater listener
  useEffect(() => {
    if (!combined.isDesktop) return;

    const unsubscribe = listenDesktopUpdateStatus((status: UpdateStatus) => {
      setCombined(prev => ({
        ...prev,
        electronState: status,
        checking: status.state === 'checking',
        downloading: status.state === 'downloading',
      }));
    });

    return () => {
      unsubscribe?.();
    };
  }, [combined.isDesktop]);

  const runCheck = useCallback(async () => {
    if (combined.isDesktop) {
      // Use electron-updater
      setCombined(prev => ({ ...prev, checking: true }));
      await checkForDesktopUpdate();
    } else {
      // Use web API
      setCombined(prev => ({ ...prev, checking: true }));
      try {
        const next = await checkAppUpdate();
        setCombined(prev => ({ ...prev, appState: next, checking: false }));
      } finally {
        setCombined(prev => ({ ...prev, checking: false }));
      }
    }
  }, [combined.isDesktop]);

  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  useEffect(() => {
    const handleOpen = () => {
      document.getElementById('desktop-app-update')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      void runCheck();
    };

    window.addEventListener('lop7:open-desktop-update', handleOpen);
    return () => window.removeEventListener('lop7:open-desktop-update', handleOpen);
  }, [runCheck]);

  const tone = getTone(combined);
  const isUpdateAvailable =
    (combined.isDesktop && combined.electronState?.state === 'update-available') ||
    (combined.appState?.state === 'update-available' || combined.appState?.state === 'update-required');
  const isDownloaded = combined.isDesktop && combined.electronState?.state === 'downloaded';
  const isDownloading = combined.isDesktop && combined.electronState?.state === 'downloading';
  
  const downloadUrl = useMemo(() => getAppUpdateDownloadUrl(combined.appState || null), [combined.appState]);
  const message = combined.isDesktop ? combined.electronState?.message : combined.appState?.message;

  const toneClass = tone === 'ok'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : tone === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-slate-200 bg-slate-50 text-slate-700';

  const handleCheckClick = async () => {
    await runCheck();
  };

  const handleInstallClick = async () => {
    if (combined.isDesktop && isDownloaded) {
      await installDesktopUpdate();
    } else if (combined.isDesktop && isUpdateAvailable) {
      // In desktop app with update found, initiate download via checkForUpdates
      // The download happens automatically and we listen to download-progress
    } else {
      // Web version: open browser download
      const latestVersion = combined.appState?.latestVersion || combined.appState?.manifest?.latestVersion || undefined;
      await openWindowsAppDownload(latestVersion);
    }
  };

  return (
    <section id="desktop-app-update" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="app-card overflow-hidden rounded-[1.75rem] border shadow-sm">
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_330px] lg:p-5">
          <div className="flex gap-4">
            <div className="app-soft flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-blue-700">
              <MonitorDown className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">Desktop app</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Tải app Lớp 7 & cập nhật phiên bản mới</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                {combined.isDesktop
                  ? 'App sẽ tự kiểm tra kênh cập nhật khi mở khu này. Có bản mới thì bấm cập nhật ngay—app tự tải và cài đè, không cần tải file thủ công.'
                  : 'Dùng bản desktop Windows để học ổn định hơn. App sẽ tự kiểm tra kênh cập nhật khi mở khu này, thấy bản mới thì bấm cập nhật ngay.'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className="app-chip rounded-full border px-3 py-1.5">Bản hiện tại: {currentVersion}</span>
                {(combined.electronState?.version || combined.appState?.latestVersion) ? (
                  <span className="app-chip rounded-full border px-3 py-1.5">
                    Bản mới nhất: {combined.electronState?.version || combined.appState?.latestVersion}
                  </span>
                ) : null}
                <span className={`rounded-full border px-3 py-1.5 ${toneClass}`}>
                  {getStateLabel(combined)}
                </span>
              </div>

              {message ? (
                <div className={`mt-3 inline-flex max-w-2xl items-start gap-2 rounded-2xl border px-3 py-2 text-xs font-bold ${toneClass}`}>
                  {tone === 'ok' || tone === 'warn' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{message}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid content-center gap-2 rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
            <button
              type="button"
              onClick={handleCheckClick}
              disabled={combined.checking || isDownloading}
              className="app-secondary inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${combined.checking ? 'animate-spin' : ''}`} />
              {combined.checking ? 'Đang kiểm tra...' : 'Kiểm tra cập nhật'}
            </button>

            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isDownloading}
              className="app-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-md transition hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" />
              {isDownloaded && combined.isDesktop
                ? 'Khởi động lại để cập nhật'
                : isDownloading
                  ? 'Đang tải...'
                  : isUpdateAvailable
                    ? 'Cập nhật ngay'
                    : 'Tải app desktop'}
            </button>

            {!combined.isDesktop ? (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                Mở link tải trực tiếp
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}

            <p className="text-[11px] font-semibold leading-5 text-slate-600">
              {combined.isDesktop
                ? 'Khi có bản mới, app sẽ tự tải và cài đè bản cũ. Không cần tải file thủ công.'
                : 'Nếu chưa có file cài đặt trên R2, nút tải sẽ sẵn sàng nhưng cần upload installer vào đúng thư mục cập nhật Lớp 7.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

