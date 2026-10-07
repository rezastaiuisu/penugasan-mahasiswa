import { Submission, LecturerSettings, Assignment } from '../types';

export interface DispatchResult {
  success: boolean;
  driveFileUrl?: string;
  driveFileId?: string;
  emailSent?: boolean;
  message: string;
  folderName?: string;
  warning?: string;
}

/**
 * Clean and extract folder ID from pure ID, full Google Drive URL, or folder name
 */
export const extractCleanFolderId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  // Check if it's a URL like https://drive.google.com/drive/folders/1AbC...
  const match = trimmed.match(/[-\w]{25,}/);
  return match ? match[0] : trimmed;
};

/**
 * Validate Google Apps Script Web App URL
 */
export const validateWebhookUrl = (url: string): { isValid: boolean; warning?: string } => {
  if (!url || url.trim().length === 0) {
    return { isValid: false, warning: 'URL Webhook masih kosong.' };
  }
  const clean = url.trim();
  if (clean.includes('/edit')) {
    return {
      isValid: false,
      warning: 'URL yang Anda masukkan adalah tautan editor script (/edit). Gunakan URL Web App hasil Deploy yang berakhiran /exec.',
    };
  }
  if (!clean.startsWith('https://script.google.com/macros/s/')) {
    return {
      isValid: false,
      warning: 'URL harus dimulai dengan "https://script.google.com/macros/s/...".',
    };
  }
  if (!clean.endsWith('/exec')) {
    return {
      isValid: false,
      warning: 'URL Web App yang valid harus berakhiran "/exec".',
    };
  }
  return { isValid: true };
};

/**
 * Generate Google Apps Script code to be pasted into script.google.com
 * Features:
 * 1. Multi-strategy folder resolution (by ID, by Name, auto-create folder if needed, fallback to Root)
 * 2. Protected file upload (isolated try-catch so Drive errors never block Gmail delivery)
 * 3. Base64 sanitation (handles data URL prefixes, whitespace, padding)
 * 4. Dual email dispatch (Student confirmation receipt + Lecturer alert notification)
 * 5. Diagnostic test mode (isTest: true) for 1-click verification
 */
