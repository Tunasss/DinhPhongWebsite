import { AppleDevice } from '../types';

/**
 * Cấu hình kết nối Google Drive gốc của Đình Phong Apple.
 * Toàn bộ dữ liệu thực tế được đồng bộ thời gian thực với Google Sheets và Google Drive.
 */
export const SHOP_DRIVE_ROOT_FOLDER_ID = '1fTKgedG4yGx6c9Sc96-385DHYWPv-CyT';
export const SHOP_DRIVE_ROOT_FOLDER_URL =
  'https://drive.google.com/drive/folders/1fTKgedG4yGx6c9Sc96-385DHYWPv-CyT?usp=sharing';

/**
 * Danh sách sản phẩm khởi tạo cho Production:
 * Để rỗng [] để hệ thống tự động tải dữ liệu thực tế từ Google Sheets & Google Drive của cửa hàng.
 */
export const INITIAL_MOCK_DEVICES: AppleDevice[] = [];
