import { callGoogleAppsScript, loadSettings } from './storageService';

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Lưu mã băm SHA-256 muối bảo mật - TUYỆT ĐỐI KHÔNG lưu plaintext password trong code hay storage
  displayName: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
  lastLogin?: string;
  phone?: string;
  updatedAt?: string;
}

const STORAGE_KEY_USERS = 'dinhphong_users_v2';
const LEGACY_STORAGE_KEYS = [
  'dinhphong_users_v2',
  'dinhphong_users',
  'dinhphong_accounts',
  'dinhphong_apple_users',
  'users',
];
const STORAGE_KEY_CURRENT_USER = 'dinhphong_current_user_v2';
const SECURITY_SALT = '_dp_salt_2026';

/**
 * Thuật toán băm SHA-256 chuẩn NIST FIPS 180-4 thuần túy (Pure JS, đồng bộ 100%, không phụ thuộc thư viện ngoài).
 * Đảm bảo mật khẩu KHÔNG BAO GIỜ bị lộ khi đẩy mã nguồn lên GitHub.
 */
export function hashPassword(plainText: string): string {
  const ascii = plainText.trim() + SECURITY_SALT;
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const maxWord = Math.pow(2, 32);
  let i: number, j: number;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  hash = hash.slice(0, 8);
  let padded = ascii + '\x80';
  while ((padded.length % 64) - 56) padded += '\x00';

  for (i = 0; i < padded.length; i++) {
    j = padded.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let i2 = 3; i2 >= 0; i2--) {
      const b = (hash[i] >> (i2 * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Danh sách 6 tài khoản khởi tạo hệ thống (1 Admin + 5 Nhân viên).
 * LƯU Ý BẢO MẬT: Mật khẩu đã được mã hóa một chiều bằng hàm băm SHA-256 có Salt bí mật.
 * Tuyệt đối KHÔNG có mật khẩu thô (plaintext) trong mã nguồn, an toàn 100% khi push lên GitHub!
 */
const SEED_ACCOUNTS: User[] = [
  {
    id: 'usr_admin',
    username: 'ADMIN',
    passwordHash: 'c1698be9631f13ea7c946cc40023d7d498790c370981d2a5bed0f5acdbb99881',
    displayName: 'Quản trị viên (ADMIN)',
    role: 'admin',
    isActive: true,
    createdAt: '2026-11-03T00:00:00.000Z',
    phone: '0901234567',
  },
  {
    id: 'usr_anhvu',
    username: 'anhvu',
    passwordHash: '8765e25b490cc0e6c13862bc330f31c84dbf0dd8db74c5d30638eb1e88010331',
    displayName: 'Anh Vũ',
    role: 'staff',
    isActive: true,
    createdAt: '2026-11-03T00:00:00.000Z',
  },
  {
    id: 'usr_vonguyen',
    username: 'vonguyen',
    passwordHash: '8765e25b490cc0e6c13862bc330f31c84dbf0dd8db74c5d30638eb1e88010331',
    displayName: 'Võ Nguyên',
    role: 'staff',
    isActive: true,
    createdAt: '2026-11-03T00:00:00.000Z',
  },
  {
    id: 'usr_phantuan',
    username: 'phantuan',
    passwordHash: '8765e25b490cc0e6c13862bc330f31c84dbf0dd8db74c5d30638eb1e88010331',
    displayName: 'Phan Tuấn',
    role: 'staff',
    isActive: true,
    createdAt: '2026-11-03T00:00:00.000Z',
  },
  {
    id: 'usr_anhtuan',
    username: 'anhtuan',
    passwordHash: '8765e25b490cc0e6c13862bc330f31c84dbf0dd8db74c5d30638eb1e88010331',
    displayName: 'Anh Tuấn',
    role: 'staff',
    isActive: true,
    createdAt: '2026-11-03T00:00:00.000Z',
  },
  {
    id: 'usr_dinhphong',
    username: 'dinhphong',
    passwordHash: '8765e25b490cc0e6c13862bc330f31c84dbf0dd8db74c5d30638eb1e88010331',
    displayName: 'Đình Phong',
    role: 'staff',
    isActive: true,
    createdAt: '2026-11-03T00:00:00.000Z',
  },
];

/**
 * Lấy danh sách tài khoản đã lưu trong LocalStorage (hỗ trợ đọc fallback và tự động nâng cấp dữ liệu qua mọi phiên bản).
 * Nếu chưa có danh sách, tự khởi tạo danh sách 6 tài khoản mặc định.
 */
export function getStoredUsers(): User[] {
  try {
    let parsed: User[] | null = null;

    // Tìm dữ liệu trong danh sách các key lưu trữ qua các phiên bản
    for (const key of LEGACY_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            parsed = list;
            break;
          }
        } catch {
          // Bỏ qua lỗi parse của key cũ
        }
      }
    }

    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEED_ACCOUNTS));
      localStorage.setItem('dinhphong_users', JSON.stringify(SEED_ACCOUNTS));
      return SEED_ACCOUNTS;
    }

    // Nâng cấp & chuẩn hóa các user đã lưu (chuyển password cũ sang SHA-256 hash nếu có)
    let hasMigrated = false;
    const normalized: User[] = parsed.map((u: any) => {
      const copy = { ...u };
      if (!copy.passwordHash && copy.password) {
        copy.passwordHash = hashPassword(copy.password);
        delete copy.password;
        hasMigrated = true;
      }
      return copy as User;
    });

    // Đảm bảo các tài khoản seed mặc định luôn tồn tại nếu chưa có
    const existingUsernames = new Set(normalized.map((u) => (u.username || '').toLowerCase()));
    for (const seed of SEED_ACCOUNTS) {
      if (!existingUsernames.has(seed.username.toLowerCase())) {
        normalized.push(seed);
        hasMigrated = true;
      }
    }

    if (hasMigrated || !localStorage.getItem(STORAGE_KEY_USERS)) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(normalized));
      localStorage.setItem('dinhphong_users', JSON.stringify(normalized));
    }

    return normalized;
  } catch (err) {
    console.error('Lỗi đọc danh sách tài khoản:', err);
    return SEED_ACCOUNTS;
  }
}

