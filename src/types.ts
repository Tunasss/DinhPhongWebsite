export type DeviceCategory = 'MacBook' | 'iPad' | 'Khác';

export type ProductLine =
  | 'MacBook Air'
  | 'MacBook Pro'
  | 'MacBook Neo'
  | 'iPad Pro'
  | 'iPad Air'
  | 'iPad Gen'
  | 'iPad Mini'
  | 'Magic Keyboard'
  | 'Apple Pencil'
  | 'Magic Mouse'
  | 'Magic Trackpad'
  | 'AirPods'
  | 'Sạc & Cáp'
  | 'Phụ kiện khác';

export const ACCESSORY_LINES: ProductLine[] = [
  'Magic Keyboard',
  'Apple Pencil',
  'Magic Mouse',
  'Magic Trackpad',
  'AirPods',
  'Sạc & Cáp',
  'Phụ kiện khác',
];

export type ChipFamily =
  | 'M1'
  | 'M1 Pro'
  | 'M1 Max'
  | 'M2'
  | 'M2 Pro'
  | 'M2 Max'
  | 'M3'
  | 'M3 Pro'
  | 'M3 Max'
  | 'M4'
  | 'M4 Pro'
  | 'M4 Max'
  | 'M5'
  | 'M5 Pro'
  | 'M5 Max'
  | 'A16'
  | 'A17 Pro'
  | 'A18 Pro'
  | 'Intel'
  | 'A-Series';

export type DeviceStatus = 'available' | 'deposited' | 'sold';

export const MACBOOK_NEO_COLORS = [
  'Silver (Bạc - Neo)',
  'Indigo (Xanh Indigo - Neo)',
  'Blush (Hồng Blush - Neo)',
  'Citrus (Vàng Chanh Citrus - Neo)',
] as const;

export const APPLE_COLORS = [
  'Silver (Bạc)',
  'Space Gray (Xám Không Gian)',
  'Starlight (Vàng Ánh Sao)',
  'Midnight (Xanh Đêm)',
  'Space Black (Đen Không Gian)',
  'Sky Blue (Xanh Da Trời)',
  'Indigo (Xanh Indigo - Neo)',
  'Blush (Hồng Blush - Neo)',
  'Citrus (Vàng Chanh Citrus - Neo)',
  'Silver (Bạc - Neo)',
  'Gold (Vàng)',
  'Rose Gold (Vàng Hồng)',
  'Blue (Xanh Dương)',
  'Purple (Tím)',
  'Pink (Hồng)',
  'Yellow (Vàng Chanh)',
] as const;

export interface DeviceImage {
  id: string;
  name: string;
  url: string;
  downloadUrl?: string;
  driveViewUrl?: string;
  base64Data?: string;
  mimeType?: string;
  isSpecImage?: boolean; // Ảnh chụp màn hình thông tin máy (Bước 1)
  specSlot?: 1 | 2;      // Ảnh thông tin 1 (Giới thiệu) hoặc Ảnh thông tin 2 (Pin & Ổ đĩa)
}

export interface AppleDevice {
  id: string;
  serial: string;
  title: string;
  deviceType: DeviceCategory;
  productLine: ProductLine;
  chip: ChipFamily;
  ram: string;
  storage: string;
  screenSize: string;
  color: string;

  // Tách riêng dung lượng pin (%) và số lần sạc (chu kỳ) dạng tickbox + số
  hasBatteryCapacity: boolean;
  batteryCapacityPercent?: number; // VD: 100
  hasBatteryCycle: boolean;
  batteryCycleCount?: number;      // VD: 14
  batteryHealth?: string;          // Chuỗi tổng hợp để hiển thị nhanh (VD: "Pin 100% • 14 lần sạc")

  // Bảo hành: Có thì bổ sung ngày tháng, Không thì không có lựa chọn gì hết
  hasWarranty: boolean;
  warrantyExpiryDate?: string;     // YYYY-MM-DD hoặc chuỗi ngày tháng khi hasWarranty = true

  conditionNote: string;  // Mô tả ngắn tình trạng ngoại hình (cấn nhẹ góc, đẹp keng 99%,...)
  importPrice: number;    // Giá nhập / Giá vốn (VNĐ)
  salePrice: number;      // Giá bán (VNĐ)
  receiverName: string;   // Người lấy
  sourcerName: string;    // Người kiếm
  sellerName: string;     // Người bán
  delivererName: string;  // Người giao
  status: DeviceStatus;
  driveFolderId?: string;
  driveFolderUrl?: string;
  images: DeviceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  gasWebAppUrl: string;
  driveRootFolderId: string;
  geminiApiKey: string;
  organizeByCategory: boolean; // Tạo folder Loại máy -> Serial hay Serial trực tiếp trong Folder Tổng
  showImportPrice: boolean;    // Ẩn/hiện giá nhập trên thẻ ngoài
  shopName: string;
}

export interface ExtractedSpecResult {
  serial?: string;
  deviceType?: DeviceCategory;
  productLine?: ProductLine;
  chip?: ChipFamily;
  ram?: string;
  storage?: string;
  rawDiskText?: string; // Ví dụ: "Khả dụng 219,66 GB / 245,11 GB -> Dự đoán 256GB"
  screenSize?: string;
  color?: string;
  hasBatteryCapacity?: boolean;
  batteryCapacityPercent?: number;
  hasBatteryCycle?: boolean;
  batteryCycleCount?: number;
  hasWarranty?: boolean;
  warrantyExpiryDate?: string;
  conditionNote?: string;
  title?: string;
  confidenceNote?: string;
}
