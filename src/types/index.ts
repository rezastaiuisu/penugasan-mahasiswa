export type AssignmentType = 'makalah_kelompok' | 'publikasi_jurnal' | 'uts' | 'uas' | 'laporan_observasi' | 'tugas_mandiri' | 'lainnya';

export type SubmissionStatus = 'menunggu_review' | 'perlu_revisi' | 'disetujui' | 'dinilai';

export interface GroupMember {
  id: string;
  nama: string;
  nim: string;
  peran?: 'Ketua' | 'Anggota';
}

export interface Course {
  id: string;
  kodeMk: string;
  namaMk: string;
  sks: number;
  semester: string; // e.g. "Ganjil 2026/2027"
  kelas: string[];  // e.g. ["PAI-A", "PAI-B", "MPI-Sore"]
  dosen: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  judul: string;
  tipe: AssignmentType;
  deskripsi: string;
  waktuMulai: string; // ISO string
  tenggatWaktu: string; // ISO string (deadline)
  isKelompok: boolean;
  maxAnggota?: number;
  formatAllowed: string[]; // e.g. ['.pdf', '.docx', '.zip']
  maxFileSizeMb: number;
  driveFolderId?: string; // Optional custom folder ID for this assignment
  isActive: boolean;
  petunjukKhusus?: string;
}

export interface SubmissionFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  base64Data?: string; // Stored if small or simulated
  driveFileUrl?: string; // Link to Google Drive if uploaded via Apps Script
  driveFileId?: string;
}

export interface SubmissionHistory {
  version: number;
  timestamp: string;
  catatanMahasiswa?: string;
  fileName: string;
  fileSize: number;
}

export interface Submission {
  id: string; // Unique ticket e.g. TGS-2026-9812
  assignmentId: string;
  courseId: string;
  kelas: string;
  semesterTahun: string;
  
  // Pengirim & Anggota
  namaPengirim: string;
  nimPengirim: string;
  emailPengirim: string;
  noHpPengirim: string;
  anggotaKelompok: GroupMember[];
  
  // Detail Tugas
  judulKarya: string;
  abstrakRingkas?: string;
  linkTambahan?: string;
  
  // File
  file: SubmissionFile;
  
  // Status & Waktu
  waktuKirim: string; // ISO
  isLate: boolean;
  status: SubmissionStatus;
  
  // Penilaian & Review Dosen
  nilai?: number;
  gradeHuruf?: string; // A, B+, B, dll
  catatanDosen?: string;
  tanggalReview?: string;
  
  // Riwayat Revisi
  versi: number;
  riwayatRevisi: SubmissionHistory[];
  bisaRevisi: boolean; // Computed or manually overridden by lecturer
}

export interface LecturerSettings {
  namaDosen: string;
  gelar: string;
  nip: string;
  emailDosen: string;
  kampus: string; // STAI UISU Medan / Perguruan Tinggi
  domainHosting: string; // rezalubis.com/penugasan-mahasiswa/
  googleDriveDefaultFolderId: string;
  googleAppsScriptWebhookUrl: string;
  notifikasiEmailAktif: boolean;
  formatSubjekEmail: string;
  secretAdminPin: string; // PIN darurat
  adminUsername: string; // ID / Username Login Dosen (e.g. rezalubis atau rezastaiuisu@gmail.com)
  adminPassword: string; // Password Login Dosen (e.g. dosen2026)
  requireLoginForAdmin: boolean;
  githubRepoUrl?: string; // Repository link on GitHub
  deploymentPlatform: 'cpanel' | 'github_pages' | 'both';
}
