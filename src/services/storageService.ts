import { AppleDevice, AppSettings, DeviceImage, DeviceStatus } from '../types';
import {
  INITIAL_MOCK_DEVICES,
  SHOP_DRIVE_ROOT_FOLDER_ID,
  SHOP_DRIVE_ROOT_FOLDER_URL,
} from '../data/mockDevices';

const DEVICES_STORAGE_KEY = 'dinhphong_apple_devices_v3';
const SETTINGS_STORAGE_KEY = 'dinhphong_apple_settings_v4';

export const USER_GAS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbyv0wCg_DYePOZ5fhYu7zehoL7kcXMLjZkH91q8sK9v-p1ZHwjDl6l-srOkokXjwaDL_w/exec';

export const DEFAULT_SETTINGS: AppSettings = {
  gasWebAppUrl: USER_GAS_WEB_APP_URL,
  driveRootFolderId: SHOP_DRIVE_ROOT_FOLDER_ID,
  geminiApiKey: '',
  organizeByCategory: false,
  showImportPrice: true,
  shopName: 'Đình Phong Apple',
};

/**
 * Gọi Google Apps Script thông qua Node.js / Vercel Serverless Proxy (/api/gas-proxy) để tránh lỗi CORS
 */
async function callGoogleAppsScript(
  gasUrl: string,
  method: 'GET' | 'POST',
  payload?: Record<string, unknown>
): Promise<any> {
  const cleanUrl = (gasUrl || '').trim();
  if (!cleanUrl) {
    throw new Error('Chưa nhập URL Google Apps Script');
  }

  try {
    const proxyRes = await fetch('/api/gas-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gasUrl: cleanUrl,
        method,
        payload,
      }),
    });
    const contentType = proxyRes.headers.get('content-type') || '';
    if (proxyRes.ok && contentType.includes('application/json')) {
      return await proxyRes.json();
    }
  } catch (proxyErr) {
    console.warn('Proxy không phản hồi, thử gọi trực tiếp Apps Script:', proxyErr);
  }

  // Fallback gọi trực tiếp nếu proxy không khả dụng
  const fetchInit: RequestInit = {
    method,
    redirect: 'follow',
  };
  if (method === 'POST' && payload) {
    fetchInit.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    fetchInit.body = JSON.stringify(payload);
  }
  const res = await fetch(cleanUrl, fetchInit);
  return await res.json();
}

export function normalizeDriveFolderId(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return SHOP_DRIVE_ROOT_FOLDER_ID;
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }
  return trimmed;
}

export function getDriveFolderLink(folderIdOrUrl: string): string {
  const id = normalizeDriveFolderId(folderIdOrUrl);
  return `https://drive.google.com/drive/folders/${id}`;
}

export function loadSettings(): AppSettings {
  try {
    const raw =
      localStorage.getItem(SETTINGS_STORAGE_KEY) ||
      localStorage.getItem('dinhphong_apple_settings_v3') ||
      localStorage.getItem('dinhphong_apple_settings_v2');
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      gasWebAppUrl: (parsed.gasWebAppUrl || USER_GAS_WEB_APP_URL).trim(),
      driveRootFolderId: normalizeDriveFolderId(
        parsed.driveRootFolderId || SHOP_DRIVE_ROOT_FOLDER_ID
      ),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  const normalized: AppSettings = {
    ...settings,
    driveRootFolderId: normalizeDriveFolderId(settings.driveRootFolderId),
  };
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
}

/**
 * Tải danh sách thiết bị từ bộ nhớ đệm trình duyệt (Client-side Cache)
 */
export function loadLocalDevices(): AppleDevice[] {
  try {
    const raw =
      localStorage.getItem(DEVICES_STORAGE_KEY) ||
      localStorage.getItem('dinhphong_apple_devices_v2');
    if (!raw) {
      return INITIAL_MOCK_DEVICES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_MOCK_DEVICES;
  } catch {
    return INITIAL_MOCK_DEVICES;
  }
}

/**
 * Lưu danh sách thiết bị vào bộ nhớ đệm trình duyệt (Loại bỏ base64 nặng để tối ưu cache)
 */
export function saveLocalDevices(devices: AppleDevice[]): void {
  try {
    const slimDevices = devices.map((d) => ({
      ...d,
      images: (d.images || []).map((img) => ({
        ...img,
        base64Data: undefined,
      })),
    }));
    localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(slimDevices));
  } catch (err) {
    console.warn('Lưu cache trình duyệt vượt dung lượng:', err);
  }
}

export function formatBatterySummary(device: Partial<AppleDevice>): string {
  const parts: string[] = [];
  if (device.hasBatteryCapacity && device.batteryCapacityPercent !== undefined) {
    parts.push(`Pin ${device.batteryCapacityPercent}%`);
  }
  if (device.hasBatteryCycle && device.batteryCycleCount !== undefined) {
    parts.push(`${device.batteryCycleCount} lần sạc`);
  }
  if (parts.length > 0) return parts.join(' • ');
  return device.batteryHealth || '';
}

export function formatWarrantySummary(device: Partial<AppleDevice>): string {
  if (!device.hasWarranty) return 'Hết bảo hành';
  if (device.warrantyExpiryDate) {
    const m = device.warrantyExpiryDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      return `Còn BH đến ${m[3]}/${m[2]}/${m[1]}`;
    }
    return `Còn BH đến ${device.warrantyExpiryDate}`;
  }
  return 'Còn bảo hành';
}

