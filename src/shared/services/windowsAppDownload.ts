export const DESKTOP_UPDATE_BASE_URL = 'https://pub-53f18eb6ccaf40f5a7c141e65e97dfb3.r2.dev/app-updates/app-lop-07';

const WINDOWS_APP_ASSET_PREFIX = 'HocHungKhoi_Lop07-Win';
const WINDOWS_APP_STABLE_ASSET_NAME = `${WINDOWS_APP_ASSET_PREFIX}.exe`;
let lastDownloadTriggerAt = 0;

function normalizeReleaseVersion(version?: string | null): string {
  const normalized = String(version || '').trim().replace(/^v/i, '');
  return normalized.replace(/[^0-9.]/g, '');
}

function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

export function getWindowsAppDownloadUrl(version?: string | null): string {
  const v = normalizeReleaseVersion(version);
  if (!v) {
    return `${DESKTOP_UPDATE_BASE_URL}/${WINDOWS_APP_STABLE_ASSET_NAME}`;
  }
  return `${DESKTOP_UPDATE_BASE_URL}/${WINDOWS_APP_ASSET_PREFIX}-${v}.exe`;
}

export async function openWindowsAppDownload(version?: string | null): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isMobileBrowser()) {
    window.alert('Hiện chỉ có app Windows cho máy tính. Bản mobile sẽ được phát triển sau.');
    return;
  }

  const now = Date.now();
  if (now - lastDownloadTriggerAt < 1500) return;
  lastDownloadTriggerAt = now;

  const url = getWindowsAppDownloadUrl(version);
  window.location.assign(url);
}
