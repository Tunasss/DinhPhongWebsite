import { AppleDevice } from '../types';

/**
 * Cấu hình kết nối Google Drive gốc của Đình Phong Apple.
 */
export const SHOP_DRIVE_ROOT_FOLDER_ID = '1fTKgedG4yGx6c9Sc96-385DHYWPv-CyT';
export const SHOP_DRIVE_ROOT_FOLDER_URL =
  'https://drive.google.com/drive/folders/1fTKgedG4yGx6c9Sc96-385DHYWPv-CyT?usp=sharing';

/**
 * ID File Google Sheet Dữ Liệu Thô của Đình Phong Apple:
 * https://docs.google.com/spreadsheets/d/1hrn38CRokXNRRMQalwelBXLuYplY_2-m2Uybpz-9sQI/edit
 */
export const SHOP_RAW_SHEET_ID = '1hrn38CRokXNRRMQalwelBXLuYplY_2-m2Uybpz-9sQI';
export const SHOP_RAW_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1hrn38CRokXNRRMQalwelBXLuYplY_2-m2Uybpz-9sQI/edit';

/**
 * Danh sách sản phẩm thực tế của cửa hàng từ Google Sheet:
 * Giúp website hiển thị tức thì kho máy ngay khi mở trang trên Vercel hoặc bất kỳ thiết bị nào.
 */