/**
 * Tải danh sách máy: kết hợp bộ nhớ đệm và đồng bộ trực tiếp từ Google Sheets Cloud
 */
export async function fetchAllDevices(settings: AppSettings): Promise<{
  devices: AppleDevice[];
  fromCloud: boolean;
  sheetUrl?: string;
}> {
  const local = loadLocalDevices();

  if (!settings.gasWebAppUrl.trim()) {
    return { devices: local, fromCloud: false };
  }

  try {
    const rootId = normalizeDriveFolderId(settings.driveRootFolderId);
    const url = `${settings.gasWebAppUrl.trim()}?rootFolderId=${encodeURIComponent(rootId)}`;
    const data = await callGoogleAppsScript(url, 'GET');
    if (data && data.ok && Array.isArray(data.devices)) {
      saveLocalDevices(data.devices);
      return { devices: data.devices, fromCloud: true, sheetUrl: data.sheetUrl };
    }
    return { devices: local, fromCloud: false };
  } catch (err) {
    console.warn('Không thể tải từ Google Sheets Cloud, dùng bản cache trình duyệt:', err);
    return { devices: local, fromCloud: false };
  }
}

async function ensureImageHasBase64ForCloud(img: DeviceImage): Promise<DeviceImage> {
  if (img.base64Data) return img;
  if (img.url && img.url.startsWith('data:image/')) {
    return {
      ...img,
      base64Data: img.url.split(',')[1] || '',
    };
  }
  if (img.url && (img.url.startsWith('/') || img.url.startsWith('http://localhost'))) {
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = String(reader.result || '');
          resolve(result.split(',')[1] || '');
        };
        reader.readAsDataURL(blob);
      });
      return {
        ...img,
        base64Data: b64,
        mimeType: blob.type || 'image/jpeg',
      };
    } catch {
      return img;
    }
  }
  return img;
}

/**
 * Thêm hoặc cập nhật máy vào Kho hàng và đồng bộ ngay lên Google Drive & Google Sheets
 */
