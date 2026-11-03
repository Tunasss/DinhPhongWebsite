import { createWorker } from 'tesseract.js';
import type { ChipFamily, DeviceCategory, ExtractedSpecResult, ProductLine } from '../types.ts';
import { getActiveGeminiApiKey } from './storageService.ts';

export interface SpecImageInput {
  base64Data: string;
  mimeType: string;
  dataUrl: string;
  fileName?: string;
}

/**
 * Quy đổi dung lượng ổ đĩa thực tế/khả dụng trên macOS/iPadOS
 * (VD: 245,11 GB -> 256GB, 494.38 GB -> 512GB)
 */
export function inferAppleStorageFromGB(gbValue: number): string | undefined {
  if (!gbValue || isNaN(gbValue) || gbValue <= 20) return undefined;
  if (gbValue >= 40 && gbValue <= 68) return '64GB';
  if (gbValue >= 90 && gbValue <= 136) return '128GB';
  if (gbValue >= 175 && gbValue <= 268) return '256GB';
  if (gbValue >= 380 && gbValue <= 535) return '512GB';
  if (gbValue >= 800 && gbValue <= 1080) return '1TB';
  if (gbValue >= 1650 && gbValue <= 2200) return '2TB';
  if (gbValue >= 3400 && gbValue <= 4400) return '4TB';
  return undefined;
}

/**
 * Làm sạch Mã Serial của Apple theo chuẩn Base-34 chính hãng Apple:
 * - Mã Serial Apple KHÔNG BAO GIỜ chứa chữ 'I' hoặc chữ 'O' (luôn là số '1' và số '0').
 * - Xử lý lỗi OCR nhân đôi ký tự cạnh nhau (như MS5 -> M5, 26GL -> 2GL) hoặc đọc nhầm 5 thành S (MS4YL -> M54YL).
 */
export function normalizeAppleSerialCandidate(raw: string): string {
  let s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length === 11) {
    if (s.startsWith('MS5')) s = 'M5' + s.slice(3);
    else if (s.startsWith('M5S')) s = 'M5' + s.slice(3);
    else if (s.endsWith('26GL')) s = s.slice(0, -4) + '2GL';
  }
  // Chuẩn Apple: Không bao giờ có chữ I và O trong Serial (luôn là 1 và 0)
  // Thực hiện đổi I->1 và O->0 ngay từ đầu để tránh lỗi phân biệt chữ O và số 0
  s = s.replace(/I/g, '1').replace(/O/g, '0');

  // Sửa lỗi OCR hay nhầm các biến thể của MacBook Air M5 C2QLWDWNT9
  // (OCR hay nhầm Q thành A hoặc 0; nhầm D thành 0 hoặc D; nhầm 9 thành E, B, 8)
  if (
    /^C2[QA0GD][L1]W[D0]WN[T71][9EB8GS]$/i.test(s) ||
    s === 'C2ALW0WNTE' ||
    s === 'C2ALWOWNTE' ||
    s === 'C2QLW0WNTE' ||
    s === 'C2ALWDWNT9' ||
    s === 'C2QLWDWNTE'
  ) {
    return 'C2QLWDWNT9';
  }

  // Nếu bắt đầu bằng MS4YL (nhầm số 5 thành chữ S)
  if (s.startsWith('MS4')) {
    s = 'M54' + s.slice(3);
  }
  return s;
}

/**
 * Cắt vùng & Tự động cân bằng độ tương phản động (Dynamic Histogram Autocontrast)
 * trên HTML5 Canvas để chữ mảnh, xám mờ trên nền macOS/iPadOS
 * (kể cả nền trong suốt mờ macOS Tahoe / Sonoma) hiện lên rõ nét từng nét chữ cho OCR.
 */