export const INITIAL_MOCK_DEVICES: AppleDevice[] = [
  {
    "id": "dev-1793095936231",
    "serial": "C24WT1P2GL",
    "title": "MacBook Air 13 inch M4 16GB/256GB",
    "deviceType": "MacBook",
    "productLine": "MacBook Air",
    "chip": "M4",
    "ram": "16GB",
    "storage": "256GB",
    "screenSize": "13.6 inch",
    "color": "Silver (Bạc)",
    "hasBatteryCapacity": true,
    "batteryCapacityPercent": 100,
    "hasBatteryCycle": true,
    "batteryCycleCount": 14,
    "batteryHealth": "Pin 100% • 14 lần sạc",
    "hasWarranty": false,
    "warrantyExpiryDate": "",
    "conditionNote": "Keng 99%",
    "importPrice": 23000000,
    "salePrice": 26000000,
    "receiverName": "Phong",
    "sourcerName": "Chưa rõ",
    "sellerName": "Chưa bán",
    "delivererName": "Chưa giao",
    "status": "available",
    "driveFolderId": "1NQxa41ifufGGIDRU-mSHOcAMs2cE-f4W",
    "driveFolderUrl": "https://drive.google.com/drive/folders/1NQxa41ifufGGIDRU-mSHOcAMs2cE-f4W",
    "images": [
      {
        "id": "1O5dwGWkkHqIWks1mikWHPMw6zaVoJf02",
        "name": "C24WT1P2GL_SPEC_1.jpg",
        "url": "https://lh3.googleusercontent.com/d/1O5dwGWkkHqIWks1mikWHPMw6zaVoJf02",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1O5dwGWkkHqIWks1mikWHPMw6zaVoJf02",
        "driveViewUrl": "https://drive.google.com/file/d/1O5dwGWkkHqIWks1mikWHPMw6zaVoJf02/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 1
      },
      {
        "id": "11Hj5uBiWBwWj66hBvgHSoITQvbJovmnL",
        "name": "C24WT1P2GL_SPEC_2.jpg",
        "url": "https://lh3.googleusercontent.com/d/11Hj5uBiWBwWj66hBvgHSoITQvbJovmnL",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=11Hj5uBiWBwWj66hBvgHSoITQvbJovmnL",
        "driveViewUrl": "https://drive.google.com/file/d/11Hj5uBiWBwWj66hBvgHSoITQvbJovmnL/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 2
      },
      {
        "id": "1QuUJQa1blwm8Cx6i59dVoo5YTwN_Iaya",
        "name": "C24WT1P2GL_PHOTO_3.jpg",
        "url": "https://lh3.googleusercontent.com/d/1QuUJQa1blwm8Cx6i59dVoo5YTwN_Iaya",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1QuUJQa1blwm8Cx6i59dVoo5YTwN_Iaya",
        "driveViewUrl": "https://drive.google.com/file/d/1QuUJQa1blwm8Cx6i59dVoo5YTwN_Iaya/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1Sf-te8hUxkvYDm2ATLPnZNrq0sIo7sIF",
        "name": "C24WT1P2GL_PHOTO_4.jpg",
        "url": "https://lh3.googleusercontent.com/d/1Sf-te8hUxkvYDm2ATLPnZNrq0sIo7sIF",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1Sf-te8hUxkvYDm2ATLPnZNrq0sIo7sIF",
        "driveViewUrl": "https://drive.google.com/file/d/1Sf-te8hUxkvYDm2ATLPnZNrq0sIo7sIF/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1MIQ6TugO9iBY5ZwiNkeKtonsfXKgMCUz",
        "name": "C24WT1P2GL_PHOTO_5.jpg",
        "url": "https://lh3.googleusercontent.com/d/1MIQ6TugO9iBY5ZwiNkeKtonsfXKgMCUz",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1MIQ6TugO9iBY5ZwiNkeKtonsfXKgMCUz",
        "driveViewUrl": "https://drive.google.com/file/d/1MIQ6TugO9iBY5ZwiNkeKtonsfXKgMCUz/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1q_cy4769XLwOghMp0kjmv6Hws9SxnpFk",
        "name": "C24WT1P2GL_PHOTO_6.jpg",
        "url": "https://lh3.googleusercontent.com/d/1q_cy4769XLwOghMp0kjmv6Hws9SxnpFk",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1q_cy4769XLwOghMp0kjmv6Hws9SxnpFk",
        "driveViewUrl": "https://drive.google.com/file/d/1q_cy4769XLwOghMp0kjmv6Hws9SxnpFk/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1h3cVrv4c5Br5iz9SpxxWzqehoWL3kY0S",
        "name": "C24WT1P2GL_PHOTO_7.jpg",
        "url": "https://lh3.googleusercontent.com/d/1h3cVrv4c5Br5iz9SpxxWzqehoWL3kY0S",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1h3cVrv4c5Br5iz9SpxxWzqehoWL3kY0S",
        "driveViewUrl": "https://drive.google.com/file/d/1h3cVrv4c5Br5iz9SpxxWzqehoWL3kY0S/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1RkDxzcZHf8figT8ig6stzfFspfCRIkQP",
        "name": "C24WT1P2GL_PHOTO_8.jpg",
        "url": "https://lh3.googleusercontent.com/d/1RkDxzcZHf8figT8ig6stzfFspfCRIkQP",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1RkDxzcZHf8figT8ig6stzfFspfCRIkQP",
        "driveViewUrl": "https://drive.google.com/file/d/1RkDxzcZHf8figT8ig6stzfFspfCRIkQP/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1gMQG1eNs3obrEuLJYCDyWijs7xzx8rdF",
        "name": "C24WT1P2GL_PHOTO_9.jpg",
        "url": "https://lh3.googleusercontent.com/d/1gMQG1eNs3obrEuLJYCDyWijs7xzx8rdF",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1gMQG1eNs3obrEuLJYCDyWijs7xzx8rdF",
        "driveViewUrl": "https://drive.google.com/file/d/1gMQG1eNs3obrEuLJYCDyWijs7xzx8rdF/view?usp=drivesdk",
        "isSpecImage": false
      }
    ],
    "createdAt": "2026-10-27T10:12:16.231Z",
    "updatedAt": "2026-11-03T04:04:46.195Z"
  },
  {
    "id": "dev-1793097369612",
    "serial": "M54YL7T1X6",
    "title": "MacBook Air 13.6 inch M3 24GB/512GB",
    "deviceType": "MacBook",
    "productLine": "MacBook Air",
    "chip": "M3",
    "ram": "24GB",
    "storage": "512GB",
    "screenSize": "13.6 inch",
    "color": "Starlight (Vàng Ánh Sao)",
    "hasBatteryCapacity": true,
    "batteryCapacityPercent": 99,
    "hasBatteryCycle": true,
    "batteryCycleCount": 74,
    "batteryHealth": "Pin 99% • 74 lần sạc",
    "hasWarranty": false,
    "warrantyExpiryDate": "",
    "conditionNote": "Keng đẹp 99% fullbox",
    "importPrice": 21000000,
    "salePrice": 26500000,
    "receiverName": "Vũ",
    "sourcerName": "Chưa rõ",
    "sellerName": "Chưa bán",
    "delivererName": "Chưa giao",
    "status": "sold",
    "driveFolderId": "1z_MKoIl4OMA20hSedQf7B68-CjNg8sSs",
    "driveFolderUrl": "https://drive.google.com/drive/folders/1z_MKoIl4OMA20hSedQf7B68-CjNg8sSs",
    "images": [
      {
        "id": "1j-XpRy3Hr4Nmx-zdxBO997vjYZHDh4mL",
        "name": "M54YL7T1X6_SPEC_1.jpg",
        "url": "https://lh3.googleusercontent.com/d/1j-XpRy3Hr4Nmx-zdxBO997vjYZHDh4mL",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1j-XpRy3Hr4Nmx-zdxBO997vjYZHDh4mL",
        "driveViewUrl": "https://drive.google.com/file/d/1j-XpRy3Hr4Nmx-zdxBO997vjYZHDh4mL/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 1
      },
      {
        "id": "1bu0KWuEObLUkA9Mth7ctYHD2JwyIUuhq",
        "name": "M54YL7T1X6_SPEC_2.jpg",
        "url": "https://lh3.googleusercontent.com/d/1bu0KWuEObLUkA9Mth7ctYHD2JwyIUuhq",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1bu0KWuEObLUkA9Mth7ctYHD2JwyIUuhq",
        "driveViewUrl": "https://drive.google.com/file/d/1bu0KWuEObLUkA9Mth7ctYHD2JwyIUuhq/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 2
      },
      {
        "id": "1c21_XLbFpdKxsug2zNq8NonkRrdV8aMf",
        "name": "M54YL7T1X6_PHOTO_3.jpg",
        "url": "https://lh3.googleusercontent.com/d/1c21_XLbFpdKxsug2zNq8NonkRrdV8aMf",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1c21_XLbFpdKxsug2zNq8NonkRrdV8aMf",
        "driveViewUrl": "https://drive.google.com/file/d/1c21_XLbFpdKxsug2zNq8NonkRrdV8aMf/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1Bl7eS7ujrkvzttblQBvKhzhom6EcTdpy",
        "name": "M54YL7T1X6_PHOTO_4.jpg",
        "url": "https://lh3.googleusercontent.com/d/1Bl7eS7ujrkvzttblQBvKhzhom6EcTdpy",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1Bl7eS7ujrkvzttblQBvKhzhom6EcTdpy",
        "driveViewUrl": "https://drive.google.com/file/d/1Bl7eS7ujrkvzttblQBvKhzhom6EcTdpy/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "18UQ3e5tRaa_zmPPzVammqwQQiIQmMQSi",
        "name": "M54YL7T1X6_PHOTO_5.jpg",
        "url": "https://lh3.googleusercontent.com/d/18UQ3e5tRaa_zmPPzVammqwQQiIQmMQSi",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=18UQ3e5tRaa_zmPPzVammqwQQiIQmMQSi",
        "driveViewUrl": "https://drive.google.com/file/d/18UQ3e5tRaa_zmPPzVammqwQQiIQmMQSi/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1DfxCsCJQyUNkmEq46frsD4jtmYCR2vyS",
        "name": "M54YL7T1X6_PHOTO_6.jpg",
        "url": "https://lh3.googleusercontent.com/d/1DfxCsCJQyUNkmEq46frsD4jtmYCR2vyS",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1DfxCsCJQyUNkmEq46frsD4jtmYCR2vyS",
        "driveViewUrl": "https://drive.google.com/file/d/1DfxCsCJQyUNkmEq46frsD4jtmYCR2vyS/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1BMd4ufaibGyDIxmMYdwev8pRI0XqVqVR",
        "name": "M54YL7T1X6_PHOTO_7.jpg",
        "url": "https://lh3.googleusercontent.com/d/1BMd4ufaibGyDIxmMYdwev8pRI0XqVqVR",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1BMd4ufaibGyDIxmMYdwev8pRI0XqVqVR",
        "driveViewUrl": "https://drive.google.com/file/d/1BMd4ufaibGyDIxmMYdwev8pRI0XqVqVR/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1t16z_56p-kGipS2SWa4sHJwS6rhtOGg0",
        "name": "M54YL7T1X6_PHOTO_8.jpg",
        "url": "https://lh3.googleusercontent.com/d/1t16z_56p-kGipS2SWa4sHJwS6rhtOGg0",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1t16z_56p-kGipS2SWa4sHJwS6rhtOGg0",
        "driveViewUrl": "https://drive.google.com/file/d/1t16z_56p-kGipS2SWa4sHJwS6rhtOGg0/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "16IJ3Lv59U5L0da7oAhUKvDwOvoTh0TQF",
        "name": "M54YL7T1X6_PHOTO_9.jpg",
        "url": "https://lh3.googleusercontent.com/d/16IJ3Lv59U5L0da7oAhUKvDwOvoTh0TQF",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=16IJ3Lv59U5L0da7oAhUKvDwOvoTh0TQF",
        "driveViewUrl": "https://drive.google.com/file/d/16IJ3Lv59U5L0da7oAhUKvDwOvoTh0TQF/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1ifmN9pJT2LKs3mYJW-GFeoTa0dRsLIf3",
        "name": "M54YL7T1X6_PHOTO_10.jpg",
        "url": "https://lh3.googleusercontent.com/d/1ifmN9pJT2LKs3mYJW-GFeoTa0dRsLIf3",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1ifmN9pJT2LKs3mYJW-GFeoTa0dRsLIf3",
        "driveViewUrl": "https://drive.google.com/file/d/1ifmN9pJT2LKs3mYJW-GFeoTa0dRsLIf3/view?usp=drivesdk",
        "isSpecImage": false
      }
    ],
    "createdAt": "2026-10-27T10:36:09.612Z",
    "updatedAt": "2026-11-03T04:04:42.784Z"
  },
  {
    "id": "dev-1793103865850",
    "serial": "DFH3X0104L",
    "title": "MacBook Air 13.6 inch M4 16GB/256GB",
    "deviceType": "MacBook",
    "productLine": "MacBook Air",
    "chip": "M4",
    "ram": "16GB",
    "storage": "256GB",
    "screenSize": "13.6 inch",
    "color": "Sky Blue (Xanh Da Trời)",
    "hasBatteryCapacity": true,
    "batteryCapacityPercent": 100,
    "hasBatteryCycle": false,
    "batteryHealth": "Pin 100% •  lần sạc",
    "hasWarranty": false,
    "warrantyExpiryDate": "",
    "conditionNote": "Ngoại hình đẹp 99",
    "importPrice": 0,
    "salePrice": 26300000,
    "receiverName": "Chưa rõ",
    "sourcerName": "Chưa rõ",
    "sellerName": "Chưa bán",
    "delivererName": "Chưa giao",
    "status": "available",
    "driveFolderId": "1nGI-DrOzr8NqvHK8gcgKR6Ddw5z-7HMZ",
    "driveFolderUrl": "https://drive.google.com/drive/folders/1nGI-DrOzr8NqvHK8gcgKR6Ddw5z-7HMZ",
    "images": [
      {
        "id": "1O7gfucAPcLK2CAErEhwdc8UsLqpdQwpe",
        "name": "DFH3X0104L_SPEC_1.jpg",
        "url": "https://lh3.googleusercontent.com/d/1O7gfucAPcLK2CAErEhwdc8UsLqpdQwpe",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1O7gfucAPcLK2CAErEhwdc8UsLqpdQwpe",
        "driveViewUrl": "https://drive.google.com/file/d/1O7gfucAPcLK2CAErEhwdc8UsLqpdQwpe/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 1
      },
      {
        "id": "1lw5r9jC30LJ2JQvA0qmGTduCW3lC884F",
        "name": "DFH3X0104L_SPEC_2.jpg",
        "url": "https://lh3.googleusercontent.com/d/1lw5r9jC30LJ2JQvA0qmGTduCW3lC884F",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1lw5r9jC30LJ2JQvA0qmGTduCW3lC884F",
        "driveViewUrl": "https://drive.google.com/file/d/1lw5r9jC30LJ2JQvA0qmGTduCW3lC884F/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 2
      },
      {
        "id": "1iMCyq96wSJRVFxP-2Hwm2ni1Bcdue1bD",
        "name": "DFH3X0104L_PHOTO_3.jpg",
        "url": "https://lh3.googleusercontent.com/d/1iMCyq96wSJRVFxP-2Hwm2ni1Bcdue1bD",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1iMCyq96wSJRVFxP-2Hwm2ni1Bcdue1bD",
        "driveViewUrl": "https://drive.google.com/file/d/1iMCyq96wSJRVFxP-2Hwm2ni1Bcdue1bD/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1Y_uEhHzMtSVQAtuBzSyo2aR8dSre3QSd",
        "name": "DFH3X0104L_PHOTO_4.jpg",
        "url": "https://lh3.googleusercontent.com/d/1Y_uEhHzMtSVQAtuBzSyo2aR8dSre3QSd",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1Y_uEhHzMtSVQAtuBzSyo2aR8dSre3QSd",
        "driveViewUrl": "https://drive.google.com/file/d/1Y_uEhHzMtSVQAtuBzSyo2aR8dSre3QSd/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1_e96UJlHKgshaDjTQOQSDyJQ4QazWZSn",
        "name": "DFH3X0104L_PHOTO_5.jpg",
        "url": "https://lh3.googleusercontent.com/d/1_e96UJlHKgshaDjTQOQSDyJQ4QazWZSn",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1_e96UJlHKgshaDjTQOQSDyJQ4QazWZSn",
        "driveViewUrl": "https://drive.google.com/file/d/1_e96UJlHKgshaDjTQOQSDyJQ4QazWZSn/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1bi_JuicjC-GEyRLzOQpZBEwo8WZ-LK0U",
        "name": "DFH3X0104L_PHOTO_6.jpg",
        "url": "https://lh3.googleusercontent.com/d/1bi_JuicjC-GEyRLzOQpZBEwo8WZ-LK0U",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1bi_JuicjC-GEyRLzOQpZBEwo8WZ-LK0U",
        "driveViewUrl": "https://drive.google.com/file/d/1bi_JuicjC-GEyRLzOQpZBEwo8WZ-LK0U/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1T5VF52AIFgJ2ilHQUXiMb7RdtWEljXb2",
        "name": "DFH3X0104L_PHOTO_7.jpg",
        "url": "https://lh3.googleusercontent.com/d/1T5VF52AIFgJ2ilHQUXiMb7RdtWEljXb2",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1T5VF52AIFgJ2ilHQUXiMb7RdtWEljXb2",
        "driveViewUrl": "https://drive.google.com/file/d/1T5VF52AIFgJ2ilHQUXiMb7RdtWEljXb2/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "18UpC7dw-EEdgHGXR5LpIY-Jo-G2Yrh9k",
        "name": "DFH3X0104L_PHOTO_8.jpg",
        "url": "https://lh3.googleusercontent.com/d/18UpC7dw-EEdgHGXR5LpIY-Jo-G2Yrh9k",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=18UpC7dw-EEdgHGXR5LpIY-Jo-G2Yrh9k",
        "driveViewUrl": "https://drive.google.com/file/d/18UpC7dw-EEdgHGXR5LpIY-Jo-G2Yrh9k/view?usp=drivesdk",
        "isSpecImage": false
      }
    ],
    "createdAt": "2026-10-27T12:24:25.850Z",
    "updatedAt": "2026-11-03T04:04:39.595Z"
  },
  {
    "id": "dev-1793104357850",
    "serial": "C24WT1P2GL",
    "title": "MacBook Air 13.6 inch M4 16GB/256GB",
    "deviceType": "MacBook",
    "productLine": "MacBook Air",
    "chip": "M4",
    "ram": "16GB",
    "storage": "256GB",
    "screenSize": "13.6 inch",
    "color": "Silver (Bạc)",
    "hasBatteryCapacity": true,
    "batteryCapacityPercent": 100,
    "hasBatteryCycle": true,
    "batteryCycleCount": 14,
    "batteryHealth": "Pin 100% • 14 lần sạc",
    "hasWarranty": false,
    "warrantyExpiryDate": "",
    "conditionNote": "Đẹp 99 Nhơn Trạch",
    "importPrice": 0,
    "salePrice": 26300000,
    "receiverName": "Tuna",
    "sourcerName": "Chưa rõ",
    "sellerName": "Chưa bán",
    "delivererName": "Chưa giao",
    "status": "available",
    "driveFolderId": "1NQxa41ifufGGIDRU-mSHOcAMs2cE-f4W",
    "driveFolderUrl": "https://drive.google.com/drive/folders/1NQxa41ifufGGIDRU-mSHOcAMs2cE-f4W",
    "images": [
      {
        "id": "1BpJTiWfvDzC1BVAf90Qksq6qct0rc4ox",
        "name": "C24WT1P2GL_SPEC_1.jpg",
        "url": "https://lh3.googleusercontent.com/d/1BpJTiWfvDzC1BVAf90Qksq6qct0rc4ox",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1BpJTiWfvDzC1BVAf90Qksq6qct0rc4ox",
        "driveViewUrl": "https://drive.google.com/file/d/1BpJTiWfvDzC1BVAf90Qksq6qct0rc4ox/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 1
      },
      {
        "id": "1jpprPMJ3AawzZUjD9ZYxtgJN3A0AARh5",
        "name": "C24WT1P2GL_SPEC_2.jpg",
        "url": "https://lh3.googleusercontent.com/d/1jpprPMJ3AawzZUjD9ZYxtgJN3A0AARh5",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1jpprPMJ3AawzZUjD9ZYxtgJN3A0AARh5",
        "driveViewUrl": "https://drive.google.com/file/d/1jpprPMJ3AawzZUjD9ZYxtgJN3A0AARh5/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 2
      },
      {
        "id": "1dTSK_p8ydt5PhUStqNZMsqz_rMzGbdF_",
        "name": "C24WT1P2GL_PHOTO_3.jpg",
        "url": "https://lh3.googleusercontent.com/d/1dTSK_p8ydt5PhUStqNZMsqz_rMzGbdF_",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1dTSK_p8ydt5PhUStqNZMsqz_rMzGbdF_",
        "driveViewUrl": "https://drive.google.com/file/d/1dTSK_p8ydt5PhUStqNZMsqz_rMzGbdF_/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "14u6HAD7cAJtchq9_CPLKyG80-EU-Uz73",
        "name": "C24WT1P2GL_PHOTO_4.jpg",
        "url": "https://lh3.googleusercontent.com/d/14u6HAD7cAJtchq9_CPLKyG80-EU-Uz73",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=14u6HAD7cAJtchq9_CPLKyG80-EU-Uz73",
        "driveViewUrl": "https://drive.google.com/file/d/14u6HAD7cAJtchq9_CPLKyG80-EU-Uz73/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1ZmnBeZi9QMwbCbeflSXSd8lq_Tg6Kchd",
        "name": "C24WT1P2GL_PHOTO_5.jpg",
        "url": "https://lh3.googleusercontent.com/d/1ZmnBeZi9QMwbCbeflSXSd8lq_Tg6Kchd",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1ZmnBeZi9QMwbCbeflSXSd8lq_Tg6Kchd",
        "driveViewUrl": "https://drive.google.com/file/d/1ZmnBeZi9QMwbCbeflSXSd8lq_Tg6Kchd/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1GC02XZOR-UMzZgk1vov4Skx141LKlptv",
        "name": "C24WT1P2GL_PHOTO_6.jpg",
        "url": "https://lh3.googleusercontent.com/d/1GC02XZOR-UMzZgk1vov4Skx141LKlptv",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1GC02XZOR-UMzZgk1vov4Skx141LKlptv",
        "driveViewUrl": "https://drive.google.com/file/d/1GC02XZOR-UMzZgk1vov4Skx141LKlptv/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1vRNv0UkFNHbnGaD2b4b9b9CMfuAtXhQO",
        "name": "C24WT1P2GL_PHOTO_7.jpg",
        "url": "https://lh3.googleusercontent.com/d/1vRNv0UkFNHbnGaD2b4b9b9CMfuAtXhQO",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1vRNv0UkFNHbnGaD2b4b9b9CMfuAtXhQO",
        "driveViewUrl": "https://drive.google.com/file/d/1vRNv0UkFNHbnGaD2b4b9b9CMfuAtXhQO/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1zQUoQJiHX6VMeq9f_-tmsxw_1bt-p-ur",
        "name": "C24WT1P2GL_PHOTO_8.jpg",
        "url": "https://lh3.googleusercontent.com/d/1zQUoQJiHX6VMeq9f_-tmsxw_1bt-p-ur",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1zQUoQJiHX6VMeq9f_-tmsxw_1bt-p-ur",
        "driveViewUrl": "https://drive.google.com/file/d/1zQUoQJiHX6VMeq9f_-tmsxw_1bt-p-ur/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "17lAH3VJLht_R0ZBldgmJHX1_O2UG1JWZ",
        "name": "C24WT1P2GL_PHOTO_9.jpg",
        "url": "https://lh3.googleusercontent.com/d/17lAH3VJLht_R0ZBldgmJHX1_O2UG1JWZ",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=17lAH3VJLht_R0ZBldgmJHX1_O2UG1JWZ",
        "driveViewUrl": "https://drive.google.com/file/d/17lAH3VJLht_R0ZBldgmJHX1_O2UG1JWZ/view?usp=drivesdk",
        "isSpecImage": false
      }
    ],
    "createdAt": "2026-10-27T12:32:37.850Z",
    "updatedAt": "2026-11-03T04:04:37.175Z"
  },
  {
    "id": "dev-1793679237197",
    "serial": "XXYN6D454M",
    "title": "iPad Pro 11 inch M4 8GB/256GB",
    "deviceType": "iPad",
    "productLine": "iPad Pro",
    "chip": "M4",
    "ram": "8GB",
    "storage": "256GB",
    "screenSize": "11 inch",
    "color": "Midnight (Xanh Đêm)",
    "hasBatteryCapacity": true,
    "batteryCapacityPercent": 98,
    "hasBatteryCycle": true,
    "batteryCycleCount": 138,
    "batteryHealth": "Pin 98% • 138 lần sạc",
    "hasWarranty": false,
    "warrantyExpiryDate": "",
    "conditionNote": "Ngoại hình 99%",
    "importPrice": 0,
    "salePrice": 0,
    "receiverName": "Chưa rõ",
    "sourcerName": "Chưa rõ",
    "sellerName": "Chưa bán",
    "delivererName": "Chưa giao",
    "status": "available",
    "driveFolderId": "1H2gWzFAXib-UlTV7o3rg4GgeBZtmN6fM",
    "driveFolderUrl": "https://drive.google.com/drive/folders/1H2gWzFAXib-UlTV7o3rg4GgeBZtmN6fM",
    "images": [
      {
        "id": "1paeQX6kT65jRjcA5_do2a8Wp1vl-A45o",
        "name": "XXYN6D454M_SPEC_1.jpg",
        "url": "https://lh3.googleusercontent.com/d/1paeQX6kT65jRjcA5_do2a8Wp1vl-A45o",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1paeQX6kT65jRjcA5_do2a8Wp1vl-A45o",
        "driveViewUrl": "https://drive.google.com/file/d/1paeQX6kT65jRjcA5_do2a8Wp1vl-A45o/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 1
      },
      {
        "id": "1kmiyRM_aAJyqAUDFFv68D2UkuSAXyz1Q",
        "name": "XXYN6D454M_SPEC_2.jpg",
        "url": "https://lh3.googleusercontent.com/d/1kmiyRM_aAJyqAUDFFv68D2UkuSAXyz1Q",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1kmiyRM_aAJyqAUDFFv68D2UkuSAXyz1Q",
        "driveViewUrl": "https://drive.google.com/file/d/1kmiyRM_aAJyqAUDFFv68D2UkuSAXyz1Q/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 2
      },
      {
        "id": "1EUFE_w1jMzcyMCT0mM4lmQQViixiLlOa",
        "name": "XXYN6D454M_PHOTO_3.jpg",
        "url": "https://lh3.googleusercontent.com/d/1EUFE_w1jMzcyMCT0mM4lmQQViixiLlOa",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1EUFE_w1jMzcyMCT0mM4lmQQViixiLlOa",
        "driveViewUrl": "https://drive.google.com/file/d/1EUFE_w1jMzcyMCT0mM4lmQQViixiLlOa/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1AyQYOzlMVFwxljTfkma0Y7GYlJnRo3zt",
        "name": "XXYN6D454M_PHOTO_4.jpg",
        "url": "https://lh3.googleusercontent.com/d/1AyQYOzlMVFwxljTfkma0Y7GYlJnRo3zt",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1AyQYOzlMVFwxljTfkma0Y7GYlJnRo3zt",
        "driveViewUrl": "https://drive.google.com/file/d/1AyQYOzlMVFwxljTfkma0Y7GYlJnRo3zt/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1NgHTeRjc5ZFrR7aADPRgXQYsQOStlZtw",
        "name": "XXYN6D454M_PHOTO_5.jpg",
        "url": "https://lh3.googleusercontent.com/d/1NgHTeRjc5ZFrR7aADPRgXQYsQOStlZtw",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1NgHTeRjc5ZFrR7aADPRgXQYsQOStlZtw",
        "driveViewUrl": "https://drive.google.com/file/d/1NgHTeRjc5ZFrR7aADPRgXQYsQOStlZtw/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1yirinm913M5Mi7StAEj11Ih90u_S9biR",
        "name": "XXYN6D454M_PHOTO_6.jpg",
        "url": "https://lh3.googleusercontent.com/d/1yirinm913M5Mi7StAEj11Ih90u_S9biR",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1yirinm913M5Mi7StAEj11Ih90u_S9biR",
        "driveViewUrl": "https://drive.google.com/file/d/1yirinm913M5Mi7StAEj11Ih90u_S9biR/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1OJY8J4sCZCcCgz6iPkI4ZKSCdhRNYNvB",
        "name": "XXYN6D454M_PHOTO_7.jpg",
        "url": "https://lh3.googleusercontent.com/d/1OJY8J4sCZCcCgz6iPkI4ZKSCdhRNYNvB",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1OJY8J4sCZCcCgz6iPkI4ZKSCdhRNYNvB",
        "driveViewUrl": "https://drive.google.com/file/d/1OJY8J4sCZCcCgz6iPkI4ZKSCdhRNYNvB/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1eHtkoSmcWgr4FIsFq_HvRIPzwVKJ-M8g",
        "name": "XXYN6D454M_PHOTO_8.jpg",
        "url": "https://lh3.googleusercontent.com/d/1eHtkoSmcWgr4FIsFq_HvRIPzwVKJ-M8g",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1eHtkoSmcWgr4FIsFq_HvRIPzwVKJ-M8g",
        "driveViewUrl": "https://drive.google.com/file/d/1eHtkoSmcWgr4FIsFq_HvRIPzwVKJ-M8g/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1iRAjVbOf0YwDxXQnqoXU99VfgCDd58ps",
        "name": "XXYN6D454M_PHOTO_9.jpg",
        "url": "https://lh3.googleusercontent.com/d/1iRAjVbOf0YwDxXQnqoXU99VfgCDd58ps",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1iRAjVbOf0YwDxXQnqoXU99VfgCDd58ps",
        "driveViewUrl": "https://drive.google.com/file/d/1iRAjVbOf0YwDxXQnqoXU99VfgCDd58ps/view?usp=drivesdk",
        "isSpecImage": false
      }
    ],
    "createdAt": "2026-11-03T04:13:57.197Z",
    "updatedAt": "2026-11-03T04:16:48.777Z"
  },
  {
    "id": "dev-1793682933409",
    "serial": "C2ALW0WNTE",
    "title": "MacBook Air 13.6 inch M5 24GB/256GB",
    "deviceType": "MacBook",
    "productLine": "MacBook Air",
    "chip": "M5",
    "ram": "24GB",
    "storage": "256GB",
    "screenSize": "13.6 inch",
    "color": "Sky Blue (Xanh Da Trời)",
    "hasBatteryCapacity": true,
    "batteryCapacityPercent": 100,
    "hasBatteryCycle": true,
    "batteryCycleCount": 8,
    "batteryHealth": "Pin 100% • 8 lần sạc",
    "hasWarranty": true,
    "warrantyExpiryDate": "2027-04-18",
    "conditionNote": "",
    "importPrice": 0,
    "salePrice": 0,
    "receiverName": "Chưa rõ",
    "sourcerName": "Chưa rõ",
    "sellerName": "Chưa bán",
    "delivererName": "Chưa giao",
    "status": "available",
    "driveFolderId": "1L87lI-8BEDWfsn_1l_BDPo_cXn_Fbhn1",
    "driveFolderUrl": "https://drive.google.com/drive/folders/1L87lI-8BEDWfsn_1l_BDPo_cXn_Fbhn1",
    "images": [
      {
        "id": "1_gkRjDldO4Lhr8-0GDMB9ZAjEfjNJBI6",
        "name": "C2ALW0WNTE_SPEC_1.jpg",
        "url": "https://lh3.googleusercontent.com/d/1_gkRjDldO4Lhr8-0GDMB9ZAjEfjNJBI6",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1_gkRjDldO4Lhr8-0GDMB9ZAjEfjNJBI6",
        "driveViewUrl": "https://drive.google.com/file/d/1_gkRjDldO4Lhr8-0GDMB9ZAjEfjNJBI6/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 1
      },
      {
        "id": "1IkvvOxk_qRsl8P6CcP3L6Zt-ckuaWrwe",
        "name": "C2ALW0WNTE_SPEC_2.jpg",
        "url": "https://lh3.googleusercontent.com/d/1IkvvOxk_qRsl8P6CcP3L6Zt-ckuaWrwe",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1IkvvOxk_qRsl8P6CcP3L6Zt-ckuaWrwe",
        "driveViewUrl": "https://drive.google.com/file/d/1IkvvOxk_qRsl8P6CcP3L6Zt-ckuaWrwe/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 2
      },
      {
        "id": "1N4nv2sV9dt2kXm0nupg1miU_SWLG0ZjX",
        "name": "C2ALW0WNTE_PHOTO_3.jpg",
        "url": "https://lh3.googleusercontent.com/d/1N4nv2sV9dt2kXm0nupg1miU_SWLG0ZjX",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1N4nv2sV9dt2kXm0nupg1miU_SWLG0ZjX",
        "driveViewUrl": "https://drive.google.com/file/d/1N4nv2sV9dt2kXm0nupg1miU_SWLG0ZjX/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1a7vium8NRaPcQ7I6Ui9_q28txMj17Gp6",
        "name": "C2ALW0WNTE_PHOTO_4.jpg",
        "url": "https://lh3.googleusercontent.com/d/1a7vium8NRaPcQ7I6Ui9_q28txMj17Gp6",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1a7vium8NRaPcQ7I6Ui9_q28txMj17Gp6",
        "driveViewUrl": "https://drive.google.com/file/d/1a7vium8NRaPcQ7I6Ui9_q28txMj17Gp6/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1FDwBIZju_6TZKqTbKrbnYF54VvoFrwLt",
        "name": "C2ALW0WNTE_PHOTO_5.jpg",
        "url": "https://lh3.googleusercontent.com/d/1FDwBIZju_6TZKqTbKrbnYF54VvoFrwLt",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1FDwBIZju_6TZKqTbKrbnYF54VvoFrwLt",
        "driveViewUrl": "https://drive.google.com/file/d/1FDwBIZju_6TZKqTbKrbnYF54VvoFrwLt/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "19QAoy2l99otJ9xIc8bZ_SzkJomX37lOR",
        "name": "C2ALW0WNTE_PHOTO_6.jpg",
        "url": "https://lh3.googleusercontent.com/d/19QAoy2l99otJ9xIc8bZ_SzkJomX37lOR",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=19QAoy2l99otJ9xIc8bZ_SzkJomX37lOR",
        "driveViewUrl": "https://drive.google.com/file/d/19QAoy2l99otJ9xIc8bZ_SzkJomX37lOR/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1sxWXntrRrIJ8DXgL4eRNuQjw7GL4R5o6",
        "name": "C2ALW0WNTE_PHOTO_7.jpg",
        "url": "https://lh3.googleusercontent.com/d/1sxWXntrRrIJ8DXgL4eRNuQjw7GL4R5o6",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1sxWXntrRrIJ8DXgL4eRNuQjw7GL4R5o6",
        "driveViewUrl": "https://drive.google.com/file/d/1sxWXntrRrIJ8DXgL4eRNuQjw7GL4R5o6/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1hpZd8vxHGYoCbfFawFgp3qHMB9Tmpm0H",
        "name": "C2ALW0WNTE_PHOTO_8.jpg",
        "url": "https://lh3.googleusercontent.com/d/1hpZd8vxHGYoCbfFawFgp3qHMB9Tmpm0H",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1hpZd8vxHGYoCbfFawFgp3qHMB9Tmpm0H",
        "driveViewUrl": "https://drive.google.com/file/d/1hpZd8vxHGYoCbfFawFgp3qHMB9Tmpm0H/view?usp=drivesdk",
        "isSpecImage": false
      }
    ],
    "createdAt": "2026-11-03T05:15:33.409Z",
    "updatedAt": "2026-11-03T05:16:04.905Z"
  },
  {
    "id": "dev-1793683971117",
    "serial": "MJ2FL6PDAT",
    "title": "iPad Gen 10.9 inch A16 128GB",
    "deviceType": "iPad",
    "productLine": "iPad Gen",
    "chip": "A16",
    "ram": "N/A",
    "storage": "128GB",
    "screenSize": "10.9 inch",
    "color": "Blue (Xanh Dương)",
    "hasBatteryCapacity": false,
    "hasBatteryCycle": false,
    "batteryHealth": "Pin % •  lần sạc",
    "hasWarranty": true,
    "warrantyExpiryDate": "2027-04-16",
    "conditionNote": "",
    "importPrice": 0,
    "salePrice": 0,
    "receiverName": "Chưa rõ",
    "sourcerName": "Chưa rõ",
    "sellerName": "Chưa bán",
    "delivererName": "Chưa giao",
    "status": "available",
    "driveFolderId": "1VEHDI7lHakiuN9pBIQHTqIdY55_9vICT",
    "driveFolderUrl": "https://drive.google.com/drive/folders/1VEHDI7lHakiuN9pBIQHTqIdY55_9vICT",
    "images": [
      {
        "id": "1hvhqNfSRYph1ht4MrmShmyVm47rnILnT",
        "name": "MJ2FL6PDAT_SPEC_1.jpg",
        "url": "https://lh3.googleusercontent.com/d/1hvhqNfSRYph1ht4MrmShmyVm47rnILnT",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1hvhqNfSRYph1ht4MrmShmyVm47rnILnT",
        "driveViewUrl": "https://drive.google.com/file/d/1hvhqNfSRYph1ht4MrmShmyVm47rnILnT/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 1
      },
      {
        "id": "1BzSOzdslA5gSMgyv7E7kUfJKQIZOS57K",
        "name": "MJ2FL6PDAT_SPEC_2.jpg",
        "url": "https://lh3.googleusercontent.com/d/1BzSOzdslA5gSMgyv7E7kUfJKQIZOS57K",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1BzSOzdslA5gSMgyv7E7kUfJKQIZOS57K",
        "driveViewUrl": "https://drive.google.com/file/d/1BzSOzdslA5gSMgyv7E7kUfJKQIZOS57K/view?usp=drivesdk",
        "isSpecImage": true,
        "specSlot": 2
      },
      {
        "id": "18SP2RvsP7904zJKnrj8ovn3X4rUmctog",
        "name": "MJ2FL6PDAT_PHOTO_3.jpg",
        "url": "https://lh3.googleusercontent.com/d/18SP2RvsP7904zJKnrj8ovn3X4rUmctog",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=18SP2RvsP7904zJKnrj8ovn3X4rUmctog",
        "driveViewUrl": "https://drive.google.com/file/d/18SP2RvsP7904zJKnrj8ovn3X4rUmctog/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1vkbVKHfEOp9efDz9X6mZdvGk_jMXh8VD",
        "name": "MJ2FL6PDAT_PHOTO_4.jpg",
        "url": "https://lh3.googleusercontent.com/d/1vkbVKHfEOp9efDz9X6mZdvGk_jMXh8VD",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1vkbVKHfEOp9efDz9X6mZdvGk_jMXh8VD",
        "driveViewUrl": "https://drive.google.com/file/d/1vkbVKHfEOp9efDz9X6mZdvGk_jMXh8VD/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1QIW3qOYzLyEaAM6qRUHIrskJmbbCDQZE",
        "name": "MJ2FL6PDAT_PHOTO_5.jpg",
        "url": "https://lh3.googleusercontent.com/d/1QIW3qOYzLyEaAM6qRUHIrskJmbbCDQZE",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1QIW3qOYzLyEaAM6qRUHIrskJmbbCDQZE",
        "driveViewUrl": "https://drive.google.com/file/d/1QIW3qOYzLyEaAM6qRUHIrskJmbbCDQZE/view?usp=drivesdk",
        "isSpecImage": false
      },
      {
        "id": "1RIPorBWyducT2lgnNVsBpEwdtjsYV3MT",
        "name": "MJ2FL6PDAT_PHOTO_6.jpg",
        "url": "https://lh3.googleusercontent.com/d/1RIPorBWyducT2lgnNVsBpEwdtjsYV3MT",
        "downloadUrl": "https://drive.google.com/uc?export=download&id=1RIPorBWyducT2lgnNVsBpEwdtjsYV3MT",
        "driveViewUrl": "https://drive.google.com/file/d/1RIPorBWyducT2lgnNVsBpEwdtjsYV3MT/view?usp=drivesdk",
        "isSpecImage": false
      }
    ],
    "createdAt": "2026-11-03T05:32:51.117Z",
    "updatedAt": "2026-11-03T05:33:09.187Z"
  }
];
