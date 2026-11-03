import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FolderOpen,
  Images,
  Sparkles,
  Edit3,
  Cpu,
  HardDrive,
  BatteryCharging,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Keyboard,
} from 'lucide-react';
import { AppleDevice } from '../types';
import {
  buildDeviceShareText,
  downloadAllDeviceImages,
  formatCurrencyVND,
} from '../utils/mobileDownload';
import { formatWarrantySummary } from '../services/storageService';
import { SHOP_DRIVE_ROOT_FOLDER_URL } from '../data/mockDevices';

interface DeviceCardProps {
  device: AppleDevice;
  showImportPrice: boolean;
  onSelectDevice: (device: AppleDevice) => void;
  onEditDevice: (device: AppleDevice) => void;
  onNotify: (message: string) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  showImportPrice,
  onSelectDevice,
  onEditDevice,
  onNotify,
}) => {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);

  const totalImgs = device.images?.length || 0;
  const safeIdx = totalImgs > 0 ? Math.min(activeImgIdx, totalImgs - 1) : 0;

  const mainImage =
    device.images?.[safeIdx]?.url ||
    device.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';

  const statusBadge = {
    available: {
      label: 'Sẵn hàng',
      className: 'bg-emerald-500 text-white',
    },
    deposited: {
      label: 'Đã nhận cọc',
      className: 'bg-amber-500 text-white',
    },
    sold: {
      label: 'Đã bán',
      className: 'bg-slate-600 text-white',
    },
  }[device.status];

  const handleCopySerial = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(device.serial);
    setCopiedSerial(true);
    onNotify(`Đã copy mã Serial: ${device.serial}`);
    setTimeout(() => setCopiedSerial(false), 1800);
  };

  const handleCopyPost = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = buildDeviceShareText(device);
    navigator.clipboard.writeText(text);
    setCopiedPost(true);
    onNotify(`Đã copy thông tin đăng bài máy ${device.serial}`);
    setTimeout(() => setCopiedPost(false), 1800);
  };

  const handleDownloadPhotos = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      const res = await downloadAllDeviceImages(device, (msg) => onNotify(msg));
      if (res.count > 0) {
        onNotify(
          res.method === 'share'
            ? `Đã mở lưu ${res.count} ảnh máy ${device.serial} vào điện thoại!`
            : `Đã tải xuống ${res.count} ảnh của máy ${device.serial}!`
        );
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi khi tải ảnh');
    } finally {
      setIsDownloading(false);
    }
  };

  const profit = (Number(device.salePrice) || 0) - (Number(device.importPrice) || 0);
  const driveHref = device.driveFolderUrl || SHOP_DRIVE_ROOT_FOLDER_URL;

  return (
    <article
      onClick={() => onSelectDevice(device)}
      className="device-card-item group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-xs dark:shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Khu vực hình ảnh máy */}
      <div className="relative aspect-16/10 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={mainImage}
          alt={device.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
        />

        {/* Lớp phủ trạng thái & dòng máy góc trên */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
              {device.productLine}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-black/75 text-white backdrop-blur-xs">
            <Images className="w-3 h-3" />
            {totalImgs > 0 ? `${safeIdx + 1}/${totalImgs} ảnh` : '0 ảnh'}
          </span>
        </div>

        {/* Nút chuyển ảnh Trái / Phải ngay trên thẻ nếu có > 1 ảnh */}
        {totalImgs > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIdx((prev) => (prev - 1 + totalImgs) % totalImgs);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
              title="Ảnh trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIdx((prev) => (prev + 1) % totalImgs);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
              title="Ảnh tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-xs max-w-[85%] overflow-x-auto no-scrollbar"
            >
              {device.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`w-2 h-2 rounded-full shrink-0 transition cursor-pointer ${
                    idx === safeIdx ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                  }`}
                  title={`Xem ảnh ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Nội dung thông tin máy */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2.5">
          {/* Hàng Serial + Link mở trực tiếp Folder Drive */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleCopySerial}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold tracking-wider transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Bấm để copy mã Serial"
            >
              <span>SN: {device.serial}</span>
              {copiedSerial ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              )}
            </button>

            <a
              href={driveHref}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-0.5 rounded-md truncate max-w-[175px] transition"
              title={`Mở thư mục Drive: ${device.serial}`}
            >
              <FolderOpen className="w-3 h-3 shrink-0" />
              <span className="truncate">Drive/{device.serial}</span>
            </a>
          </div>

          {/* Tên máy & Cấu hình */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              {device.title}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {device.deviceType === 'Khác' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <Keyboard className="w-3 h-3" /> Phụ kiện chính hãng
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    <Cpu className="w-3 h-3" /> {device.chip}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <HardDrive className="w-3 h-3 text-slate-500 dark:text-slate-400" />{' '}
                    {device.deviceType === 'iPad' || !device.ram || device.ram === 'N/A'
                      ? device.storage
                      : `${device.ram} / ${device.storage}`}
                  </span>
                </>
              )}
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {device.color}
              </span>

              {/* Hiển thị tách riêng Dung lượng Pin (%) & Số lần sạc */}
              {device.hasBatteryCapacity && device.batteryCapacityPercent !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <BatteryCharging className="w-3 h-3" /> Pin {device.batteryCapacityPercent}%
                </span>
              )}
              {device.hasBatteryCycle && device.batteryCycleCount !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                  <RefreshCw className="w-2.5 h-2.5" /> Sạc {device.batteryCycleCount} lần
                </span>
              )}

              {/* Nhãn Bảo hành */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                  device.hasWarranty
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                {formatWarrantySummary(device)}
              </span>
            </div>
          </div>

          {/* Mô tả ngắn tình trạng ngoại hình để phân biệt các máy cùng cấu hình */}
          <div className="rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 px-3 py-2">
            <div className="flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed line-clamp-2">
                <span className="font-semibold">Ngoại hình: </span>
                {device.conditionNote || 'Chưa có ghi chú ngoại hình'}
              </p>
            </div>
          </div>

          {/* Bảng 4 thông tin nhân sự: Người lấy, Người kiếm, Người bán, Người giao */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-200/70 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between gap-1 px-1">
              <span className="text-slate-500 dark:text-slate-400">Người lấy:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {device.receiverName || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 px-1">
              <span className="text-slate-500 dark:text-slate-400">Người kiếm:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {device.sourcerName || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 px-1">
              <span className="text-slate-500 dark:text-slate-400">Người bán:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                {device.sellerName || 'Chưa bán'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 px-1">
              <span className="text-slate-500 dark:text-slate-400">Người giao:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                {device.delivererName || 'Chưa giao'}
              </span>
            </div>
          </div>
        </div>

        {/* Giá bán & Giá vốn + Cụm nút tải ảnh nhanh trên điện thoại */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Giá bán niêm yết</span>
              <span className="text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400">
                {formatCurrencyVND(device.salePrice)}
              </span>
            </div>

            {showImportPrice && (
              <div className="text-right">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Vốn: {formatCurrencyVND(device.importPrice)}
                </span>
                <span
                  className={`text-xs font-bold ${
                    profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  Lãi: {profit >= 0 ? '+' : ''}
                  {formatCurrencyVND(profit)}
                </span>
              </div>
            )}
          </div>

          {/* 3 Nút thao tác nhanh trên điện thoại */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={handleDownloadPhotos}
              disabled={isDownloading}
              className="col-span-2 h-9 inline-flex items-center justify-center gap-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-60"
              title="Lưu tất cả ảnh của máy này về điện thoại"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {isDownloading ? 'Đang tải...' : `Tải ${totalImgs} ảnh`}
              </span>
            </button>

            <button
              onClick={handleCopyPost}
              className="col-span-2 h-9 inline-flex items-center justify-center gap-1 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Copy cấu hình + giá + tình trạng để gửi khách Zalo/FB"
            >
              {copiedPost ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Đã copy</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                  <span className="truncate">Copy bài</span>
                </>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditDevice(device);
              }}
              className="col-span-1 h-9 inline-flex items-center justify-center px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Chỉnh sửa thông tin máy"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
