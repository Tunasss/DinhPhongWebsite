import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  Share2,
  ChevronDown,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  Palette,
  Cpu,
  Laptop,
  ArrowRight,
  ArrowLeft,
  Eye,
  ListChecks,
} from 'lucide-react';
import { AppleDevice, DeviceStatus, ProductLine, ChipFamily } from '../types';

interface PostGeneratorModalProps {
  isOpen: boolean;
  devices: AppleDevice[];
  onClose: () => void;
  onNotify?: (msg: string) => void;
  initialFilter?: {
    productLine?: string;
    chip?: string;
    color?: string;
  };
}

const CIRCLE_NUMBERS = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳',
];

/**
 * Format số tiền sang dạng VNĐ chuẩn: 26.000.000đ
 */
function formatVND(amount: number): string {
  if (!amount || isNaN(amount)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

/**
 * Định dạng tiêu đề máy chuẩn xác theo form Facebook Đình Phong Store:
 * - MacBook: MacBook Air M4 13” – 16GB / 256GB – Sky Blue
 * - iPad: iPad Air M3 11” – 128GB – Starlight (Không ghi RAM, không N/A)
 */
function formatDeviceTitle(d: AppleDevice): string {
  const isIPad =
    d.deviceType === 'iPad' ||
    (d.productLine && d.productLine.toLowerCase().includes('ipad'));

  let lineName = 'MacBook';

  if (isIPad) {
    const pl = (d.productLine || '').toLowerCase();
    if (pl.includes('pro')) {
      lineName = 'iPad Pro';
    } else if (pl.includes('air')) {
      lineName = 'iPad Air';
    } else if (pl.includes('mini')) {
      lineName = 'iPad Mini';
    } else if (pl.includes('gen')) {
      lineName = 'iPad Gen';
    } else {
      lineName = 'iPad';
    }
  } else {
    // MacBook
    const pl = (d.productLine || '').toLowerCase();
    if (pl.includes('air')) {
      lineName = 'MacBook Air';
    } else if (pl.includes('pro')) {
      lineName = 'MacBook Pro';
    } else if (pl.includes('neo')) {
      lineName = 'MacBook Neo';
    } else {
      lineName = 'MacBook';
    }
  }

  // Chip: M4, M3, M2, M1, A16, etc.
  const chip = (d.chip || '').trim();

  // Screen size: 13.6 inch -> 13”, 14.2 inch -> 14”, 15.3 inch -> 15”, 11 inch -> 11”, 10.9 inch -> 10.9”
  let screen = (d.screenSize || '').replace(/inch/i, '').trim();
  if (screen.includes('13.6') || screen === '13.3' || screen === '13') {
    screen = '13”';
  } else if (screen.includes('14.2') || screen === '14') {
    screen = '14”';
  } else if (screen.includes('15.3') || screen === '15') {
    screen = '15”';
  } else if (screen.includes('16.2') || screen === '16') {
    screen = '16”';
  } else if (screen.includes('11')) {
    screen = '11”';
  } else if (screen.includes('10.9')) {
    screen = '10.9”';
  } else if (screen.includes('12.9')) {
    screen = '12.9”';
  } else if (screen) {
    screen = `${screen}”`;
  }

  // Chuẩn hóa tên màu sắc dạng Title Case:
  // "Sky Blue (Xanh Da Trời)" -> "Sky Blue"
  // "Silver (Bạc)" -> "Silver"
  let colorName = (d.color || '').trim();
  const matchEnglish = colorName.match(/^([^(]+)/);
  if (matchEnglish && matchEnglish[1]) {
    colorName = matchEnglish[1].trim();
  }
  colorName = colorName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  // Ổ đĩa: 128GB, 256GB, 512GB, 1TB...
  const storage = (d.storage || '256GB').trim();

  const parts: string[] = [];
  const modelAndChip = [lineName, chip, screen].filter(Boolean).join(' ');
  parts.push(modelAndChip);

  // Đối với iPad: Chỉ ghi dung lượng ổ đĩa, KHÔNG ghi RAM (tránh N/A)
  if (isIPad) {
    parts.push(storage);
  } else {
    const rawRam = (d.ram || '').trim();
    const ram =
      rawRam && rawRam.toUpperCase() !== 'N/A' && rawRam !== 'undefined'
        ? rawRam
        : '16GB';
    parts.push(`${ram} / ${storage}`);
  }

  if (colorName) parts.push(colorName);

  return parts.join(' – ');
}

/**
 * Định dạng thông tin pin:
 * 🔋 Pin 99%
 * hoặc 🔋 Pin 99% – 86 lần sạc
 */
function formatBattery(d: AppleDevice): string {
  const hasCap =
    d.hasBatteryCapacity &&
    d.batteryCapacityPercent !== undefined &&
    d.batteryCapacityPercent > 0;
  const hasCycle =
    d.hasBatteryCycle &&
    d.batteryCycleCount !== undefined &&
    d.batteryCycleCount >= 0;

  if (hasCap && hasCycle) {
    return `🔋 Pin ${d.batteryCapacityPercent}% – ${d.batteryCycleCount} lần sạc`;
  }
  if (hasCap) {
    return `🔋 Pin ${d.batteryCapacityPercent}%`;
  }
  if (hasCycle) {
    return `🔋 Pin sạc ${d.batteryCycleCount} lần`;
  }
  return '🔋 Pin tốt';
}

/**
 * Định dạng tình trạng ngoại hình:
 * ✨ Ngoại hình đẹp keng
 * ✨ Ngoại hình 98%, một vệt xước
 */
function formatCondition(d: AppleDevice): string {
  let note = (d.conditionNote || '').trim();
  if (!note) note = 'đẹp keng';
  if (!note.toLowerCase().startsWith('ngoại hình')) {
    note = `Ngoại hình ${note}`;
  }
  return `✨ ${note}`;
}

/**
 * Định dạng bảo hành theo quy định mới:
 * - Nếu còn bảo hành hãng: 🛡️ BH hãng đến 03/2027 (hoặc ngày cụ thể)
 * - Nếu hết bảo hành hãng: 🛡️ BH shop 3 tháng – Bao test 15 ngày
 */
function formatWarranty(d: AppleDevice): string {
  if (d.hasWarranty && d.warrantyExpiryDate) {
    let wDate = d.warrantyExpiryDate.trim();
    if (wDate.includes('-')) {
      const parts = wDate.split('-');
      if (parts.length === 3) {
        wDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (parts.length === 2) {
        wDate = `${parts[1]}/${parts[0]}`;
      }
    }
    return `🛡️ BH hãng đến ${wDate}`;
  }
  return '🛡️ BH shop 3 tháng – Bao test 15 ngày';
}

/**
 * Footer cố định theo mẫu quy định của Đình Phong Store:
 */
const DEFAULT_POST_FOOTER = `Máy full zin – Không MDM, không iCloud.
📍 Thủ Đức – TP.HCM

📲 094 578 6642 (Đình Phong)

    092 215 5156 (Vũ)

    033 8195 855 (Minh Quân)`;

/**
 * Tạo danh sách Hashtags tự động theo model, chip và màu sắc
 */
function generateDynamicHashtags(selectedDevices: AppleDevice[]): string {
  const tags = new Set<string>();

  selectedDevices.forEach((d) => {
    const isIPad =
      d.deviceType === 'iPad' ||
      (d.productLine && d.productLine.toLowerCase().includes('ipad'));

    const pl = (d.productLine || '').replace(/\s+/g, '');
    const chip = (d.chip || '').replace(/\s+/g, '');

    if (pl && chip) {
      tags.add(`#${pl}${chip}`);
    }
    if (chip) {
      if (isIPad) {
        tags.add(`#iPad${chip}`);
      } else {
        tags.add(`#MacBook${chip}`);
      }
    }

    let rawColor = (d.color || '').trim();
    const matchEnglish = rawColor.match(/^([^(]+)/);
    if (matchEnglish && matchEnglish[1]) {
      const cleanColor = matchEnglish[1].trim().replace(/\s+/g, '');
      if (cleanColor) {
        if (isIPad) {
          tags.add(`#iPad${cleanColor}`);
        } else {
          tags.add(`#MacBook${cleanColor}`);
        }
      }
    }
  });

  tags.add('#DinhPhongStore');
  tags.add('#SinhVien');

  return Array.from(tags).join(' ');
}

/**
 * Ghép toàn bộ bài đăng Facebook hoàn chỉnh
 */
function buildCompletePost(selectedDevices: AppleDevice[]): string {
  if (!selectedDevices || selectedDevices.length === 0) return '';

  const entries = selectedDevices.map((d, index) => {
    const num =
      index < CIRCLE_NUMBERS.length ? CIRCLE_NUMBERS[index] : `(${index + 1})`;
    const titleLine = `${num} ${formatDeviceTitle(d)}`;
    const batteryLine = formatBattery(d);
    const conditionLine = formatCondition(d);
    const warrantyLine = formatWarranty(d);
    const priceLine = `💰 ${formatVND(d.salePrice)}`;

    return [titleLine, batteryLine, conditionLine, warrantyLine, priceLine].join(
      '\n'
    );
  });

  const hashtagString = generateDynamicHashtags(selectedDevices);

  return `${entries.join('\n\n')}\n\n${DEFAULT_POST_FOOTER}\n\n${hashtagString}`;
}

export const PostGeneratorModal: React.FC<PostGeneratorModalProps> = ({
  isOpen,
  devices,
  onClose,
  onNotify,
  initialFilter,
}) => {
  // Quản lý tab trên mobile: 1: Chọn máy (List & Filter) | 2: Xem trước bài & Copy
  const [activeTab, setActiveTab] = useState<'SELECT' | 'PREVIEW'>('SELECT');

  // Trạng thái bộ lọc máy
  const [selectedProductLine, setSelectedProductLine] = useState<string>(
    initialFilter?.productLine || 'ALL'
  );
  const [selectedChip, setSelectedChip] = useState<string>(
    initialFilter?.chip || 'ALL'
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    initialFilter?.color || 'ALL'
  );
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | 'ALL'>(
    'available'
  );
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Danh sách ID máy được tick chọn
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(
    new Set()
  );

  // Nội dung bài viết tùy biến (nếu người dùng muốn sửa trực tiếp)
  const [customPostContent, setCustomPostContent] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Lấy danh sách các lựa chọn duy nhất từ kho máy
  const availableProductLines = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      if (d.productLine) set.add(d.productLine);
    });
    return Array.from(set).sort();
  }, [devices]);

  const availableChips = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      if (d.chip) set.add(d.chip);
    });
    return Array.from(set).sort();
  }, [devices]);

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      if (d.color) set.add(d.color);
    });
    return Array.from(set).sort();
  }, [devices]);

  // Lọc danh sách máy theo các tiêu chí đã chọn
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;

      if (selectedProductLine !== 'ALL') {
        const isIPad =
          d.deviceType === 'iPad' ||
          (d.productLine && d.productLine.toLowerCase().includes('ipad'));

        if (selectedProductLine === 'MacBook Air') {
          if (isIPad || !d.productLine?.toLowerCase().includes('air')) return false;
        } else if (selectedProductLine === 'MacBook Pro') {
          if (isIPad || !d.productLine?.toLowerCase().includes('pro')) return false;
        } else if (selectedProductLine === 'iPad Air') {
          if (!isIPad || !d.productLine?.toLowerCase().includes('air')) return false;
        } else if (selectedProductLine === 'iPad Pro') {
          if (!isIPad || !d.productLine?.toLowerCase().includes('pro')) return false;
        } else if (selectedProductLine === 'iPad Gen') {
          if (!isIPad || !d.productLine?.toLowerCase().includes('gen')) return false;
        } else if (selectedProductLine === 'iPad Mini') {
          if (!isIPad || !d.productLine?.toLowerCase().includes('mini')) return false;
        } else if (d.productLine !== selectedProductLine) {
          return false;
        }
      }

      if (selectedChip !== 'ALL' && d.chip !== selectedChip) return false;

      if (selectedColor !== 'ALL') {
        const rawCol = (d.color || '').toLowerCase();
        const targetCol = selectedColor.toLowerCase();
        if (!rawCol.includes(targetCol)) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const text = `${d.title} ${d.serial} ${d.color} ${d.chip} ${d.conditionNote}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [
    devices,
    selectedStatus,
    selectedProductLine,
    selectedChip,
    selectedColor,
    searchTerm,
  ]);

  const filteredIds = useMemo(
    () => filteredDevices.map((d) => d.id),
    [filteredDevices]
  );

  // Khi modal mở, mặc định chọn tất cả các máy trong filter
  useEffect(() => {
    if (isOpen) {
      setSelectedDeviceIds(new Set(filteredIds));
      setCustomPostContent(null);
      setActiveTab('SELECT');
    }
  }, [isOpen]);

  // Cập nhật selectedDeviceIds khi filteredIds thay đổi
  useEffect(() => {
    if (isOpen) {
      setSelectedDeviceIds(new Set(filteredIds));
      setCustomPostContent(null);
    }
  }, [filteredIds]);

  // Danh sách các máy đã được tick chọn (theo đúng thứ tự lọc)
  const selectedDevices = useMemo(() => {
    return filteredDevices.filter((d) => selectedDeviceIds.has(d.id));
  }, [filteredDevices, selectedDeviceIds]);

  // Tự động tạo bài đăng khi danh sách máy đã chọn thay đổi
  const generatedPost = useMemo(() => {
    if (customPostContent !== null) return customPostContent;
    return buildCompletePost(selectedDevices);
  }, [selectedDevices, customPostContent]);

  if (!isOpen) return null;

  const handleToggleSelectAll = () => {
    if (selectedDeviceIds.size === filteredIds.length) {
      setSelectedDeviceIds(new Set());
    } else {
      setSelectedDeviceIds(new Set(filteredIds));
    }
    setCustomPostContent(null);
  };

  const handleToggleDevice = (id: string) => {
    const next = new Set(selectedDeviceIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedDeviceIds(next);
    setCustomPostContent(null);
  };

  const handleCopyPost = async () => {
    if (!generatedPost.trim()) {
      onNotify?.('Chưa chọn máy nào để tạo bài đăng.');
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedPost);
      setIsCopied(true);
      onNotify?.(
        '✓ Đã sao chép bài đăng (Không kèm Serial)! Bạn có thể dán ngay lên Facebook.'
      );
      setTimeout(() => setIsCopied(false), 3000);
    } catch (e) {
      onNotify?.('Không thể tự động sao chép. Hãy bôi đen và nhấn Ctrl + C.');
    }
  };

  const handleDownloadTxt = () => {
    if (!generatedPost.trim()) return;
    const blob = new Blob([generatedPost], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaiDang_DinhPhongStore_${new Date()
      .toISOString()
      .slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.('Đã tải file bài viết (.txt) về máy!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[94vh] max-h-[94vh]">
        {/* Header Modal */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-blue-100 text-[10px] font-bold mb-0.5">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>Form Chuẩn Đình Phong Store</span>
              </div>
              <h2 className="text-sm sm:text-base font-black tracking-tight leading-snug">
                Tạo List Máy Đăng Bài Facebook
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh Điều Hướng 2 Bước Rõ Ràng (Tối ưu đặc biệt cho điện thoại) */}
        <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 p-1.5 px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {/* Nút Tab 1 */}
            <button
              type="button"
              onClick={() => setActiveTab('SELECT')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeTab === 'SELECT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>Bước 1: Chọn máy ({selectedDevices.length})</span>
            </button>

            {/* Nút Tab 2 */}
            <button
              type="button"
              onClick={() => setActiveTab('PREVIEW')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeTab === 'PREVIEW'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Bước 2: Xem &amp; Copy bài</span>
              {selectedDevices.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <span>
              Đã chọn: <b className="text-blue-600 dark:text-blue-400">{selectedDevices.length}</b>/{filteredDevices.length} máy
            </span>
          </div>
        </div>

        {/* Thân Modal: Trên mobile hiển thị theo Tab, Trên desktop (lg) hiển thị 2 cột song song */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* CỘT 1: BỘ LỌC & DANH SÁCH MÁY TICKBOX */}
          <div
            className={`lg:col-span-6 flex flex-col h-full overflow-hidden ${
              activeTab === 'SELECT' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* 1. Khu vực Bộ lọc (Cố định ở trên) */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                  <span>Bộ lọc danh sách</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {filteredDevices.length} máy phù hợp
                </span>
              </div>

              {/* Grid dropdown bộ lọc */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-xs">
                {/* Dòng máy */}
                <div>
                  <select
                    value={selectedProductLine}
                    onChange={(e) => {
                      setSelectedProductLine(e.target.value);
                      setCustomPostContent(null);
                    }}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-[11px] sm:text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none truncate"
                  >
                    <option value="ALL">Mọi dòng máy</option>
                    <optgroup label="💻 MacBook">
                      <option value="MacBook Air">MacBook Air</option>
                      <option value="MacBook Pro">MacBook Pro</option>
                    </optgroup>
                    <optgroup label="📱 iPad">
                      <option value="iPad Air">iPad Air</option>
                      <option value="iPad Pro">iPad Pro</option>
                      <option value="iPad Gen">iPad Gen</option>
                      <option value="iPad Mini">iPad Mini</option>
                    </optgroup>
                  </select>
                </div>

                {/* Chip */}
                <div>
                  <select
                    value={selectedChip}
                    onChange={(e) => {
                      setSelectedChip(e.target.value);
                      setCustomPostContent(null);
                    }}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-[11px] sm:text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none truncate"
                  >
                    <option value="ALL">Mọi loại Chip</option>
                    <option value="M4">M4</option>
                    <option value="M4 Pro">M4 Pro</option>
                    <option value="M3">M3</option>
                    <option value="M3 Pro">M3 Pro</option>
                    <option value="M2">M2</option>
                    <option value="M1">M1</option>
                    <option value="A16">A16</option>
                    <option value="A17 Pro">A17 Pro</option>
                  </select>
                </div>

                {/* Màu sắc */}
                <div>
                  <select
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
                      setCustomPostContent(null);
                    }}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-[11px] sm:text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none truncate"
                  >
                    <option value="ALL">Mọi màu</option>
                    <option value="Sky Blue">Sky Blue (Xanh Trời)</option>
                    <option value="Silver">Silver (Bạc)</option>
                    <option value="Space Gray">Space Gray (Xám)</option>
                    <option value="Midnight">Midnight (Đêm Tối)</option>
                    <option value="Starlight">Starlight (Ánh Sao)</option>
                    <option value="Space Black">Space Black (Đen)</option>
                    <option value="Blue">Blue (Xanh Dương)</option>
                    <option value="Purple">Purple (Tím)</option>
                    <option value="Pink">Pink (Hồng)</option>
                  </select>
                </div>
              </div>

              {/* Tìm kiếm nhanh */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Gõ tìm Serial, màu, cấu hình..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductLine('ALL');
                    setSelectedChip('ALL');
                    setSelectedColor('ALL');
                    setSearchTerm('');
                    setCustomPostContent(null);
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer shrink-0"
                >
                  Xóa lọc
                </button>
              </div>

              {/* Thanh chọn tất cả */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {selectedDeviceIds.size === filteredIds.length &&
                  filteredIds.length > 0 ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      <span>Bỏ chọn tất cả</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-slate-400" />
                      <span>Chọn tất cả ({filteredIds.length} máy)</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] font-semibold text-slate-500">
                  Đã tick: <b>{selectedDevices.length}</b> máy
                </span>
              </div>
            </div>

            {/* 2. Danh sách máy Cuộn Thoải Mái */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
              {filteredDevices.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4">
                  <Laptop className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Không có máy nào thỏa mãn bộ lọc
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Thử chọn dòng máy, chip hoặc màu sắc khác.
                  </p>
                </div>
              ) : (
                filteredDevices.map((d, index) => {
                  const isChecked = selectedDeviceIds.has(d.id);
                  const circleNum =
                    index < CIRCLE_NUMBERS.length
                      ? CIRCLE_NUMBERS[index]
                      : `(${index + 1})`;

                  return (
                    <div
                      key={d.id}
                      onClick={() => handleToggleDevice(d.id)}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition cursor-pointer flex items-start gap-2.5 select-none ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-400 dark:bg-blue-950/40 dark:border-blue-600/70 shadow-xs'
                          : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 opacity-70'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="pt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        )}
                      </div>

                      {/* Chi tiết máy */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            <span className="text-blue-600 dark:text-blue-400 mr-1 font-bold">
                              {circleNum}
                            </span>
                            {d.title || `${d.productLine} ${d.chip} ${d.storage}`}
                          </div>
                          <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                            {formatVND(d.salePrice)}
                          </span>
                        </div>

                        {/* Badges thông tin */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            SN: {d.serial}
                          </span>

                          {d.color && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold">
                              {d.color.replace(/\([^)]*\)/g, '').trim()}
                            </span>
                          )}

                          {d.hasBatteryCapacity && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                              Pin {d.batteryCapacityPercent}%{' '}
                              {d.hasBatteryCycle ? `• ${d.batteryCycleCount}L` : ''}
                            </span>
                          )}

                          {d.conditionNote && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium">
                              {d.conditionNote}
                            </span>
                          )}

                          <span
                            className={`px-1.5 py-0.5 rounded font-medium ${
                              d.hasWarranty && d.warrantyExpiryDate
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {d.hasWarranty && d.warrantyExpiryDate
                              ? `BH: ${d.warrantyExpiryDate}`
                              : 'BH Shop 3T'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Thanh Nút Tiếp Tục ở đáy (Đặc biệt hữu ích trên Mobile) */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Đã chọn: <b className="text-blue-600 font-black">{selectedDevices.length}</b> máy
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                disabled={selectedDevices.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition cursor-pointer disabled:opacity-50"
              >
                <span>Xem trước bài viết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CỘT 2: XEM TRƯỚC BÀI ĐĂNG (LIVE PREVIEW & COPY) */}
          <div
            className={`lg:col-span-6 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 ${
              activeTab === 'PREVIEW' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Header Cột Preview */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('SELECT')}
                  className="lg:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mr-1"
                  title="Quay lại chọn máy"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Nội dung bài viết Facebook (Live Preview)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleDownloadTxt}
                disabled={!generatedPost.trim()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-50"
                title="Tải văn bản bài viết về máy (.txt)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tải .txt</span>
              </button>
            </div>

            {/* Banner Lưu ý không copy serial */}
            <div className="p-2 sm:p-2.5 mx-3 sm:mx-4 mt-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-[11px] flex items-center gap-2 shrink-0">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <b>Đã tối ưu:</b> Bài đăng <b>không chứa Serial</b>, có icon 🔋✨🛡️💰 &amp; bảo hành shop tự động.
              </span>
            </div>

            {/* Ô Textarea Live Preview */}
            <div className="flex-1 p-3 sm:p-4 overflow-hidden">
              <textarea
                value={generatedPost}
                onChange={(e) => setCustomPostContent(e.target.value)}
                placeholder="Chọn ít nhất 1 máy ở Bước 1 để tạo bài viết tự động..."
                className="w-full h-full p-3 sm:p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none shadow-inner"
              />
            </div>

            {/* Nút Sao Chép Bài Đăng Nổi Bật Ở Đáy */}
            <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('SELECT')}
                className="lg:hidden py-3 px-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                ← Chọn máy
              </button>

              <button
                type="button"
                onClick={handleCopyPost}
                disabled={!generatedPost.trim()}
                className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer transform active:scale-98 ${
                  isCopied
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white shadow-blue-500/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    <span>ĐÃ SAO CHÉP THÀNH CÔNG!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>SAO CHÉP BÀI ĐĂNG (1 CHẠM)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
