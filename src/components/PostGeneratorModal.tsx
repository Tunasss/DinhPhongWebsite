import React, { useState, useMemo } from 'react';
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
 * Format số tiền sang dạng VNĐ chuẩn: 25.800.000đ
 */
function formatVND(amount: number): string {
  if (!amount || isNaN(amount)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

/**
 * Làm sạch và chuẩn hóa tiêu đề máy theo đúng form chuẩn của shop
 * Ví dụ: MAC AIR M4 13” – 16GB / 256GB – SKY BLUE
 */
function formatDeviceTitle(d: AppleDevice): string {
  let lineName = 'MACBOOK';
  const pl = (d.productLine || d.deviceType || '').toLowerCase();
  if (pl.includes('macbook air') || pl.includes('air')) {
    lineName = 'MAC AIR';
  } else if (pl.includes('macbook pro') || (pl.includes('pro') && !pl.includes('ipad'))) {
    lineName = 'MAC PRO';
  } else if (pl.includes('ipad pro')) {
    lineName = 'IPAD PRO';
  } else if (pl.includes('ipad air')) {
    lineName = 'IPAD AIR';
  } else if (pl.includes('ipad mini')) {
    lineName = 'IPAD MINI';
  } else if (pl.includes('ipad')) {
    lineName = 'IPAD';
  }

  const chip = (d.chip || '').toUpperCase().trim();

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
  } else if (screen.includes('12.9') || screen === '13') {
    screen = '13”';
  } else if (screen) {
    screen = `${screen}”`;
  }

  let colorName = (d.color || '').trim();
  const matchEnglish = colorName.match(/^([^(]+)/);
  if (matchEnglish && matchEnglish[1]) {
    colorName = matchEnglish[1].trim();
  }
  colorName = colorName.toUpperCase();

  const ram = (d.ram || '16GB').toUpperCase().trim();
  const storage = (d.storage || '256GB').toUpperCase().trim();

  const parts: string[] = [];
  const modelAndChip = [lineName, chip, screen].filter(Boolean).join(' ');
  parts.push(modelAndChip);
  parts.push(`${ram} / ${storage}`);
  if (colorName) parts.push(colorName);

  return parts.join(' – ');
}

/**
 * Định dạng thông tin pin & số lần sạc
 */
function formatBattery(d: AppleDevice): string | null {
  const hasCap = d.hasBatteryCapacity && d.batteryCapacityPercent !== undefined && d.batteryCapacityPercent > 0;
  const hasCycle = d.hasBatteryCycle && d.batteryCycleCount !== undefined && d.batteryCycleCount >= 0;

  if (hasCap && hasCycle) {
    return `Pin ${d.batteryCapacityPercent}% – ${d.batteryCycleCount} lần sạc`;
  }
  if (hasCap) {
    return `Pin ${d.batteryCapacityPercent}%`;
  }
  if (hasCycle) {
    return `${d.batteryCycleCount} lần sạc`;
  }
  return null;
}

/**
 * Định dạng tình trạng ngoại hình máy
 */
function formatCondition(d: AppleDevice): string {
  let note = (d.conditionNote || '').trim();
  if (!note) note = 'Đẹp keng';
  if (!note.toLowerCase().startsWith('ngoại hình')) {
    note = `Ngoại hình ${note}`;
  }
  return note;
}

/**
 * Định dạng thời hạn bảo hành Apple
 */
function formatWarranty(d: AppleDevice): string | null {
  if (!d.hasWarranty) return null;
  let wDate = (d.warrantyExpiryDate || '').trim();
  if (!wDate) return 'Bảo hành chính hãng Apple';

  if (wDate.includes('-')) {
    const parts = wDate.split('-');
    if (parts.length === 3) {
      wDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else if (parts.length === 2) {
      wDate = `${parts[1]}/${parts[0]}`;
    }
  }
  return `Bảo hành hãng đến ${wDate}`;
}

/**
 * Footer cố định theo mẫu quy định của shop
 */
const DEFAULT_POST_FOOTER = `Máy full zin – Không MDM, không iCloud.



📍 Thủ Đức – TP.HCM

📲 092 215 5156 (Vũ)

    033 8195 855 (Minh Quân)

    094 578 6642 (Đình Phong)`;

/**
 * Tạo danh sách Hashtags tự động theo model, chip và màu sắc
 */
function generateDynamicHashtags(selectedDevices: AppleDevice[]): string {
  const tags = new Set<string>();

  selectedDevices.forEach((d) => {
    const pl = (d.productLine || '').replace(/\s+/g, '');
    const chip = (d.chip || '').replace(/\s+/g, '');

    if (pl && chip) {
      tags.add(`#${pl}${chip}`);
    }
    if (chip) {
      if (pl.toLowerCase().includes('macbook')) {
        tags.add(`#MacBook${chip}`);
      } else if (pl.toLowerCase().includes('ipad')) {
        tags.add(`#iPad${chip}`);
      }
    }

    let rawColor = (d.color || '').trim();
    const matchEnglish = rawColor.match(/^([^(]+)/);
    if (matchEnglish && matchEnglish[1]) {
      const cleanColor = matchEnglish[1].trim().replace(/\s+/g, '');
      if (cleanColor) {
        if (pl.toLowerCase().includes('macbook') || !pl) {
          tags.add(`#MacBook${cleanColor}`);
        } else if (pl.toLowerCase().includes('ipad')) {
          tags.add(`#iPad${cleanColor}`);
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
    const num = index < CIRCLE_NUMBERS.length ? CIRCLE_NUMBERS[index] : `(${index + 1})`;
    const titleLine = `${num} ${formatDeviceTitle(d)}`;
    const lines: string[] = [titleLine];

    const batteryLine = formatBattery(d);
    if (batteryLine) lines.push(batteryLine);

    const conditionLine = formatCondition(d);
    if (conditionLine) lines.push(conditionLine);

    const warrantyLine = formatWarranty(d);
    if (warrantyLine) lines.push(warrantyLine);

    const priceLine = `Giá: ${formatVND(d.salePrice)}`;
    lines.push(priceLine);

    return lines.join('\n\n');
  });

  const hashtagString = generateDynamicHashtags(selectedDevices);

  return `${entries.join('\n\n\n\n')}\n\n\n\n${DEFAULT_POST_FOOTER}\n\n\n\n${hashtagString}`;
}

export const PostGeneratorModal: React.FC<PostGeneratorModalProps> = ({
  isOpen,
  devices,
  onClose,
  onNotify,
  initialFilter,
}) => {
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
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | 'ALL'>('available');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Danh sách ID máy được tick chọn
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());

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
        const pl = (d.productLine || '').toLowerCase();
        if (selectedProductLine === 'MacBook Air' && !pl.includes('air')) return false;
        if (selectedProductLine === 'MacBook Pro' && !pl.includes('pro')) return false;
        if (selectedProductLine !== 'MacBook Air' && selectedProductLine !== 'MacBook Pro' && d.productLine !== selectedProductLine) {
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
  }, [devices, selectedStatus, selectedProductLine, selectedChip, selectedColor, searchTerm]);

  // Cập nhật mặc định chọn tất cả khi danh sách filtered thay đổi lần đầu hoặc khi bấm chọn
  const filteredIds = useMemo(() => filteredDevices.map((d) => d.id), [filteredDevices]);

  // Khi modal mở, mặc định chọn tất cả các máy trong filter
  React.useEffect(() => {
    if (isOpen) {
      setSelectedDeviceIds(new Set(filteredIds));
      setCustomPostContent(null);
    }
  }, [isOpen]);

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
      onNotify?.('✓ Đã sao chép bài đăng (Không kèm Serial) vào Clipboard! Dán ngay lên FB.');
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
    a.download = `BaiDang_DinhPhongStore_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.('Đã tải file bài viết (.txt) về máy!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-blue-100 text-[10px] font-bold mb-0.5">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>Form Chuẩn Đình Phong Store</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                Tạo List Máy Đăng Bài Facebook
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân Modal: Chia 2 cột (Trái: Bộ lọc & Chọn máy | Phải: Preview bài viết) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* CỘT TRÁI (7 CỘT): Bộ lọc & Danh sách máy tickbox */}
          <div className="lg:col-span-6 p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto max-h-[50vh] lg:max-h-none">
            {/* Thanh Bộ Lọc Nhanh */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                  <span>Bộ lọc máy viết bài</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {filteredDevices.length} máy khớp
                </span>
              </div>

              {/* Grid các ô Dropdown bộ lọc */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {/* 1. Dòng máy */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Dòng máy:
                  </label>
                  <select
                    value={selectedProductLine}
                    onChange={(e) => {
                      setSelectedProductLine(e.target.value);
                      setCustomPostContent(null);
                    }}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ALL">Mọi dòng máy</option>
                    <option value="MacBook Air">MacBook Air</option>
                    <option value="MacBook Pro">MacBook Pro</option>
                    <option value="iPad Pro">iPad Pro</option>
                    <option value="iPad Air">iPad Air</option>
                    {availableProductLines
                      .filter((l) => !['MacBook Air', 'MacBook Pro', 'iPad Pro', 'iPad Air'].includes(l))
                      .map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 2. Chip */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Dòng Chip:
                  </label>
                  <select
                    value={selectedChip}
                    onChange={(e) => {
                      setSelectedChip(e.target.value);
                      setCustomPostContent(null);
                    }}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ALL">Mọi loại Chip</option>
                    <option value="M4">Apple M4</option>
                    <option value="M4 Pro">Apple M4 Pro</option>
                    <option value="M3">Apple M3</option>
                    <option value="M3 Pro">Apple M3 Pro</option>
                    <option value="M2">Apple M2</option>
                    <option value="M1">Apple M1</option>
                    <option value="M5">Apple M5</option>
                    {availableChips
                      .filter((c) => !['M4', 'M4 Pro', 'M3', 'M3 Pro', 'M2', 'M1', 'M5'].includes(c))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 3. Màu sắc */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Màu sắc:
                  </label>
                  <select
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
                      setCustomPostContent(null);
                    }}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ALL">Mọi màu sắc</option>
                    <option value="Sky Blue">Sky Blue (Xanh Trời)</option>
                    <option value="Silver">Silver (Bạc)</option>
                    <option value="Space Gray">Space Gray (Xám)</option>
                    <option value="Midnight">Midnight (Xanh Đêm)</option>
                    <option value="Starlight">Starlight (Ánh Sao)</option>
                    <option value="Space Black">Space Black (Đen)</option>
                    {availableColors
                      .filter((col) => !['Sky Blue', 'Silver', 'Space Gray', 'Midnight', 'Starlight', 'Space Black'].some((k) => col.includes(k)))
                      .map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Tìm kiếm & Trạng thái */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm theo Serial, RAM, SSD, Ghi chú..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer shrink-0"
                >
                  Xóa lọc
                </button>
              </div>
            </div>

            {/* Thanh Chọn Tất Cả & Thống kê */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {selectedDeviceIds.size === filteredIds.length && filteredIds.length > 0 ? (
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

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Đã chọn: <b className="text-blue-600 dark:text-blue-400">{selectedDevices.length}</b>/{filteredDevices.length} máy
              </span>
            </div>

            {/* Danh sách máy Tickbox */}
            <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
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
                  const circleNum = index < CIRCLE_NUMBERS.length ? CIRCLE_NUMBERS[index] : `(${index + 1})`;

                  return (
                    <div
                      key={d.id}
                      onClick={() => handleToggleDevice(d.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-400 dark:bg-blue-950/40 dark:border-blue-600/70 shadow-xs'
                          : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 opacity-75'
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
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            <span className="text-blue-600 dark:text-blue-400 mr-1.5 font-bold">
                              {circleNum}
                            </span>
                            {d.title || `${d.productLine} ${d.chip} ${d.ram}/${d.storage}`}
                          </div>
                          <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                            {formatVND(d.salePrice)}
                          </span>
                        </div>

                        {/* Badges thông tin: Serial, Màu, Pin, Bảo hành */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          {/* Serial nội bộ (giúp nhận diện máy trong kho) */}
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            SN: {d.serial}
                          </span>

                          {/* Màu */}
                          {d.color && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold">
                              {d.color.replace(/\([^)]*\)/g, '').trim()}
                            </span>
                          )}

                          {/* Pin */}
                          {d.hasBatteryCapacity && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                              Pin {d.batteryCapacityPercent}% {d.hasBatteryCycle ? `• ${d.batteryCycleCount}L` : ''}
                            </span>
                          )}

                          {/* Ngoại hình */}
                          {d.conditionNote && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium">
                              {d.conditionNote}
                            </span>
                          )}

                          {/* Bảo hành */}
                          {d.hasWarranty && d.warrantyExpiryDate && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">
                              BH: {d.warrantyExpiryDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI (6 CỘT): Xem trước bài đăng (Live Preview & Copy) */}
          <div className="lg:col-span-6 p-4 sm:p-5 flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Nội dung bài viết Facebook (Live Preview)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  disabled={!generatedPost.trim()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-50"
                  title="Tải văn bản bài viết về máy (.txt)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tải file .txt</span>
                </button>
              </div>
            </div>

            {/* Lưu ý không copy serial */}
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-[11px] flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <b>Tự động ẩn Serial:</b> Văn bản copy hoàn toàn <b>không chứa số Serial</b>, giữ nguyên đúng mẫu bài đăng Facebook của Đình Phong Store.
              </span>
            </div>

            {/* Textarea Live Preview & Cho phép chỉnh sửa trực tiếp */}
            <div className="flex-1 min-h-[320px] relative">
              <textarea
                value={generatedPost}
                onChange={(e) => setCustomPostContent(e.target.value)}
                placeholder="Chọn ít nhất 1 máy ở cột bên trái để tạo bài viết tự động..."
                className="w-full h-full min-h-[340px] p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none shadow-inner"
              />
            </div>

            {/* Nút Sao Chép Bài Đăng Nổi Bật (CTA chính) */}
            <button
              type="button"
              onClick={handleCopyPost}
              disabled={!generatedPost.trim()}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-lg transition cursor-pointer transform active:scale-98 ${
                isCopied
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white shadow-blue-500/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>ĐÃ SAO CHÉP BÀI ĐĂNG (KHÔNG SERIAL) THÀNH CÔNG!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>SAO CHÉP BÀI ĐĂNG FACEBOOK (1 CHẠM)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
