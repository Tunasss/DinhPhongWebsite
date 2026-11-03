import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Laptop,
  FolderKanban,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  Keyboard,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import {
  AppleDevice,
  AppSettings,
  DeviceStatus,
  ProductLine,
} from './types';
import {
  exportDevicesToCsv,
  fetchAllDevices,
  loadLocalDevices,
  loadSettings,
  quickUpdateDeviceStatus,
  removeDeviceById,
  saveSettings,
  upsertDevice,
} from './services/storageService';
import { getCurrentUser, logout, syncUsersFromCloud, User } from './services/authService';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { Navbar } from './components/Navbar';
import { CategoryFilterBar, CategoryFilterLine } from './components/CategoryFilterBar';
import { DeviceCard } from './components/DeviceCard';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { AddEditDeviceModal } from './components/AddEditDeviceModal';
import { GoogleSetupModal } from './components/GoogleSetupModal';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export const App: React.FC = () => {
  // Trạng thái Theme (Light Mode / Dark Mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dinhphong_theme');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dinhphong_theme', theme);
  }, [theme]);

  // Trạng thái Đăng nhập hệ thống (Chỉ tài khoản được cấp mới xem được website)
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [devices, setDevices] = useState<AppleDevice[]>(() => loadLocalDevices());
  const [isInitialLoading, setIsInitialLoading] = useState(() => loadLocalDevices().length === 0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [cloudSheetUrl, setCloudSheetUrl] = useState<string | undefined>(undefined);

  // Bộ lọc kiểu trang bán hàng + quản lý nội bộ
  const [selectedLine, setSelectedLine] = useState<CategoryFilterLine>('ALL');
  const [selectedChip, setSelectedChip] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | 'ALL'>('ALL');
  const [selectedStaff, setSelectedStaff] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Trạng thái các hộp thoại (Modals)
  const [selectedDevice, setSelectedDevice] = useState<AppleDevice | null>(null);
  const [editingDevice, setEditingDevice] = useState<AppleDevice | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Thông báo nhanh (Toast)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mainContainerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const syncInventory = async (currentSettings = settings) => {
    setIsSyncing(true);
    try {
      const res = await fetchAllDevices(currentSettings);
      setDevices(res.devices);
      setIsCloudConnected(res.fromCloud || !!currentSettings.gasWebAppUrl.trim());
      if (res.sheetUrl) setCloudSheetUrl(res.sheetUrl);
    } finally {
      setIsSyncing(false);
      setIsInitialLoading(false);
    }
  };

  // Tự động đồng bộ tài khoản người dùng từ Cloud ngay khi mở trang web (trước hoặc sau đăng nhập)
  useEffect(() => {
    syncUsersFromCloud().catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser) {
      syncInventory(settings);
    }
  }, [currentUser]);

  const handleToggleImportPrice = () => {
    const next = { ...settings, showImportPrice: !settings.showImportPrice };
    setSettings(next);
    saveSettings(next);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    syncInventory(newSettings);
  };

  const handleSaveDevice = async (device: AppleDevice) => {
    setIsSyncing(true);
    try {
      const res = await upsertDevice(device, settings, (msg) => showToast(msg));
      setDevices(loadLocalDevices());
      if (res.sheetUrl) setCloudSheetUrl(res.sheetUrl);
      if (selectedDevice && selectedDevice.id === res.device.id) {
        setSelectedDevice(res.device);
      }
      if (res.syncedToCloud) {
        showToast(
          `Đã tạo Folder [${res.device.serial}] (${res.device.images.length} ảnh) & lưu vào Sheet Dữ Liệu Thô trên Google Drive!`
        );
      } else if (res.cloudError) {
        showToast(
          `Đã lưu tạm ${res.device.images.length} ảnh vào bộ nhớ cache. Lỗi Cloud: ${res.cloudError}`
        );
      } else {
        showToast(
          `Đã lưu ${res.device.images.length} ảnh vào kho & cập nhật bộ nhớ cache!`
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    const next = await removeDeviceById(id, settings);
    setDevices(next);
    showToast('Đã xóa máy khỏi kho.');
  };

  const handleQuickStatusChange = async (
    id: string,
    status: DeviceStatus,
    sellerName: string,
    delivererName: string
  ) => {
    const next = await quickUpdateDeviceStatus(
      id,
      status,
      sellerName,
      delivererName,
      settings
    );
    setDevices(next);
    const updated = next.find((d) => d.id === id) || null;
    setSelectedDevice(updated);
    showToast('Đã cập nhật trạng thái & nhân sự bán/giao!');
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    showToast('Đã đăng xuất thành công.');
  };

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      // Lọc danh mục tổng
      if (selectedLine === 'MACBOOK_ALL' && d.deviceType !== 'MacBook') return false;
      if (selectedLine === 'IPAD_ALL' && d.deviceType !== 'iPad') return false;
      if (selectedLine === 'ACCESSORY_ALL' && d.deviceType !== 'Khác') return false;

      // Lọc theo dòng máy / phụ kiện cụ thể
      if (
        selectedLine !== 'ALL' &&
        selectedLine !== 'MACBOOK_ALL' &&
        selectedLine !== 'IPAD_ALL' &&
        selectedLine !== 'ACCESSORY_ALL' &&
        d.productLine !== selectedLine
      ) {
        return false;
      }

      // Lọc Chip
      if (selectedChip !== 'ALL') {
        if (selectedChip === 'M5_GROUP' && !d.chip.startsWith('M5')) return false;
        else if (selectedChip === 'M4_GROUP' && !d.chip.startsWith('M4')) return false;
        else if (selectedChip === 'M3_GROUP' && !d.chip.startsWith('M3')) return false;
        else if (selectedChip === 'M2_GROUP' && !d.chip.startsWith('M2')) return false;
        else if (selectedChip === 'M1_GROUP' && !d.chip.startsWith('M1')) return false;
        else if (
          !['M5_GROUP', 'M4_GROUP', 'M3_GROUP', 'M2_GROUP', 'M1_GROUP'].includes(selectedChip) &&
          d.chip !== selectedChip
        ) {
          return false;
        }
      }

      // Lọc trạng thái
      if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;

      // Lọc nhân sự
      if (selectedStaff !== 'ALL') {
        const staffMatch = [
          d.receiverName,
          d.sourcerName,
          d.sellerName,
          d.delivererName,
        ].some((n) => (n || '').toLowerCase() === selectedStaff.toLowerCase());
        if (!staffMatch) return false;
      }

      // Lọc từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const haystack = [
          d.serial,
          d.title,
          d.productLine,
          d.chip,
          d.ram,
          d.storage,
          d.color,
          d.conditionNote,
          d.receiverName,
          d.sourcerName,
          d.sellerName,
          d.delivererName,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    devices,
    selectedLine,
    selectedChip,
    selectedStatus,
    selectedStaff,
    searchQuery,
  ]);

  // GSAP: Hiệu ứng Stagger reveal mượt mà cho lưới thẻ sản phẩm
  useGSAP(
    () => {
      if (!currentUser) return;
      gsap.fromTo(
        '.device-card-item',
        { y: 22, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.04,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      );
    },
    {
      scope: mainContainerRef,
      dependencies: [
        filteredDevices.length,
        selectedLine,
        selectedChip,
        selectedStatus,
        selectedStaff,
      ],
    }
  );

  const handleResetFilters = () => {
    setSelectedLine('ALL');
    setSelectedChip('ALL');
    setSelectedStatus('ALL');
    setSelectedStaff('ALL');
    setSearchQuery('');
  };

  // NẾU CHƯA ĐĂNG NHẬP: Hiển thị màn hình đăng nhập bảo vệ toàn bộ website
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Xin chào ${user.displayName}! Chúc bạn một ngày làm việc hiệu quả.`);
        }}
        shopName={settings.shopName}
      />
    );
  }

  // ĐÃ ĐĂNG NHẬP: Hiển thị giao diện kho máy đầy đủ
  return (
    <div
      ref={mainContainerRef}
      className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-blue-500 selection:text-white pb-24 sm:pb-12"
    >
      {/* Thanh điều hướng & Thống kê */}
      <Navbar
        devices={devices}
        settings={settings}
        isSyncing={isSyncing}
        isCloudConnected={isCloudConnected}
        sheetUrl={cloudSheetUrl}
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onToggleImportPrice={handleToggleImportPrice}
        onOpenAddModal={() => {
          setEditingDevice(null);
          setIsAddEditOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
        onRefresh={() => {
          syncInventory(settings);
          syncUsersFromCloud().catch(() => {});
        }}
      />

      {/* Thanh phân loại dòng máy (MacBook / iPad / Phụ kiện & Khác), Chip, Nhân sự & Tìm kiếm */}
      <CategoryFilterBar
        devices={devices}
        selectedLine={selectedLine}
        selectedChip={selectedChip}
        selectedStatus={selectedStatus}
        selectedStaff={selectedStaff}
        searchQuery={searchQuery}
        onSelectLine={setSelectedLine}
        onSelectChip={setSelectedChip}
        onSelectStatus={setSelectedStatus}
        onSelectStaff={setSelectedStaff}
        onSearchChange={setSearchQuery}
        onResetFilters={handleResetFilters}
      />

      {/* Khu vực danh sách máy */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 flex-1 space-y-4">
        {/* Cảnh báo hướng dẫn nếu chưa kết nối Google Drive */}
        {!settings.gasWebAppUrl.trim() && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <b>Chế độ Offline / Bộ nhớ đệm:</b> Dữ liệu máy &amp; ảnh hiện đang lưu trong bộ nhớ cache trình duyệt. Bấm nút bên phải để kết nối ghi trực tiếp lên Google Drive &amp; Google Sheet!
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => exportDevicesToCsv(devices)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition shadow-xs cursor-pointer"
                title="Tải toàn bộ danh sách máy ra file CSV dữ liệu thô"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Tải Sheet Dữ Liệu Thô</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <span>Nối Google Drive</span>
              </button>
            </div>
          </div>
        )}

        {/* Banner Quản lý 3 Hạng mục: MacBook, iPad & Phụ kiện */}
        <div className="rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-indigo-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs dark:shadow-md">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-amber-700 dark:text-amber-300">
                Kho Máy &amp; Phụ Kiện Đình Phong Apple:{' '}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Hỗ trợ phân loại 3 nhóm <b>MacBook</b>, <b>iPad</b> và{' '}
                <b>Phụ kiện (Magic Keyboard, Pencil...)</b>. Tự động lưu Folder Serial và Sheet dữ liệu thô!
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingDevice(null);
              setIsAddEditOpen(true);
            }}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>+ Nhập sản phẩm mới</span>
          </button>
        </div>

        {/* Lưới thẻ sản phẩm (GSAP Stagger Reveal) */}
        {isInitialLoading || (devices.length === 0 && isSyncing) ? (
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-14 text-center max-w-lg mx-auto my-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                Đang đồng bộ dữ liệu kho máy...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Hệ thống đang kết nối Google Sheets &amp; Google Drive để tải danh mục sản phẩm và hình ảnh mới nhất.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Đang kết nối Cloud Google Sheet</span>
            </div>
          </div>
        ) : filteredDevices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                showImportPrice={settings.showImportPrice}
                onSelectDevice={(d) => setSelectedDevice(d)}
                onEditDevice={(d) => {
                  setEditingDevice(d);
                  setIsAddEditOpen(true);
                }}
                onNotify={showToast}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center max-w-md mx-auto my-8 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-200 text-base">
              Không tìm thấy sản phẩm phù hợp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thử xóa bộ lọc hiện tại hoặc bấm nút Nhập máy mới để thêm sản phẩm vào kho.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer transition border border-slate-200 dark:border-slate-700"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={() => {
                  setEditingDevice(null);
                  setIsAddEditOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition shadow-md shadow-blue-600/20"
              >
                + Nhập máy mới
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Hộp thoại Xem chi tiết & Tải ảnh điện thoại */}
      <DeviceDetailModal
        device={selectedDevice}
        showImportPrice={settings.showImportPrice}
        onClose={() => setSelectedDevice(null)}
        onEdit={(d) => {
          setSelectedDevice(null);
          setEditingDevice(d);
          setIsAddEditOpen(true);
        }}
        onDelete={handleDeleteDevice}
        onQuickStatusChange={handleQuickStatusChange}
        onNotify={showToast}
      />

      {/* Hộp thoại Nhập / Sửa máy (Bước 0: 3 lựa chọn MacBook / iPad / Phụ kiện) */}
      <AddEditDeviceModal
        isOpen={isAddEditOpen}
        initialDevice={editingDevice}
        settings={settings}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingDevice(null);
        }}
        onSave={handleSaveDevice}
        onNotify={showToast}
      />

      {/* Hộp thoại Cấu hình Google Drive, Sheets & Gemini AI */}
      <GoogleSetupModal
        isOpen={isSettingsOpen}
        settings={settings}
        devices={devices}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
        onNotify={showToast}
        onSyncCompleted={() => syncInventory(loadSettings())}
      />

      {/* Hộp thoại Quản lý tài khoản đăng nhập (Chỉ dành cho Admin) */}
      {isUserManagementOpen && (
        <UserManagementModal
          isOpen={isUserManagementOpen}
          currentUser={currentUser}
          onClose={() => setIsUserManagementOpen(false)}
          onNotify={showToast}
        />
      )}

      {/* Hộp thoại Đổi mật khẩu cá nhân (Dành cho mọi thành viên) */}
      {isChangePasswordOpen && currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          currentUser={currentUser}
          onClose={() => setIsChangePasswordOpen(false)}
          onNotify={showToast}
        />
      )}

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 text-white text-xs sm:text-sm font-semibold shadow-2xl border border-slate-700 backdrop-blur-md max-w-[92vw] text-center animate-fadeIn">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
