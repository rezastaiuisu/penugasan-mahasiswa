import { Course, Assignment, Submission, LecturerSettings } from '../types';

const STORAGE_KEYS = {
  COURSES: 'reza_app_courses',
  ASSIGNMENTS: 'reza_app_assignments',
  SUBMISSIONS: 'reza_app_submissions',
  SETTINGS: 'reza_app_settings',
};

export const DEFAULT_SETTINGS: LecturerSettings = {
  namaDosen: 'Reza Lubis',
  gelar: 'M.Pd',
  nip: '198504122014031002',
  emailDosen: 'rezastaiuisu@gmail.com',
  kampus: 'STAI UISU (Sekolah Tinggi Agama Islam UISU)',
  domainHosting: 'rezalubis.com/penugasan-mahasiswa/',
  googleDriveDefaultFolderId: '1AbCdEfGhIjKlMnOpQrStUvWxYz_2026',
  googleAppsScriptWebhookUrl: '',
  notifikasiEmailAktif: true,
  formatSubjekEmail: '[TUGAS STAI UISU] Konfirmasi Pengumpulan: {judul_tugas} - {nama_pengirim}',
  secretAdminPin: '123456',
  adminUsername: 'rezalubis',
  adminPassword: 'dosen2026',
  requireLoginForAdmin: true,
  githubRepoUrl: 'https://github.com/rezalubis/penugasan-mahasiswa',
  deploymentPlatform: 'both',
};

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    kodeMk: 'MPI-302',
    namaMk: 'Manajemen Pendidikan Islam',
    sks: 3,
    semester: 'Ganjil 2026/2027',
    kelas: ['MPI-III Reguler Pagi A', 'MPI-III Reguler Pagi B', 'MPI-III Eksekutif Sore'],
    dosen: 'Reza Lubis, M.Pd',
  },
  {
    id: 'course-2',
    kodeMk: 'MET-401',
    namaMk: 'Metodologi Penelitian & Penulisan Ilmiah',
    sks: 3,
    semester: 'Ganjil 2026/2027',
    kelas: ['PAI-V Pagi', 'PAI-V Sore', 'MPI-V Pagi'],
    dosen: 'Reza Lubis, M.Pd',
  },
  {
    id: 'course-3',
    kodeMk: 'JUR-501',
    namaMk: 'Publikasi Artikel Jurnal Ilmiah',
    sks: 2,
    semester: 'Ganjil 2026/2027',
    kelas: ['Kelas Jurnal VII-A', 'Kelas Jurnal VII-B'],
    dosen: 'Reza Lubis, M.Pd',
  },
];

