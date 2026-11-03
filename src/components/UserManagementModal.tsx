import React, { useRef, useState } from 'react';
import {
  X,
  UserPlus,
  Shield,
  ShieldCheck,
  User,
  KeyRound,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Eye,
  EyeOff,
  Cloud,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  Download,
} from 'lucide-react';
import {
  adminResetPassword,
  createUser,
  deleteUser,
  getStoredUsers,
  updateUser,
  syncUsersFromCloud,
  pushUsersToCloud,
  exportAccountsSyncCode,
  importAccountsSyncCode,
  User as UserType,
  UserRole,
} from '../services/authService';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface UserManagementModalProps {
  isOpen: boolean;
  currentUser: UserType;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onNotify,
}) => {
  const [users, setUsers] = useState<UserType[]>(() => getStoredUsers());
  const [searchQuery, setSearchQuery] = useState('');

  // Form tạo user mới
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [newPhone, setNewPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Modal đổi mật khẩu nhanh
  const [changingPasswordUser, setChangingPasswordUser] = useState<UserType | null>(null);
  const [newPassInput, setNewPassInput] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Trạng thái đồng bộ Cloud & Mã đồng bộ đa thiết bị
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [showImportSyncCode, setShowImportSyncCode] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [copiedSyncCode, setCopiedSyncCode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!isOpen) return;
      gsap.fromTo(
        modalCardRef.current,
        { scale: 0.95, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
      );
    },
    { scope: containerRef, dependencies: [isOpen] }
  );

  if (!isOpen) return null;

  const refreshList = () => {
    setUsers(getStoredUsers());
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const res = createUser(currentUser, {
      username: newUsername,
      password: newPassword,
      displayName: newDisplayName,
      role: newRole,
      phone: newPhone,
    });

    if (res.success && res.user) {
      refreshList();
      setIsAddingNew(false);
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('staff');
      setNewPhone('');
      onNotify(`Đang lưu & đồng bộ "${res.user.displayName}" lên Google Sheets...`);
      const syncRes = await pushUsersToCloud();
      if (syncRes.success) {
        onNotify(`Đã tạo "${res.user.displayName}" và đồng bộ lên Google Sheets tab TaiKhoan_NhanSu!`);
      } else {
        onNotify(`Đã lưu "${res.user.displayName}".`);
      }
    } else {
      setFormError(res.message || 'Lỗi khi tạo tài khoản');
    }
  };

  const handleToggleActive = async (targetUser: UserType) => {
    if (targetUser.username.toUpperCase() === 'ADMIN') {
      onNotify('Không thể khóa tài khoản ADMIN mặc định.');
      return;
    }
    const nextStatus = !targetUser.isActive;
    const res = updateUser(currentUser, targetUser.id, { isActive: nextStatus });
    if (res.success) {
      refreshList();
      onNotify(
        nextStatus
          ? `Đã kích hoạt lại tài khoản ${targetUser.username}.`
          : `Đã tạm khóa tài khoản ${targetUser.username}.`
      );
      await pushUsersToCloud();
    } else {
      onNotify(res.message || 'Không thể đổi trạng thái.');
    }
  };

  const handleDelete = async (targetUser: UserType) => {
    if (targetUser.username.toUpperCase() === 'ADMIN') {
      onNotify('Không thể xóa tài khoản ADMIN gốc của hệ thống.');
      return;
    }
    if (targetUser.id === currentUser.id) {
      onNotify('Bạn không thể tự xóa tài khoản đang đăng nhập.');
      return;
    }

    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa tài khoản "${targetUser.displayName}" (${targetUser.username}) không?`
      )
    ) {
      const res = deleteUser(currentUser, targetUser.id);
      if (res.success) {
        refreshList();
        onNotify(`Đã xóa tài khoản ${targetUser.username}.`);
        await pushUsersToCloud();
      } else {
        onNotify(res.message || 'Lỗi khi xóa.');
      }
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingPasswordUser) return;

    const res = adminResetPassword(currentUser, changingPasswordUser.id, newPassInput);
    if (res.success) {
      setChangingPasswordUser(null);
      setNewPassInput('');
      refreshList();
      onNotify('Đang đồng bộ mật khẩu mới lên Google Sheets...');
      const syncRes = await pushUsersToCloud();
      if (syncRes.success) {
        onNotify(`Đã đổi mật khẩu cho @${changingPasswordUser.username} và lưu vào Google Sheet thành công!`);
      } else {
        onNotify(`Đã đổi mật khẩu thành công.`);
      }
    } else {
      onNotify(res.message || 'Đổi mật khẩu thất bại.');
    }
  };

  const handleCloudSync = async () => {
    setIsSyncingCloud(true);
    try {
      await pushUsersToCloud(users);
      const res = await syncUsersFromCloud();
      if (res.success) {
        setUsers(res.users);
        onNotify('Đã đồng bộ tài khoản với Google Sheets (tab TaiKhoan_NhanSu) thành công!');
      } else {
        onNotify(res.message || 'Chưa thể kết nối Google Sheets.');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Lỗi kết nối');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleCopySyncCode = () => {
    const code = exportAccountsSyncCode();
    navigator.clipboard.writeText(code);
    setCopiedSyncCode(true);
    onNotify('Đã copy mã đồng bộ! Bạn có thể dán mã này vào điện thoại để nhận đủ tài khoản tức thì.');
    setTimeout(() => setCopiedSyncCode(false), 2500);
  };

  const handleImportSyncCode = (e: React.FormEvent) => {
    e.preventDefault();
    const res = importAccountsSyncCode(syncCodeInput);
    if (res.success) {
      onNotify(`Đã đồng bộ thành công ${res.count} tài khoản vào thiết bị này!`);
      refreshList();
      setShowImportSyncCode(false);
      setSyncCodeInput('');
    } else {
      onNotify(res.message || 'Lỗi nhập mã đồng bộ');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        ref={modalCardRef}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl text-slate-900 dark:text-white overflow-hidden transition-colors"
      >
        {/* Top Header */}
        <div className="px-5 py-4 sm:px-6 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Quản Lý Tài Khoản Đăng Nhập</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                  Quyền Admin
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tạo mới, phân quyền và kiểm soát quyền truy cập hệ thống Đình Phong Apple
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top action row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm tài khoản, tên nhân viên, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setIsAddingNew(!isAddingNew);
                setFormError(null);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-blue-500/20 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isAddingNew ? 'Ẩn form thêm mới' : '+ Tạo tài khoản mới'}</span>
            </button>
          </div>

          {/* Thanh công cụ Đồng bộ tài khoản đa thiết bị (Google Sheets & Mã đồng bộ) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
              <Cloud className="w-4 h-4 text-blue-500" />
              <span>Đồng bộ PC ⟷ Điện thoại:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleCloudSync}
                disabled={isSyncingCloud}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
                title="Lưu hoặc lấy danh sách tài khoản từ Google Sheets (tab TaiKhoan_NhanSu)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloud ? 'Đang đồng bộ...' : 'Đồng bộ Google Sheets'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySyncCode}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold transition cursor-pointer shadow-xs"
                title="Sao chép toàn bộ tài khoản để dán sang thiết bị khác"
              >
                {copiedSyncCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Đã chép mã</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-500" />
                    <span>Chép mã đồng bộ</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowImportSyncCode(!showImportSyncCode)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold transition cursor-pointer shadow-xs"
                title="Dán mã đồng bộ được gửi từ máy khác"
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                <span>Dán mã từ máy khác</span>
              </button>
            </div>
          </div>

          {/* Form dán mã đồng bộ */}
          {showImportSyncCode && (
            <form onSubmit={handleImportSyncCode} className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-300">
                <span>Dán chuỗi mã đồng bộ tài khoản nhận từ thiết bị khác:</span>
                <button
                  type="button"
                  onClick={() => setShowImportSyncCode(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Dán mã đồng bộ vào đây (chuỗi ký tự dài)..."
                  value={syncCodeInput}
                  onChange={(e) => setSyncCodeInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                >
                  Nhập ngay
                </button>
              </div>
            </form>
          )}

          {/* Form thêm tài khoản mới */}
          {isAddingNew && (
            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-500/30 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Điền thông tin tạo tài khoản cho nhân viên / quản lý</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Tất cả tài khoản đều có quyền quản lý kho máy</span>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tên nhân viên / Hiển thị *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn Phong"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tên đăng nhập (Username) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: phong_apple"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mật khẩu khởi tạo *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Ít nhất 3 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Vai trò tài khoản
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="staff">Nhân viên (Toàn quyền quản lý máy)</option>
                      <option value="admin">Quản trị viên (Admin - Được tạo/quản lý tài khoản)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Số điện thoại liên hệ
                    </label>
                    <input
                      type="tel"
                      placeholder="VD: 0988xxxxxx"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    Xác nhận tạo tài khoản
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Danh sách tài khoản hiện có */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Danh sách tài khoản ({filteredUsers.length} tài khoản):</span>
              <span>Ai có tài khoản đều được toàn quyền thêm, sửa, xóa máy</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUsers.map((u) => {
                const isAdmin = u.role === 'admin';
                const isCurrent = u.id === currentUser.id;
                const isRoot = u.id === 'admin_root';

                return (
                  <div
                    key={u.id}
                    className={`p-4 rounded-2xl border transition relative flex flex-col justify-between gap-3 ${
                      !u.isActive
                        ? 'bg-rose-50/50 dark:bg-slate-950/60 border-rose-300 dark:border-rose-900/40 opacity-70'
                        : isCurrent
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-500/40 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base uppercase shrink-0 ${
                            isAdmin
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm'
                          }`}
                        >
                          {u.displayName ? u.displayName.charAt(0) : u.username.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {u.displayName}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white text-[10px] font-bold">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            @{u.username}
                          </div>
                          {u.phone && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              SĐT: {u.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isAdmin
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                              : 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
                        </span>
                        <div className="mt-1">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                              u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {u.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {u.lastLogin
                          ? `Đăng nhập: ${new Date(u.lastLogin).toLocaleDateString('vi-VN')}`
                          : 'Chưa đăng nhập'}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Nút đổi mật khẩu */}
                        <button
                          type="button"
                          onClick={() => {
                            setChangingPasswordUser(u);
                            setNewPassInput('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-slate-200 dark:border-slate-600"
                          title="Đổi mật khẩu"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Đổi MK</span>
                        </button>

                        {/* Nút Khóa / Mở khóa */}
                        {!isRoot && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                              u.isActive
                                ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                            }`}
                            title={u.isActive ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {u.isActive ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Khóa</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Mở</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Nút Xóa */}
                        {!isRoot && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                            title="Xóa tài khoản vĩnh viễn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal con: Đổi mật khẩu tài khoản */}
        {changingPasswordUser && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 shadow-2xl space-y-4 text-slate-900 dark:text-white">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Đổi mật khẩu: @{changingPasswordUser.username}</span>
                </h4>
                <button
                  onClick={() => setChangingPasswordUser(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu mới..."
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setChangingPasswordUser(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer transition shadow-sm"
                  >
                    Lưu mật khẩu mới
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

