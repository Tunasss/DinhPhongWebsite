/**
 * ============================================================================
 * ĐÌNH PHONG APPLE - GOOGLE APPS SCRIPT BACKEND (DRIVE + SHEET DỮ LIỆU THÔ)
 * ============================================================================
 * Folder Google Drive gốc (DinhPhongData):
 * https://drive.google.com/drive/folders/1fTKgedG4yGx6c9Sc96-385DHYWPv-CyT?usp=sharing
 *
 * File Google Sheet Dữ Liệu Thô của bạn (Đã tạo thành công):
 * https://docs.google.com/spreadsheets/d/1hrn38CRokXNRRMQalwelBXLuYplY_2-m2Uybpz-9sQI/edit
 */

const DEFAULT_ROOT_FOLDER_ID = '1fTKgedG4yGx6c9Sc96-385DHYWPv-CyT';
const DEFAULT_SHEET_ID = '1hrn38CRokXNRRMQalwelBXLuYplY_2-m2Uybpz-9sQI';
const RAW_SHEET_FILE_NAME = 'DinhPhong_DuLieuTho_KhoMay';
const SHEET_TAB_NAME = 'DuLieuTho_KhoMay';
const ACCOUNTS_TAB_NAME = 'TaiKhoan_NhanSu';

function getOrCreateAccountsSheet(ss) {
  let sheet = ss.getSheetByName(ACCOUNTS_TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ACCOUNTS_TAB_NAME);
    const headers = ['id', 'username', 'passwordHash', 'displayName', 'role', 'isActive', 'phone', 'createdAt', 'updatedAt'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function CAP_QUYEN_VA_TAO_SHEET_NGAY() {
  const res = getOrCreateSpreadsheetInDriveFolder(DEFAULT_ROOT_FOLDER_ID);
  
  // 1. Tự động tạo Tab TaiKhoan_NhanSu và nạp 6 tài khoản mặc định
  const accSheet = getOrCreateAccountsSheet(res.ss);
  if (accSheet.getLastRow() <= 1) {
    const seedAccounts = [
      ['usr_admin', 'ADMIN', 'c1698be9631f13ea7c946cc40023d7d498790c370981d2a5bed0f5acdbb99881', 'Quản trị viên (ADMIN)', 'admin', 'TRUE', '0901234567', new Date().toISOString(), new Date().toISOString()],
      ['usr_anhvu', 'anhvu', '8765e25b490cc0e6c13862bc330f31c84dbf0dd8db74c5d30638eb1e88010331', 'Anh Vũ', 'staff', 'TRUE', '', new Date().toISOString(), new Date().toISOString()],
      ['usr_vonguyen', 'vonguyen', '8765e25b490cc0e6c13862bc330f31c84dbf0dd8db74c5d30638eb1e88010331', 'Võ Nguyên', 'staff', 'TRUE', '', new Date().toISOString(), new Date().toISOString()],
      ['usr_phantuan', 'phantuan', '8765e25b490cc0e6c13862bc330f31c84dbf0dd8db74c5d30638eb1e88010331', 'Phan Tuấn', 'staff', 'TRUE', '', new Date().toISOString(), new Date().toISOString()],
      ['usr_anhtuan', 'anhtuan', '8765e25b490cc0e6c13862bc330f31c84dbf0dd8db74c5d30638eb1e88010331', 'Anh Tuấn', 'staff', 'TRUE', '', new Date().toISOString(), new Date().toISOString()],
      ['usr_dinhphong', 'dinhphong', '8765e25b490cc0e6c13862bc330f31c84dbf0dd8db74c5d30638eb1e88010331', 'Đình Phong', 'staff', 'TRUE', '', new Date().toISOString(), new Date().toISOString()]
    ];
    seedAccounts.forEach(function(row) {
      accSheet.appendRow(row);
    });
  }

  // 2. Kiểm tra quyền tạo Folder con trong DinhPhongData luôn
  const testFolder = getOrCreateSerialFolder(
    res.rootFolder,
    'C24WT1P2GL',
    'MacBook Air 13.6 inch M4 16GB/256GB',
    'MacBook Air',
    false
  );
  Logger.log('✅ ĐÃ KẾT NỐI THÀNH CÔNG FOLDER: ' + res.rootFolder.getName());
  Logger.log('✅ ĐÃ TẠO THÀNH CÔNG TAB: ' + accSheet.getName() + ' (Có ' + accSheet.getLastRow() + ' dòng)');
  Logger.log('✅ ĐÃ MỞ FILE SHEET DỮ LIỆU THÔ: ' + res.ss.getUrl());
}

function extractCleanFolderId(input) {
  const raw = String(input || DEFAULT_ROOT_FOLDER_ID).trim();
  if (!raw) return DEFAULT_ROOT_FOLDER_ID;
  const folderMatch = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];
  return raw;
}

function getOrCreateSpreadsheetInDriveFolder(rootFolderId) {
  const cleanRootId = extractCleanFolderId(rootFolderId);
  const rootFolder = DriveApp.getFolderById(cleanRootId);

  let ss = null;
  // 1. Ưu tiên mở trực tiếp file Sheet đã tạo của bạn (1hrn38CRokXNRRMQalwelBXLuYplY_2-m2Uybpz-9sQI)
  try {
    ss = SpreadsheetApp.openById(DEFAULT_SHEET_ID);
  } catch (e) {
    ss = null;
  }

  // 2. Nếu không thấy, tìm theo tên trong folder DinhPhongData
  if (!ss) {
    const existingFiles = rootFolder.getFilesByName(RAW_SHEET_FILE_NAME);
    while (existingFiles.hasNext()) {
      const file = existingFiles.next();
      if (!file.isTrashed() && file.getMimeType() === MimeType.GOOGLE_SHEETS) {
        ss = SpreadsheetApp.openById(file.getId());
        break;
      }
    }
  }

  // 3. Nếu vẫn chưa có thì tạo mới
  if (!ss) {
    ss = SpreadsheetApp.create(RAW_SHEET_FILE_NAME);
    const ssFile = DriveApp.getFileById(ss.getId());
    ssFile.moveTo(rootFolder);
    try {
      ssFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}
  }

  let sheet = ss.getSheetByName(SHEET_TAB_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(SHEET_TAB_NAME);
  }

  if (sheet.getLastRow() === 0) {
    const headers = [
      'id',
      'serial',
      'title',
      'deviceType',
      'productLine',
      'chip',
      'ram',
      'storage',
      'screenSize',
      'color',
      'hasBatteryCapacity',
      'batteryCapacityPercent',
      'hasBatteryCycle',
      'batteryCycleCount',
      'hasWarranty',
      'warrantyExpiryDate',
      'conditionNote',
      'importPrice',
      'salePrice',
      'receiverName',
      'sourcerName',
      'sellerName',
      'delivererName',
      'status',
      'driveFolderId',
      'driveFolderUrl',
      'imageCount',
      'imagesJson',
      'createdAt',
      'updatedAt'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  return { ss, sheet, rootFolder };
}

function doGet(e) {
  try {
    const rootFolderId = (e && e.parameter && e.parameter.rootFolderId) || DEFAULT_ROOT_FOLDER_ID;
    const reqAction = e && e.parameter && e.parameter.action;
    const { ss, sheet, rootFolder } = getOrCreateSpreadsheetInDriveFolder(rootFolderId);

    // Xử lý lấy danh sách tài khoản
    if (reqAction === 'getAccounts') {
      const accSheet = getOrCreateAccountsSheet(ss);
      const accData = accSheet.getDataRange().getValues();
      const users = [];
      if (accData.length > 1) {
        const accHeaders = accData[0];
        for (let i = 1; i < accData.length; i++) {
          const row = accData[i];
          if (!row[0] || !row[1]) continue;
          const u = {};
          accHeaders.forEach((h, idx) => {
            u[h] = row[idx];
          });
          u.isActive = u.isActive === true || u.isActive === 'TRUE' || u.isActive === 'true';
          users.push(u);
        }
      }
      return jsonResponse({ ok: true, users: users });
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({
        ok: true,
        devices: [],
        sheetUrl: ss.getUrl(),
        rootFolderUrl: rootFolder.getUrl()
      });
    }
    const headers = data[0];
    const devices = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      const obj = {};
      headers.forEach((h, idx) => {
        let val = row[idx];
        if (val instanceof Date) {
          if (h === 'warrantyExpiryDate') {
            val = Utilities.formatDate(val, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
          } else {
            val = val.toISOString();
          }
        }
        obj[h] = val;
      });
      if (obj.warrantyExpiryDate && typeof obj.warrantyExpiryDate === 'string' && obj.warrantyExpiryDate.includes('T')) {
        const d = new Date(obj.warrantyExpiryDate);
        if (!isNaN(d.getTime())) {
          obj.warrantyExpiryDate = Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
        }
      }
      try {
        obj.images = obj.imagesJson ? JSON.parse(obj.imagesJson) : [];
      } catch (err) {
        obj.images = [];
      }
      obj.importPrice = Number(obj.importPrice) || 0;
      obj.salePrice = Number(obj.salePrice) || 0;
      obj.hasBatteryCapacity = obj.hasBatteryCapacity === true || obj.hasBatteryCapacity === 'true';
      obj.batteryCapacityPercent = obj.batteryCapacityPercent !== '' ? Number(obj.batteryCapacityPercent) : undefined;
      obj.hasBatteryCycle = obj.hasBatteryCycle === true || obj.hasBatteryCycle === 'true';
      obj.batteryCycleCount = obj.batteryCycleCount !== '' ? Number(obj.batteryCycleCount) : undefined;
      obj.hasWarranty = obj.hasWarranty === true || obj.hasWarranty === 'true';
      devices.push(obj);
    }
    return jsonResponse({
      ok: true,
      devices: devices.reverse(),
      sheetUrl: ss.getUrl(),
      rootFolderUrl: rootFolder.getUrl()
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === 'saveAccounts') {
      const rootFolderId = payload.rootFolderId || DEFAULT_ROOT_FOLDER_ID;
      const { ss } = getOrCreateSpreadsheetInDriveFolder(rootFolderId);
      const accSheet = getOrCreateAccountsSheet(ss);
      const users = payload.users || [];
      const lastRow = accSheet.getLastRow();
      if (lastRow > 1) {
        accSheet.getRange(2, 1, lastRow - 1, accSheet.getLastColumn()).clearContent();
      }
      users.forEach((u) => {
        accSheet.appendRow([
          u.id || '',
          u.username || '',
          u.passwordHash || '',
          u.displayName || '',
          u.role || 'staff',
          u.isActive !== false ? 'TRUE' : 'FALSE',
          u.phone || '',
          u.createdAt || '',
          new Date().toISOString()
        ]);
      });
      return jsonResponse({ ok: true, count: users.length });
    }

    if (action === 'initDriveAndSheet') {
      const { ss, rootFolder } = getOrCreateSpreadsheetInDriveFolder(payload.rootFolderId);
      return jsonResponse({
        ok: true,
        sheetUrl: ss.getUrl(),
        sheetName: RAW_SHEET_FILE_NAME,
        rootFolderUrl: rootFolder.getUrl()
      });
    }
    if (action === 'saveDevice') {
      return handleSaveDevice(payload);
    }
    if (action === 'uploadSingleImage') {
      return handleUploadSingleImage(payload);
    }
    if (action === 'deleteDevice') {
      return handleDeleteDevice(payload);
    }
    if (action === 'updateStatus') {
      return handleUpdateStatus(payload);
    }
    return jsonResponse({ ok: false, error: 'Action không hợp lệ: ' + action });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.toString() });
  }
}

function getOrCreateSerialFolder(rootFolder, serial, title, productLine, organizeByCategory) {
  let parentFolder = rootFolder;

  if (organizeByCategory && productLine) {
    const catFolders = rootFolder.getFoldersByName(productLine);
    parentFolder = catFolders.hasNext() ? catFolders.next() : rootFolder.createFolder(productLine);
  }

  const cleanSerial = (serial || 'NO_SERIAL').trim().toUpperCase();
  const folderName = cleanSerial + (title ? ' - ' + title : '');

  const existingFolders = parentFolder.getFolders();
  while (existingFolders.hasNext()) {
    const f = existingFolders.next();
    if (!f.isTrashed() && f.getName().toUpperCase().indexOf(cleanSerial) === 0) {
      return f;
    }
  }

  const newFolder = parentFolder.createFolder(folderName);
  try {
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
  return newFolder;
}

function handleSaveDevice(payload) {
  const rootFolderId = payload.rootFolderId || DEFAULT_ROOT_FOLDER_ID;
  const { ss, sheet, rootFolder } = getOrCreateSpreadsheetInDriveFolder(rootFolderId);
  const device = payload.device;
  const organizeByCategory = payload.organizeByCategory === true;

  const targetFolder = getOrCreateSerialFolder(
    rootFolder,
    device.serial,
    device.title,
    device.productLine,
    organizeByCategory
  );
  const driveFolderId = targetFolder.getId();
  const driveFolderUrl = targetFolder.getUrl();

  const uploadedImages = [];
  const images = device.images || [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (img.base64Data) {
      const contentType = img.mimeType || 'image/jpeg';
      const ext = contentType.indexOf('png') !== -1 ? '.png' : '.jpg';
      const prefix = img.isSpecImage ? 'SPEC_' : 'PHOTO_';
      const fileName = (device.serial || 'DEVICE') + '_' + prefix + (i + 1) + ext;
      const bytes = Utilities.base64Decode(img.base64Data);
      const blob = Utilities.newBlob(bytes, contentType, fileName);
      const file = targetFolder.createFile(blob);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {}
      const fileId = file.getId();
      uploadedImages.push({
        id: fileId,
        name: fileName,
        url: 'https://lh3.googleusercontent.com/d/' + fileId,
        downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
        driveViewUrl: file.getUrl(),
        isSpecImage: !!img.isSpecImage,
        specSlot: img.specSlot
      });
    } else {
      uploadedImages.push({
        id: img.id || ('img_' + i),
        name: img.name || ('photo_' + (i + 1) + '.jpg'),
        url: img.url,
        downloadUrl: img.downloadUrl || img.url,
        driveViewUrl: img.driveViewUrl || '',
        isSpecImage: !!img.isSpecImage,
        specSlot: img.specSlot
      });
    }
  }

  const now = new Date().toISOString();
  const rowValues = [
    device.id,
    (device.serial || '').toUpperCase(),
    device.title || '',
    device.deviceType || 'MacBook',
    device.productLine || 'MacBook Air',
    device.chip || 'M4',
    device.ram || '16GB',
    device.storage || '256GB',
    device.screenSize || '13.6 inch',
    device.color || 'Silver (Bạc)',
    !!device.hasBatteryCapacity,
    device.batteryCapacityPercent !== undefined ? Number(device.batteryCapacityPercent) : '',
    !!device.hasBatteryCycle,
    device.batteryCycleCount !== undefined ? Number(device.batteryCycleCount) : '',
    !!device.hasWarranty,
    device.hasWarranty ? (device.warrantyExpiryDate ? String(device.warrantyExpiryDate).slice(0, 10) : '') : '',
    device.conditionNote || '',
    Number(device.importPrice) || 0,
    Number(device.salePrice) || 0,
    device.receiverName || '',
    device.sourcerName || '',
    device.sellerName || '',
    device.delivererName || '',
    device.status || 'available',
    driveFolderId,
    driveFolderUrl,
    uploadedImages.length,
    JSON.stringify(uploadedImages),
    device.createdAt || now,
    now
  ];

  const data = sheet.getDataRange().getValues();
  let updatedRowIndex = -1;
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(device.id)) {
      updatedRowIndex = r + 1;
      break;
    }
  }

  if (updatedRowIndex > 0) {
    sheet.getRange(updatedRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  device.driveFolderId = driveFolderId;
  device.driveFolderUrl = driveFolderUrl;
  device.images = uploadedImages;
  device.updatedAt = now;

  return jsonResponse({
    ok: true,
    device: device,
    sheetUrl: ss.getUrl(),
    driveFolderUrl: driveFolderUrl
  });
}

function handleUploadSingleImage(payload) {
  const folderId = payload.driveFolderId;
  const serial = (payload.serial || 'DEVICE').toUpperCase();
  const index = Number(payload.index) || 1;
  const img = payload.image;

  const targetFolder = DriveApp.getFolderById(folderId);
  const contentType = img.mimeType || 'image/jpeg';
  const ext = contentType.indexOf('png') !== -1 ? '.png' : '.jpg';
  const prefix = img.isSpecImage ? 'SPEC_' : 'PHOTO_';
  const fileName = serial + '_' + prefix + index + ext;
  const bytes = Utilities.base64Decode(img.base64Data);
  const blob = Utilities.newBlob(bytes, contentType, fileName);
  const file = targetFolder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
  const fileId = file.getId();

  return jsonResponse({
    ok: true,
    uploadedImage: {
      id: fileId,
      name: fileName,
      url: 'https://lh3.googleusercontent.com/d/' + fileId,
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
      driveViewUrl: file.getUrl(),
      isSpecImage: !!img.isSpecImage,
      specSlot: img.specSlot
    }
  });
}

function handleDeleteDevice(payload) {
  const { sheet } = getOrCreateSpreadsheetInDriveFolder(payload.rootFolderId);
  const id = payload.id;
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(id)) {
      sheet.deleteRow(r + 1);
      return jsonResponse({ ok: true });
    }
  }
  return jsonResponse({ ok: false, error: 'Không tìm thấy máy để xóa' });
}

function handleUpdateStatus(payload) {
  const { sheet } = getOrCreateSpreadsheetInDriveFolder(payload.rootFolderId);
  const id = payload.id;
  const status = payload.status;
  const sellerName = payload.sellerName;
  const delivererName = payload.delivererName;
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(id)) {
      sheet.getRange(r + 1, 24).setValue(status);
      if (sellerName !== undefined) sheet.getRange(r + 1, 22).setValue(sellerName);
      if (delivererName !== undefined) sheet.getRange(r + 1, 23).setValue(delivererName);
      sheet.getRange(r + 1, 30).setValue(new Date().toISOString());
      return jsonResponse({ ok: true });
    }
  }
  return jsonResponse({ ok: false, error: 'Không tìm thấy máy' });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