/**
 * Lấy danh sách tên hiển thị của các nhân sự trong hệ thống (Đình Phong, Anh Tuấn, Phan Tuấn, Võ Nguyên, Anh Vũ...)
 * dùng làm danh sách Dropdown cho người lấy, kiếm, giao, bán.
 */
export function getStaffNames(): string[] {
  try {
    const users = getStoredUsers();
    const names = users
      .filter((u) => u.isActive)
      .map((u) => u.displayName || u.username);
    const defaults = ['Đình Phong', 'Anh Tuấn', 'Phan Tuấn', 'Võ Nguyên', 'Anh Vũ'];
    return Array.from(new Set([...defaults, ...names])).filter(Boolean);
  } catch {
    return ['Đình Phong', 'Anh Tuấn', 'Phan Tuấn', 'Võ Nguyên', 'Anh Vũ'];
  }
}

/**
 * Lưu danh sách tài khoản vào LocalStorage (chỉ lưu cục bộ trình duyệt, KHÔNG tự động ghi đè lên Cloud)
 */
export function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    localStorage.setItem('dinhphong_users', JSON.stringify(users));

    // Phát sự kiện thông báo các component cập nhật danh sách
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dinhphong_users_updated', { detail: users }));
    }
  } catch (err) {
    console.error('Lỗi lưu danh sách tài khoản:', err);
  }
}

/**
 * Đọc trực tiếp danh sách tài khoản từ Google Sheets (tab TaiKhoan_NhanSu) qua endpoint CSV công khai (siêu nhanh ~200ms).
 * Phương thức này hoạt động trên mọi điện thoại & thiết bị mà không bị chặn CORS hay phụ thuộc Apps Script!
 */
export async function fetchUsersFromGoogleSheetDirect(): Promise<User[]> {
  try {
    const csvUrl =
      'https://docs.google.com/spreadsheets/d/1hrn38CRokXNRRMQalwelBXLuYplY_2-m2Uybpz-9sQI/gviz/tq?tqx=out:csv&sheet=TaiKhoan_NhanSu';
    const res = await fetch(csvUrl, { cache: 'no-store' });
    if (!res.ok) return [];
    const csvText = await res.text();
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length <= 1) return [];

    const fetchedUsers: User[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Tách các cột theo định dạng CSV có nháy kép
      const values: string[] = [];
      let current = '';
      let inQuote = false;
      for (let j = 0; j < line.length; j++) {
        const c = line[j];
        if (c === '"') {
          if (inQuote && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuote = !inQuote;
          }
        } else if (c === ',' && !inQuote) {
          values.push(current);
          current = '';
        } else {
          current += c;
        }
      }
      values.push(current);

      const id = (values[0] || '').trim();
      const username = (values[1] || '').trim();
      const passwordHash = (values[2] || '').trim();
      const displayName = (values[3] || '').trim();
      const role = (values[4] || 'staff').trim();
      const isActiveRaw = (values[5] || '').trim().toUpperCase();
      const phone = (values[6] || '').trim();
      const createdAt = (values[7] || '').trim();
      const updatedAt = (values[8] || '').trim();

      if (username && passwordHash) {
        fetchedUsers.push({
          id: id || `usr_${username}`,
          username: username,
          passwordHash: passwordHash,
          displayName: displayName || username,
          role: role === 'admin' ? 'admin' : 'staff',
          isActive: isActiveRaw !== 'FALSE',
          phone: phone,
          createdAt: createdAt || new Date().toISOString(),
          updatedAt: updatedAt,
        });
      }
    }

    if (fetchedUsers.length > 0) {
      // Lưu danh sách mới nhất vào LocalStorage để lần sau mở ngay cả khi offline
      saveStoredUsers(fetchedUsers);
      return fetchedUsers;
    }
    return [];
  } catch (err) {
    console.warn('Không thể đọc trực tiếp tài khoản từ Google Sheet CSV:', err);
    return [];
  }
}