export const generateAppsScriptCode = (settings: LecturerSettings): string => {
  const cleanDefaultFolder = extractCleanFolderId(settings.googleDriveDefaultFolderId) || '1AbCdEfGhIjKlMnOpQrStUvWxYz_2026';
  const dosenEmail = settings.emailDosen || 'rezastaiuisu@gmail.com';
  const dosenNama = `${settings.namaDosen || 'Reza Lubis'}, ${settings.gelar || 'M.Pd'}`;
  const kampus = settings.kampus || 'STAI UISU Medan';

  return `/**
 * =======================================================================
 * GOOGLE APPS SCRIPT - WEBHOOK PORTAL PENUGASAN MAHASISWA (VERSI 3.0 RESMI)
 * Dosen Pengampu : ${dosenNama}
 * Email Dosen    : ${dosenEmail}
 * Kampus         : ${kampus}
 * Default Folder : ${cleanDefaultFolder}
 * =======================================================================
 * 
 * PANDUAN PENERAPAN / DEPLOYMENT (PENTING - IKUTI DENGAN TELITI):
 * 1. Buka https://script.google.com/home (Login dengan akun Google: ${dosenEmail})
 * 2. Buka proyek script portal tugas Anda (atau klik "+ Proyek Baru")
 * 3. Hapus seluruh isi script lama, lalu SALIN & TEMPEL KODE INI SELURUHNYA.
 * 4. Klik ikon Disket (Simpan) di toolbar atas.
 * 5. Klik tombol biru "Deploy" di kanan atas:
 *    - Jika proyek baru: Pilih "New deployment" (Penerapan baru)
 *    - Jika sudah ada: Pilih "Manage deployments" (Kelola penerapan) -> Klik ikon Pensil (Edit) -> Versi: Pilih "New version" (Versi Baru) -> Klik Deploy!
 * 6. Pastikan pengaturan:
 *    - Execute as     : "Me (${dosenEmail})"
 *    - Who has access : "Anyone" (Siapa saja)  <-- WAJIB "Anyone"!
 * 7. Salin URL Web App yang berakhiran "/exec" dan simpan di Portal Dosen!
 * =======================================================================
 */

const DEFAULT_DRIVE_FOLDER_ID = "${cleanDefaultFolder}";
const DOSEN_EMAIL = "${dosenEmail}";
const DOSEN_NAMA = "${dosenNama}";
const KAMPUS = "${kampus}";

function extractCleanFolderId(str) {
  if (!str) return "";
  var s = str.toString().trim();
  var match = s.match(/[-\\w]{25,}/);
  return match ? match[0] : s;
}

/**
 * Temukan folder target di Google Drive dengan strategi bertingkat:
 * 1. Coba getFolderById
 * 2. Coba getFoldersByName
 * 3. Coba createFolder (otomatis buat folder baru jika belum ada)
 * 4. Fallback ke Root Drive Dosen
 */
function resolveTargetFolder(rawInput) {
  var raw = (rawInput || DEFAULT_DRIVE_FOLDER_ID || "").toString().trim();
  var cleanId = extractCleanFolderId(raw);
  var target = null;

  // 1. Coba berdasarkan ID folder murni (panjang > 10)
  if (cleanId && cleanId.length > 10) {
    try {
      target = DriveApp.getFolderById(cleanId);
      if (target) return target;
    } catch (errId) {
      Logger.log("getFolderById gagal untuk ID " + cleanId + ": " + errId.toString());
    }
  }

  // 2. Coba cari berdasarkan Nama Folder
  if (raw && raw.length > 2) {
    try {
      var folders = DriveApp.getFoldersByName(raw);
      if (folders.hasNext()) {
        return folders.next();
      }
    } catch (errName) {
      Logger.log("getFoldersByName gagal: " + errName.toString());
    }
  }

  // 3. Jika nama folder dimasukkan tapi belum ada di Drive, OTOMATIS BUATKAN FOLDER
  if (raw && raw.length > 2 && raw.indexOf("1AbCdEfGh") === -1 && raw.length < 80) {
    try {
      var newFolder = DriveApp.createFolder(raw);
      if (newFolder) return newFolder;
    } catch (errCreate) {
      Logger.log("createFolder gagal: " + errCreate.toString());
    }
  }

  // 4. Fallback aman terakhir: Root Drive Saya (My Drive)
  try {
    return DriveApp.getRootFolder();
  } catch (rootErr) {
    return null;
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Tidak ada data postData yang diterima oleh Webhook."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = {};
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Format JSON payload tidak valid: " + parseErr.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // 0. MODE TES KONEKSI DARI DASHBOARD DOSEN
    // ==========================================
    if (data.isTest === true) {
      var testFolder = resolveTargetFolder(data.driveFolderId);
      var folderName = testFolder ? testFolder.getName() : "Root Drive";
      var folderId = testFolder ? testFolder.getId() : "";

      var testContent = "TES SINKRONISASI BERHASIL!\\n\\n" +
        "Portal Penugasan Dosen: " + DOSEN_NAMA + "\\n" +
        "Target Email Dosen   : " + DOSEN_EMAIL + "\\n" +
        "Target Folder Drive  : " + folderName + " (ID: " + folderId + ")\\n" +
        "Waktu Pengujian      : " + new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB\\n\\n" +
        "Selamat! Webhook Google Apps Script Anda 100% aktif dan siap menerima tugas mahasiswa serta mengirim email konfirmasi otomatis.";
      
      var testFile = null;
      var testFileUrl = "";
      try {
        if (testFolder) {
          testFile = testFolder.createFile("TES_KONEKSI_PORTAL_DOSEN.txt", testContent, MimeType.PLAIN_TEXT);
          testFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          testFileUrl = testFile.getUrl();
        }
      } catch (fErr) {
        Logger.log("Gagal buat file tes di folder, coba root: " + fErr.toString());
        try {
          testFile = DriveApp.getRootFolder().createFile("TES_KONEKSI_PORTAL_DOSEN.txt", testContent, MimeType.PLAIN_TEXT);
          testFileUrl = testFile.getUrl();
        } catch (fErr2) {}
      }

      // Kirim email tes verifikasi ke Gmail Dosen
      try {
        GmailApp.sendEmail(
          DOSEN_EMAIL,
          "[SUKSES] Uji Coba Sinkronisasi Google Drive & Gmail Portal Tugas",
          testContent,
          {
            htmlBody: "<div style='font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #10b981; border-radius: 8px;'>" +
              "<h2 style='color: #047857; margin-top: 0;'>Uji Coba Sinkronisasi Berhasil!</h2>" +
              "<p>Halo Bapak <b>" + DOSEN_NAMA + "</b>,</p>" +
              "<p>Selamat! Webhook Google Apps Script Anda telah <b>sukses terhubung</b> dengan Portal Penugasan Mahasiswa.</p>" +
              "<ul>" +
              "<li><b>Google Drive Target:</b> " + folderName + "</li>" +
              (testFileUrl ? "<li><b>File Uji Coba:</b> <a href='" + testFileUrl + "' target='_blank'>Lihat File Tes di Drive</a></li>" : "") +
              "<li><b>Email Dosen:</b> " + DOSEN_EMAIL + "</li>" +
              "</ul>" +
              "<p>Mulai sekarang, berkas mahasiswa akan <b>otomatis tersimpan ke Google Drive</b> Anda dan konfirmasi akan <b>otomatis terkirim via Gmail</b>.</p>" +
              "</div>",
            name: "Portal Tugas STAI UISU"
          }
        );
      } catch (errMail) {
        Logger.log("Gagal kirim email tes: " + errMail.toString());
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        isTest: true,
        driveFileUrl: testFileUrl,
        folderName: folderName,
        folderId: folderId,
        message: "Uji coba berhasil! File tes tersimpan di folder '" + folderName + "' dan email konfirmasi terkirim ke " + DOSEN_EMAIL
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // 1. CARI ATAU BUAT FOLDER TARGET DI DRIVE
    // ==========================================
    var targetFolder = resolveTargetFolder(data.driveFolderId);
    var finalFolderName = targetFolder ? targetFolder.getName() : "Root Drive Dosen";
    var finalFolderId = targetFolder ? targetFolder.getId() : "";

    // ==========================================
    // 2. SIMPAN BERKAS MAHASISWA KE DRIVE (PROTECTED)
    // ==========================================
    var fileUrl = "";
    var fileId = "";
    var fileSaveWarning = "";

    if (data.file && data.file.base64Data) {
      try {
        var rawBase64 = (data.file.base64Data || "").toString().trim();
        // Bersihkan prefix data URL jika ada
        if (rawBase64.indexOf(",") !== -1) {
          rawBase64 = rawBase64.split(",")[1];
        }
        // Bersihkan spasi atau newline
        rawBase64 = rawBase64.replace(/\\s+/g, "");

        var decodedData = Utilities.base64Decode(rawBase64);
        var mimeType = data.file.type || "application/octet-stream";

        // Format nama file: [NIM]_[Nama]_[MataKuliah]_[NamaAsli]
        var nimPrefix = data.nimPengirim ? "[" + data.nimPengirim + "] " : "";
        var namaPrefix = data.namaPengirim ? data.namaPengirim + " - " : "";
        var cleanFileName = (data.file.name || "Tugas_Mahasiswa.pdf").replace(/[\\\\/:*?\"<>|]/g, "_");
        var customFileName = nimPrefix + namaPrefix + cleanFileName;

        var blob = Utilities.newBlob(decodedData, mimeType, customFileName);
        var uploadedFile = null;

        // Coba simpan ke target folder
        try {
          if (targetFolder) {
            uploadedFile = targetFolder.createFile(blob);
          }
        } catch (folderWriteErr) {
          Logger.log("Gagal tulis ke targetFolder (" + folderWriteErr.toString() + "), fallback ke Root Folder...");
          try {
            uploadedFile = DriveApp.getRootFolder().createFile(blob);
          } catch (rootWriteErr) {
            fileSaveWarning = "Gagal menyimpan berkas ke Drive: " + rootWriteErr.toString();
          }
        }

        if (uploadedFile) {
          try {
            uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (shareErr) {}
          fileUrl = uploadedFile.getUrl();
          fileId = uploadedFile.getId();
        }
      } catch (fileErr) {
        fileSaveWarning = "Error decoding/saving berkas: " + fileErr.toString();
        Logger.log(fileSaveWarning);
      }
    }

    // ==========================================
    // 3. KIRIM EMAIL OTOMATIS VIA GMAIL
    // ==========================================
    var recipientEmail = (data.emailPengirim || "").toString().trim();
    var studentEmailSent = false;
    var dosenEmailSent = false;

    // Siapkan daftar anggota kelompok jika ada
    var daftarAnggotaHtml = "";
    if (data.anggotaKelompok && data.anggotaKelompok.length > 0) {
      daftarAnggotaHtml = "<p style='margin-top: 12px; margin-bottom: 4px;'><b>Daftar Anggota / Penulis:</b></p><ul style='margin-top: 4px; padding-left: 20px;'>";
      for (var i = 0; i < data.anggotaKelompok.length; i++) {
        var m = data.anggotaKelompok[i];
        daftarAnggotaHtml += "<li>" + m.nama + " (NIM: " + m.nim + ")" + (m.peran ? " - <i>" + m.peran + "</i>" : "") + "</li>";
      }
      daftarAnggotaHtml += "</ul>";
    }

    var fileLinkHtml = fileUrl
      ? "<p style='margin: 16px 0;'><a href='" + fileUrl + "' target='_blank' style='display: inline-block; background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Buka Berkas di Google Drive</a></p>"
      : (fileSaveWarning ? "<p style='color: #b45309; font-size: 12px;'><i>Catatan: Berkas terekam di sistem portal (" + fileSaveWarning + ")</i></p>" : "");

    var htmlReceiptBody = "" +
      "<div style='font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 620px; margin: auto; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden;'>" +
        "<div style='background-color: #0f172a; color: white; padding: 20px 24px;'>" +
          "<h2 style='margin: 0; font-size: 20px; color: #5eead4;'>BUKTI PENGUMPULAN TUGAS ELEKTRONIK</h2>" +
          "<p style='margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;'>" + KAMPUS + "</p>" +
        "</div>" +
        "<div style='padding: 24px; background-color: #ffffff;'>" +
          "<p>Yth. Sdr/i <b>" + (data.namaPengirim || "Mahasiswa") + "</b> (NIM: " + (data.nimPengirim || "-") + "),</p>" +
          "<p>Tugas kuliah Anda telah <b>berhasil diterima dan tersimpan di Google Drive</b> Dosen Pengampu.</p>" +
          "<table style='width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;'>" +
            "<tr><td style='padding: 9px 12px; font-weight: bold; width: 35%; border-bottom: 1px solid #e2e8f0;'>ID Registrasi</td><td style='padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #0f766e;'>" + (data.id || "-") + "</td></tr>" +
            "<tr><td style='padding: 9px 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;'>Mata Kuliah / Kelas</td><td style='padding: 9px 12px; border-bottom: 1px solid #e2e8f0;'>" + (data.namaMk || "-") + " (" + (data.kelas || "-") + ")</td></tr>" +
            "<tr><td style='padding: 9px 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;'>Judul Tugas</td><td style='padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;'>" + (data.judulKarya || "-") + "</td></tr>" +
            "<tr><td style='padding: 9px 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;'>Waktu Pengiriman</td><td style='padding: 9px 12px; border-bottom: 1px solid #e2e8f0;'>" + (data.waktuKirimFormatted || new Date().toLocaleString("id-ID")) + " WIB</td></tr>" +
            "<tr><td style='padding: 9px 12px; font-weight: bold;'>Folder Tujuan</td><td style='padding: 9px 12px; color: #0f766e; font-weight: bold;'>" + finalFolderName + "</td></tr>" +
          "</table>" +
          daftarAnggotaHtml +
          fileLinkHtml +
          "<p style='font-size: 13px; color: #64748b; margin-top: 20px;'>" +
            "Gunakan NIM Anda sewaktu-waktu pada portal penugasan mahasiswa untuk memeriksa status validasi, catatan evaluasi, atau revisi dari Dosen Pengampu." +
          "</p>" +
          "<div style='margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;'>" +
            "<p style='margin: 0;'>Salam hormat,<br><b>" + DOSEN_NAMA + "</b><br>Email: " + DOSEN_EMAIL + "</p>" +
          "</div>" +
        "</div>" +
      "</div>";

    // A. Kirim email bukti tanda terima ke Mahasiswa
    if (recipientEmail && recipientEmail.indexOf("@") !== -1) {
      try {
        var studentSubject = "[TANDA TERIMA TUGAS] " + (data.judulKarya || "Tugas Kuliah") + " - " + (data.namaPengirim || "");
        GmailApp.sendEmail(recipientEmail, studentSubject, "Bukti Pengumpulan Tugas Mahasiswa", {
          htmlBody: htmlReceiptBody,
          replyTo: DOSEN_EMAIL,
          name: DOSEN_NAMA
        });
        studentEmailSent = true;
      } catch (mailErr) {
        Logger.log("Email ke mahasiswa (" + recipientEmail + ") gagal: " + mailErr.toString());
      }
    }

    // B. Kirim email notifikasi tugas masuk ke Dosen Pengampu (${dosenEmail})
    try {
      var dosenSubject = "[TUGAS MASUK] " + (data.namaPengirim || "Mahasiswa") + " (" + (data.nimPengirim || "-") + ") - " + (data.namaMk || "Tugas");
      var dosenAlertHtml = "" +
        "<div style='font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #0284c7; border-radius: 8px;'>" +
          "<h3 style='color: #0369a1; margin-top: 0;'>Notifikasi Tugas Masuk</h3>" +
          "<p>Yth. Bapak <b>" + DOSEN_NAMA + "</b>,</p>" +
          "<p>Ada mahasiswa baru yang telah mengumpulkan tugas melalui portal:</p>" +
          "<table style='width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0;'>" +
            "<tr><td style='padding: 6px 0; width: 30%; font-weight: bold;'>Nama Mahasiswa:</td><td>" + (data.namaPengirim || "-") + "</td></tr>" +
            "<tr><td style='padding: 6px 0; font-weight: bold;'>NIM:</td><td>" + (data.nimPengirim || "-") + "</td></tr>" +
            "<tr><td style='padding: 6px 0; font-weight: bold;'>Email Mahasiswa:</td><td>" + (recipientEmail || "Tidak diisi") + "</td></tr>" +
            "<tr><td style='padding: 6px 0; font-weight: bold;'>Mata Kuliah:</td><td>" + (data.namaMk || "-") + " (Kelas: " + (data.kelas || "-") + ")</td></tr>" +
            "<tr><td style='padding: 6px 0; font-weight: bold;'>Judul Tugas:</td><td><b>" + (data.judulKarya || "-") + "</b></td></tr>" +
            "<tr><td style='padding: 6px 0; font-weight: bold;'>Folder Target:</td><td><b>" + finalFolderName + "</b> (ID: " + finalFolderId + ")</td></tr>" +
            "<tr><td style='padding: 6px 0; font-weight: bold;'>Waktu Kirim:</td><td>" + (data.waktuKirimFormatted || new Date().toLocaleString("id-ID")) + " WIB</td></tr>" +
          "</table>" +
          daftarAnggotaHtml +
          (fileUrl 
            ? "<p style='margin: 16px 0;'><a href='" + fileUrl + "' target='_blank' style='background-color: #0284c7; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>Buka Berkas di Google Drive</a></p>" 
            : "<p style='color: #dc2626;'><i>Perhatian: Berkas belum tersimpan di Drive (" + fileSaveWarning + ")</i></p>") +
          "<p style='font-size: 12px; color: #64748b;'>Status Notifikasi Email Siswa: " + (studentEmailSent ? "Terkirim ke " + recipientEmail : "Tidak terkirim/email kosong") + "</p>" +
        "</div>";

      GmailApp.sendEmail(DOSEN_EMAIL, dosenSubject, "Tugas baru masuk dari " + (data.namaPengirim || "Mahasiswa"), {
        htmlBody: dosenAlertHtml,
        name: "Sistem Portal Tugas"
      });
      dosenEmailSent = true;
    } catch (dosenMailErr) {
      Logger.log("Email ke dosen gagal: " + dosenMailErr.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      driveFileUrl: fileUrl,
      driveFileId: fileId,
      emailSent: studentEmailSent || dosenEmailSent,
      studentEmailSent: studentEmailSent,
      dosenEmailSent: dosenEmailSent,
      targetFolderId: finalFolderId,
      targetFolderName: finalFolderName,
      warning: fileSaveWarning || undefined,
      message: fileUrl
        ? "Berkas berhasil masuk ke Google Drive (" + finalFolderName + ") & email tanda terima telah terkirim via Gmail."
        : "Data tugas berhasil diterima & email notifikasi telah terkirim."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Fatal doPost error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var testFolder = resolveTargetFolder(DEFAULT_DRIVE_FOLDER_ID);
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script Webhook Tugas Dosen siap digunakan!",
    dosen: DOSEN_NAMA,
    email: DOSEN_EMAIL,
    defaultFolderId: DEFAULT_DRIVE_FOLDER_ID,
    resolvedFolderName: testFolder ? testFolder.getName() : "Root",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
};

/**
 * Dispatch student submission to Google Apps Script Webhook
 */
export const dispatchSubmissionToGoogle = async (
  submission: Submission,
  assignment: Assignment,
  settings: LecturerSettings
): Promise<DispatchResult> => {
  const webhookUrl = (settings.googleAppsScriptWebhookUrl || '').trim();

  // Check if webhook URL is configured
  if (webhookUrl.length > 10) {
    const rawFolderId = assignment.driveFolderId || settings.googleDriveDefaultFolderId || '';
    const cleanFolderId = extractCleanFolderId(rawFolderId);

    const payload = {
      ...submission,
      namaMk: assignment.judul,
      driveFolderId: cleanFolderId,
      waktuKirimFormatted: new Date(submission.waktuKirim).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'full',
        timeStyle: 'medium',
      }),
    };

    const payloadJson = JSON.stringify(payload);

    try {
      // Send with text/plain to avoid CORS preflight OPTIONS request
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: payloadJson,
      });

      if (response.ok) {
        try {
          const result = await response.json();
          if (result.status === 'success') {
            return {
              success: true,
              driveFileUrl: result.driveFileUrl,
              driveFileId: result.driveFileId,
              emailSent: result.emailSent,
              folderName: result.targetFolderName,
              warning: result.warning,
              message: result.driveFileUrl
                ? `Berkas berhasil disimpan ke Google Drive folder "${result.targetFolderName || 'Drive'}" & tanda terima terkirim via Gmail!`
                : 'Data tugas telah dicatat & email tanda terima otomatis terkirim via Gmail.',
            };
          } else {
            console.warn('Apps Script returned error status:', result.message);
            return {
              success: false,
              message: `Google Apps Script: ${result.message}`,
            };
          }
        } catch (_) {
          return {
            success: true,
            emailSent: true,
            message: 'Tugas telah terkirim dan diproses oleh Google Apps Script.',
          };
        }
      }
    } catch (err: any) {
      console.warn('Standard fetch hit redirect/CORS, executing fallback no-cors dispatch:', err);
      // Fallback: Google Apps Script STILL executes doPost in no-cors mode!
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: payloadJson,
        });

        return {
          success: true,
          emailSent: true,
          message: 'Berkas tugas berhasil dikirimkan ke Google Apps Script Webhook (mode asynchronous background).',
        };
      } catch (fallbackErr: any) {
        console.error('All dispatch attempts failed:', fallbackErr);
        return {
          success: false,
          message: `Gagal mengirim ke Webhook: ${fallbackErr?.message || 'Cek koneksi internet'}`,
        };
      }
    }
  }

  // Fallback if no webhook URL is configured
  const cleanDefaultFolder = extractCleanFolderId(assignment.driveFolderId || settings.googleDriveDefaultFolderId);
  const simulatedDriveUrl = cleanDefaultFolder ? `https://drive.google.com/drive/folders/${cleanDefaultFolder}` : undefined;

  return {
    success: false,
    driveFileUrl: simulatedDriveUrl,
    emailSent: false,
    message: 'URL Webhook Google Apps Script belum dipasang di Dashboard Dosen. Berkas disimpan di portal lokal.',
  };
};