// Current date offset helpers
const now = new Date();
const inDays = (d: number, hour = 23, min = 59) => {
  const date = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  date.setHours(hour, min, 0, 0);
  return date.toISOString();
};
const pastDays = (d: number, hour = 8, min = 0) => {
  const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  date.setHours(hour, min, 0, 0);
  return date.toISOString();
};

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-1',
    courseId: 'course-1',
    judul: 'Makalah Kelompok: Model Kepemimpinan Lembaga Pendidikan Islam',
    tipe: 'makalah_kelompok',
    deskripsi: 'Susun makalah kelompok 4-5 orang dengan kajian komparatif gaya kepemimpinan kepala madrasah/sekolah Islam. Sertakan studi kasus lapangan dan analisis SWOT.',
    waktuMulai: pastDays(5),
    tenggatWaktu: inDays(6), // Masih buka 6 hari lagi
    isKelompok: true,
    maxAnggota: 5,
    formatAllowed: ['.pdf', '.docx'],
    maxFileSizeMb: 20,
    driveFolderId: '1Folder_Makalah_MPI_2026',
    isActive: true,
    petunjukKhusus: 'Font Times New Roman 12, Spasi 1.5, Minimal 15 halaman dan minimal 8 referensi jurnal ilmiah 5 tahun terakhir.',
  },
  {
    id: 'asg-2',
    courseId: 'course-3',
    judul: 'Publikasi Naskah Artikel Jurnal (Format Template SINTA)',
    tipe: 'publikasi_jurnal',
    deskripsi: 'Naskah artikel ilmiah siap publish yang mengacu pada template jurnal OJS SINTA 3/4/5. Boleh karya mandiri atau kolaborasi 2-3 orang.',
    waktuMulai: pastDays(10),
    tenggatWaktu: inDays(12),
    isKelompok: true,
    maxAnggota: 3,
    formatAllowed: ['.docx', '.pdf'],
    maxFileSizeMb: 25,
    driveFolderId: '1Folder_ArtikelJurnal_2026',
    isActive: true,
    petunjukKhusus: 'Pastikan tingkat kesamaan (Turnitin/Plagiarisme) di bawah 25% dan gunakan Mendeley/Zotero untuk sitasi (APA Style).',
  },
  {
    id: 'asg-3',
    courseId: 'course-2',
    judul: 'Proposal Penelitian Mini: Bab 1 Pendahuluan & Rumusan Masalah',
    tipe: 'tugas_mandiri',
    deskripsi: 'Tugas mandiri berupa Bab 1 Proposal Skripsi: Latar Belakang Masalah, Identifikasi, Batasan Masalah, Rumusan Masalah, dan Manfaat Penelitian.',
    waktuMulai: pastDays(7),
    tenggatWaktu: inDays(2), // 2 hari lagi
    isKelompok: false,
    formatAllowed: ['.pdf', '.docx'],
    maxFileSizeMb: 15,
    driveFolderId: '1Folder_ProposalMetopen_2026',
    isActive: true,
    petunjukKhusus: 'Sertakan fenomena empiris lapangan dan kesenjangan penelitian (research gap).',
  },
  {
    id: 'asg-4',
    courseId: 'course-1',
    judul: 'Tugas Ringkasan Buku Manajemen Mutu ISO (Telah Berakhir)',
    tipe: 'tugas_mandiri',
    deskripsi: 'Resume bab 3 dan 4 mengenai audit mutu internal madrasah.',
    waktuMulai: pastDays(14),
    tenggatWaktu: pastDays(1), // Sudah tutup kemarin
    isKelompok: false,
    formatAllowed: ['.pdf'],
    maxFileSizeMb: 10,
    isActive: true,
    petunjukKhusus: 'Tugas sudah ditutup sesuai batas waktu.',
  },
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'TGS-2026-8192',
    assignmentId: 'asg-1',
    courseId: 'course-1',
    kelas: 'MPI-III Reguler Pagi A',
    semesterTahun: 'Ganjil 2026/2027',
    namaPengirim: 'Ahmad Fauzi Harahap',
    nimPengirim: '210101001',
    emailPengirim: 'ahmadfauzi21@gmail.com',
    noHpPengirim: '081264551234',
    anggotaKelompok: [
      { id: 'm-1', nama: 'Ahmad Fauzi Harahap', nim: '210101001', peran: 'Ketua' },
      { id: 'm-2', nama: 'Siti Nurhaliza Siregar', nim: '210101002', peran: 'Anggota' },
      { id: 'm-3', nama: 'Rizky Pratama Lubis', nim: '210101003', peran: 'Anggota' },
      { id: 'm-4', nama: 'Dinda Permata Sari', nim: '210101004', peran: 'Anggota' },
    ],
    judulKarya: 'Strategi Kepemimpinan Transformasional Kepala Madrasah Aliyah di Medan',
    abstrakRingkas: 'Penelitian kualitatif deskriptif mengenai implementasi kepemimpinan transformasional dalam meningkatkan kedisiplinan guru dan mutu lulusan.',
    linkTambahan: 'https://drive.google.com/drive/folders/contoh-lampiran-fauzi',
    file: {
      name: 'Makalah_Kelompok1_MPI_AhmadFauzi.pdf',
      size: 2450000,
      type: 'application/pdf',
      lastModified: Date.now() - 3600000 * 24 * 2,
      driveFileUrl: 'https://drive.google.com/file/d/contoh-file-fauzi/view',
    },
    waktuKirim: pastDays(2, 14, 25),
    isLate: false,
    status: 'disetujui',
    nilai: 88,
    gradeHuruf: 'A',
    catatanDosen: 'Kajian teoritis sangat baik dan studi kasus tajam. Format sitasi sudah rapi. Pertahankan untuk presentasi kelompok!',
    tanggalReview: pastDays(1, 16, 0),
    versi: 1,
    riwayatRevisi: [
      {
        version: 1,
        timestamp: pastDays(2, 14, 25),
        fileName: 'Makalah_Kelompok1_MPI_AhmadFauzi.pdf',
        fileSize: 2450000,
        catatanMahasiswa: 'Pengiriman awal tepat waktu',
      },
    ],
    bisaRevisi: false,
  },
  {
    id: 'TGS-2026-9041',
    assignmentId: 'asg-1',
    courseId: 'course-1',
    kelas: 'MPI-III Reguler Pagi B',
    semesterTahun: 'Ganjil 2026/2027',
    namaPengirim: 'Muhammad Zikri Daulay',
    nimPengirim: '210101015',
    emailPengirim: 'zikridaulay@gmail.com',
    noHpPengirim: '085277112233',
    anggotaKelompok: [
      { id: 'm-5', nama: 'Muhammad Zikri Daulay', nim: '210101015', peran: 'Ketua' },
      { id: 'm-6', nama: 'Nurul Hidayah', nim: '210101018', peran: 'Anggota' },
      { id: 'm-7', nama: 'Fajar Shiddiq Nasution', nim: '210101020', peran: 'Anggota' },
    ],
    judulKarya: 'Penerapan Total Quality Management di Pondok Pesantren Modern',
    abstrakRingkas: 'Analisis implementasi standar mutu ISO dan kurikulum terpadu pada pondok pesantren modern.',
    file: {
      name: 'Makalah_Kelompok3_MPI_Zikri.docx',
      size: 1820000,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      lastModified: Date.now() - 3600000 * 18,
    },
    waktuKirim: pastDays(1, 19, 10),
    isLate: false,
    status: 'perlu_revisi',
    catatanDosen: 'Bab pembahasan belum ada data pembanding. Referensi jurnal ilmiah masih kurang dari 8 referensi wajib. Mohon lengkapi dan submit revisi kembali.',
    tanggalReview: pastDays(0, 10, 30),
    versi: 1,
    riwayatRevisi: [
      {
        version: 1,
        timestamp: pastDays(1, 19, 10),
        fileName: 'Makalah_Kelompok3_MPI_Zikri.docx',
        fileSize: 1820000,
        catatanMahasiswa: 'Pengiriman versi draft 1',
      },
    ],
    bisaRevisi: true,
  },
  {
    id: 'TGS-2026-9923',
    assignmentId: 'asg-3',
    courseId: 'course-2',
    kelas: 'PAI-V Pagi',
    semesterTahun: 'Ganjil 2026/2027',
    namaPengirim: 'Putri Rahmadani',
    nimPengirim: '210102008',
    emailPengirim: 'putrirahma21@gmail.com',
    noHpPengirim: '082165009988',
    anggotaKelompok: [
      { id: 'm-8', nama: 'Putri Rahmadani', nim: '210102008', peran: 'Ketua' },
    ],
    judulKarya: 'Pengaruh Media Pembelajaran Interaktif Canva terhadap Minat Belajar PAI',
    abstrakRingkas: 'Proposal mini meneliti efektivitas media canva bagi peserta didik kelas VIII MTs.',
    file: {
      name: 'Proposal_Bab1_PutriRahmadani_210102008.pdf',
      size: 1450000,
      type: 'application/pdf',
      lastModified: Date.now() - 3600000 * 4,
    },
    waktuKirim: pastDays(0, 8, 45),
    isLate: false,
    status: 'menunggu_review',
    versi: 1,
    riwayatRevisi: [
      {
        version: 1,
        timestamp: pastDays(0, 8, 45),
        fileName: 'Proposal_Bab1_PutriRahmadani_210102008.pdf',
        fileSize: 1450000,
      },
    ],
    bisaRevisi: true,
  },
];