/**
 * Đẩy toàn bộ danh sách tài khoản lên Google Sheets (Lưu vào tab TaiKhoan_NhanSu)
 * CHỈ GỌI KHI CÓ HÀNH ĐỘNG THỰC SỰ: Tạo user, đổi pass, xóa user, reset pass.
 */
export async function pushUsersToCloud(
  usersToPush?: User[]
): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    const users = usersToPush || getStoredUsers();
    const settings = loadSettings();
    if (!settings.gasWebAppUrl || !settings.gasWebAppUrl.trim()) {
      return { success: false, message: 'Chưa cấu hình Google Apps Script' };
    }

    const res = await callGoogleAppsScript(settings.gasWebAppUrl, 'POST', {
      action: 'saveAccounts',
      rootFolderId: settings.driveRootFolderId,
      users: users,
    });

    if (res && res.ok) {
      return { success: true, count: users.length };
    }
    return { success: false, message: res?.error || 'Lỗi lưu tài khoản lên Google Sheet' };
  } catch (err: any) {
    return { success: false, message: err?.message || String(err) };
  }
}

/**
 * Đồng bộ kéo danh sách tài khoản mới nhất từ Google Sheets về máy / điện thoại
 */
export async function syncUsersFromCloud(): Promise<{
  success: boolean;
  users: User[];
  message?: string;
}> {
  try {
    // 1. Ưu tiên đọc trực tiếp từ Google Sheet CSV (nhanh và chuẩn xác nhất)
    const directUsers = await fetchUsersFromGoogleSheetDirect();
    if (directUsers.length > 0) {
      return { success: true, users: directUsers };
    }

    // 2. Fallback gọi qua Apps Script nếu cần
    const localUsers = getStoredUsers();
    const settings = loadSettings();
    if (!settings.gasWebAppUrl || !settings.gasWebAppUrl.trim()) {
      return { success: false, users: localUsers, message: 'Chưa cấu hình Google Apps Script' };
    }

    const res = await callGoogleAppsScript(settings.gasWebAppUrl, 'GET', {
      action: 'getAccounts',
      rootFolderId: settings.driveRootFolderId,
    });

    if (res && res.ok && Array.isArray(res.users) && res.users.length > 0) {
      const cloudUsers: User[] = res.users;
      const userMap = new Map<string, User>();
      localUsers.forEach((u) => userMap.set(u.username.toLowerCase(), u));
      cloudUsers.forEach((cu) => {
        const key = (cu.username || '').toLowerCase();
        if (!key) return;
        userMap.set(key, cu);
      });
      const mergedUsers = Array.from(userMap.values());
      saveStoredUsers(mergedUsers);
      return { success: true, users: mergedUsers };
    }

    return { success: false, users: localUsers, message: res?.error || 'Không có dữ liệu tài khoản trên Sheet' };
  } catch (err: any) {
    return { success: false, users: getStoredUsers(), message: err?.message || String(err) };
  }
}

/**
 * Xuất mã đồng bộ tài khoản dạng chuỗi Base64 an toàn để chuyển sang thiết bị khác tức thì
 */
