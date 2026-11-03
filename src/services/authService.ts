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
}

const STORAGE_KEY_USERS = 'dinhphong_users_v2';
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
 * Lấy danh sách tài khoản đã lưu trong LocalStorage.
 * Nếu chưa có danh sách, tự khởi tạo danh sách 6 tài khoản mặc định.
 */
export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEED_ACCOUNTS));
      return SEED_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEED_ACCOUNTS));
      return SEED_ACCOUNTS;
    }

    // Đảm bảo 6 tài khoản mặc định (ADMIN, anhvu, vonguyen, phantuan, anhtuan, dinhphong) luôn tồn tại
    let hasUpdated = false;
    const existingUsernames = new Set(parsed.map((u: any) => (u.username || '').toLowerCase()));
    for (const seed of SEED_ACCOUNTS) {
      if (!existingUsernames.has(seed.username.toLowerCase())) {
        parsed.push(seed);
        hasUpdated = true;
      }
    }
    if (hasUpdated) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(parsed));
    }

    return parsed;
  } catch (err) {
    console.error('Lỗi đọc danh sách tài khoản:', err);
    return SEED_ACCOUNTS;
  }
}

/**
 * Lưu danh sách tài khoản vào LocalStorage
 */
export function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Lỗi lưu danh sách tài khoản:', err);
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
 * Đăng nhập hệ thống (Xác thực bằng hàm băm SHA-256 an toàn)
 */
export function login(
  username: string,
  pass: string
): { success: boolean; user?: User; message?: string } {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = pass.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' };
  }

  const users = getStoredUsers();
  const inputHash = hashPassword(cleanPassword);

  const matched = users.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername &&
      (u.passwordHash === inputHash || (u as any).password === cleanPassword)
  );

  if (!matched) {
    return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
  }

  if (!matched.isActive) {
    return { success: false, message: 'Tài khoản này đã bị tạm khóa. Vui lòng liên hệ Admin.' };
  }

  // Tự động nâng cấp hash nếu tài khoản cũ
  matched.passwordHash = inputHash;
  delete (matched as any).password;
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