export async function upsertDevice(
  device: AppleDevice,
  settings: AppSettings,
  onProgress?: (msg: string) => void
): Promise<{
  device: AppleDevice;
  syncedToCloud: boolean;
  cloudError?: string;
  sheetUrl?: string;
}> {
  const cleanSerial = (device.serial || 'CHUA_CO_SERIAL').trim().toUpperCase();
  const rootId = normalizeDriveFolderId(settings.driveRootFolderId);

  let updatedDevice: AppleDevice = {
    ...device,
    serial: cleanSerial,
    batteryHealth: formatBatterySummary(device),
    driveFolderId: device.driveFolderId || rootId,
    driveFolderUrl:
      device.driveFolderUrl ||
      (rootId ? `https://drive.google.com/drive/folders/${rootId}` : SHOP_DRIVE_ROOT_FOLDER_URL),
    updatedAt: new Date().toISOString(),
  };

  let syncedToCloud = false;
  let cloudError: string | undefined;
  let sheetUrl: string | undefined;

  if (settings.gasWebAppUrl.trim()) {
    try {
      onProgress?.(
        `Đang tạo Folder [${cleanSerial}] & cập nhật Sheet dữ liệu thô trên Google Drive...`
      );
      const imagesWithBase64 = await Promise.all(
        (updatedDevice.images || []).map((img) => ensureImageHasBase64ForCloud(img))
      );

      const data = await callGoogleAppsScript(settings.gasWebAppUrl.trim(), 'POST', {
        action: 'saveDevice',
        device: {
          ...updatedDevice,
          images: imagesWithBase64,
        },
        rootFolderId: rootId,
        organizeByCategory: settings.organizeByCategory,
      });

      if (data && data.ok && data.device) {
        updatedDevice = data.device;
        syncedToCloud = true;
        sheetUrl = data.sheetUrl;
      } else {
        cloudError = data?.error || 'Không thể đồng bộ lên Google Drive/Sheets';
      }
    } catch (error) {
      cloudError = error instanceof Error ? error.message : String(error);
    }
  }

  const currentList = loadLocalDevices();
  const existingIdx = currentList.findIndex((d) => d.id === updatedDevice.id);
  let nextList: AppleDevice[];
  if (existingIdx >= 0) {
    nextList = [...currentList];
    nextList[existingIdx] = updatedDevice;
  } else {
    nextList = [updatedDevice, ...currentList];
  }

  saveLocalDevices(nextList);
  return { device: updatedDevice, syncedToCloud, cloudError, sheetUrl };
}

/**
 * Đẩy toàn bộ máy trong bộ nhớ lên Google Drive & Google Sheets
 */
export async function syncAllLocalDevicesToGoogleDrive(
  devices: AppleDevice[],
  settings: AppSettings,
  onProgress?: (msg: string) => void
): Promise<{ syncedCount: number; sheetUrl?: string; error?: string }> {
  if (!settings.gasWebAppUrl.trim()) {
    return {
      syncedCount: 0,
      error: 'Bạn chưa dán URL Google Apps Script Web App trong phần Deploy Drive!',
    };
  }

  let syncedCount = 0;
  let lastSheetUrl: string | undefined;

  const rootId = normalizeDriveFolderId(settings.driveRootFolderId);
  onProgress?.('Đang khởi tạo file Google Sheet "DinhPhong_DuLieuTho_KhoMay" trên Google Drive...');
  const initData = await callGoogleAppsScript(settings.gasWebAppUrl.trim(), 'POST', {
    action: 'initDriveAndSheet',
    rootFolderId: rootId,
  });

  if (!initData || !initData.ok) {
    return {
      syncedCount: 0,
      error: initData?.error || 'Lỗi khởi tạo Folder Drive & Sheet',
    };
  }
  lastSheetUrl = initData.sheetUrl;

  for (let i = 0; i < devices.length; i++) {
    const dev = devices[i];
    onProgress?.(
      `Đang tạo Folder Drive & tải ${dev.images?.length || 0} ảnh cho máy ${i + 1}/${
        devices.length
      }: ${dev.serial}...`
    );
    const res = await upsertDevice(dev, settings);
    if (res.syncedToCloud) {
      syncedCount++;
      if (res.sheetUrl) lastSheetUrl = res.sheetUrl;
    } else if (res.cloudError) {
      return {
        syncedCount,
        sheetUrl: lastSheetUrl,
        error: res.cloudError,
      };
    }
  }

  return { syncedCount, sheetUrl: lastSheetUrl };
}

/**
 * Xóa máy khỏi kho và đồng bộ lệnh xóa lên Google Sheet
 */
