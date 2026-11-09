import { AppleDevice, DeviceImage } from '../types';
import { formatBatterySummary, formatWarrantySummary } from '../services/storageService';

// BẢN GỐC DỰ PHÒNG (TRƯỚC KHI TỐI ƯU CHO IOS 18 / 17 PRO MAX)
async function imageToFile(img: DeviceImage, serial: string, index: number): Promise<File | null> {
  try {
    const response = await fetch(img.url, { mode: 'cors' });
    const blob = await response.blob();
    const ext = blob.type.includes('png') ? 'png' : 'jpg';
    const safeSerial = (serial || 'APPLE').replace(/[^A-Z0-9_-]/gi, '');
    const fileName = `${safeSerial}_${index + 1}.${ext}`;
    return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
  } catch (err) {
    console.warn('Không thể fetch blob ảnh:', img.url, err);
    return null;
  }
}

export async function downloadAllDeviceImages(
  device: AppleDevice,
  onProgress?: (msg: string) => void
): Promise<{ method: 'share' | 'download'; count: number }> {
  if (!device.images || device.images.length === 0) {
    throw new Error('Máy này chưa có hình ảnh nào để tải.');
  }

  onProgress?.(`Đang chuẩn bị ${device.images.length} ảnh của máy ${device.serial}...`);

  const files: File[] = [];
  for (let i = 0; i < device.images.length; i++) {
    const file = await imageToFile(device.images[i], device.serial, i);
    if (file) files.push(file);
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (
    isMobile &&
    files.length > 0 &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files })
  ) {
    try {
      await navigator.share({
        files,
        title: `${device.serial} - ${device.title}`,
        text: `${device.title} (${device.serial})`,
      });
      return { method: 'share', count: files.length };
    } catch (shareErr) {
      if ((shareErr as Error)?.name === 'AbortError') {
        return { method: 'share', count: 0 };
      }
    }
  }

  for (let i = 0; i < device.images.length; i++) {
    const img = device.images[i];
    const safeSerial = (device.serial || 'APPLE').replace(/[^A-Z0-9_-]/gi, '');
    const link = document.createElement('a');

    if (files[i]) {
      const objectUrl = URL.createObjectURL(files[i]);
      link.href = objectUrl;
      link.download = files[i].name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    } else {
      link.href = img.downloadUrl || img.url;
      link.download = `${safeSerial}_${i + 1}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  return { method: 'download', count: device.images.length };
}

export function formatCurrencyVND(amount: number): string {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildDeviceShareText(device: AppleDevice): string {
  const batteryText = formatBatterySummary(device);
  const warrantyText = formatWarrantySummary(device);
  const lines = [
    `🍎 ${device.title.toUpperCase()}`,
    `• Mã Serial: ${device.serial}`,
    device.deviceType === 'Khác'
      ? `• Phụ kiện: ${device.title}`
      : device.deviceType === 'iPad' || !device.ram || device.ram === 'N/A'
      ? `• Cấu hình: Chip ${device.chip} | Dung lượng ${device.storage} | Màn ${device.screenSize}`
      : `• Cấu hình: Chip ${device.chip} | RAM ${device.ram} | SSD ${device.storage} | Màn ${device.screenSize}`,
    `• Màu sắc: ${device.color}${batteryText ? ` | ${batteryText}` : ''}`,
    `• Bảo hành: ${warrantyText}`,
    `• Ngoại hình: ${device.conditionNote || 'Máy đẹp nguyên zin'}`,
    `💰 Giá bán: ${formatCurrencyVND(device.salePrice)}`,
  ];
  return lines.join('\n');
}
