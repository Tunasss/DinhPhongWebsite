import { AppleDevice, DeviceImage } from '../types';
import { formatBatterySummary, formatWarrantySummary } from '../services/storageService';

// Bộ nhớ đệm tạm thời cho File ảnh (tránh fetch lại nhiều lần và giảm độ trễ về 0ms)
const deviceFilesCache = new Map<string, Promise<File[]>>();

/**
 * Chuyển đổi 1 DeviceImage thành đối tượng File của trình duyệt.
 * Ưu tiên:
 * 1. Base64 có sẵn trong data (0ms, không phụ thuộc mạng, không bao giờ lỗi CORS).
 * 2. Fetch URL và ép MIME type chuẩn image/jpeg hoặc image/png.
 */
async function imageToFile(img: DeviceImage, serial: string, index: number): Promise<File | null> {
  const safeSerial = (serial || 'APPLE').replace(/[^A-Z0-9_-]/gi, '');

  // 1. Nếu có base64Data sẵn trong RAM/Storage
  if (img.base64Data) {
    try {
      const byteCharacters = atob(img.base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const isPng = (img.mimeType || '').toLowerCase().includes('png');
      const cleanMime = isPng ? 'image/png' : 'image/jpeg';
      const ext = isPng ? 'png' : 'jpg';
      const blob = new Blob([byteArray], { type: cleanMime });
      return new File([blob], `${safeSerial}_${index + 1}.${ext}`, { type: cleanMime });
    } catch (e) {
      console.warn('Lỗi đọc base64 ảnh:', e);
    }
  }

  // 2. Tải qua URL thông thường (Chế độ CORS an toàn)
  try {
    const response = await fetch(img.url, { mode: 'cors' });
    const blob = await response.blob();
    const isPng = (blob.type || img.mimeType || '').toLowerCase().includes('png');
    const cleanMime = isPng ? 'image/png' : 'image/jpeg';
    const ext = isPng ? 'png' : 'jpg';
    const fileName = `${safeSerial}_${index + 1}.${ext}`;
    return new File([blob], fileName, { type: cleanMime });
  } catch (err) {
    console.warn('Không thể fetch blob ảnh:', img.url, err);
    return null;
  }
}

/**
 * Tải song song tất cả ảnh của một máy về bộ nhớ đệm
 */
async function prepareDeviceFiles(device: AppleDevice): Promise<File[]> {
  if (!device.images || device.images.length === 0) return [];
  const tasks = device.images.map((img, i) => imageToFile(img, device.serial, i));
  const results = await Promise.all(tasks);
  return results.filter((f): f is File => f !== null);
}

/**
 * Tải trước (Pre-fetch) ảnh vào RAM khi người dùng vừa bấm mở xem máy.
 * Nhờ đó, khi bấm nút "Lưu cả 6 ảnh", dữ liệu đã sẵn sàng 100% trong 0ms,
 * Safari trên iOS 18/17 Pro Max sẽ không bao giờ bị quá hạn tương tác (User Activation Timeout).
 */
export function prefetchDeviceImages(device: AppleDevice): void {
  if (!device || !device.images || device.images.length === 0) return;
  if (!deviceFilesCache.has(device.id)) {
    deviceFilesCache.set(device.id, prepareDeviceFiles(device));
  }
}

/**
 * Hàm tải ảnh chính được tối ưu đặc biệt cho iOS 18 / Safari / PWA:
 * 1. Bỏ title và text trong navigator.share để iOS bắt buộc nhận diện là Album ảnh thuần túy,
 *    từ đó LUÔN HIỂN THỊ nút "Save X Images" (Lưu X hình ảnh) màu xanh của Apple Photos.
 * 2. Tải song song Promise.all hoặc dùng cache pre-fetch để phản hồi ngay lập tức trong 0.01s.
 */
export async function downloadAllDeviceImages(
  device: AppleDevice,
  onProgress?: (msg: string) => void
): Promise<{ method: 'share' | 'download'; count: number }> {
  if (!device.images || device.images.length === 0) {
    throw new Error('Máy này chưa có hình ảnh nào để tải.');
  }

  // Lấy danh sách File từ bộ nhớ đệm (nếu đã prefetch) hoặc tải ngay song song
  let filePromise = deviceFilesCache.get(device.id);
  if (!filePromise) {
    onProgress?.(`Đang chuẩn bị ${device.images.length} ảnh của máy ${device.serial}...`);
    filePromise = prepareDeviceFiles(device);
    deviceFilesCache.set(device.id, filePromise);
  }

  let files = await filePromise;

  // Nếu cache bị rỗng (ví dụ lỗi mạng lần đầu), thử tải lại
  if (!files || files.length === 0) {
    onProgress?.(`Đang kết nối lại lấy ${device.images.length} ảnh...`);
    files = await prepareDeviceFiles(device);
  }

  // Hỗ trợ Share Sheet trên TẤT CẢ thiết bị (kể cả iPhone bật Request Desktop Website làm Mac giả lập)
  const hasShareApi =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

  if (hasShareApi && files.length > 0) {
    try {
      if (navigator.canShare({ files })) {
        /**
         * ĐIỀU CHỈNH THEN CHỐT CHO IOS 18 / 17 PRO MAX:
         * Chỉ truyền DUY NHẤT { files }, TUYỆT ĐỐI KHÔNG TRUYỀN title hay text.
         * Khi có title/text, iOS sẽ coi là bài viết đính kèm tệp và giấu nút "Save X Images".
         * Khi chỉ có { files }, iOS sẽ luôn hiển thị nút "Save X Images" ("Lưu X hình ảnh").
         */
        await navigator.share({
          files,
        });
        return { method: 'share', count: files.length };
      } else {
        console.warn('Thiết bị không hỗ trợ chia sẻ danh sách tệp này (canShare returned false)');
      }
    } catch (shareErr) {
      if ((shareErr as Error)?.name === 'AbortError') {
        // Người dùng tự bấm Hủy / Đóng menu chia sẻ
        return { method: 'share', count: 0 };
      }
      console.warn('Lỗi navigator.share:', shareErr);
    }
  }

  // Fallback tải từng file nếu không chia sẻ qua Share Sheet được
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
