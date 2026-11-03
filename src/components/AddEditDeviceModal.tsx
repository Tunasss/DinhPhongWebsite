import React, { useState } from 'react';
import {
  X,
  Upload,
  Sparkles,
  FolderPlus,
  Camera,
  Trash2,
  Loader2,
  CheckCircle2,
  User,
  DollarSign,
  Cpu,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  BatteryCharging,
  HardDrive,
  Images,
  Laptop,
  Tablet,
  Palette,
  Keyboard,
  Headphones,
} from 'lucide-react';
import {
  APPLE_COLORS,
  MACBOOK_NEO_COLORS,
  AppleDevice,
  AppSettings,
  ChipFamily,
  DeviceCategory,
  DeviceImage,
  DeviceStatus,
  ProductLine,
} from '../types';
import {
  extractDeviceInfoFromTwoImages,
  SpecImageInput,
} from '../services/geminiService';
import {
  formatBatterySummary,
  getDriveFolderLink,
  normalizeDateToYMD,
} from '../services/storageService';
import { StaffSelect } from './StaffSelect';

interface AddEditDeviceModalProps {
  isOpen: boolean;
  initialDevice: AppleDevice | null;
  settings: AppSettings;
  onClose: () => void;
  onSave: (device: AppleDevice) => Promise<void>;
  onNotify: (msg: string) => void;
}

const PRODUCT_LINES_BY_TYPE: Record<DeviceCategory, ProductLine[]> = {
  MacBook: ['MacBook Air', 'MacBook Pro', 'MacBook Neo'],
  iPad: ['iPad Pro', 'iPad Air', 'iPad Gen', 'iPad Mini'],
  Khác: [
    'Magic Keyboard',
    'Apple Pencil',
    'Magic Mouse',
    'Magic Trackpad',
    'AirPods',
    'Sạc & Cáp',
    'Phụ kiện khác',
  ],
};

const CHIP_OPTIONS: ChipFamily[] = [
  'M5',
  'M5 Pro',
  'M5 Max',
  'M4',
  'M4 Pro',
  'M4 Max',
  'M3',
  'M3 Pro',
  'M3 Max',
  'M2',
  'M2 Pro',
  'M2 Max',
  'M1',
  'M1 Pro',
  'M1 Max',
  'A18 Pro',
  'A17 Pro',
  'A16',
  'A-Series',
  'Intel',
];

const RAM_OPTIONS = ['4GB', '8GB', '16GB', '18GB', '24GB', '32GB', '36GB', '48GB', '64GB'];
const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB', '4TB'];
const SCREEN_SIZE_OPTIONS = [
  '13 inch',
  '13.6 inch',
  '14 inch',
  '15 inch',
  '15.3 inch',
  '16 inch',
  '10.9 inch',
  '11 inch',
  '12.9 inch',
  '8.3 inch',
];

/**
 * Định dạng số tiền tự động thêm dấu phẩy (,) khi nhập:
 * VD: "23500000" -> "23,500,000"
 */
