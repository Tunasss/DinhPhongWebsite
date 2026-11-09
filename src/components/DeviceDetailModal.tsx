import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FolderOpen,
  Edit3,
  Trash2,
  Sparkles,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { AppleDevice, DeviceStatus } from '../types';
import {
  buildDeviceShareText,
  downloadAllDeviceImages,
  prefetchDeviceImages,
  formatCurrencyVND,
} from '../utils/mobileDownload';
import { formatWarrantySummary } from '../services/storageService';
import { SHOP_DRIVE_ROOT_FOLDER_URL } from '../data/mockDevices';
import { StaffSelect } from './StaffSelect';

interface DeviceDetailModalProps {
  device: AppleDevice | null;
  showImportPrice: boolean;
  onClose: () => void;
  onEdit: (device: AppleDevice) => void;
  onDelete: (id: string) => void;
  onQuickStatusChange: (
    id: string,
    status: DeviceStatus,
    sellerName: string,
    delivererName: string
  ) => void;
  onNotify: (msg: string) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  showImportPrice,
  onClose,
  onEdit,
  onDelete,
  onQuickStatusChange,
  onNotify,
}) => {
  if (!device) return null;

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sellerInput, setSellerInput] = useState(
    device.sellerName === 'Chưa bán' ? '' : device.sellerName
  );
  const [delivererInput, setDelivererInput] = useState(
    device.delivererName === 'Chưa giao' ? '' : device.delivererName
  );
  const [copiedPost, setCopiedPost] = useState(false);

  const currentImg = device.images?.[selectedImageIdx] || device.images?.[0];
  const driveLink = device.driveFolderUrl || SHOP_DRIVE_ROOT_FOLDER_URL;

  // Tải trước ảnh vào RAM ngay khi mở chi tiết máy để sẵn sàng cho lệnh lưu 1 chạm (0ms delay)
  useEffect(() => {
    if (device && device.images && device.images.length > 0) {
      prefetchDeviceImages(device);
    }
  }, [device]);

  const handleDownloadAll = async () => {
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      const res = await downloadAllDeviceImages(device, onNotify);
      if (res.count > 0) {
        onNotify(
          res.method === 'share'
            ? `Đã mở menu lưu ${res.count} ảnh vào Album điện thoại!`
            : `Đã tải về ${res.count} ảnh của máy ${device.serial}!`
        );
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi tải ảnh');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyShareText = () => {
    navigator.clipboard.writeText(buildDeviceShareText(device));
    setCopiedPost(true);
    onNotify('Đã copy bài đăng báo khách!');
    setTimeout(() => setCopiedPost(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white overflow-hidden max-h-[94vh] flex flex-col transition-colors"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-blue-600 font-mono text-xs font-bold tracking-wider shrink-0 text-white">
              {device.serial}
            </span>
            <h2 className="font-bold text-sm sm:text-base truncate">{device.title}</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onEdit(device)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Sửa
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Xóa máy ${device.title} (${device.serial}) khỏi kho?`)) {
                  onDelete(device.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
              title="Xóa máy"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái: Bộ sưu tập ảnh & Nút tải nhanh trên điện thoại */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              {currentImg ? (
                <img
                  src={currentImg.url}
                  alt={device.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  Chưa có hình ảnh
                </div>
              )}

              {currentImg?.isSpecImage && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-indigo-600/90 text-white text-xs font-semibold shadow-sm">
                  Ảnh chụp thông tin máy {currentImg.specSlot ? `#${currentImg.specSlot}` : ''}
                </span>
              )}
            </div>

            {/* Danh sách ảnh thu nhỏ */}
            {device.images && device.images.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {device.images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-18 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                      idx === selectedImageIdx
                        ? 'border-blue-600 ring-2 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Hộp tải ảnh tối ưu cho điện thoại iOS/Android & Google Drive */}
            <div className="bg-blue-50/90 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                    Tải ảnh nhanh về Điện thoại &amp; Folder Drive theo Serial
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-md">
                  /{device.serial}/
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadAll}
                  disabled={isDownloading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isDownloading
                      ? 'Đang chuẩn bị ảnh...'
                      : `Lưu cả ${device.images?.length || 0} ảnh về Điện thoại`}
                  </span>
                </button>

                <a
                  href={driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                >
                  <FolderOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Mở Folder Drive ({device.serial})</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                Mẹo trên iPhone/Android: Bấm nút <b>"Lưu cả {device.images?.length || 0} ảnh"</b>{' '}
                sẽ mở menu chia sẻ hệ thống, chọn <b>"Lưu {device.images?.length || 0} hình ảnh"</b>{' '}
                để lưu thẳng vào Album Ảnh mà không cần giải nén!
              </p>
            </div>
          </div>

          {/* Cột phải: Chi tiết cấu hình, Ngoại hình, Nhân sự & Chốt trạng thái */}
          <div className="lg:col-span-5 space-y-4">
            {/* Giá bán & Giá vốn */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Giá bán khách</span>
                <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                  {formatCurrencyVND(device.salePrice)}
                </span>
              </div>
              {showImportPrice && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Giá nhập: {formatCurrencyVND(device.importPrice)}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Lợi nhuận:{' '}
                    {formatCurrencyVND(
                      (Number(device.salePrice) || 0) - (Number(device.importPrice) || 0)
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Mô tả ngắn tình trạng ngoại hình */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Mô tả tình trạng ngoại hình (Phân biệt máy)
              </div>
              <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed">
                {device.conditionNote || 'Chưa có mô tả ngoại hình.'}
              </p>
            </div>

            {/* Thông số kỹ thuật */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-2 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm pb-1 border-b border-slate-100 dark:border-slate-700">
                {device.deviceType === 'Khác' ? 'Thông tin phụ kiện & Bảo hành' : 'Thông số phân loại máy, Pin & Bảo hành'}
              </div>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Hạng mục:</span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{device.productLine}</span>
                </div>
                {device.deviceType !== 'Khác' && (
                  <>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Dòng Chip:</span>{' '}
                      <span className="font-semibold text-indigo-700 dark:text-indigo-400">{device.chip}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">
                        {device.deviceType === 'iPad' || !device.ram || device.ram === 'N/A'
                          ? 'Dung lượng ổ đĩa:'
                          : 'RAM / Ổ đĩa:'}
                      </span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {device.deviceType === 'iPad' || !device.ram || device.ram === 'N/A'
                          ? device.storage
                          : `${device.ram} / ${device.storage}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Màn hình:</span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{device.screenSize}</span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Màu sắc:</span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{device.color}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Bảo hành:</span>{' '}
                  <span
                    className={`font-semibold inline-flex items-center gap-1 ${
                      device.hasWarranty ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {formatWarrantySummary(device)}
                  </span>
                </div>
                {device.deviceType !== 'Khác' && (
                  <>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Dung lượng Pin:</span>{' '}
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {device.hasBatteryCapacity && device.batteryCapacityPercent !== undefined
                          ? `${device.batteryCapacityPercent}%`
                          : 'Không hiển thị'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Số lần sạc:</span>{' '}
                      <span className="font-bold text-teal-700 dark:text-teal-400">
                        {device.hasBatteryCycle && device.batteryCycleCount !== undefined
                          ? `${device.batteryCycleCount} lần (Chu kỳ)`
                          : 'Không hiển thị'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Nhân sự phụ trách máy */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm pb-1 border-b border-slate-100 dark:border-slate-700">
                Nhân sự phụ trách (Lấy • Kiếm • Bán • Giao)
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">1. Người lấy máy</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {device.receiverName || '—'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">2. Người kiếm máy</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {device.sourcerName || '—'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/50">
                  <StaffSelect
                    label="3. Người bán máy"
                    value={sellerInput}
                    onChange={setSellerInput}
                    placeholder="Chưa bán"
                    defaultOptions={['Chưa bán']}
                  />
                </div>
                <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50">
                  <StaffSelect
                    label="4. Người giao máy"
                    value={delivererInput}
                    onChange={setDelivererInput}
                    placeholder="Chưa giao"
                    defaultOptions={['Chưa giao']}
                  />
                </div>
              </div>

              {/* Đổi nhanh trạng thái máy */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'available', label: 'Sẵn hàng' },
                    { id: 'deposited', label: 'Khách đã cọc' },
                    { id: 'sold', label: 'Đã bán xong' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    onClick={() =>
                      onQuickStatusChange(
                        device.id,
                        st.id,
                        sellerInput.trim() || 'Chưa bán',
                        delivererInput.trim() || 'Chưa giao'
                      )
                    }
                    className={`flex-1 py-2 px-2.5 rounded-xl font-semibold text-xs inline-flex items-center justify-center gap-1 transition cursor-pointer border ${
                      device.status === st.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {device.status === st.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Copy nhanh bài đăng */}
            <button
              onClick={handleCopyShareText}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              {copiedPost ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Đã copy nội dung báo khách!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy cấu hình &amp; giá để gửi Zalo / Facebook</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