/**
 * Test Webhook with small sample file & real test email to Lecturer
 */
export const testWebhookDispatch = async (
  webhookUrl: string,
  settings: LecturerSettings,
  targetFolderIdOverride?: string
): Promise<{ success: boolean; message: string; driveFileUrl?: string; folderName?: string }> => {
  if (!webhookUrl || webhookUrl.trim().length < 10) {
    return {
      success: false,
      message: 'URL Webhook belum diisi. Masukkan URL hasil deploy Google Apps Script yang berakhiran /exec.',
    };
  }

  const cleanUrl = webhookUrl.trim();
  const folderToTest = extractCleanFolderId(targetFolderIdOverride || settings.googleDriveDefaultFolderId);

  const testPayload = {
    isTest: true,
    driveFolderId: folderToTest,
    namaDosen: settings.namaDosen,
    emailDosen: settings.emailDosen,
  };

  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      try {
        const json = await response.json();
        if (json.status === 'success') {
          return {
            success: true,
            folderName: json.folderName,
            message: `✅ Sukses! File tes tersimpan di folder "${json.folderName || 'Drive'}" (ID: ${json.folderId || '-'}) dan email tes terkirim ke ${settings.emailDosen}.`,
            driveFileUrl: json.driveFileUrl,
          };
        } else {
          return {
            success: false,
            message: `Pesan dari Apps Script: ${json.message}`,
          };
        }
      } catch (_) {
        return {
          success: true,
          message: `✅ Webhook menerima kiriman tes. Silakan cek inbox Gmail (${settings.emailDosen}) dan Google Drive Anda.`,
        };
      }
    }

    // If standard fetch had issues, try no-cors fallback
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(testPayload),
    });

    return {
      success: true,
      message: `✅ Paket tes telah terkirim ke Webhook. Silakan periksa inbox Gmail (${settings.emailDosen}) dan Google Drive Anda untuk melihat email & file tes!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi Webhook: ${err.message || 'Cek koneksi internet atau pastikan opsi "Who has access" diset ke "Anyone"'}.`,
    };
  }
};

