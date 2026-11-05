import React from 'react';
import {
  Search,
  Laptop,
  Cpu,
  Palette,
  Filter,
  X,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { AppleDevice, DeviceStatus, ProductLine, APPLE_COLORS } from '../types';

export type CategoryFilterLine =
  | ProductLine
  | 'ALL'
  | 'MACBOOK_ALL'
  | 'IPAD_ALL'
  | 'ACCESSORY_ALL';

interface CategoryFilterBarProps {
  devices: AppleDevice[];
  selectedLine: CategoryFilterLine;
  selectedChip: string;
  selectedStatus: DeviceStatus | 'ALL';
  selectedColor: string;
  searchQuery: string;
  onSelectLine: (line: CategoryFilterLine) => void;
  onSelectChip: (chip: string) => void;
  onSelectStatus: (status: DeviceStatus | 'ALL') => void;
  onSelectColor: (color: string) => void;
  onSearchChange: (q: string) => void;
  onResetFilters: () => void;
  onOpenPostGenerator?: () => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  devices,
  selectedLine,
  selectedChip,
  selectedStatus,
  selectedColor,
  searchQuery,
  onSelectLine,
  onSelectChip,
  onSelectStatus,
  onSelectColor,
  onSearchChange,
  onResetFilters,
  onOpenPostGenerator,
}) => {
  // Lấy danh sách màu sắc thực tế trong kho và các màu Apple chuẩn
  const colorCountMap = new Map<string, number>();
  devices.forEach((d) => {
    const c = (d.color || '').trim();
    if (c) {
      colorCountMap.set(c, (colorCountMap.get(c) || 0) + 1);
    }
  });

  const availableColorsInStock = Array.from(colorCountMap.keys()).sort();
  const allOptionColors = Array.from(
    new Set([...availableColorsInStock, ...APPLE_COLORS])
  );

  const countByLine = (lineId: CategoryFilterLine) => {
    if (lineId === 'ALL') return devices.length;
    if (lineId === 'MACBOOK_ALL') return devices.filter((d) => d.deviceType === 'MacBook').length;
    if (lineId === 'IPAD_ALL') return devices.filter((d) => d.deviceType === 'iPad').length;
    if (lineId === 'ACCESSORY_ALL') return devices.filter((d) => d.deviceType === 'Khác').length;
    return devices.filter((d) => d.productLine === lineId).length;
  };

  const hasActiveFilters =
    selectedLine !== 'ALL' ||
    selectedChip !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedColor !== 'ALL' ||
    searchQuery.trim() !== '';

  return (
    <section className="bg-white/95 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white backdrop-blur-md relative sm:sticky sm:top-[69px] z-20 shadow-xs dark:shadow-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-2.5">
          {/* 1. Ô tìm kiếm đa năng */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo Serial, Cấu hình, Màu sắc, Người bán/lấy..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 2. Cụm các Dropdown phân loại & bộ lọc: Lưới 2x2 trên điện thoại, hàng ngang trên máy tính */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Dropdown 1: Phân loại / Dòng máy */}
            <div className="relative min-w-0">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600 dark:text-blue-400">
                <Laptop className="w-3.5 h-3.5" />
              </div>
              <select
                value={selectedLine}
                onChange={(e) => onSelectLine(e.target.value as CategoryFilterLine)}
                className={`w-full sm:w-auto pl-8 pr-6 py-2 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer appearance-none truncate ${
                  selectedLine !== 'ALL'
                    ? 'bg-blue-50 text-blue-800 border-blue-400 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
                title="Chọn phân loại hoặc dòng máy"
              >
                <option value="ALL">✨ Tất cả ({countByLine('ALL')})</option>
                <optgroup label="💻 Nhóm MacBook">
                  <option value="MACBOOK_ALL">Toàn bộ MacBook ({countByLine('MACBOOK_ALL')})</option>
                  <option value="MacBook Air">MacBook Air ({countByLine('MacBook Air')})</option>
                  <option value="MacBook Pro">MacBook Pro ({countByLine('MacBook Pro')})</option>
                  <option value="MacBook Neo">MacBook Neo ({countByLine('MacBook Neo')})</option>
                </optgroup>
                <optgroup label="📱 Nhóm iPad">
                  <option value="IPAD_ALL">Toàn bộ iPad ({countByLine('IPAD_ALL')})</option>
                  <option value="iPad Pro">iPad Pro ({countByLine('iPad Pro')})</option>
                  <option value="iPad Air">iPad Air ({countByLine('iPad Air')})</option>
                  <option value="iPad Gen">iPad Gen ({countByLine('iPad Gen')})</option>
                  <option value="iPad Mini">iPad Mini ({countByLine('iPad Mini')})</option>
                </optgroup>
                <optgroup label="⌨️ Phụ kiện &amp; Khác">
                  <option value="ACCESSORY_ALL">Toàn bộ Phụ kiện ({countByLine('ACCESSORY_ALL')})</option>
                  <option value="Magic Keyboard">Magic Keyboard ({countByLine('Magic Keyboard')})</option>
                  <option value="Apple Pencil">Apple Pencil ({countByLine('Apple Pencil')})</option>
                  <option value="Magic Mouse">Magic Mouse / Trackpad</option>
                  <option value="AirPods">Tai nghe AirPods</option>
                  <option value="Sạc & Cáp">Sạc &amp; Cáp</option>
                  <option value="Phụ kiện khác">Phụ kiện khác</option>
                </optgroup>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Dropdown 2: Dòng Chip Apple */}
            <div className="relative min-w-0">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <select
                value={selectedChip}
                onChange={(e) => onSelectChip(e.target.value)}
                className={`w-full sm:w-auto pl-8 pr-6 py-2 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer appearance-none truncate ${
                  selectedChip !== 'ALL'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
                title="Lọc theo dòng Chip xử lý"
              >
                <option value="ALL">⚙️ Tất cả Chip</option>
                <option value="M5_GROUP">Apple M5</option>
                <option value="M4_GROUP">Apple M4</option>
                <option value="M3_GROUP">Apple M3</option>
                <option value="M2_GROUP">Apple M2</option>
                <option value="M1_GROUP">Apple M1</option>
                <option value="A18 Pro">A18 Pro (Neo)</option>
                <option value="A-Series">A-Series (iPad)</option>
                <option value="Intel">Intel Core</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Dropdown 3: Trạng thái máy (Sẵn hàng, Đã cọc, Đã bán) */}
            <div className="relative min-w-0">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => onSelectStatus(e.target.value as DeviceStatus | 'ALL')}
                className={`w-full sm:w-auto pl-8 pr-6 py-2 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer appearance-none truncate ${
                  selectedStatus !== 'ALL'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
                title="Lọc theo trạng thái kho"
              >
                <option value="ALL">📦 Tất cả</option>
                <option value="available">🟢 Sẵn hàng</option>
                <option value="deposited">🟡 Đã cọc</option>
                <option value="sold">🔴 Đã bán</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Dropdown 4: Lọc theo Màu sắc */}
            <div className="relative min-w-0">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-600 dark:text-purple-400">
                <Palette className="w-3.5 h-3.5" />
              </div>
              <select
                value={selectedColor}
                onChange={(e) => onSelectColor(e.target.value)}
                className={`w-full sm:w-auto pl-8 pr-6 py-2 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer appearance-none truncate ${
                  selectedColor !== 'ALL'
                    ? 'bg-purple-50 text-purple-800 border-purple-400 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-500'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
                title="Lọc theo màu sắc máy"
              >
                <option value="ALL">🎨 Mọi màu sắc</option>
                {allOptionColors.map((col) => {
                  const count = colorCountMap.get(col) || 0;
                  return (
                    <option
                      key={col}
                      value={col}
                      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {col} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Nút Tạo bài đăng FB nhanh */}
            {onOpenPostGenerator && (
              <button
                type="button"
                onClick={onOpenPostGenerator}
                className="col-span-2 sm:col-span-1 shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-sm shadow-blue-500/25 transition cursor-pointer active:scale-95"
                title="Tạo bài đăng Facebook từ các máy đang lọc"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Đăng FB</span>
              </button>
            )}

            {/* Nút Xóa lọc nếu có bộ lọc đang bật */}
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="col-span-2 sm:col-span-1 shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer shadow-xs active:scale-95"
                title="Bỏ tất cả bộ lọc để xem toàn bộ máy"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