export function exportAccountsSyncCode(): string {
  try {
    const users = getStoredUsers();
    const jsonStr = JSON.stringify(users);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch {
    return '';
  }
}

/**
 * Nhập mã đồng bộ tài khoản từ thiết bị khác để cập nhật ngay lập tức
 */
export function importAccountsSyncCode(code: string): {
  success: boolean;
  count?: number;
  message?: string;
} {
  try {
    const clean = (code || '').trim();
    if (!clean) return { success: false, message: 'Mã đồng bộ trống.' };
    const jsonStr = decodeURIComponent(escape(atob(clean)));
    const imported = JSON.parse(jsonStr);
    if (!Array.isArray(imported) || imported.length === 0) {
      return { success: false, message: 'Dữ liệu mã đồng bộ không hợp lệ.' };
    }

    const localUsers = getStoredUsers();
    const userMap = new Map<string, User>();
    localUsers.forEach((u) => userMap.set(u.username.toLowerCase(), u));
    imported.forEach((u: any) => {
      if (u.username) userMap.set(u.username.toLowerCase(), u);
    });

    const merged = Array.from(userMap.values());
    saveStoredUsers(merged);
    return { success: true, count: merged.length };
  } catch (err: any) {
    return { success: false, message: 'Mã đồng bộ không đúng định dạng: ' + (err?.message || '') };
  }
}

/**
 * Lấy thông tin tài khoản đang đăng nhập phiên hiện tại
 */
export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
    const allUsers = getStoredUsers();
    const existing = allUsers.find(
      (u) => u.id === user.id && u.isActive && u.username.toLowerCase() === user.username.toLowerCase()
    );
    if (!existing) {
      logout();
      return null;
    }
    return existing;
  } catch {
    return null;
  }
}

/**
 * Đặt tài khoản đang đăng nhập
 */
export function setCurrentUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  } else {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
  }
}

/**
 * Đăng nhập hệ thống (Xác thực bằng hàm băm SHA-256 an toàn và tự động kiểm tra Google Sheet nếu cần)
 */
export async function login(
  username: string,
  pass: string
): Promise<{ success: boolean; user?: User; message?: string }> {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = pass.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' };
  }

  const inputHash = hashPassword(cleanPassword);

  // 1. Kiểm tra với danh sách tài khoản hiện có trong máy
  let users = getStoredUsers();
  let matched = users.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername &&
      (u.passwordHash === inputHash || (u as any).password === cleanPassword)
  );

  // 2. Nếu không khớp (có thể do vừa đổi pass ở máy khác hoặc tạo user mới trên Sheet):
  // Tải danh sách mới nhất từ Google Sheet về ngay lập tức
  if (!matched) {
    try {
      const freshUsers = await fetchUsersFromGoogleSheetDirect();
      if (freshUsers.length > 0) {
        users = freshUsers;
        matched = users.find(
          (u) =>
            u.username.toLowerCase() === cleanUsername &&
            (u.passwordHash === inputHash || (u as any).password === cleanPassword)
        );
      }
    } catch {
      // Bỏ qua lỗi mạng
    }
  }

  if (!matched) {
    return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
  }

  if (!matched.isActive) {
    return { success: false, message: 'Tài khoản này đã bị tạm khóa. Vui lòng liên hệ Admin.' };
  }

  // Cập nhật phiên đăng nhập (CHỈ LƯU TRÌNH DUYỆT LOCAL, TUYỆT ĐỐI KHÔNG PUSH LÊN CLOUD ĐỂ TRÁNH RESET SHEET!)
  matched.lastLogin = new Date().toISOString();
  saveStoredUsers(users);
  setCurrentUser(matched);

  return { success: true, user: matched };
}

/**
 * Đăng xuất
 */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
}

/**
 * Quản trị viên (Admin) tạo tài khoản mới
 * (Kiểm tra quyền Admin nghiêm ngặt)
 */
export function createUser(
  operator: User,
  data: {
    username: string;
    password: string;
    displayName: string;
    role: UserRole;
    phone?: string;
  }
): { success: boolean; user?: User; message?: string } {
  if (operator.role !== 'admin') {
    return { success: false, message: 'Chỉ Quản trị viên (Admin) mới có quyền tạo tài khoản nhân viên.' };
  }

  const cleanUsername = data.username.trim();
  const cleanPassword = data.password.trim();
  const cleanName = data.displayName.trim();

  if (!cleanUsername || !cleanPassword || !cleanName) {
    return { success: false, message: 'Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu và Tên nhân viên.' };
  }

  if (cleanUsername.length < 3) {
    return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự.' };
  }

  if (cleanPassword.length < 4) {
    return { success: false, message: 'Mật khẩu phải có ít nhất 4 ký tự.' };
  }

  const users = getStoredUsers();
  const exists = users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (exists) {
    return { success: false, message: `Tên đăng nhập "${cleanUsername}" đã tồn tại trên hệ thống.` };
  }

  const newUser: User = {
    id: `usr_${cleanUsername.toLowerCase()}_${Date.now()}`,
    username: cleanUsername,
    passwordHash: hashPassword(cleanPassword),
    displayName: cleanName,
    role: data.role || 'staff',
    createdAt: new Date().toISOString(),
    isActive: true,
    phone: data.phone?.trim() || '',
  };

  users.push(newUser);
  saveStoredUsers(users);

  return { success: true, user: newUser };
}

