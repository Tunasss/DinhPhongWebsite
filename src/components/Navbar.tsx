import React, { useState, useEffect, useRef } from 'react';
import {
  Laptop,
  Plus,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Cloud,
  FolderOpen,
  ExternalLink,
  FileSpreadsheet,
  AlertTriangle,
  LogOut,
  Users,
  Sun,
  Moon,
  ChevronDown,
  KeyRound,
} from 'lucide-react';
import { AppleDevice, AppSettings } from '../types';
import { formatCurrencyVND } from '../utils/mobileDownload';
import { getDriveFolderLink } from '../services/storageService';
import { User } from '../services/authService';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface NavbarProps {
  devices: AppleDevice[];
  settings: AppSettings;
  isSyncing: boolean;
  isCloudConnected: boolean;
  sheetUrl?: string;
  currentUser: User;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleImportPrice: () => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenUserManagement?: () => void;
  onOpenChangePassword?: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  devices,
  settings,
  isSyncing,
  isCloudConnected,
  sheetUrl,
  currentUser,
  theme,
  onToggleTheme,
  onToggleImportPrice,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenUserManagement,
  onOpenChangePassword,
  onLogout,
  onRefresh,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const [isCloudMenuOpen, setIsCloudMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const cloudMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cloudMenuRef.current && !cloudMenuRef.current.contains(event.target as Node)) {
        setIsCloudMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useGSAP(
    () => {
      gsap.from('.nav-element', {
        y: -10,
        opacity: 0,
        duration: 0.45,
        stagger: 0.04,
        ease: 'power2.out',
      });
    },
    { scope: navRef }
  );

  const availableDevices = devices.filter((d) => d.status === 'available');
  const depositedDevices = devices.filter((d) => d.status === 'deposited');
  const soldDevices = devices.filter((d) => d.status === 'sold');

  const totalStockValue = availableDevices.reduce(
    (sum, item) => sum + (Number(item.importPrice) || 0),
    0
  );
  const totalExpectedRevenue = availableDevices.reduce(
    (sum, item) => sum + (Number(item.salePrice) || 0),
    0
  );

  const rootDriveUrl = getDriveFolderLink(settings.driveRootFolderId);
  const hasScriptUrl = !!settings.gasWebAppUrl.trim();
  const isAdmin = currentUser.role === 'admin';

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/90 text-slate-900 dark:text-white shadow-sm dark:shadow-xl backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Tên Shop */}
          <div className="nav-element flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Laptop className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  {settings.shopName || 'Đình Phong Apple'}
                </h1>
                <button
                  type="button"
                  onClick={onOpenSettingsModal}
                  className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                    hasScriptUrl && isCloudConnected
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse'
                  }`}
                  title="Bấm để mở cấu hình Google Drive & Sheet"
                >
                  {hasScriptUrl ? (
                    <>
                      <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Đã nối Cloud</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Nối Google Drive</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Hệ thống Quản lý Kho &amp; Bán hàng chuyên nghiệp
              </p>
            </div>
          </div>

          {/* Cụm nút thao tác tinh gọn & Menu dạng dropdown hiện đại */}
          <div className="nav-element flex items-center gap-2 shrink-0">
            {/* 1. Nút Đồng bộ Dữ liệu */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isSyncing}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 shadow-xs disabled:opacity-50"
              title="Đồng bộ dữ liệu từ Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
              <span className="hidden md:inline">{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ'}</span>
            </button>

            {/* 2. Menu Dữ liệu Cloud & Lưu trữ */}
            <div ref={cloudMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsCloudMenuOpen((prev) => !prev);
                  setIsProfileMenuOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shadow-xs ${
                  isCloudMenuOpen
                    ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-slate-800 dark:text-blue-400 dark:border-blue-500/50'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700/80'
                }`}
                title="Dữ liệu Google Sheet & Google Drive"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Drive &amp; Sheet</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isCloudMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCloudMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/60 p-2 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Lưu trữ &amp; Dữ liệu gốc
                  </div>
                  <div className="p-1 space-y-1">
                    <a
                      href={
                        sheetUrl ||
                        'https://docs.google.com/spreadsheets/d/1hrn38CRokXNRRMQalwelBXLuYplY_2-m2Uybpz-9sQI/edit'
                      }
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsCloudMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 transition text-xs font-semibold group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div>Google Sheet Thô</div>
                          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-normal">
                            Bảng tính Excel tổng kho
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                    </a>

                    <a
                      href={rootDriveUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsCloudMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-900 dark:text-amber-300 transition text-xs font-semibold group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                          <FolderOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <div>Thư mục Drive Gốc</div>
                          <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-normal">
                            Chứa folder con từng máy
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCloudMenuOpen(false);
                        onOpenSettingsModal();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition text-xs font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div>Cài đặt liên kết Drive</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Đổi Apps Script &amp; API Key
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Nút Nhập sản phẩm (CTA nổi bật nhất) */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition cursor-pointer transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nhập sản phẩm</span>
            </button>

            {/* 4. Menu Tài Khoản & Cài Đặt (Profile & Settings Dropdown) */}
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen((prev) => !prev);
                  setIsCloudMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition cursor-pointer shadow-xs ${
                  isProfileMenuOpen
                    ? 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                    : 'bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700/80'
                }`}
                title="Tài khoản & Tùy chọn hệ thống"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase text-white shadow-xs ${
                    isAdmin
                      ? 'bg-gradient-to-tr from-amber-600 to-amber-500'
                      : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                  }`}
                >
                  {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[110px] leading-tight">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                    {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/70 p-2 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Header tài khoản */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2 flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase text-white shadow-sm shrink-0 ${
                        isAdmin ? 'bg-amber-600' : 'bg-blue-600'
                      }`}
                    >
                      {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {currentUser.displayName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        @{currentUser.username}
                      </div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          isAdmin
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
                      </span>
                    </div>
                  </div>

                  {/* Mục Tùy chỉnh Hiển thị */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        onToggleTheme();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {theme === 'dark' ? (
                          <Sun className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Moon className="w-4 h-4 text-blue-600" />
                        )}
                        <span>Chế độ: {theme === 'dark' ? 'Giao diện Tối' : 'Giao diện Sáng'}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {theme === 'dark' ? 'Đang bật Tối' : 'Đang bật Sáng'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleImportPrice();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {settings.showImportPrice ? (
                          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-500" />
                        )}
                        <span>Hiển thị Giá vốn</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          settings.showImportPrice
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {settings.showImportPrice ? 'Đang Hiện' : 'Đang Ẩn'}
                      </span>
                    </button>

                    {/* Nút Đổi mật khẩu cá nhân (Dành cho mọi thành viên & Admin) */}
                    {onOpenChangePassword && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenChangePassword();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Đổi Mật Khẩu Cá Nhân</span>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Mục Quản trị viên */}
                  {isAdmin && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Quản trị hệ thống
                      </div>

                      {onOpenUserManagement && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenUserManagement();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-900 dark:text-purple-300 transition text-xs font-semibold cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span>Quản lý Tài Khoản Đăng Nhập</span>
                          </div>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenSettingsModal();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition text-xs font-semibold cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span>Cài đặt Hệ thống &amp; Drive</span>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Đăng xuất */}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-xs font-bold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thanh thống kê nhanh kho hàng */}
        <div className="nav-element grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Sẵn hàng:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
              {availableDevices.length} máy
            </span>
          </div>
          <div className="bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Đã cọc / Đã bán:</span>
            <span className="font-bold text-amber-700 dark:text-amber-300">
              {depositedDevices.length} cọc • {soldDevices.length} bán
            </span>
          </div>
          <div className="bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Tổng vốn tồn:</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-100">
              {settings.showImportPrice ? formatCurrencyVND(totalStockValue) : '••••••••'}
            </span>
          </div>
          <div className="bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Tổng giá niêm yết:</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400">
              {formatCurrencyVND(totalExpectedRevenue)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