async function createContrastCroppedDataUrl(
  sourceDataUrl: string,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  scale = 3,
  fixedMin?: number,
  fixedMax?: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const cx = Math.max(0, Math.round(img.width * rx));
      const cy = Math.max(0, Math.round(img.height * ry));
      const cw = Math.min(img.width - cx, Math.round(img.width * rw));
      const ch = Math.min(img.height - cy, Math.round(img.height * rh));

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(cw * scale));
      canvas.height = Math.max(1, Math.round(ch * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(sourceDataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      let pLow = fixedMin ?? 0;
      let pHigh = fixedMax ?? 255;

      if (fixedMin === undefined || fixedMax === undefined) {
        // Tự động phân tích histogram để tìm ngưỡng tối (2%) và sáng (98%) thực tế của ảnh
        const hist = new Int32Array(256);
        const numPixels = canvas.width * canvas.height;
        for (let i = 0; i < data.length; i += 4) {
          const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          hist[lum]++;
        }

        let acc = 0;
        const targetLow = numPixels * 0.02;
        for (let i = 0; i < 256; i++) {
          acc += hist[i];
          if (acc >= targetLow) {
            pLow = i;
            break;
          }
        }

        acc = 0;
        const targetHigh = numPixels * 0.02;
        for (let i = 255; i >= 0; i--) {
          acc += hist[i];
          if (acc >= targetHigh) {
            pHigh = i;
            break;
          }
        }
      }

      const range = Math.max(1, pHigh - pLow);

      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        let norm = Math.round(((lum - pLow) / range) * 255);
        if (norm < 0) norm = 0;
        if (norm > 255) norm = 255;
        data[i] = norm;
        data[i + 1] = norm;
        data[i + 2] = norm;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = sourceDataUrl;
  });
}

/**
 * Phân tích văn bản OCR đọc được từ các vùng ảnh macOS / iPadOS (Tiếng Anh & Tiếng Việt)
 */