export async function removeDeviceById(
  id: string,
  settings: AppSettings
): Promise<AppleDevice[]> {
  const current = loadLocalDevices();
  const next = current.filter((d) => d.id !== id);
  saveLocalDevices(next);

  if (settings.gasWebAppUrl.trim()) {
    try {
      await callGoogleAppsScript(settings.gasWebAppUrl.trim(), 'POST', {
        action: 'deleteDevice',
        id,
        rootFolderId: normalizeDriveFolderId(settings.driveRootFolderId),
      });
    } catch (err) {
      console.warn('Lỗi xóa trên Google Sheets:', err);
    }
  }
  return next;
}

/**
 * Cập nhật nhanh trạng thái máy (Sẵn hàng, Đã cọc, Đã bán)
 */
export async function quickUpdateDeviceStatus(
  id: string,
  status: DeviceStatus,
  sellerName: string,
  delivererName: string,
  settings: AppSettings
): Promise<AppleDevice[]> {
  const current = loadLocalDevices();
  const next = current.map((d) =>
    d.id === id
      ? {
          ...d,
          status,
          sellerName: sellerName || d.sellerName,
          delivererName: delivererName || d.delivererName,
          updatedAt: new Date().toISOString(),
        }
      : d
  );
  saveLocalDevices(next);

  if (settings.gasWebAppUrl.trim()) {
    try {
      await callGoogleAppsScript(settings.gasWebAppUrl.trim(), 'POST', {
        action: 'updateStatus',
        id,
        status,
        sellerName,
        delivererName,
        rootFolderId: normalizeDriveFolderId(settings.driveRootFolderId),
      });
    } catch (err) {
      console.warn('Lỗi cập nhật trạng thái trên Google Sheets:', err);
    }
  }
  return next;
}

/**
 * Xuất dữ liệu kho máy ra file CSV dữ liệu thô (UTF-8 BOM hỗ trợ Excel tiếng Việt)
 * Hoạt động 100% Client-side ngay trên điện thoại và máy tính, không cần lưu ổ đĩa cục bộ.
 */
export function exportDevicesToCsv(devices: AppleDevice[]): void {
  const headers = [
    'ID',
    'Mã Serial',
    'Tên Máy',
    'Nhóm Thiết Bị',
    'Dòng Máy',
    'Chip',
    'RAM',
    'Ổ Đĩa',
    'Màn Hình',
    'Màu Sắc',
    'Dung Lượng Pin (%)',
    'Số Lần Sạc (Chu Kỳ)',
    'Còn Bảo Hành',
    'Ngày Hết Hạn BH',
    'Tình Trạng Ngoại Hình',
    'Giá Vốn (VNĐ)',
    'Giá Bán (VNĐ)',
    'Lợi Nhuận Dự Kiến (VNĐ)',
    'Người Lấy',
    'Người Kiếm',
    'Người Bán',
    'Người Giao',
    'Trạng Thái',
    'Số Lượng Ảnh',
    'Link Thư Mục Drive',
    'Ngày Tạo',
    'Cập Nhật Lúc',
  ];

  const escapeCell = (val: unknown) => {
    const str = val === null || val === undefined ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = devices.map((d) => {
    const importPrice = Number(d.importPrice) || 0;
    const salePrice = Number(d.salePrice) || 0;
    const profit = salePrice - importPrice;
    const images = Array.isArray(d.images) ? d.images : [];
    return [
      d.id,
      d.serial,
      d.title,
      d.deviceType,
      d.productLine,
      d.chip,
      d.ram,
      d.storage,
      d.screenSize,
      d.color,
      d.hasBatteryCapacity ? d.batteryCapacityPercent ?? '' : '',
      d.hasBatteryCycle ? d.batteryCycleCount ?? '' : '',
      d.hasWarranty ? 'Có' : 'Không',
      d.hasWarranty ? d.warrantyExpiryDate || '' : '',
      d.conditionNote,
      importPrice,
      salePrice,
      profit,
      d.receiverName,
      d.sourcerName,
      d.sellerName,
      d.delivererName,
      d.status === 'available' ? 'Sẵn hàng' : d.status === 'deposited' ? 'Đã cọc' : 'Đã bán',
      images.length,
      d.driveFolderUrl || '',
      d.createdAt,
      d.updatedAt,
    ].map(escapeCell).join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DinhPhong_DuLieuTho_KhoMay_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