class StorageService {
  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save to localStorage (${key}):`, e);
    }
  }

  // Settings
  getSettings(): LecturerSettings {
    return this.get<LecturerSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  updateSettings(settings: Partial<LecturerSettings>): LecturerSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // Courses
  getCourses(): Course[] {
    return this.get<Course[]>(STORAGE_KEYS.COURSES, INITIAL_COURSES);
  }

  saveCourse(course: Course): Course[] {
    const courses = this.getCourses();
    const index = courses.findIndex(c => c.id === course.id);
    let updated: Course[];
    if (index >= 0) {
      updated = [...courses];
      updated[index] = course;
    } else {
      updated = [course, ...courses];
    }
    this.set(STORAGE_KEYS.COURSES, updated);
    return updated;
  }

  deleteCourse(courseId: string): Course[] {
    const courses = this.getCourses().filter(c => c.id !== courseId);
    this.set(STORAGE_KEYS.COURSES, courses);
    return courses;
  }

  // Assignments
  getAssignments(): Assignment[] {
    return this.get<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  }

  saveAssignment(assignment: Assignment): Assignment[] {
    const assignments = this.getAssignments();
    const index = assignments.findIndex(a => a.id === assignment.id);
    let updated: Assignment[];
    if (index >= 0) {
      updated = [...assignments];
      updated[index] = assignment;
    } else {
      updated = [assignment, ...assignments];
    }
    this.set(STORAGE_KEYS.ASSIGNMENTS, updated);
    return updated;
  }

  deleteAssignment(assignmentId: string): Assignment[] {
    const assignments = this.getAssignments().filter(a => a.id !== assignmentId);
    this.set(STORAGE_KEYS.ASSIGNMENTS, assignments);
    return assignments;
  }

  // Submissions
  getSubmissions(): Submission[] {
    return this.get<Submission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  }

  addSubmission(submission: Submission): Submission[] {
    const list = this.getSubmissions();
    const updated = [submission, ...list];
    this.set(STORAGE_KEYS.SUBMISSIONS, updated);
    return updated;
  }

  updateSubmission(submission: Submission): Submission[] {
    const list = this.getSubmissions();
    const index = list.findIndex(s => s.id === submission.id);
    if (index >= 0) {
      list[index] = submission;
      this.set(STORAGE_KEYS.SUBMISSIONS, list);
    }
    return list;
  }

  deleteSubmission(submissionId: string): Submission[] {
    const list = this.getSubmissions().filter(s => s.id !== submissionId);
    this.set(STORAGE_KEYS.SUBMISSIONS, list);
    return list;
  }

  // Lookup submissions for student NIM
  getSubmissionsByNIM(nim: string): { submissions: Submission[]; matchingMemberName?: string } {
    const cleanNim = nim.trim().toLowerCase();
    if (!cleanNim) return { submissions: [] };

    const all = this.getSubmissions();
    let matchingMemberName: string | undefined;

    const matched = all.filter(sub => {
      // Direct sender check
      if (sub.nimPengirim.toLowerCase() === cleanNim) {
        matchingMemberName = sub.namaPengirim;
        return true;
      }
      // Group member check
      const foundInGroup = sub.anggotaKelompok.find(m => m.nim.toLowerCase() === cleanNim);
      if (foundInGroup) {
        if (!matchingMemberName) matchingMemberName = foundInGroup.nama;
        return true;
      }
      return false;
    });

    return { submissions: matched, matchingMemberName };
  }

  // Reset to default
  resetToDefault(): void {
    this.set(STORAGE_KEYS.COURSES, INITIAL_COURSES);
    this.set(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    this.set(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  // Load and sync global config from server (for cPanel multi-device support)
  async syncGlobalConfig(): Promise<LecturerSettings | null> {
    try {
      const res = await fetch('./portal-config.json', { cache: 'no-cache' });
      if (res.ok) {
        const json = await res.json();
        const current = this.getSettings();
        // If current local settings doesn't have webhook URL, or server config has one:
        if (json.googleAppsScriptWebhookUrl && json.googleAppsScriptWebhookUrl.trim().length > 10) {
          const merged = { ...current, ...json };
          this.set(STORAGE_KEYS.SETTINGS, merged);
          return merged;
        }
      }
    } catch (_) {
      // Ignored in offline / static mode
    }
    return null;
  }

  // Generate portal-config.json string for cPanel upload
  exportPortalConfig(): string {
    const settings = this.getSettings();
    return JSON.stringify(settings, null, 2);
  }

  // Export full backup JSON
  exportDataJson(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      courses: this.getCourses(),
      assignments: this.getAssignments(),
      submissions: this.getSubmissions(),
    };
    return JSON.stringify(data, null, 2);
  }

  // Import JSON backup
  importDataJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.courses) this.set(STORAGE_KEYS.COURSES, data.courses);
      if (data.assignments) this.set(STORAGE_KEYS.ASSIGNMENTS, data.assignments);
      if (data.submissions) this.set(STORAGE_KEYS.SUBMISSIONS, data.submissions);
      if (data.settings) this.set(STORAGE_KEYS.SETTINGS, data.settings);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage = new StorageService();