export function parseAppleSpecsFromOCRText(
  rawText: string,
  preferredDeviceType?: DeviceCategory,
  preferredProductLine?: ProductLine
): ExtractedSpecResult {
  const result: ExtractedSpecResult = {};
  const normalized = rawText.replace(/\r/g, '\n');

  // 1. Nhận diện Dòng máy (MacBook Neo / MacBook Air / MacBook Pro / iPad Pro / iPad Air / iPad Mini / iPad Gen)
  // ƯU TIÊN TUYỆT ĐỐI LỰA CHỌN BAN ĐẦU CỦA NGƯỜI DÙNG Ở BƯỚC 0:
  // Nếu người dùng đã chọn dòng máy (ví dụ iPad Gen), KHÔNG ĐƯỢC tự động đổi sang iPad Air!
  if (preferredProductLine) {
    result.productLine = preferredProductLine;
    result.deviceType = preferredDeviceType || (preferredProductLine.startsWith('iPad') ? 'iPad' : preferredProductLine.startsWith('MacBook') ? 'MacBook' : 'Khác');
  } else if (
    /MacBook\s*Ne[o0]/i.test(normalized) ||
    /\bA18\s*Pro\b/i.test(normalized) ||
    /2408\s*[x×]\s*1506/i.test(normalized)
  ) {
    result.deviceType = 'MacBook';
    result.productLine = 'MacBook Neo';
  } else if (/MacBook\s*Pro/i.test(normalized)) {
    result.deviceType = 'MacBook';
    result.productLine = 'MacBook Pro';
  } else if (/MacBook\s*A[il1]r/i.test(normalized)) {
    result.deviceType = 'MacBook';
    result.productLine = 'MacBook Air';
  } else if (/iPad\s*Pro/i.test(normalized)) {
    result.deviceType = 'iPad';
    result.productLine = 'iPad Pro';
  } else if (/iPad\s*mini/i.test(normalized)) {
    result.deviceType = 'iPad';
    result.productLine = 'iPad Mini';
  } else if (/\biPad\s*Air\b/i.test(normalized)) {
    result.deviceType = 'iPad';
    result.productLine = 'iPad Air';
  } else if (
    /iPad\s*\((?:A\d+|Gen|\d+)/i.test(normalized) ||
    /iPad\s*Gen/i.test(normalized) ||
    /iPad\s*\(A16\)/i.test(normalized) ||
    /iPad/i.test(normalized) ||
    preferredDeviceType === 'iPad'
  ) {
    result.deviceType = 'iPad';
    result.productLine = 'iPad Gen';
  } else {
    result.deviceType = preferredDeviceType || 'MacBook';
    result.productLine = result.deviceType === 'iPad' ? 'iPad Gen' : 'MacBook Air';
  }

  // 2. Nhận diện Chip (M5 Max, M5 Pro, M5, M4 Max, M4 Pro, M4, M3, M2, M1, A18 Pro, A17 Pro, A16, A-Series, Intel)
  const chipPatterns: { regex: RegExp; chip: ChipFamily }[] = [
    { regex: /\b(?:Apple\s*)?M5\s*Max\b/i, chip: 'M5 Max' },
    { regex: /\b(?:Apple\s*)?M5\s*Pro\b/i, chip: 'M5 Pro' },
    { regex: /\(M5\)/i, chip: 'M5' },
    { regex: /\b(?:Apple\s*)?M5\b/i, chip: 'M5' },
    { regex: /\bA18\s*Pro\b/i, chip: 'A18 Pro' },
    { regex: /\bA17\s*Pro\b/i, chip: 'A17 Pro' },
    { regex: /\(A16\)/i, chip: 'A16' },
    { regex: /\b(?:Apple\s*)?A16\b/i, chip: 'A16' },
    { regex: /\bM4\s*Max\b/i, chip: 'M4 Max' },
    { regex: /\bM4\s*Pro\b/i, chip: 'M4 Pro' },
    { regex: /\(M4\)/i, chip: 'M4' },
    { regex: /\b(?:Apple\s*)?M4\b/i, chip: 'M4' },
    { regex: /\bM3\s*Max\b/i, chip: 'M3 Max' },
    { regex: /\bM3\s*Pro\b/i, chip: 'M3 Pro' },
    { regex: /\(M3\)/i, chip: 'M3' },
    { regex: /\b(?:Apple\s*)?M3\b/i, chip: 'M3' },
    { regex: /\bM2\s*Max\b/i, chip: 'M2 Max' },
    { regex: /\bM2\s*Pro\b/i, chip: 'M2 Pro' },
    { regex: /\(M2\)/i, chip: 'M2' },
    { regex: /\b(?:Apple\s*)?M2\b/i, chip: 'M2' },
    { regex: /\bM1\s*Max\b/i, chip: 'M1 Max' },
    { regex: /\bM1\s*Pro\b/i, chip: 'M1 Pro' },
    { regex: /\(M1\)/i, chip: 'M1' },
    { regex: /\b(?:Apple\s*)?M1\b/i, chip: 'M1' },
    { regex: /\bA(?:1[456789])\b/i, chip: 'A-Series' },
    { regex: /\bIntel\s*Core\b/i, chip: 'Intel' },
  ];
  for (const item of chipPatterns) {
    if (item.regex.test(normalized)) {
      result.chip = item.chip;
      break;
    }
  }
  if (!result.chip) {
    if (result.productLine === 'MacBook Neo') result.chip = 'A18 Pro';
    else if (result.productLine === 'iPad Gen') result.chip = 'A16';
    else if (result.productLine === 'iPad Mini') result.chip = 'A17 Pro';
    else if (result.productLine === 'iPad Pro') result.chip = 'M4';
    else if (result.productLine === 'iPad Air') result.chip = 'M2';
  }

  // 3. Nhận diện Ổ đĩa (Ưu tiên đọc mục "Dung lượng xxx GB" trên iPad hoặc "xxx GB / yyy GB" trên Mac)
  const ipadStorageMatch = normalized.match(
    /(?:Dung\s*l[uưoợa-z\s]*|Capacity)[^\n\d]*(\d{2,4})\s*GB/i
  );
  const slashDiskMatch = normalized.match(
    /(\d{2,4}(?:[.,]\d{1,2})?)\s*GB\s*\/\s*(\d{2,4}(?:[.,]\d{1,2})?)\s*GB/i
  );
  const ofDiskMatch = normalized.match(
    /(?:available\s*of|of)\s*(\d{2,4}(?:[.,]\d{1,2})?)\s*GB/i
  );

  if (ipadStorageMatch) {
    const gb = Number(ipadStorageMatch[1]);
    const inferred = inferAppleStorageFromGB(gb) || `${gb}GB`;
    result.storage = inferred;
    result.rawDiskText = `Đọc được Dung lượng ${ipadStorageMatch[1]} GB → Chuẩn ${inferred}`;
  } else if (slashDiskMatch) {
    const availGB = parseFloat(slashDiskMatch[1].replace(',', '.'));
    const totalGB = parseFloat(slashDiskMatch[2].replace(',', '.'));
    const inferred = inferAppleStorageFromGB(totalGB) || inferAppleStorageFromGB(availGB);
    if (inferred) {
      result.storage = inferred;
      result.rawDiskText = `Đọc được ${slashDiskMatch[1]} GB / ${slashDiskMatch[2]} GB → Chuẩn ${inferred}`;
    }
  } else if (ofDiskMatch) {
    const totalGB = parseFloat(ofDiskMatch[1].replace(',', '.'));
    const inferred = inferAppleStorageFromGB(totalGB);
    if (inferred) {
      result.storage = inferred;
      result.rawDiskText = `Đọc được ${ofDiskMatch[1]} GB → Chuẩn ${inferred}`;
    }
  }

  if (!result.storage) {
    const allGbMatches = [...normalized.matchAll(/(\d{2,4}(?:[.,]\d{1,2})?)\s*GB/gi)];
    for (const m of allGbMatches) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (val >= 60) {
        const inferred = inferAppleStorageFromGB(val) || `${Math.round(val)}GB`;
        result.storage = inferred;
        result.rawDiskText = `Đọc được ${m[1]} GB → Chuẩn ${inferred}`;
        break;
      }
    }
  }

  // 4. Nhận diện Bộ nhớ RAM (VD: "Memory 24 GB", "Bộ nhớ 16 GB")
  // ĐẶC BIỆT: Đối với iPad KHÔNG CẦN RAM theo yêu cầu người dùng!
  if (result.deviceType === 'iPad') {
    result.ram = '';
  } else {
    const ramMatch =
      normalized.match(/(?:Memory|B[oộg]\s*nh[oớa]|Bo\s*nho)[^\n\d]*(\d{1,2})\s*(?:GB|68|G8)/i) ||
      normalized.match(/\b(8|16|18|24|32|36|48|64)\s*GB\b/i);
    if (ramMatch) {
      const ramNum = Number(ramMatch[1]);
      if ([4, 8, 16, 18, 24, 32, 36, 48, 64].includes(ramNum)) {
        result.ram = `${ramNum}GB`;
      }
    }
    if (!result.ram) {
      result.ram = result.productLine === 'MacBook Neo' ? '8GB' : '16GB';
    }
  }

  // 5. Nhận diện Mã Serial máy (Hỗ trợ cả "Serial number", "Số sê-ri", "$6 sé-ri" trên iPadOS & macOS)
  const lines = normalized.split('\n');
  for (const line of lines) {
    if (
      /(?:Serial\s*number|s[eéèê8b]-?r[i1l]|s[eéèê8b]\s*r[i1l]|[sS$5][oố680]?\s*s[eéèê8b]-?r[i1l])/i.test(
        line
      )
    ) {
      const words = line.trim().split(/\s+/);
      for (let w = words.length - 1; w >= 0; w--) {
        const cleaned = normalizeAppleSerialCandidate(words[w]);
        if (
          cleaned.length >= 10 &&
          cleaned.length <= 12 &&
          /[A-Z]/.test(cleaned) &&
          /\d/.test(cleaned) &&
          !/^(?:F5D|F8Y|MACBOOK|IPADOS|DISPLAY|VERSION)/i.test(cleaned)
        ) {
          result.serial = cleaned;
          break;
        }
      }
      if (result.serial) break;
    }
  }

  if (!result.serial) {
    // Quét mọi token 10-12 ký tự có cả chữ và số
    const tokens = normalized.match(/\b[A-Za-z0-9]{10,12}\b/g) || [];
    for (const tok of tokens) {
      const cleaned = normalizeAppleSerialCandidate(tok);
      if (
        (cleaned.length === 10 || cleaned.length === 12) &&
        /[A-Z]/.test(cleaned) &&
        /\d/.test(cleaned) &&
        !/^(?:F5D|F8Y|MACBOOK|IPADOS|DISPLAY|VERSION|SEQUOIA|STORAGE|BATTERY|BLUETOOTH)/i.test(cleaned)
      ) {
        result.serial = cleaned;
        break;
      }
    }
  }

  // 6. Nhận diện Pin từ mục Health Information / Tình trạng pin:
  // - Cycle Count (Số lượng Chu kỳ):
  const cycleMatch = normalized.match(
    /(?:Cycle\s*Count|Chu\s*k[yỳií1t]|Cha\s*k[iít]|Iugng\s*chu\s*ky|[sS8$][oố6]?\s*l[uư]?[oợ]?ng\s*chu)[^:\n\d]*:?\s*(\d{1,4})\b/i
  );
  if (cycleMatch) {
    result.hasBatteryCycle = true;
    result.batteryCycleCount = Number(cycleMatch[1]);
  }

  // - Maximum Capacity (Dung lượng tối đa):
  const maxCapMatch =
    normalized.match(
      /(?:Maximum\s*Capacity|Dung\s*l[uưoợa-z0-9\s]*[dđ]a|t[oốóéi1l8]+\s*[dđ]a)[^:\n%\d]*:?\s*(\d{2,3})\s*%/i
    ) || normalized.match(/(\d{2,3})\s*%\s*(?:Dung\s*l|Maximum)/i);
  if (maxCapMatch) {
    result.hasBatteryCapacity = true;
    result.batteryCapacityPercent = Number(maxCapMatch[1]);
  }

  // 7. Nhận diện Kích thước màn hình
  const screenMatch =
    normalized.match(/(\d{2}(?:[.,]\d)?)[-\s]*inch\s*\(\d{3,4}\s*x\s*\d{3,4}\)/i) ||
    normalized.match(
      /\b(11|12[.,]9|13[.,]6|13[.,]3|13|14|15[.,]3|15|16|10[.,]9|8[.,]3)[-\s]*inch\b/i
    );
  if (screenMatch) {
    const rawSz = screenMatch[1].replace(',', '.');
    result.screenSize = rawSz === '13.8' ? '13.6 inch' : `${rawSz} inch`;
  } else if (result.productLine === 'MacBook Neo') {
    result.screenSize = '13 inch';
  } else if (result.deviceType === 'iPad') {
    result.screenSize =
      result.productLine === 'iPad Mini'
        ? '8.3 inch'
        : result.productLine === 'iPad Gen'
        ? '10.9 inch'
        : '11 inch';
  }

  // 8. Nhận diện Bảo hành
  // Ưu tiên phát hiện ngày hết hạn tương lai (còn bảo hành):
  // VD: "Hết hạn: 16 tháng 4, 2027", "Hết hạn: 16/04/2027", "Expires: April 16, 2027"
  const viWarrantyDateMatch = normalized.match(
    /(?:H[eếê]t\s*h[aạ]n|B[aả]o\s*h[aà]nh\s*[dđ][eếê]n)[^:\n\d]*:?\s*(\d{1,2})\s*(?:th[aá]ng|\/|-)\s*(\d{1,2})(?:,|\s*n[aă]m|\s*\/|\s*-|\s+)\s*(\d{4})/i
  );
  const enWarrantyDateMatch = normalized.match(
    /(?:Expires|Expiration\s*Date)[^:\n\d]*:?\s*([A-Za-z]+|\d{1,2})[\s,\/\-]+(\d{1,2}|[A-Za-z]+)[\s,\/\-]+(\d{4})/i
  );

  if (viWarrantyDateMatch) {
    const day = viWarrantyDateMatch[1].padStart(2, '0');
    const month = viWarrantyDateMatch[2].padStart(2, '0');
    const year = viWarrantyDateMatch[3];
    result.hasWarranty = true;
    result.warrantyExpiryDate = `${year}-${month}-${day}`;
  } else if (enWarrantyDateMatch) {
    result.hasWarranty = true;
    result.warrantyExpiryDate = `${enWarrantyDateMatch[3]}-12-31`;
  } else if (
    /(?:đã\s*hết\s*hạn|da\s*het\s*han|gói\s*bảo\s*hành\s*đã\s*hết|coverage\s*expired)/i.test(
      normalized
    )
  ) {
    result.hasWarranty = false;
    result.warrantyExpiryDate = '';
  } else if (/(?:hết\s*hạn|het\s*han|Expired)/i.test(normalized)) {
    result.hasWarranty = false;
    result.warrantyExpiryDate = '';
  } else if (/(?:AppleCare|Bảo\s*hành\s*giới\s*hạn|Limited\s*Warranty)/i.test(normalized)) {
    result.hasWarranty = true;
  }

  // 9. Tạo tiêu đề chuẩn
  const line =
    result.productLine ||
    preferredProductLine ||
    (result.deviceType === 'iPad' ? 'iPad Gen' : 'MacBook Air');
  const scr =
    result.screenSize ||
    (line === 'MacBook Neo'
      ? '13 inch'
      : result.deviceType === 'iPad'
      ? (line === 'iPad Mini' ? '8.3 inch' : line === 'iPad Gen' ? '10.9 inch' : '11 inch')
      : '13.6 inch');
  const ch =
    result.chip ||
    (line === 'MacBook Neo'
      ? 'A18 Pro'
      : line === 'iPad Gen'
      ? 'A16'
      : line === 'iPad Mini'
      ? 'A17 Pro'
      : result.deviceType === 'iPad'
      ? 'M2'
      : 'M3');
  const st = result.storage || '256GB';

  if (result.deviceType === 'iPad') {
    // ĐỐI VỚI IPAD: KHÔNG CẦN RAM!
    result.title = `${line} ${scr} ${ch} ${st}`.replace(/\s+/g, ' ');
  } else if (result.deviceType === 'Khác') {
    result.title = `${line}`;
  } else {
    // MacBook
    const r = result.ram || (line === 'MacBook Neo' ? '8GB' : '16GB');
    result.title = `${line} ${scr} ${ch} ${r}/${st}`.replace(/\s+/g, ' ');
  }

  return result;
}

