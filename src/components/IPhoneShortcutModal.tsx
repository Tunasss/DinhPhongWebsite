import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  ArrowDown,
  Compass,
} from 'lucide-react';

interface IPhoneShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (msg: string) => void;
}

export const IPhoneShortcutModal: React.FC<IPhoneShortcutModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{
    isIOS: boolean;
    isSafari: boolean;
    isInAppBrowser: boolean;
    isAndroid: boolean;
  }>({
    isIOS: false,
    isSafari: false,
    isInAppBrowser: false,
    isAndroid: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Nhận diện thiết bị
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isInAppBrowser = /FBAN|FBAV|Instagram|Line|Zalo|TikTok|MicroMessenger/i.test(ua);
    const isSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua) && !isInAppBrowser;
    const isAndroid = /Android/i.test(ua);

    setDeviceInfo({ isIOS, isSafari, isInAppBrowser, isAndroid });

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      onNotify?.('Đã sao chép link website! Bạn có thể dán vào trình duyệt Safari.');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      onNotify?.('Không thể tự động sao chép. Vui lòng copy trên thanh địa chỉ.');
    }
  };

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onNotify?.('Đang tiến hành cài đặt ứng dụng...');
        onClose();
      }
      setDeferredPrompt(null);
    } else {
      onNotify?.('Hãy nhấn vào menu 3 chấm (⋮) của Chrome và chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header với Icon quả táo & Background Gradient */}
        <div className="relative p-5 pb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 p-[1.5px] shadow-lg shadow-pink-500/25 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden p-1 shadow-inner">
                <img
                  src="/dp-logo.png"
                  alt="Đình Phong Store"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/30 mb-1">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>Phím tắt Màn hình chính iPhone</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                Cài Đặt App Đình Phong Apple
              </h2>
              <p className="text-xs text-slate-300 font-normal">
                Mở 1 chạm như App Store • Không tốn dung lượng máy
              </p>
            </div>
          </div>
        </div>

        {/* Nội dung hướng dẫn chi tiết */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
          {/* Cảnh báo nếu đang mở trong In-app browser (Zalo/Facebook) */}
          {deviceInfo.isInAppBrowser && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="font-bold flex items-center gap-2 text-xs">
                <Compass className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bạn đang mở website trong Zalo / Facebook / Messenger</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Trình duyệt trong Zalo/Facebook không hỗ trợ tạo icon ra màn hình chính. Vui lòng bấm <b>Sao chép link</b> bên dưới rồi mở trình duyệt <b>Safari</b> trên iPhone và dán vào.
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? '✓ Đã sao chép link!' : 'Sao chép link web để dán vào Safari'}</span>
              </button>
            </div>
          )}

          {/* 3 Bước hướng dẫn chuẩn iOS Safari */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <span>Hướng dẫn 3 bước thêm vào iPhone (Safari):</span>
            </div>

            {/* Bước 1 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 transition">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm shadow-blue-500/30">
                1
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Nhấn vào nút Chia sẻ</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
                    <Share className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ở thanh menu công cụ dưới cùng của Safari (hoặc góc trên nếu dùng iPad), nhấn vào biểu tượng <b>Chia sẻ</b> (hình vuông có mũi tên trỏ lên <Share className="w-3 h-3 inline-block" />).
                </p>
              </div>
            </div>

            {/* Bước 2 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 transition">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm shadow-indigo-500/30">
                2
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Chọn &quot;Thêm vào MH chính&quot;</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cuộn menu vừa hiện lên xuống phía dưới, tìm và nhấn chọn dòng có biểu tượng dấu cộng: <b>&quot;Thêm vào MH chính&quot;</b> (Add to Home Screen).
                </p>
              </div>
            </div>

            {/* Bước 3 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 transition">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm shadow-emerald-500/30">
                3
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Nhấn nút &quot;Thêm&quot; (Add)</span>
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Thêm
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Nhấn nút <b>&quot;Thêm&quot;</b> ở góc trên bên phải màn hình. Biểu tượng <b>Đình Phong Apple</b> sẽ xuất hiện ngay trên màn hình chính iPhone của bạn!
                </p>
              </div>
            </div>
          </div>

          {/* Dành cho Android */}
          {deviceInfo.isAndroid && (
            <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 space-y-2">
              <div className="font-bold text-cyan-900 dark:text-cyan-300 text-xs flex items-center justify-between">
                <span>🤖 Dành cho điện thoại Android (Chrome):</span>
                {deferredPrompt && (
                  <button
                    type="button"
                    onClick={handleAndroidInstall}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Cài đặt ngay
                  </button>
                )}
              </div>
              <p className="text-[11px] text-cyan-800 dark:text-cyan-400">
                Nhấn vào biểu tượng <b>3 chấm dọc (⋮)</b> ở góc trên trình duyệt Chrome &gt; Chọn <b>&quot;Cài đặt ứng dụng&quot;</b> hoặc <b>&quot;Thêm vào màn hình chính&quot;</b>.
              </p>
            </div>
          )}

          {/* Lợi ích khi thêm ra màn hình chính */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              Mở ứng dụng ở chế độ <b>toàn màn hình (Standalone)</b>, tự động ghi nhớ tài khoản đăng nhập, tra cứu kho máy siêu tốc mà không bị vướng thanh URL trình duyệt.
            </div>
          </div>
        </div>

        {/* Footer Thao tác */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-blue-500" />
            <span>{copied ? '✓ Đã sao chép link' : 'Sao chép link web'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition cursor-pointer"
          >
            <span>Đã hiểu, đóng lại</span>
          </button>
        </div>
      </div>
    </div>
  );
};

