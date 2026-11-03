import { AppleDevice, AppSettings, DeviceImage, DeviceStatus } from '../types';
import {
  INITIAL_MOCK_DEVICES,
  SHOP_DRIVE_ROOT_FOLDER_ID,
  SHOP_DRIVE_ROOT_FOLDER_URL,
  SHOP_RAW_SHEET_ID,
  SHOP_RAW_SHEET_URL,
} from '../data/mockDevices';

const DEVICES_STORAGE_KEY = 'dinhphong_apple_devices_v3';
const SETTINGS_STORAGE_KEY = 'dinhphong_apple_settings_v4';

export const USER_GAS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwoHvW6gL5qrA5g2SbDC4uzXnyRZQuZuMIYOTYLRJq2xSmSvyxqrzurDYhTpjOycF8/exec';

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
export async function callGoogleAppsScript(
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
  try {
    const res = await fetch(cleanUrl, fetchInit);
    return await res.json();
  } catch (directErr) {
    // Nếu trình duyệt chặn đọc response do CORS, gửi lại qua mode: 'no-cors' để Google Apps Script vẫn nhận lệnh và ghi vào Sheet
    if (method === 'POST' && payload) {
      try {
        await fetch(cleanUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
        return { ok: true, fallbackNoCors: true };
      } catch {
        throw directErr;
      }
    }
    throw directErr;
  }
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
    let gasUrl = (parsed.gasWebAppUrl || USER_GAS_WEB_APP_URL).trim();
    // Tự động nâng cấp URL nếu còn lưu URL cũ bị lỗi 403
    if (gasUrl.includes('AKfycbyv0wCg')) {
      gasUrl = USER_GAS_WEB_APP_URL;
    }
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      gasWebAppUrl: gasUrl,
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
      localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DEVICES));
      return INITIAL_MOCK_DEVICES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DEVICES));
    return INITIAL_MOCK_DEVICES;
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
 * Bóc tách danh sách máy từ dữ liệu file Google Sheet CSV
 */
export function parseDevicesFromSheetCsv(csvText: string): AppleDevice[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    if (c === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && csvText[i + 1] === '\n') i++;
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += c;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().replace(/^"|"$/g, ''));
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] ? row[idx].trim().replace(/^"|"$/g, '') : '';
    });

    let images: any[] = [];
    try {
      if (obj.imagesJson) {
        images = JSON.parse(obj.imagesJson);
      }
    } catch {
      // ignore
    }

    const hasBattery = obj.hasBatteryCapacity === 'TRUE' || obj.hasBatteryCapacity === 'true';
    const hasCycle = obj.hasBatteryCycle === 'TRUE' || obj.hasBatteryCycle === 'true';
    const cap = obj.batteryCapacityPercent ? Number(obj.batteryCapacityPercent) : undefined;
    const cycle = obj.batteryCycleCount ? Number(obj.batteryCycleCount) : undefined;
    const batteryHealth =
      hasBattery && cap !== undefined
        ? `Pin ${cap}%${hasCycle && cycle !== undefined ? ` • ${cycle} lần sạc` : ''}`
        : '';

    return {
      id: obj.id || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      serial: obj.serial || '',
      title: obj.title || '',
      deviceType: (obj.deviceType as any) || 'MacBook',
      productLine: (obj.productLine as any) || 'MacBook Air',
      chip: obj.chip || 'M1',
      ram: obj.ram || '8GB',
      storage: obj.storage || '256GB',
      screenSize: obj.screenSize || '13 inch',
      color: obj.color || '',
      hasBatteryCapacity: hasBattery,
      batteryCapacityPercent: cap,
      hasBatteryCycle: hasCycle,
      batteryCycleCount: cycle,
      batteryHealth,
      hasWarranty: obj.hasWarranty === 'TRUE' || obj.hasWarranty === 'true',
      warrantyExpiryDate: obj.warrantyExpiryDate || '',
      conditionNote: obj.conditionNote || '',
      importPrice: Number(obj.importPrice) || 0,
      salePrice: Number(obj.salePrice) || 0,
      receiverName: obj.receiverName || '',
      sourcerName: obj.sourcerName || '',
      sellerName: obj.sellerName || 'Chưa bán',
      delivererName: obj.delivererName || 'Chưa giao',
      status: (obj.status as any) || 'available',
      driveFolderId: obj.driveFolderId || '',
      driveFolderUrl: obj.driveFolderUrl || '',
      images,
      createdAt: obj.createdAt || new Date().toISOString(),
      updatedAt: obj.updatedAt || new Date().toISOString(),
    };
  });
}

/**
 * Tải trực tiếp dữ liệu thô từ file Google Sheet chính thức của shop (Không bao giờ lỗi CORS)
 */
export async function fetchDevicesFromGoogleSheetDirect(): Promise<AppleDevice[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHOP_RAW_SHEET_ID}/gviz/tq?tqx=out:csv`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const parsed = parseDevicesFromSheetCsv(text);
    if (parsed.length > 0) {
      saveLocalDevices(parsed);
      return parsed;
    }
  } catch (err) {
    console.warn('Lỗi tải trực tiếp từ Google Sheet:', err);
  }
  return [];
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

  // 1. Thử gọi qua Google Apps Script Web App
  if (settings.gasWebAppUrl.trim()) {
    try {
      const rootId = normalizeDriveFolderId(settings.driveRootFolderId);
      const url = `${settings.gasWebAppUrl.trim()}?rootFolderId=${encodeURIComponent(rootId)}`;
      const data = await callGoogleAppsScript(url, 'GET');
      if (data && data.ok && Array.isArray(data.devices) && data.devices.length > 0) {
        saveLocalDevices(data.devices);
        return { devices: data.devices, fromCloud: true, sheetUrl: data.sheetUrl };
      }
    } catch (err) {
      console.warn('Google Apps Script proxy không phản hồi, tự động đọc trực tiếp từ Google Sheet:', err);
    }
  }

  // 2. Tự động đồng bộ trực tiếp từ Google Sheet chính thức của shop (Hoạt động 100% không lo lỗi 403)
  try {
    const directDevices = await fetchDevicesFromGoogleSheetDirect();
    if (directDevices.length > 0) {
      return {
        devices: directDevices,
        fromCloud: true,
        sheetUrl: SHOP_RAW_SHEET_URL,
      };
    }
  } catch (err) {
    console.warn('Không thể đọc Google Sheet trực tiếp:', err);
  }

  // 3. Fallback về cache trình duyệt hoặc danh sách khởi tạo
  return { devices: local, fromCloud: false, sheetUrl: SHOP_RAW_SHEET_URL };
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