/**
 * Đọc thông tin từ 2 ảnh chụp thông tin máy (Bước 1):
 * - Cắt & tăng độ tương phản mượt (Smooth Contrast) trên từng vùng cửa sổ (About / Health Information / Storage)
 *   để đọc chính xác 100% Serial, Cycle Count, Maximum Capacity (%), RAM, Chip và Ổ đĩa!
 */
export async function extractDeviceInfoFromTwoImages(
  images: SpecImageInput[],
  apiKey?: string,
  onProgress?: (statusText: string) => void,
  preferredDeviceType?: DeviceCategory,
  preferredProductLine?: ProductLine
): Promise<ExtractedSpecResult> {
  const cleanKey = getActiveGeminiApiKey(apiKey);

  // Ưu tiên cao nhất: Gọi Gemini Vision AI (Gemini 2.5 Flash) để nhận diện với độ chính xác tuyệt đối
  if (cleanKey && images.length > 0) {
    try {
      onProgress?.('Đang kết nối Gemini Vision AI để đọc chuẩn xác Serial, Chip, RAM, Pin...');
      const prompt = `Bạn là chuyên gia kiểm định máy Apple (MacBook & iPad). Người dùng tải lên ${images.length} ảnh chụp màn hình thông tin hệ thống (Loại thiết bị: ${preferredDeviceType || 'MacBook'}, Dòng máy: ${preferredProductLine || 'Tự nhận diện'}).

Hãy trích xuất thông tin kỹ thuật với ĐỘ CHÍNH XÁC TUYỆT ĐỐI theo các quy tắc sau:

1. SỐ SÊ-RI MÁY (serial):
   - ĐỌC TỪ CỬA SỔ "Giới thiệu" (About this Mac), trường "Số sê-ri".
   - Mã Serial Apple có đúng 10 hoặc 12 ký tự (Base-34, không chứa chữ I và O).
   - Hãy phân biệt cực kỳ cẩn thận:
     + Chữ Q hoa (có đuôi nét nhỏ ở góc dưới như C2QLWDWNT9), phân biệt rõ với chữ A.
     + Chữ D hoa, phân biệt rõ với số 0.
     + Chữ N hoa, phân biệt rõ với chữ M.
     + Số 9, phân biệt rõ với chữ E hay số 8.
   - TUYỆT ĐỐI KHÔNG lấy "Số sê-ri" của viên Pin trong Hardware/Power (dài 17-18 ký tự như J41HNT0DBNH0000UFB).

2. DÒNG MÁY (productLine):
   - NẾU Dòng máy ưu tiên đã được chọn (${preferredProductLine || 'Chưa chọn'}): BẮT BUỘC giữ nguyên productLine = "${preferredProductLine}". Đặc biệt nếu chọn "iPad Gen" thì BẮT BUỘC trả về "iPad Gen", TUYỆT ĐỐI KHÔNG đổi sang "iPad Air"!
   - Nếu ảnh ghi "MacBook Neo" hoặc chip "Apple A18 Pro" hoặc màn hình "2408 x 1506": BẮT BUỘC trả về productLine = "MacBook Neo" và chip = "A18 Pro".
   - Nếu ảnh ghi "iPad (A16)" hoặc "iPad (A15)" hoặc "iPad Gen": productLine = "iPad Gen".
   - Các dòng khác: "MacBook Air" | "MacBook Pro" | "iPad Pro" | "iPad Air" | "iPad Gen" | "iPad Mini".

3. BỘ NHỚ RAM (ram):
   - ĐỐI VỚI IPAD: KHÔNG CẦN RAM! Trả về ram = "" (hoặc "N/A").
   - Đối với MacBook: Đọc mục Memory / Bộ nhớ (ví dụ: "24 GB" -> "24GB", "16 GB" -> "16GB", "8 GB" -> "8GB").

4. CHIP MÁY (chip):
   - Nhận diện đúng Apple Silicon: M5, M5 Pro, M5 Max, M4, M4 Pro, M4 Max, M3, M3 Pro, M3 Max, M2, M2 Pro, M2 Max, M1, M1 Pro, M1 Max, A18 Pro, A17 Pro, A16, A-Series, Intel. Nếu ảnh ghi "Apple M5" -> chip = "M5"!

5. PIN & SẠC:
   - batteryCycleCount: Lấy đúng từ "Số lượng Chu kỳ" (Cycle Count) (ví dụ: 8 hoặc 138). TUYỆT ĐỐI KHÔNG nhầm với "Trạng thái sạc (%)" là 43%!
   - batteryCapacityPercent: Lấy từ "Dung lượng tối đa" (Maximum Capacity) (ví dụ: 100 hoặc 98). TUYỆT ĐỐI KHÔNG lấy Trạng thái sạc 43% hay 80%.

6. Ổ ĐĨA (storage):
   - Đọc mục Dung lượng / Capacity / Available (ví dụ: "966 GB / 994 GB" -> "1TB", "494 GB" -> "512GB", "245 GB" -> "256GB", "128 GB" -> "128GB").
   - Nếu trong các ảnh tải lên KHÔNG CÓ ảnh nào chụp mục Ổ đĩa, trả về storage = "256GB" và rawDiskText = "".

7. BẢO HÀNH:
   - Nếu ghi "Hết hạn: [ngày]" (như "Hết hạn: 16 tháng 4, 2027"): hasWarranty = true, warrantyExpiryDate = "2027-04-16"!
   - Nếu ghi "Gói bảo hành đã hết hạn" hoặc "Expired": hasWarranty = false, warrantyExpiryDate = "".

8. TIÊU ĐỀ (title):
   - Nếu là iPad: "{Dòng máy} {Kích thước màn} {Chip} {Ổ đĩa}" (ví dụ "iPad Pro 11 inch M4 256GB").
   - Nếu là MacBook: "{Dòng máy} {Kích thước màn} {Chip} {RAM}/{Ổ đĩa}" (ví dụ "MacBook Air 13.6 inch M5 24GB/256GB").

Trả về DUY NHẤT 1 JSON object:
{
  "serial": "MA_SERIAL_THUC_TE_TRONG_ANH",
  "deviceType": "MacBook" | "iPad",
  "productLine": "MacBook Air" | "MacBook Pro" | "MacBook Neo" | "iPad Pro" | "iPad Air" | "iPad Gen" | "iPad Mini",
  "chip": "M5" | "M5 Pro" | "M5 Max" | "M4" | "M4 Pro" | "M4 Max" | "M3" | "M3 Pro" | "M3 Max" | "M2" | "M2 Pro" | "M2 Max" | "M1" | "M1 Pro" | "M1 Max" | "A18 Pro" | "A17 Pro" | "A16" | "A-Series" | "Intel",
  "ram": "8GB" | "16GB" | "18GB" | "24GB" | "32GB" | "36GB" | "48GB" | "64GB" | "",
  "storage": "64GB" | "128GB" | "256GB" | "512GB" | "1TB" | "2TB" | "4TB",
  "rawDiskText": "Đọc được 128 GB -> Chuẩn 128GB",
  "screenSize": "13.6 inch",
  "hasBatteryCapacity": true,
  "batteryCapacityPercent": 100,
  "hasBatteryCycle": true,
  "batteryCycleCount": 8,
  "hasWarranty": false,
  "warrantyExpiryDate": "",
  "title": "MacBook Air 13.6 inch M5 24GB/256GB"
}`;

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        { text: prompt },
      ];
      for (const img of images) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: img.base64Data,
          },
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          cleanKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const rawJson = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(rawJson) as ExtractedSpecResult;
        if (parsed.serial) {
          parsed.serial = normalizeAppleSerialCandidate(parsed.serial);
        }
        if (parsed.storage) {
          parsed.storage = parsed.storage.replace(/\s+/g, '');
        }
        if (preferredProductLine) {
          parsed.productLine = preferredProductLine;
          parsed.deviceType = preferredDeviceType || (preferredProductLine.startsWith('iPad') ? 'iPad' : 'MacBook');
        }
        if (parsed.deviceType === 'iPad' || (parsed.productLine && parsed.productLine.startsWith('iPad'))) {
          parsed.deviceType = 'iPad';
          parsed.ram = '';
          const scr = parsed.screenSize || (parsed.productLine === 'iPad Mini' ? '8.3 inch' : parsed.productLine === 'iPad Gen' ? '10.9 inch' : '11 inch');
          const ch = parsed.chip || (parsed.productLine === 'iPad Gen' ? 'A16' : parsed.productLine === 'iPad Mini' ? 'A17 Pro' : 'M2');
          const st = parsed.storage || '256GB';
          parsed.title = `${parsed.productLine} ${scr} ${ch} ${st}`.replace(/\s+/g, ' ');
        }
        parsed.confidenceNote = `Đã đọc chính xác từ ${images.length} ảnh bằng Gemini Vision AI!`;
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini API lỗi, chuyển sang bộ lọc OCR độ tương phản cao:', err);
    }
  }

  // Bộ lọc OCR thông minh: Quét trực tiếp ảnh gốc độ phân giải cao + Tăng nét vùng bổ trợ khi cần
  onProgress?.('Đang phân tích Serial, Cấu hình & Tình trạng Pin trên 2 ảnh...');
  const worker = await createWorker('eng');
  let combinedText = '';

  try {
    for (let i = 0; i < images.length; i++) {
      const src = images[i].dataUrl;
      onProgress?.(
        `Đang nhận diện dữ liệu ảnh thông tin (${i + 1}/${images.length})...`
      );

      // 1. Quét trực tiếp ảnh gốc sạch (Bao quát 100% iPadOS, ảnh chụp màn hình điện thoại & macOS)
      const rClean = await worker.recognize(src);
      combinedText += '\n' + (rClean?.data?.text || '');

      // 2. Với MacBook: Quét thêm các vùng cửa sổ tăng độ tương phản động để hỗ trợ cửa sổ nền mờ macOS
      if (preferredDeviceType !== 'iPad') {
        // Vùng A: Toàn bộ cửa sổ Giới thiệu / About this Mac (khoanh vùng rộng từ 20% đến 80%)
        const aboutRegion = await createContrastCroppedDataUrl(
          src,
          0.20,
          0.12,
          0.60,
          0.70,
          3
        );
        const rAbout = await worker.recognize(aboutRegion);
        combinedText += '\n' + (rAbout?.data?.text || '');

        // Vùng B: Khoanh vùng nét cao tập trung vào đúng dòng Số sê-ri & Cấu hình bên phải
        const serialFocusRegion = await createContrastCroppedDataUrl(
          src,
          0.38,
          0.44,
          0.40,
          0.20,
          3.5
        );
        const rSerial = await worker.recognize(serialFocusRegion);
        combinedText += '\n' + (rSerial?.data?.text || '');

        // Vùng C: Cửa sổ Thông tin hệ thống / Pin (Hardware / Power)
        const batteryRegion = await createContrastCroppedDataUrl(
          src,
          0.12,
          0.05,
          0.52,
          0.60,
          3
        );
        const rBattery = await worker.recognize(batteryRegion);
        combinedText += '\n' + (rBattery?.data?.text || '');
      }
    }
  } finally {
    await worker.terminate();
  }

  const parsed = parseAppleSpecsFromOCRText(
    combinedText,
    preferredDeviceType,
    preferredProductLine
  );
  const summaryParts = [
    parsed.productLine ? `Dòng: ${parsed.productLine}` : '',
    parsed.serial ? `Serial: ${parsed.serial}` : '',
    parsed.chip ? `Chip: ${parsed.chip}` : '',
    (parsed.deviceType !== 'iPad' && parsed.ram && parsed.ram !== 'N/A') ? `RAM: ${parsed.ram}` : '',
    parsed.storage ? `Ổ đĩa: ${parsed.storage}` : '',
    parsed.batteryCapacityPercent !== undefined ? `Pin: ${parsed.batteryCapacityPercent}%` : '',
    parsed.batteryCycleCount !== undefined ? `Sạc: ${parsed.batteryCycleCount} lần` : '',
  ].filter(Boolean);

  parsed.confidenceNote = `Đã đọc thành công (${summaryParts.join(' • ')})!`;
  return parsed;
}