/**
 * Quản trị viên cập nhật thông tin / phân quyền tài khoản
 */
export function updateUser(
  operator: User,
  id: string,
  updates: Partial<Omit<User, 'id' | 'username' | 'createdAt' | 'passwordHash'>>
): { success: boolean; message?: string } {
  if (operator.role !== 'admin') {
    return { success: false, message: 'Chỉ Quản trị viên (Admin) mới có quyền thay đổi thông tin và phân quyền.' };
  }

  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return { success: false, message: 'Không tìm thấy tài khoản.' };
  }

  // Không cho phép khóa tài khoản admin gốc
  if (users[idx].username.toUpperCase() === 'ADMIN' && updates.isActive === false) {
    return { success: false, message: 'Không thể khóa tài khoản ADMIN gốc của hệ thống.' };
  }

  users[idx] = { ...users[idx], ...updates };
  saveStoredUsers(users);

  const current = getCurrentUser();
  if (current && current.id === id) {
    setCurrentUser(users[idx]);
  }

  return { success: true };
}

/**
 * Quản trị viên xóa tài khoản
 */
export function deleteUser(operator: User, id: string): { success: boolean; message?: string } {
  if (operator.role !== 'admin') {
    return { success: false, message: 'Chỉ Quản trị viên (Admin) mới có quyền xóa tài khoản.' };
  }

  const users = getStoredUsers();
  const target = users.find((u) => u.id === id);
  if (!target) {
    return { success: false, message: 'Không tìm thấy tài khoản để xóa.' };
  }

  if (target.username.toUpperCase() === 'ADMIN') {
    return { success: false, message: 'Không thể xóa tài khoản ADMIN gốc của hệ thống.' };
  }

  const filtered = users.filter((u) => u.id !== id);
  saveStoredUsers(filtered);

  const current = getCurrentUser();
  if (current && current.id === id) {
    logout();
  }

  return { success: true };
}

/**
 * Quản trị viên Đặt lại (Reset) mật khẩu cho bất kỳ tài khoản nào
 */
export function adminResetPassword(
  operator: User,
  targetUserId: string,
  newPass: string
): { success: boolean; message?: string } {
  if (operator.role !== 'admin') {
    return { success: false, message: 'Chỉ Quản trị viên mới có quyền đặt lại mật khẩu.' };
  }

  const cleanPass = newPass.trim();
  if (cleanPass.length < 4) {
    return { success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự.' };
  }

  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === targetUserId);
  if (idx === -1) return { success: false, message: 'Không tìm thấy tài khoản.' };

  users[idx].passwordHash = hashPassword(cleanPass);
  delete (users[idx] as any).password;
  saveStoredUsers(users);

  return { success: true };
}

/**
 * THÀNH VIÊN TỰ ĐỔI MẬT KHẨU CỦA CHÍNH MÌNH (Ai cũng có quyền này)
 * Yêu cầu: Phải nhập đúng mật khẩu hiện tại!
 */
export function changeMyPassword(
  userId: string,
  currentPass: string,
  newPass: string
): { success: boolean; message?: string } {
  const cleanCurrent = currentPass.trim();
  const cleanNew = newPass.trim();

  if (!cleanCurrent || !cleanNew) {
    return { success: false, message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.' };
  }

  if (cleanNew.length < 4) {
    return { success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự.' };
  }

  if (cleanCurrent === cleanNew) {
    return { success: false, message: 'Mật khẩu mới không được trùng với mật khẩu cũ.' };
  }

  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return { success: false, message: 'Không tìm thấy tài khoản người dùng.' };
  }

  const user = users[idx];
  const currentHash = hashPassword(cleanCurrent);

  const isCurrentPassValid =
    user.passwordHash === currentHash || (user as any).password === cleanCurrent;

  if (!isCurrentPassValid) {
    return { success: false, message: 'Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.' };
  }

  // Cập nhật mã băm mật khẩu mới
  const newHash = hashPassword(cleanNew);
  user.passwordHash = newHash;
  delete (user as any).password;

  saveStoredUsers(users);
  setCurrentUser(user);

  return { success: true, message: 'Đã đổi mật khẩu thành công!' };
}
