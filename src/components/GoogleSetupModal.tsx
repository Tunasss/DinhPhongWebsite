import React, { useState } from 'react';
import {
  X,
  Cloud,
  FolderTree,
  KeyRound,
  Copy,
  Check,
  Save,
  ExternalLink,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  Rocket,
} from 'lucide-react';
import { AppleDevice, AppSettings } from '../types';
import {
  exportDevicesToCsv,
  getDriveFolderLink,
  normalizeDriveFolderId,
  syncAllLocalDevicesToGoogleDrive,
} from '../services/storageService';
import appsScriptSource from '../../google-apps-script/Code.gs?raw';

interface GoogleSetupModalProps {
  isOpen: boolean;
  settings: AppSettings;
  devices: AppleDevice[];
  onClose: () => void;
  onSaveSettings: (newSettings: AppSettings) => void;
  onNotify: (msg: string) => void;
  onSyncCompleted: () => void;
}

export const GoogleSetupModal: React.FC<GoogleSetupModalProps> = ({
  isOpen,
  settings,
  devices,
  onClose,
  onSaveSettings,
  onNotify,
  onSyncCompleted,
}) => {
  if (!isOpen) return null;

  const [shopName, setShopName] = useState(settings.shopName);
  const [gasWebAppUrl, setGasWebAppUrl] = useState(settings.gasWebAppUrl);
  const [driveRootFolderId, setDriveRootFolderId] = useState(settings.driveRootFolderId);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [organizeByCategory, setOrganizeByCategory] = useState(settings.organizeByCategory);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isPushingToDrive, setIsPushingToDrive] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>('');

  const buildUpdatedSettings = (): AppSettings => ({
    ...settings,
    shopName: shopName.trim() || 'Đình Phong Apple',
    gasWebAppUrl: gasWebAppUrl.trim(),
    driveRootFolderId: normalizeDriveFolderId(driveRootFolderId),
    geminiApiKey: geminiApiKey.trim(),
    organizeByCategory,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = buildUpdatedSettings();
    onSaveSettings(updated);
    onNotify('Đã lưu cấu hình Google Drive, Sheets & AI!');
    onClose();
  };

  const handleSaveAndPushAllToDrive = async () => {
    const updated = buildUpdatedSettings();
    onSaveSettings(updated);

    if (!updated.gasWebAppUrl) {
      onNotify('Vui lòng dán URL ứng dụng web Apps Script (https://script.google.com/macros/s/.../exec) vào ô bên dưới trước!');
      return;
    }

    setIsPushingToDrive(true);
    setPushStatus('Đang kết nối tới Google Drive (DinhPhongData)...');
    try {
      const res = await syncAllLocalDevicesToGoogleDrive(devices, updated, (msg) =>
        setPushStatus(msg)
      );
      if (res.error) {
        setPushStatus(`Lỗi: ${res.error}`);
        onNotify(`Lỗi đồng bộ Drive: ${res.error}`);
      } else {
        setPushStatus(
          `Thành công! Đã tạo file Sheet "DinhPhong_DuLieuTho_KhoMay" và ${res.syncedCount} Folder máy trong DinhPhongData!`
        );
        onNotify(
          `Đã tạo Folder & File Sheet dữ liệu thô trong DinhPhongData cho ${res.syncedCount} máy!`
        );
        onSyncCompleted();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPushStatus(`Lỗi kết nối: ${msg}`);
      onNotify(`Lỗi kết nối Apps Script: ${msg}`);
    } finally {
      setIsPushingToDrive(false);
    }
  };

  const handleCopyFullScript = () => {
    navigator.clipboard.writeText(appsScriptSource);
    setCopiedScript(true);
    onNotify('Đã copy toàn bộ mã Apps Script (Tự tạo Folder + File Sheet trong DinhPhongData)!');
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const resolvedDriveUrl = getDriveFolderLink(driveRootFolderId);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white overflow-hidden max-h-[94vh] flex flex-col transition-colors"
      >
        <div className="px-5 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-bold text-base">
                Kết nối Google Drive (DinhPhongData) &amp; File Sheet Dữ Liệu Thô
              </h2>
              <p className="text-xs text-slate-400">
                Tự động tạo Folder [Serial] + File Google Sheet "DinhPhong_DuLieuTho_KhoMay" trong
                DinhPhongData
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
          {/* Bản sao lưu dữ liệu thô (.CSV) tiện lợi */}
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Sao lưu dữ liệu: Xuất toàn bộ danh sách kho máy ra file Excel/CSV dữ liệu thô mọi lúc!
                </span>
              </div>
              <button
                type="button"
                onClick={() => exportDevicesToCsv(devices)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Tải Sheet Dữ Liệu Thô (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Hướng dẫn 3 bước cấp quyền Google Drive cho thư mục DinhPhongData */}
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-2xl p-4 space-y-3 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  2. Trên Google Drive (DinhPhongData): Làm 3 bước dưới đây (Chỉ 1 lần duy nhất)
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Để Google cho phép Web tạo Folder và tạo file Sheet vào thẳng{' '}
                  <b>Drive của tôi &gt; DinhPhongData</b> của bạn:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyFullScript}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-sm cursor-pointer transition"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã Copy mã Code.gs!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Bước 1: Bấm Copy mã Apps Script</span>
                  </>
                )}
              </button>

              <a
                href="https://script.google.com/home/start"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
              >
                <span>Bước 2: Mở Google Apps Script</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-2.5">
              <li>
                Bấm nút vàng <b>"Bước 1: Bấm Copy mã Apps Script"</b> ở trên.
              </li>
              <li>
                Bấm <b>"Bước 2: Mở Google Apps Script"</b> &rarr; Chọn <b>Dự án mới (New project)</b>{' '}
                &rarr; Xóa mã cũ và <b>Dán (Ctrl+V)</b> mã vừa copy vào &rarr; Bấm <b>Ctrl+S</b>.
              </li>
              <li>
                Bấm nút xanh <b>Triển khai (Deploy) &rarr; Tạo bản triển khai mới</b> &rarr; Chọn
                bánh răng <b>Ứng dụng web (Web app)</b> &rarr; Mục <i>Ai có quyền truy cập</i> chọn{' '}
                <b className="text-amber-300">Bất kỳ ai (Anyone)</b> &rarr; Bấm <b>Triển khai</b>{' '}
                (Cấp quyền cho tài khoản Google của bạn).
              </li>
              <li>
                Copy đường link <b>URL ứng dụng web (`https://script.google.com/macros/s/.../exec`)</b>{' '}
                dán vào ô ngay bên dưới rồi bấm nút màu xanh lá!
              </li>
            </ol>
          </div>

          {/* Ô dán URL Google Apps Script */}
          <div className="bg-blue-50/70 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-800/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-blue-950 dark:text-blue-300">
                <FolderTree className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Bước 3: Dán URL ứng dụng web Apps Script vào đây
              </span>
              <a
                href={resolvedDriveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Mở folder DinhPhongData</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <input
                type="url"
                value={gasWebAppUrl}
                onChange={(e) => setGasWebAppUrl(e.target.value)}
                placeholder="Dán link https://script.google.com/macros/s/.../exec vào đây"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-blue-400 dark:border-blue-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Nút Đẩy toàn bộ máy + Tạo Folder + Tạo File Sheet trong DinhPhongData ngay lập tức */}
            <button
              type="button"
              disabled={isPushingToDrive}
              onClick={handleSaveAndPushAllToDrive}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-60"
            >
              {isPushingToDrive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{pushStatus || 'Đang tạo Folder & Sheet trên Google Drive...'}</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>
                    Lưu &amp; Tạo ngay Folder + File Sheet Dữ Liệu Thô trong DinhPhongData ({devices.length} máy)
                  </span>
                </>
              )}
            </button>

            {pushStatus && !isPushingToDrive && (
              <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-emerald-300 dark:border-emerald-700">
                {pushStatus}
              </div>
            )}

            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ID Folder Google Drive Gốc (DinhPhongData)
              </label>
              <input
                type="text"
                value={driveRootFolderId}
                onChange={(e) => setDriveRootFolderId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>

            <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={organizeByCategory}
                onChange={(e) => setOrganizeByCategory(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Gom nhóm theo thư mục Dòng máy (Bỏ tích để tạo thẳng Folder{' '}
                <code>[Serial - Tên máy]</code> ngay ngoài <code>DinhPhongData</code>)
              </span>
            </label>
          </div>

          {/* Gemini API Key */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Gemini API Key (Tùy chọn) &amp; Tên Shop
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Gemini API Key (AIzaSy...)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
              />
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Đình Phong Apple"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu cấu hình</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