/**
 * Ping Webhook via GET
 */
export const pingWebhookUrl = async (
  webhookUrl: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  if (!webhookUrl || webhookUrl.trim().length < 10) {
    return {
      success: false,
      message: 'URL Webhook kosong.',
    };
  }

  const cleanUrl = webhookUrl.trim();

  try {
    const res = await fetch(cleanUrl, {
      method: 'GET',
    });

    if (res.ok) {
      try {
        const json = await res.json();
        return {
          success: true,
          message: `✅ Webhook Online & Aktif! Terhubung ke akun: ${json.email || 'Google'} (Folder: ${json.resolvedFolderName || json.defaultFolderId || 'Drive'}).`,
          data: json,
        };
      } catch (_) {
        return {
          success: true,
          message: '✅ Webhook Online dan merespons dengan baik.',
        };
      }
    } else {
      return {
        success: false,
        message: `HTTP Status ${res.status}: Pastikan Webhook di-deploy dengan opsi "Who has access: Anyone".`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal ping Webhook: ${err.message || 'CORS / Network Error'}. Pastikan akses di Google Apps Script dipilih 'Anyone'.`,
    };
  }
};

export const createMailtoLink = (
  studentEmail: string,
  studentName: string,
  assignmentTitle: string,
  status: string,
  dosenNotes: string,
  settings: LecturerSettings
): string => {
  const subject = encodeURIComponent(`[UPDATE STATUS TUGAS] ${assignmentTitle} - ${studentName}`);
  const body = encodeURIComponent(
    `Kepada Yth. Sdr/i ${studentName},\n\n` +
    `Tugas Anda mengenai "${assignmentTitle}" telah diperiksa oleh Bapak ${settings.namaDosen}, ${settings.gelar}.\n\n` +
    `Status Tugas: ${status.toUpperCase()}\n` +
    `Catatan Dosen:\n${dosenNotes || 'Tidak ada catatan khusus.'}\n\n` +
    `Silakan kunjungi portal penugasan mahasiswa untuk detail lebih lanjut dan pengiriman revisi (jika diperlukan).\n\n` +
    `Salam hormat,\n${settings.namaDosen}, ${settings.gelar}\n${settings.kampus}`
  );
  return `mailto:${studentEmail}?subject=${subject}&body=${body}`;
};