function formatPriceInputWithCommas(raw: string | number | undefined): string {
  if (raw === undefined || raw === null || raw === '') return '';
  const digitsOnly = String(raw).replace(/[^0-9]/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parsePriceFromFormatted(formatted: string): number {
  const digitsOnly = String(formatted || '').replace(/[^0-9]/g, '');
  return Number(digitsOnly) || 0;
}

async function compressImageFile(
  file: File,
  maxWidth = 1500,
  quality = 0.84
): Promise<{ dataUrl: string; base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể khởi tạo Canvas nén ảnh'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64Data = dataUrl.split(',')[1] || '';
        resolve({ dataUrl, base64Data, mimeType });
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function urlToSpecImageInput(url: string, fileName: string): Promise<SpecImageInput> {
  const res = await fetch(url);
  const blob = await res.blob();
  const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
  const compressed = await compressImageFile(file, 2200, 0.96);
  return {
    base64Data: compressed.base64Data,
    mimeType: compressed.mimeType,
    dataUrl: compressed.dataUrl,
    fileName,
  };
}

export const AddEditDeviceModal: React.FC<AddEditDeviceModalProps> = ({
  isOpen,
  initialDevice,
  settings,
  onClose,
  onSave,
  onNotify,
}) => {
  const isEditing = !!initialDevice;

  // Bước 0: Chọn MacBook hay iPad trước khi tải ảnh; Bước 1: Tải 2 ảnh thông tin; Bước 2: Cấu hình, Giá & Bộ ảnh
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(isEditing ? 2 : 0);

  // Phân loại đúng 2 ảnh thông tin máy và TẤT CẢ các ảnh ngoại hình còn lại
  const [specImage1, setSpecImage1] = useState<DeviceImage | null>(() => {
    if (!initialDevice?.images) return null;
    return (
      initialDevice.images.find((img) => img.specSlot === 1) ||
      initialDevice.images.filter((img) => img.isSpecImage)[0] ||
      null
    );
  });

  const [specImage2, setSpecImage2] = useState<DeviceImage | null>(() => {
    if (!initialDevice?.images) return null;
    return (
      initialDevice.images.find((img) => img.specSlot === 2) ||
      initialDevice.images.filter((img) => img.isSpecImage)[1] ||
      null
    );
  });

  const [exteriorImages, setExteriorImages] = useState<DeviceImage[]>(() => {
    if (!initialDevice?.images) return [];
    const s1Id =
      initialDevice.images.find((img) => img.specSlot === 1)?.id ||
      initialDevice.images.filter((img) => img.isSpecImage)[0]?.id;
    const s2Id =
      initialDevice.images.find((img) => img.specSlot === 2)?.id ||
      initialDevice.images.filter((img) => img.isSpecImage)[1]?.id;
    return initialDevice.images.filter((img) => img.id !== s1Id && img.id !== s2Id);
  });

  // Thông tin cấu hình máy
  const [serial, setSerial] = useState(initialDevice?.serial || '');
  const [deviceType, setDeviceType] = useState<DeviceCategory>(
    initialDevice?.deviceType || 'MacBook'
  );
  const [productLine, setProductLine] = useState<ProductLine>(
    initialDevice?.productLine || 'MacBook Air'
  );
  const [chip, setChip] = useState<ChipFamily>(initialDevice?.chip || 'M4');
  const [ram, setRam] = useState(initialDevice?.ram || '16GB');
  const [storage, setStorage] = useState(initialDevice?.storage || '256GB');
  const [rawDiskNote, setRawDiskNote] = useState<string>('');
  const [screenSize, setScreenSize] = useState(initialDevice?.screenSize || '13.6 inch');
  const [color, setColor] = useState<string>(initialDevice?.color || APPLE_COLORS[0]);
  const [title, setTitle] = useState(initialDevice?.title || '');

  // Dung lượng Pin (%) & Lần sạc (Tickbox dạng số)
  const [hasBatteryCapacity, setHasBatteryCapacity] = useState<boolean>(
    initialDevice ? initialDevice.hasBatteryCapacity : true
  );
  const [batteryCapacityPercent, setBatteryCapacityPercent] = useState<string>(
    initialDevice?.batteryCapacityPercent !== undefined
      ? String(initialDevice.batteryCapacityPercent)
      : ''
  );

  const [hasBatteryCycle, setHasBatteryCycle] = useState<boolean>(
    initialDevice ? initialDevice.hasBatteryCycle : true
  );
  const [batteryCycleCount, setBatteryCycleCount] = useState<string>(
    initialDevice?.batteryCycleCount !== undefined
      ? String(initialDevice.batteryCycleCount)
      : ''
  );

  // Bảo hành
  const [hasWarranty, setHasWarranty] = useState<boolean>(
    initialDevice ? initialDevice.hasWarranty : false
  );
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState<string>(() =>
    normalizeDateToYMD(initialDevice?.warrantyExpiryDate)
  );

  // Ngoại hình, Giá tiền (CÓ DẤU PHẨY ,) & Nhân sự
  const [conditionNote, setConditionNote] = useState(initialDevice?.conditionNote || '');
  const [importPrice, setImportPrice] = useState<string>(() =>
    initialDevice?.importPrice ? formatPriceInputWithCommas(initialDevice.importPrice) : ''
  );
  const [salePrice, setSalePrice] = useState<string>(() =>
    initialDevice?.salePrice ? formatPriceInputWithCommas(initialDevice.salePrice) : ''
  );
  const [receiverName, setReceiverName] = useState(initialDevice?.receiverName || '');
  const [sourcerName, setSourcerName] = useState(initialDevice?.sourcerName || '');
  const [sellerName, setSellerName] = useState(initialDevice?.sellerName || 'Chưa bán');
  const [delivererName, setDelivererName] = useState(initialDevice?.delivererName || 'Chưa giao');
  const [status, setStatus] = useState<DeviceStatus>(initialDevice?.status || 'available');

  const [isScanningAI, setIsScanningAI] = useState(false);
  const [aiStatusNote, setAiStatusNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const computedTitle =
    title.trim() ||
    (deviceType === 'Khác'
      ? `${productLine}`
      : deviceType === 'iPad'
      ? `${productLine} ${screenSize} ${chip} ${storage}`.replace(/\s+/g, ' ')
      : `${productLine} ${screenSize} ${chip} ${ram}/${storage}`.replace(/\s+/g, ' '));

  const cleanSerialPreview = (serial || 'SERIAL_MAY').trim().toUpperCase();
  const driveSubfolderPreview = settings.organizeByCategory
    ? `DinhPhongData / ${productLine} / ${cleanSerialPreview} - ${computedTitle}`
    : `DinhPhongData / ${cleanSerialPreview} - ${computedTitle}`;

  const totalImagesCount =
    (specImage1 ? 1 : 0) + (specImage2 ? 1 : 0) + exteriorImages.length;

  const handleChooseCategoryAndLine = (type: DeviceCategory, line: ProductLine) => {
    setDeviceType(type);
    setProductLine(line);
    if (type === 'Khác') {
      setChip('A-Series');
      setRam('N/A');
      setStorage('N/A');
      setScreenSize('N/A');
      setColor(APPLE_COLORS[0]);
      setTitle(`${line}`);
      // Với phụ kiện, bỏ qua bước đọc ảnh màn hình thông số (Bước 1) và vào thẳng Bước 2
      setCurrentStep(2);
      return;
    }
    if (line === 'MacBook Neo') {
      setChip('A18 Pro');
      setRam('8GB');
      setScreenSize('13 inch');
      setColor(MACBOOK_NEO_COLORS[0]);
    } else if (type === 'iPad') {
      setChip(line === 'iPad Gen' ? 'A16' : line === 'iPad Mini' ? 'A17 Pro' : 'M2');
      setRam('N/A');
      setScreenSize(line === 'iPad Mini' ? '8.3 inch' : line === 'iPad Gen' ? '10.9 inch' : '11 inch');
      setColor(APPLE_COLORS[0]);
    } else {
      if (chip === 'A18 Pro') setChip('M3');
      if (MACBOOK_NEO_COLORS.includes(color as any)) setColor(APPLE_COLORS[0]);
    }
    setCurrentStep(1);
  };

  const applyExtractedSpecs = (
    extracted: Awaited<ReturnType<typeof extractDeviceInfoFromTwoImages>>
  ) => {
    if (extracted.serial) setSerial(extracted.serial.toUpperCase());

    // Nếu người dùng đã chủ động chọn MacBook Neo hoặc ảnh đọc ra MacBook Neo, giữ riêng MacBook Neo!
    const isNeo =
      productLine === 'MacBook Neo' || extracted.productLine === 'MacBook Neo';

    if (isNeo) {
      setDeviceType('MacBook');
      setProductLine('MacBook Neo');
      setChip(extracted.chip === 'A18 Pro' || !extracted.chip ? 'A18 Pro' : extracted.chip);
      setScreenSize(extracted.screenSize || '13 inch');
      if (!MACBOOK_NEO_COLORS.includes(color as any)) {
        setColor(MACBOOK_NEO_COLORS[0]);
      }
    } else {
      // ƯU TIÊN GIỮ NGUYÊN DÒNG MÁY MÀ NGƯỜI DÙNG ĐÃ CHỌN Ở BƯỚC 0:
      // Đặc biệt nếu người dùng chọn iPad Gen, giữ vững iPad Gen!
      if (productLine) {
        setProductLine(productLine);
        setDeviceType(productLine.startsWith('iPad') ? 'iPad' : productLine.startsWith('MacBook') ? 'MacBook' : 'Khác');
      } else {
        if (extracted.deviceType) setDeviceType(extracted.deviceType);
        if (extracted.productLine) setProductLine(extracted.productLine);
      }
      if (extracted.chip) setChip(extracted.chip);
      if (extracted.screenSize) setScreenSize(extracted.screenSize);
    }

    const currentDevType =
      productLine.startsWith('iPad') || extracted.deviceType === 'iPad' || deviceType === 'iPad'
        ? 'iPad'
        : deviceType;

    if (currentDevType === 'iPad') {
      setRam('N/A');
    } else if (extracted.ram) {
      setRam(extracted.ram);
    }

    if (extracted.storage) setStorage(extracted.storage);
    if (extracted.rawDiskText) setRawDiskNote(extracted.rawDiskText);
    if (extracted.title) {
      if (currentDevType === 'iPad') {
        setTitle(
          `${productLine || extracted.productLine || 'iPad Gen'} ${
            extracted.screenSize || screenSize
          } ${extracted.chip || chip} ${extracted.storage || storage}`.replace(/\s+/g, ' ')
        );
      } else if (isNeo) {
        setTitle(
          `MacBook Neo ${extracted.screenSize || '13 inch'} A18 Pro ${extracted.ram || '8GB'}/${
            extracted.storage || '256GB'
          }`
        );
      } else {
        setTitle(extracted.title);
      }
    }

    if (extracted.batteryCapacityPercent !== undefined) {
      setHasBatteryCapacity(true);
      setBatteryCapacityPercent(String(extracted.batteryCapacityPercent));
    }
    if (extracted.batteryCycleCount !== undefined) {
      setHasBatteryCycle(true);
      setBatteryCycleCount(String(extracted.batteryCycleCount));
    }
    if (extracted.hasWarranty !== undefined) {
      setHasWarranty(extracted.hasWarranty);
      if (!extracted.hasWarranty) {
        setWarrantyExpiryDate('');
      } else if (extracted.warrantyExpiryDate) {
        setWarrantyExpiryDate(normalizeDateToYMD(extracted.warrantyExpiryDate));
      }
    }
    setAiStatusNote(
      extracted.confidenceNote ||
        `Đã đọc xong 2 ảnh thông tin! Serial: ${extracted.serial || ''} • Ổ đĩa: ${
          extracted.storage || ''
        }`
    );
  };

  /**
   * Xử lý chọn ảnh ở Bước 1:
   * - Nếu người dùng chọn 2 ảnh: đưa vào Ảnh thông tin 1 và Ảnh thông tin 2.
   * - ĐẶC BIỆT: Nếu người dùng chọn NHIỀU HƠN 2 ẢNH (ví dụ chọn liền 5, 8, 10 ảnh một lúc),
   *   2 ảnh đầu sẽ làm Ảnh thông tin 1 & 2, và TẤT CẢ các ảnh từ thứ 3 trở đi được giữ lại
   *   đưa thẳng vào danh sách Ảnh ngoại hình máy (exteriorImages) -> KHÔNG BAO GIỜ BỊ MẤT ẢNH!
   */
  const handleSelectSpecSlot = async (
    slot: 1 | 2 | 'both',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    try {
      if (files.length >= 2) {
        const c1 = await compressImageFile(files[0], 2200, 0.96);
        const c2 = await compressImageFile(files[1], 2200, 0.96);
        const img1: DeviceImage = {
          id: `spec-1-${Date.now()}`,
          name: `Spec1_${files[0].name}`,
          url: c1.dataUrl,
          base64Data: c1.base64Data,
          mimeType: c1.mimeType,
          isSpecImage: true,
          specSlot: 1,
        };
        const img2: DeviceImage = {
          id: `spec-2-${Date.now() + 1}`,
          name: `Spec2_${files[1].name}`,
          url: c2.dataUrl,
          base64Data: c2.base64Data,
          mimeType: c2.mimeType,
          isSpecImage: true,
          specSlot: 2,
        };
        setSpecImage1(img1);
        setSpecImage2(img2);

        // Nếu chọn > 2 ảnh cùng lúc, lưu toàn bộ các ảnh còn lại vào Ảnh ngoại hình máy!
        if (files.length > 2) {
          const extraPhotos: DeviceImage[] = [];
          for (let i = 2; i < files.length; i++) {
            const compExtra = await compressImageFile(files[i], 1500, 0.85);
            extraPhotos.push({
              id: `ext-${Date.now()}-${i}`,
              name: files[i].name,
              url: compExtra.dataUrl,
              base64Data: compExtra.base64Data,
              mimeType: compExtra.mimeType,
              isSpecImage: false,
            });
          }
          setExteriorImages((prev) => [...prev, ...extraPhotos]);
          onNotify(
            `Đã nhận đủ ${files.length} ảnh (2 ảnh thông tin + ${extraPhotos.length} ảnh ngoại hình)!`
          );
        } else {
          onNotify('Đã tải đủ 2 ảnh thông tin máy! Đang phân tích cấu hình...');
        }

        await runExtractFromTwoImages(img1, img2);
      } else {
        const file = files[0];
        const comp = await compressImageFile(file, 2200, 0.96);
        const targetSlot: 1 | 2 = slot === 'both' ? (specImage1 ? 2 : 1) : slot;
        const newImg: DeviceImage = {
          id: `spec-${targetSlot}-${Date.now()}`,
          name: `Spec${targetSlot}_${file.name}`,
          url: comp.dataUrl,
          base64Data: comp.base64Data,
          mimeType: comp.mimeType,
          isSpecImage: true,
          specSlot: targetSlot,
        };

        const nextImg1 = targetSlot === 1 ? newImg : specImage1;
        const nextImg2 = targetSlot === 2 ? newImg : specImage2;
        if (targetSlot === 1) setSpecImage1(newImg);
        else setSpecImage2(newImg);

        if (nextImg1 && nextImg2) {
          await runExtractFromTwoImages(nextImg1, nextImg2);
        }
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi khi tải ảnh thông tin');
    } finally {
      e.target.value = '';
    }
  };

  const runExtractFromTwoImages = async (
    img1: DeviceImage | null = specImage1,
    img2: DeviceImage | null = specImage2
  ) => {
    const validList = [img1, img2].filter((x): x is DeviceImage => !!x);
    if (validList.length < 2) {
      onNotify('Vui lòng tải đủ 2 ảnh thông tin máy (Ảnh 1: Giới thiệu & Ảnh 2: Pin + Ổ đĩa)!');
      return;
    }

    try {
      setIsScanningAI(true);
      const inputs: SpecImageInput[] = [];
      for (const item of validList) {
        if (item.base64Data) {
          inputs.push({
            base64Data: item.base64Data,
            mimeType: item.mimeType || 'image/jpeg',
            dataUrl: item.url,
            fileName: item.name,
          });
        } else {
          const converted = await urlToSpecImageInput(item.url, item.name);
          inputs.push(converted);
        }
      }

      const extracted = await extractDeviceInfoFromTwoImages(
        inputs,
        settings.geminiApiKey,
        (msg) => setAiStatusNote(msg),
        deviceType,
        productLine
      );
      applyExtractedSpecs(extracted);
      const notiDetails = [
        extracted.serial ? `Serial: ${extracted.serial}` : '',
        extracted.chip ? `Chip: ${extracted.chip}` : '',
        extracted.storage ? `Ổ đĩa: ${extracted.storage}` : '',
        extracted.batteryCapacityPercent !== undefined ? `Pin: ${extracted.batteryCapacityPercent}%` : '',
        extracted.batteryCycleCount !== undefined ? `Sạc: ${extracted.batteryCycleCount} lần` : '',
      ].filter(Boolean).join(' • ');

      onNotify(`Đã nhận diện thành công: ${notiDetails || 'Hoàn tất đọc 2 ảnh'}`);
      setCurrentStep(2);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi phân tích 2 ảnh';
      setAiStatusNote(msg);
      onNotify(msg);
    } finally {
      setIsScanningAI(false);
    }
  };

  const handleExteriorPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const added: DeviceImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressed = await compressImageFile(file, 1400, 0.82);
        added.push({
          id: `ext-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          url: compressed.dataUrl,
          base64Data: compressed.base64Data,
          mimeType: compressed.mimeType,
          isSpecImage: false,
        });
      } catch (err) {
        console.warn('Bỏ qua ảnh lỗi:', file.name, err);
      }
    }

    setExteriorImages((prev) => [...prev, ...added]);
    onNotify(
      `Đã thêm ${added.length} ảnh ngoại hình! Tổng cộng máy có ${
        (specImage1 ? 1 : 0) + (specImage2 ? 1 : 0) + exteriorImages.length + added.length
      } ảnh.`
    );
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSerial = serial.trim()
      ? serial.trim().toUpperCase()
      : deviceType === 'Khác'
      ? `PK-${Date.now().toString(36).toUpperCase()}`
      : '';

    if (!effectiveSerial) {
      onNotify('Vui lòng nhập hoặc quét mã Serial của máy/thiết bị!');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const allImages: DeviceImage[] = [
        ...(specImage1 ? [specImage1] : []),
        ...(specImage2 ? [specImage2] : []),
        ...exteriorImages,
      ];

      const capNum = hasBatteryCapacity ? Number(batteryCapacityPercent) || 100 : undefined;
      const cycNum = hasBatteryCycle ? Number(batteryCycleCount) || 0 : undefined;

      const deviceToSave: AppleDevice = {
        id: initialDevice?.id || `dev-${Date.now()}`,
        serial: effectiveSerial,
        title: computedTitle,
        deviceType,
        productLine,
        chip,
        ram: deviceType === 'iPad' || productLine.startsWith('iPad') ? 'N/A' : (ram || '16GB'),
        storage,
        screenSize,
        color,
        hasBatteryCapacity,
        batteryCapacityPercent: capNum,
        hasBatteryCycle,
        batteryCycleCount: cycNum,
        batteryHealth: formatBatterySummary({
          hasBatteryCapacity,
          batteryCapacityPercent: capNum,
          hasBatteryCycle,
          batteryCycleCount: cycNum,
        }),
        hasWarranty,
        warrantyExpiryDate: hasWarranty ? normalizeDateToYMD(warrantyExpiryDate) : '',
        conditionNote: conditionNote.trim(),
        importPrice: parsePriceFromFormatted(importPrice),
        salePrice: parsePriceFromFormatted(salePrice),
        receiverName: receiverName.trim() || 'Chưa rõ',
        sourcerName: sourcerName.trim() || 'Chưa rõ',
        sellerName: sellerName.trim() || 'Chưa bán',
        delivererName: delivererName.trim() || 'Chưa giao',
        status,
        driveFolderId: initialDevice?.driveFolderId || settings.driveRootFolderId,
        driveFolderUrl:
          initialDevice?.driveFolderUrl || getDriveFolderLink(settings.driveRootFolderId),
        images: allImages,
        createdAt: initialDevice?.createdAt || now,
        updatedAt: now,
      };

      await onSave(deviceToSave);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const bothSpecImagesReady = !!specImage1 && !!specImage2;
  const parsedImportNum = parsePriceFromFormatted(importPrice);
  const parsedSaleNum = parsePriceFromFormatted(salePrice);
  const previewProfit = parsedSaleNum - parsedImportNum;

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white overflow-hidden max-h-[95vh] flex flex-col transition-colors"
      >
        {/* Header & Thanh tiến trình: Chọn MacBook/iPad -> Bước 1 -> Bước 2 */}
        <div className="px-4 sm:px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white space-y-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
                {isEditing ? (
                  `Chỉnh sửa máy (${initialDevice.serial})`
                ) : (
                  <>
                    <span>Nhập máy mới vào Kho</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/20 border border-blue-400/40 text-blue-300">
                      {deviceType === 'MacBook' ? `💻 ${productLine}` : `📱 ${productLine}`}
                    </span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Đã chọn tổng cộng <b className="text-amber-300">{totalImagesCount} ảnh</b> • Tự tạo
                Folder con &amp; ghi vào file Sheet dữ liệu thô trong <b>DinhPhongData</b>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper chuyển đổi: Phân loại MacBook/iPad/Phụ kiện -> Bước 1 -> Bước 2 */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                currentStep === 0
                  ? 'bg-blue-600/25 border-blue-400 text-white'
                  : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 ${
                  currentStep === 0 ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
                }`}
              >
                {deviceType === 'MacBook' ? (
                  <Laptop className="w-3.5 h-3.5" />
                ) : deviceType === 'iPad' ? (
                  <Tablet className="w-3.5 h-3.5" />
                ) : (
                  <Keyboard className="w-3.5 h-3.5" />
                )}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">
                  Loại: {productLine}
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  {deviceType === 'Khác' ? 'Phụ kiện & Khác' : 'MacBook & iPad'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (deviceType === 'Khác') {
                  onNotify('Phụ kiện không cần ảnh thông số hệ thống, chuyển sang Bước 2!');
                  setCurrentStep(2);
                  return;
                }
                setCurrentStep(1);
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                currentStep === 1
                  ? 'bg-blue-600/25 border-blue-400 text-white'
                  : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 ${
                  currentStep === 1
                    ? 'bg-blue-500 text-white'
                    : bothSpecImagesReady || deviceType === 'Khác'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                1
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">
                  {deviceType === 'Khác' ? 'Bước 1: Bỏ qua (Phụ kiện)' : 'Bước 1: Tải 2 ảnh thông tin'}
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  {deviceType === 'Khác' ? 'Không cần quét màn hình' : 'Đọc Serial, Pin, Chu kỳ & Ổ đĩa'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!bothSpecImagesReady && !isEditing && !serial && deviceType !== 'Khác') {
                  onNotify('Hãy tải 2 ảnh thông tin máy ở Bước 1 trước để lấy cấu hình!');
                  return;
                }
                setCurrentStep(2);
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                currentStep === 2
                  ? 'bg-blue-600/25 border-blue-400 text-white'
                  : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 ${
                  currentStep === 2 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                2
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">
                  Bước 2: Cấu hình &amp; Ảnh ({totalImagesCount})
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  Màu sắc, Bảo hành, Giá &amp; Bộ ảnh
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Nội dung theo từng bước */}
        {currentStep === 0 ? (
          /* ======================= BƯỚC MỞ ĐẦU: 3 LỰA CHỌN MACBOOK / IPAD / PHỤ KIỆN & KHÁC ======================= */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            <div className="text-center space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Chọn nhóm thiết bị trước khi tải ảnh
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Bạn đang muốn nhập máy MacBook, iPad hay Phụ kiện khác?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chọn đúng nhóm bên dưới để hệ thống áp dụng giao diện nhập liệu và thông số tối ưu nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* CỘT 1: NHÓM MACBOOK */}
              <div
                className={`rounded-2xl border-2 p-4 space-y-3.5 transition ${
                  deviceType === 'MacBook'
                    ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-md shadow-blue-500/5'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                      <Laptop className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        Nhóm MacBook
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Air • Pro • <b>Neo (Riêng)</b>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChooseCategoryAndLine('MacBook', 'MacBook Air')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition"
                  >
                    Chọn &rarr;
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Bấm chọn nhanh dòng MacBook:
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => handleChooseCategoryAndLine('MacBook', 'MacBook Air')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        productLine === 'MacBook Air'
                          ? 'bg-white dark:bg-slate-800 border-blue-500 ring-2 ring-blue-500/15'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          💻 MacBook Air
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          M1–M4 • 13.6&quot; / 15.3&quot;
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChooseCategoryAndLine('MacBook', 'MacBook Pro')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        productLine === 'MacBook Pro'
                          ? 'bg-white dark:bg-slate-800 border-blue-500 ring-2 ring-blue-500/15'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          💻 MacBook Pro
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          M1–M4 Pro/Max • 14&quot; / 16&quot;
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChooseCategoryAndLine('MacBook', 'MacBook Neo')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                        productLine === 'MacBook Neo'
                          ? 'bg-gradient-to-r from-amber-50 via-pink-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950 border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'bg-gradient-to-r from-amber-50/60 via-pink-50/60 to-indigo-50/60 dark:from-slate-800/80 dark:to-indigo-950/60 border-indigo-300 dark:border-slate-700 hover:border-indigo-500'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
                            ✨ MacBook Neo (Riêng)
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400">
                          Chip A18 Pro • 4 màu Neo
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CỘT 2: NHÓM IPAD */}
              <div
                className={`rounded-2xl border-2 p-4 space-y-3.5 transition ${
                  deviceType === 'iPad'
                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-md shadow-indigo-500/5'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-950 text-white flex items-center justify-center shadow-xs">
                      <Tablet className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        Nhóm iPad
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pro • Air • Gen • Mini
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChooseCategoryAndLine('iPad', 'iPad Pro')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition"
                  >
                    Chọn &rarr;
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Bấm chọn nhanh dòng iPad:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { line: 'iPad Pro' as ProductLine, desc: 'M1/M2/M4 • 11"/13"' },
                        { line: 'iPad Air' as ProductLine, desc: 'M1/M2 • 10.9"/11"' },
                        { line: 'iPad Gen' as ProductLine, desc: 'Gen 9/10 • A-Series' },
                        { line: 'iPad Mini' as ProductLine, desc: 'Mini 6/7 • 8.3"' },
                      ] as const
                    ).map((item) => (
                      <button
                        type="button"
                        key={item.line}
                        onClick={() => handleChooseCategoryAndLine('iPad', item.line)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          productLine === item.line
                            ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/15'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          📱 {item.line}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CỘT 3: NHÓM KHÁC & PHỤ KIỆN (MAGIC KEYBOARD, APPLE PENCIL, AIRPODS...) */}
              <div
                className={`rounded-2xl border-2 p-4 space-y-3.5 transition ${
                  deviceType === 'Khác'
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-md shadow-emerald-500/5'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-950 text-white flex items-center justify-center shadow-xs">
                      <Keyboard className="w-6 h-6 text-emerald-300" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        Khác &amp; Phụ kiện
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Keyboard • Pencil • Mouse • AirPods...
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChooseCategoryAndLine('Khác', 'Magic Keyboard')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition"
                  >
                    Chọn &rarr;
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Bấm chọn nhanh phụ kiện:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { line: 'Magic Keyboard' as ProductLine, desc: 'Bàn phím iPad/Mac', icon: '⌨️' },
                      { line: 'Apple Pencil' as ProductLine, desc: 'Bút 1/2/Pro/USB-C', icon: '✏️' },
                      { line: 'Magic Mouse' as ProductLine, desc: 'Chuột & Trackpad', icon: '🖱️' },
                      { line: 'AirPods' as ProductLine, desc: 'Tai nghe AirPods', icon: '🎧' },
                      { line: 'Sạc & Cáp' as ProductLine, desc: 'Củ sạc, Cáp zin', icon: '🔌' },
                      { line: 'Phụ kiện khác' as ProductLine, desc: 'Hub, Bao da, Ốp...', icon: '📦' },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.line}
                        onClick={() => handleChooseCategoryAndLine('Khác', item.line)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          productLine === item.line
                            ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/15'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {item.icon} {item.line}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-[11px] text-emerald-800 dark:text-emerald-300">
                    💡 Phụ kiện không cần ảnh màn hình — vào thẳng bước nhập giá, tình trạng &amp; ảnh chụp!
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : currentStep === 1 ? (
          /* ======================= BƯỚC 1: TẢI 2 ẢNH THÔNG TIN MÁY ======================= */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Thanh hiển thị loại máy đã chọn (MacBook Air/Pro/Neo hoặc iPad) và nút đổi nhanh */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Đang nhập dòng máy:</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-extrabold shadow-xs">
                  {deviceType === 'MacBook' ? `💻 ${productLine}` : `📱 ${productLine}`}
                </span>
                {productLine === 'MacBook Neo' && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold text-[11px] border border-indigo-300 dark:border-indigo-800">
                    Giữ riêng MacBook Neo (Không gộp Air/Pro)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { type: 'MacBook' as DeviceCategory, line: 'MacBook Air' as ProductLine },
                    { type: 'MacBook' as DeviceCategory, line: 'MacBook Pro' as ProductLine },
                    { type: 'MacBook' as DeviceCategory, line: 'MacBook Neo' as ProductLine },
                    { type: 'iPad' as DeviceCategory, line: 'iPad Pro' as ProductLine },
                    { type: 'iPad' as DeviceCategory, line: 'iPad Air' as ProductLine },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.line}
                    type="button"
                    onClick={() => handleChooseCategoryAndLine(preset.type, preset.line)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      productLine === preset.line
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {preset.line}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Đổi loại khác...
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 dark:from-slate-800/80 dark:via-slate-800 dark:to-indigo-950/40 border border-blue-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    <Sparkles className="w-4 h-4" />
                    Yêu cầu Bước 1 ({productLine}): Nhập 2 ảnh thông tin máy
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    • 2 ảnh đầu tiên sẽ được dùng để đọc <b>Số sê-ri máy</b>, <b>Chip</b>,{' '}
                    <b>RAM</b>, dự đoán <b>Ổ đĩa (2xx GB &rarr; 256GB)</b>, <b>% Pin</b> và{' '}
                    <b>Số lần sạc</b>.<br />• Nếu bạn chọn nhiều hơn 2 ảnh cùng lúc (VD: 6-10 ảnh),
                    tất cả các ảnh còn lại sẽ được <b>tự động giữ nguyên</b> sang phần Ảnh ngoại
                    hình ở Bước 2!
                  </p>
                </div>

                {/* Nút chọn nhanh nhiều ảnh cùng lúc */}
                <div className="flex items-center shrink-0">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer transition">
                    <Camera className="w-4 h-4" />
                    <span>Chọn 2 ảnh thông tin (hoặc chọn tất cả ảnh)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleSelectSpecSlot('both', e)}
                      className="hidden"
                      disabled={isScanningAI}
                    />
                  </label>
                </div>
              </div>

              {/* 2 Ô tải ảnh thông tin máy tách biệt rõ ràng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Ô Ảnh 1: Màn hình Giới thiệu */}
                <div
                  className={`rounded-2xl border-2 p-3.5 transition flex flex-col justify-between ${
                    specImage1
                      ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Ảnh 1: Cài đặt chung &rarr; Giới thiệu ({productLine})
                      </span>
                      {specImage1 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          Đã có Ảnh 1
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {deviceType === 'MacBook' ? (
                        <>
                          Chứa: Tên máy (<b>{productLine}</b>), Chip, Bộ nhớ RAM,{' '}
                          <b>Số sê-ri máy</b> &amp; Gói bảo hành.
                        </>
                      ) : (
                        <>
                          Chứa: Màn hình Giới thiệu iPad (<b>{productLine}</b>),{' '}
                          <b>Số sê-ri máy</b>, Dung lượng &amp; Bảo hành.
                        </>
                      )}
                    </p>

                    {specImage1 ? (
                      <div className="relative aspect-16/10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                        <img
                          src={specImage1.url}
                          alt="Ảnh thông tin 1"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setSpecImage1(null)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="aspect-16/10 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-2 cursor-pointer transition">
                        <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                          Bấm tải Ảnh 1 (Giới thiệu / Serial)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleSelectSpecSlot(1, e)}
                          className="hidden"
                          disabled={isScanningAI}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Ô Ảnh 2: Thông tin Hệ thống (Pin & Dung lượng ổ đĩa) */}
                <div
                  className={`rounded-2xl border-2 p-3.5 transition flex flex-col justify-between ${
                    specImage2
                      ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Ảnh 2: Nguồn điện (Pin) &amp; Ổ đĩa khả dụng
                      </span>
                      {specImage2 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          Đã có Ảnh 2
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chứa: <b>Số lượng Chu kỳ sạc</b>, <b>Dung lượng tối đa (%)</b>, Độ phân giải
                      màn hình &amp; <b>Khả dụng xxx GB / yyy GB</b>.
                    </p>

                    {specImage2 ? (
                      <div className="relative aspect-16/10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                        <img
                          src={specImage2.url}
                          alt="Ảnh thông tin 2"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setSpecImage2(null)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="aspect-16/10 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-2 cursor-pointer transition">
                        <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                          Bấm tải Ảnh 2 (Pin &amp; Ổ đĩa khả dụng)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleSelectSpecSlot(2, e)}
                          className="hidden"
                          disabled={isScanningAI}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {exteriorImages.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-3.5 py-2 text-xs text-emerald-900 dark:text-emerald-300 font-semibold flex items-center justify-between">
                  <span>
                    Đã giữ thêm <b>{exteriorImages.length} ảnh chụp ngoại hình máy</b> (Tổng:{' '}
                    {totalImagesCount} ảnh).
                  </span>
                </div>
              )}

              {/* Trạng thái đang quét OCR / AI */}
              {(isScanningAI || aiStatusNote) && (
                <div className="flex items-center gap-2.5 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100">
                  {isScanningAI ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-medium">{aiStatusNote}</span>
                </div>
              )}
            </div>

            {/* Chân trang Bước 1 */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Chọn lại MacBook / iPad
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline cursor-pointer"
                >
                  Bỏ qua quét ảnh, tự nhập tay ở Bước 2 &rarr;
                </button>
              </div>

              <button
                type="button"
                disabled={!bothSpecImagesReady || isScanningAI}
                onClick={() => runExtractFromTwoImages(specImage1, specImage2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isScanningAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang bóc tách thông tin...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Đọc thông tin từ 2 ảnh &amp; Sang Bước 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ======================= BƯỚC 2: XÁC NHẬN CẤU HÌNH, MÀU SẮC, PIN, BẢO HÀNH, NHÂN SỰ & ẢNH ======================= */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Thanh tóm tắt kết quả đọc từ Bước 1 + Đường dẫn Folder Drive */}
            <div className="rounded-2xl bg-slate-900 text-white p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">
                    {aiStatusNote || 'Kiểm tra và bổ sung thông tin máy bên dưới:'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-300 hover:text-blue-200 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Bước 1 (Đổi 2 ảnh thông tin)
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs bg-slate-800/90 px-3 py-2 rounded-xl border border-slate-700">
                <FolderPlus className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400">Folder con sẽ tạo: </span>
                  <span className="font-mono font-bold text-amber-300">
                    {driveSubfolderPreview}
                  </span>
                </div>
              </div>
            </div>

            {/* PHẦN A: Mã Serial, Loại máy, Chip, RAM, Ổ đĩa, Màu sắc (Hạng mục chọn) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                1. Thông tin cấu hình &amp; Màu sắc (MacBook Air / Pro / Neo riêng • iPad riêng)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Số Sê-ri máy (Serial) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={serial}
                    onChange={(e) => setSerial(e.target.value.toUpperCase())}
                    placeholder="VD: C24WT1P2GL"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-slate-700 font-mono font-bold text-sm uppercase bg-amber-50/70 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Nhóm thiết bị (Chia riêng)
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    {(['MacBook', 'iPad', 'Khác'] as const).map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => {
                          setDeviceType(type);
                          const nextLine = PRODUCT_LINES_BY_TYPE[type][0];
                          setProductLine(nextLine);
                          if (type === 'Khác') {
                            setChip('A-Series');
                            setRam('N/A');
                            setStorage('N/A');
                            setScreenSize('N/A');
                            setTitle(nextLine);
                          }
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          deviceType === type
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {type === 'MacBook' ? '💻 Mac' : type === 'iPad' ? '📱 iPad' : '⌨️ Khác'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Dòng máy (Air / Pro / Neo riêng / iPad)
                  </label>
                  <select
                    value={productLine}
                    onChange={(e) => {
                      const nextLine = e.target.value as ProductLine;
                      setProductLine(nextLine);
                      if (nextLine === 'MacBook Neo') {
                        setChip('A18 Pro');
                        setRam('8GB');
                        setScreenSize('13 inch');
                        if (!MACBOOK_NEO_COLORS.includes(color as any)) {
                          setColor(MACBOOK_NEO_COLORS[0]);
                        }
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      productLine === 'MacBook Neo'
                        ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/50 dark:bg-slate-800 text-indigo-950 dark:text-indigo-300'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    }`}
                  >
                    {PRODUCT_LINES_BY_TYPE[deviceType].map((line) => (
                      <option key={line} value={line}>
                        {line === 'MacBook Neo' ? '✨ MacBook Neo (Hạng mục riêng)' : line}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {deviceType === 'Khác' ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950 dark:text-emerald-300">
                        Đang nhập: {productLine} (Phụ kiện &amp; Khác)
                      </div>
                      <div className="text-[11px] text-emerald-800 dark:text-emerald-400">
                        Tự động ẩn Chip, RAM, Ổ đĩa &amp; Màn hình. Chỉ cần nhập Tên, Màu sắc, Giá tiền, Tình trạng và Bộ ảnh chụp thực tế.
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Màu sắc sản phẩm
                    </label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {APPLE_COLORS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className={`grid grid-cols-2 ${deviceType === 'iPad' ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} gap-3`}>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Dòng Chip
                    </label>
                    <select
                      value={chip}
                      onChange={(e) => setChip(e.target.value as ChipFamily)}
                      className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-300 bg-indigo-50/70 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CHIP_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          Apple {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {deviceType !== 'iPad' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Bộ nhớ RAM
                      </label>
                      <select
                        value={ram}
                        onChange={(e) => setRam(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {RAM_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Ổ đĩa (Dự đoán chuẩn)
                    </label>
                    <select
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-400 dark:border-slate-700 text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-50/70 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {STORAGE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {rawDiskNote && (
                      <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
                        <HardDrive className="w-2.5 h-2.5 inline mr-0.5" />
                        {rawDiskNote}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Kích thước màn
                    </label>
                    <select
                      value={screenSize}
                      onChange={(e) => setScreenSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SCREEN_SIZE_OPTIONS.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hạng mục chọn Màu sắc (Ưu tiên bảng màu MacBook Neo khi chọn MacBook Neo) */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {productLine === 'MacBook Neo' ? 'Màu MacBook Neo' : 'Hạng mục Màu sắc'}
                    </label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        productLine === 'MacBook Neo'
                          ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/40 dark:bg-slate-800 text-indigo-950 dark:text-indigo-300'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      }`}
                    >
                      {productLine === 'MacBook Neo' ? (
                        <>
                          <optgroup label="🎨 Bảng màu chuẩn MacBook Neo">
                            {MACBOOK_NEO_COLORS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Các màu Apple khác">
                            {APPLE_COLORS.filter(
                              (c) => !MACBOOK_NEO_COLORS.includes(c as any)
                            ).map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      ) : (
                        APPLE_COLORS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* Nếu đang chọn MacBook Neo: Hiển thị thêm thanh chọn nhanh 4 màu đặc trưng của Neo */}
              {productLine === 'MacBook Neo' && (
                <div className="rounded-xl bg-gradient-to-r from-indigo-50 via-pink-50 to-amber-50 border border-indigo-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    Chọn nhanh 4 màu MacBook Neo:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        {
                          value: 'Silver (Bạc - Neo)',
                          label: 'Silver (Bạc)',
                          dot: 'bg-slate-300',
                        },
                        {
                          value: 'Indigo (Xanh Indigo - Neo)',
                          label: 'Indigo (Xanh Chàm)',
                          dot: 'bg-indigo-600',
                        },
                        {
                          value: 'Blush (Hồng Blush - Neo)',
                          label: 'Blush (Hồng Phấn)',
                          dot: 'bg-pink-400',
                        },
                        {
                          value: 'Citrus (Vàng Chanh Citrus - Neo)',
                          label: 'Citrus (Vàng Chanh)',
                          dot: 'bg-lime-400',
                        },
                      ] as const
                    ).map((neoColor) => (
                      <button
                        key={neoColor.value}
                        type="button"
                        onClick={() => setColor(neoColor.value)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          color === neoColor.value
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${neoColor.dot}`} />
                        <span>{neoColor.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PHẦN B: Tách riêng Tickbox Dung lượng Pin (%) + Số lần sạc & Bảo hành */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              {/* Hộp 1: Tickbox Dung lượng Pin (%) & Số lần sạc dạng số */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl p-3.5 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <BatteryCharging className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  2. Tình trạng Pin &amp; Lần sạc (Tickbox dạng số)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className={`p-2.5 rounded-xl border transition ${
                      hasBatteryCapacity
                        ? 'bg-white dark:bg-slate-800 border-emerald-400 dark:border-emerald-600 shadow-2xs'
                        : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-75'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasBatteryCapacity}
                        onChange={(e) => setHasBatteryCapacity(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Dung lượng Pin (%)
                      </span>
                    </label>
                    {hasBatteryCapacity && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={batteryCapacityPercent}
                          onChange={(e) => setBatteryCapacityPercent(e.target.value)}
                          placeholder="100"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-sm text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">%</span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border transition ${
                      hasBatteryCycle
                        ? 'bg-white dark:bg-slate-800 border-emerald-400 dark:border-emerald-600 shadow-2xs'
                        : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-75'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasBatteryCycle}
                        onChange={(e) => setHasBatteryCycle(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Số lần sạc (Chu kỳ)
                      </span>
                    </label>
                    {hasBatteryCycle && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={5000}
                          value={batteryCycleCount}
                          onChange={(e) => setBatteryCycleCount(e.target.value)}
                          placeholder="14"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-sm text-indigo-800 dark:text-indigo-300 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">lần</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Hộp 2: Bảo hành (Có thì bổ sung ngày tháng, Không thì không có lựa chọn gì hết) */}
              <div className="bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl p-3.5 border border-blue-200 dark:border-blue-800/50 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  3. Gói Bảo hành Apple
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasWarranty(false);
                      setWarrantyExpiryDate('');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      !hasWarranty
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Không (Hết bảo hành)
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasWarranty(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      hasWarranty
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Có (Còn bảo hành)
                  </button>
                </div>

                {hasWarranty && (
                  <div className="pt-1">
                    <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
                      Ngày tháng hết hạn bảo hành:
                    </label>
                    <input
                      type="date"
                      value={warrantyExpiryDate}
                      onChange={(e) => setWarrantyExpiryDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-blue-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mô tả ngắn tình trạng ngoại hình & Tên sản phẩm */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Tên hiển thị sản phẩm
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={computedTitle}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold placeholder:text-slate-500 dark:placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Mô tả ngắn tình trạng ngoại hình máy (để dễ phân biệt giữa các máy)
                </label>
                <input
                  type="text"
                  value={conditionNote}
                  onChange={(e) => setConditionNote(e.target.value)}
                  placeholder="VD: Đẹp keng 99%, cấn nhẹ 1 vết góc trái, màn đẹp nguyên zin..."
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-slate-700 bg-amber-50/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-750 text-slate-900 dark:text-white font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* PHẦN C: Nhân sự & Giá tiền (Định dạng có dấu phẩy , tự động) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  4. Thông tin Nhân sự (Lấy • Kiếm • Bán • Giao)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <StaffSelect
                    label="1. Tên người lấy"
                    value={receiverName}
                    onChange={setReceiverName}
                    placeholder="-- Chọn người lấy --"
                  />
                  <StaffSelect
                    label="2. Tên người kiếm"
                    value={sourcerName}
                    onChange={setSourcerName}
                    placeholder="-- Chọn người kiếm --"
                  />
                  <StaffSelect
                    label="3. Tên người bán"
                    value={sellerName}
                    onChange={setSellerName}
                    placeholder="Chưa bán"
                    defaultOptions={['Chưa bán']}
                  />
                  <StaffSelect
                    label="4. Tên người giao"
                    value={delivererName}
                    onChange={setDelivererName}
                    placeholder="Chưa giao"
                    defaultOptions={['Chưa giao']}
                  />
                </div>
              </div>

              {/* Ô nhập Giá tiền tự động thêm dấu phẩy (,) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    5. Giá tiền (VNĐ — Tự thêm dấu ,)
                  </div>
                  {(parsedImportNum > 0 || parsedSaleNum > 0) && (
                    <span
                      className={`text-xs font-bold ${
                        previewProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      Lãi: {previewProfit >= 0 ? '+' : ''}
                      {formatPriceInputWithCommas(Math.abs(previewProfit))} ₫
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Giá nhập / Giá vốn (VNĐ)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={importPrice}
                      onChange={(e) =>
                        setImportPrice(formatPriceInputWithCommas(e.target.value))
                      }
                      placeholder="VD: 23,000,000"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Giá bán niêm yết (VNĐ)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={salePrice}
                      onChange={(e) => setSalePrice(formatPriceInputWithCommas(e.target.value))}
                      placeholder="VD: 25,500,000"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Trạng thái máy
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'available', label: 'Sẵn hàng' },
                        { id: 'deposited', label: 'Đã nhận cọc' },
                        { id: 'sold', label: 'Đã bán' },
                      ] as const
                    ).map((st) => (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => setStatus(st.id)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          status === st.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PHẦN D: Tải thêm không giới hạn ảnh chụp ngoại hình máy */}
            <div className="rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-800/50 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                    <Images className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    6. Toàn bộ hình ảnh của máy (Đang có: {totalImagesCount} ảnh)
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Gồm {(specImage1 ? 1 : 0) + (specImage2 ? 1 : 0)} ảnh thông tin +{' '}
                    <b>{exteriorImages.length} ảnh ngoại hình</b>. Bạn có thể chọn thêm bao nhiêu
                    ảnh ngoại hình tùy ý!
                  </p>
                </div>

                <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>+ Chọn thêm nhiều ảnh ngoại hình máy</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleExteriorPhotosUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {specImage1 && (
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden border-2 border-blue-500 bg-slate-900">
                    <img src={specImage1.url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                      Ảnh TT 1
                    </span>
                  </div>
                )}
                {specImage2 && (
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden border-2 border-blue-500 bg-slate-900">
                    <img src={specImage2.url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                      Ảnh TT 2
                    </span>
                  </div>
                )}
                {exteriorImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative group aspect-4/3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-semibold">
                      Ảnh #{idx + 3}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExteriorImages((prev) => prev.filter((item) => item.id !== img.id))
                      }
                      className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút Lưu Bước 2 */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Bước 1</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {isSaving
                      ? `Đang lưu ${totalImagesCount} ảnh & tạo Folder...`
                      : isEditing
                      ? `Cập nhật máy (${totalImagesCount} ảnh)`
                      : `Lưu máy (${totalImagesCount} ảnh) & Tạo Folder [${cleanSerialPreview}]`}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
