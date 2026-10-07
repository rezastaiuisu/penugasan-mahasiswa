import React, { useState, useId } from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  CalendarClock, 
  FolderSync, 
  Settings as SettingsIcon, 
  Users, 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileText, 
  Save, 
  Send, 
  RefreshCw,
  Server,
  Code2,
  Lock,
  Mail,
  Award,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { 
  Submission, 
  Assignment, 
  Course, 
  LecturerSettings, 
  AssignmentType,
  SubmissionStatus 
} from '../types';
import { storage } from '../services/storage';
import { 
  formatDateTimeIndo, 
  formatDateIndo, 
  formatFileSize, 
  getStatusBadge, 
  getDeadlineStatus 
} from '../utils/formatters';
import { 
  generateAppsScriptCode, 
  dispatchSubmissionToGoogle,
  extractCleanFolderId,
  validateWebhookUrl,
  testWebhookDispatch,
  pingWebhookUrl 
} from '../services/appsScriptService';
import { AdminReviewModal } from './AdminReviewModal';
import { SubmissionReceiptModal } from './SubmissionReceiptModal';

interface AdminDashboardProps {
  courses: Course[];
  assignments: Assignment[];
  submissions: Submission[];
  settings: LecturerSettings;
  onRefreshData: () => void;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  courses,
  assignments,
  submissions,
  settings,
  onRefreshData,
  onLogout,
}) => {
  // Navigation tabs inside admin
  const [adminTab, setAdminTab] = useState<'overview' | 'submissions' | 'gdrive' | 'assignments' | 'courses' | 'deployment' | 'settings'>('overview');
  const [deploymentSubTab, setDeploymentSubTab] = useState<'github' | 'cpanel'>('github');
  const [syncingSubmissionId, setSyncingSubmissionId] = useState<string | null>(null);
  const [webhookWarning, setWebhookWarning] = useState<string | null>(null);

  // Search & Filter state for Submissions table
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<Submission | null>(null);
  const [selectedSubmissionForReceipt, setSelectedSubmissionForReceipt] = useState<Submission | null>(null);

  // Assignment CRUD state
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [asgFormId, setAsgFormId] = useState<string | null>(null);
  const [asgCourseId, setAsgCourseId] = useState(courses[0]?.id || '');
  const [asgJudul, setAsgJudul] = useState('');
  const [asgTipe, setAsgTipe] = useState<AssignmentType>('makalah_kelompok');
  const [asgDeskripsi, setAsgDeskripsi] = useState('');
  const [asgWaktuMulai, setAsgWaktuMulai] = useState(new Date().toISOString().slice(0, 16));
  const [asgTenggatWaktu, setAsgTenggatWaktu] = useState(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [asgIsKelompok, setAsgIsKelompok] = useState(true);
  const [asgMaxAnggota, setAsgMaxAnggota] = useState(5);
  const [asgFormats, setAsgFormats] = useState('.pdf, .docx');
  const [asgMaxSizeMb, setAsgMaxSizeMb] = useState(20);
  const [asgDriveFolder, setAsgDriveFolder] = useState('');
  const [asgPetunjuk, setAsgPetunjuk] = useState('');

  // Course CRUD state
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [crsFormId, setCrsFormId] = useState<string | null>(null);
  const [crsKode, setCrsKode] = useState('');
  const [crsNama, setCrsNama] = useState('');
  const [crsSks, setCrsSks] = useState(3);
  const [crsSemester, setCrsSemester] = useState('Ganjil 2026/2027');
  const [crsKelasInput, setCrsKelasInput] = useState('PAI-A, PAI-B');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<LecturerSettings>(settings);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);
  const [copiedGithubWorkflow, setCopiedGithubWorkflow] = useState(false);
  const [copiedGitCommands, setCopiedGitCommands] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);
  const [testDispatchStatus, setTestDispatchStatus] = useState<string | null>(null);
  const [isTestingDispatch, setIsTestingDispatch] = useState(false);
  const [isTestingAsgFolder, setIsTestingAsgFolder] = useState(false);
  const [asgFolderTestResult, setAsgFolderTestResult] = useState<string | null>(null);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [batchSyncProgress, setBatchSyncProgress] = useState<string | null>(null);

  // Statistics calculation
  const totalSubmissions = submissions.length;
  const pendingReview = submissions.filter(s => s.status === 'menunggu_review').length;
  const needRevision = submissions.filter(s => s.status === 'perlu_revisi').length;
  const approvedOrGraded = submissions.filter(s => s.status === 'disetujui' || s.status === 'dinilai').length;
  const onTimeCount = submissions.filter(s => !s.isLate).length;
  const onTimePercentage = totalSubmissions > 0 ? Math.round((onTimeCount / totalSubmissions) * 100) : 100;

  // Filtered submissions
  const filteredSubmissions = submissions.filter(sub => {
    if (courseFilter !== 'all' && sub.courseId !== courseFilter) return false;
    if (classFilter !== 'all' && sub.kelas !== classFilter) return false;
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inNim = sub.nimPengirim.toLowerCase().includes(q);
      const inName = sub.namaPengirim.toLowerCase().includes(q);
      const inTitle = sub.judulKarya.toLowerCase().includes(q);
      const inId = sub.id.toLowerCase().includes(q);
      const inMembers = sub.anggotaKelompok.some(
        m => m.nama.toLowerCase().includes(q) || m.nim.toLowerCase().includes(q)
      );
      if (!inNim && !inName && !inTitle && !inId && !inMembers) return false;
    }
    return true;
  });

  // Extract all distinct classes
  const allClasses = Array.from(new Set(submissions.map(s => s.kelas))).filter(Boolean);

  // Export submissions to CSV
  const handleExportCsv = () => {
    const headers = [
      'ID Registrasi',
      'Waktu Pengiriman',
      'Mata Kuliah',
      'Kelas',
      'Judul Tugas',
      'Nama Pengirim',
      'NIM Pengirim',
      'Email',
      'No HP',
      'Anggota Kelompok',
      'Nama File',
      'Ukuran File',
      'Status',
      'Nilai',
      'Grade',
      'Catatan Dosen',
    ];

    const rows = filteredSubmissions.map(s => {
      const course = courses.find(c => c.id === s.courseId);
      const members = s.anggotaKelompok.map(m => `${m.nama} (${m.nim})`).join('; ');
      return [
        s.id,
        new Date(s.waktuKirim).toLocaleString('id-ID'),
        `"${course?.namaMk || '-'}"`,
        `"${s.kelas}"`,
        `"${s.judulKarya.replace(/"/g, '""')}"`,
        `"${s.namaPengirim}"`,
        s.nimPengirim,
        s.emailPengirim,
        s.noHpPengirim,
        `"${members}"`,
        `"${s.file.name}"`,
        formatFileSize(s.file.size),
        s.status,
        s.nilai ?? '',
        s.gradeHuruf ?? '',
        `"${(s.catatanDosen || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Tugas_Dosen_RezaLubis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Assignment Form
  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const formatsArray = asgFormats
      .split(',')
      .map(f => f.trim().toLowerCase())
      .map(f => (f.startsWith('.') ? f : '.' + f))
      .filter(Boolean);

    const assignmentData: Assignment = {
      id: asgFormId || 'asg_' + Date.now(),
      courseId: asgCourseId,
      judul: asgJudul.trim(),
      tipe: asgTipe,
      deskripsi: asgDeskripsi.trim(),
      waktuMulai: new Date(asgWaktuMulai).toISOString(),
      tenggatWaktu: new Date(asgTenggatWaktu).toISOString(),
      isKelompok: asgIsKelompok,
      maxAnggota: asgIsKelompok ? asgMaxAnggota : undefined,
      formatAllowed: formatsArray.length > 0 ? formatsArray : ['.pdf', '.docx'],
      maxFileSizeMb: asgMaxSizeMb,
      driveFolderId: asgDriveFolder.trim() || undefined,
      isActive: true,
      petunjukKhusus: asgPetunjuk.trim() || undefined,
    };

    storage.saveAssignment(assignmentData);
    setIsEditingAssignment(false);
    resetAssignmentForm();
    onRefreshData();
  };

  const handleEditAssignment = (asg: Assignment) => {
    setAsgFormId(asg.id);
    setAsgCourseId(asg.courseId);
    setAsgJudul(asg.judul);
    setAsgTipe(asg.tipe);
    setAsgDeskripsi(asg.deskripsi);
    setAsgWaktuMulai(new Date(asg.waktuMulai).toISOString().slice(0, 16));
    setAsgTenggatWaktu(new Date(asg.tenggatWaktu).toISOString().slice(0, 16));
    setAsgIsKelompok(asg.isKelompok);
    setAsgMaxAnggota(asg.maxAnggota || 5);
    setAsgFormats(asg.formatAllowed.join(', '));
    setAsgMaxSizeMb(asg.maxFileSizeMb);
    setAsgDriveFolder(asg.driveFolderId || '');
    setAsgPetunjuk(asg.petunjukKhusus || '');
    setIsEditingAssignment(true);
  };

  const resetAssignmentForm = () => {
    setAsgFormId(null);
    setAsgJudul('');
    setAsgDeskripsi('');
    setAsgPetunjuk('');
    setAsgDriveFolder('');
    setAsgFolderTestResult(null);
  };

  const handleDeleteAssignment = (id: string) => {
    if (window.confirm('Yakin ingin menghapus penugasan ini?')) {
      storage.deleteAssignment(id);
      onRefreshData();
    }
  };

  // Course CRUD
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const classList = crsKelasInput.split(',').map(c => c.trim()).filter(Boolean);

    const courseData: Course = {
      id: crsFormId || 'crs_' + Date.now(),
      kodeMk: crsKode.trim(),
      namaMk: crsNama.trim(),
      sks: crsSks,
      semester: crsSemester.trim(),
      kelas: classList,
      dosen: `${settings.namaDosen}, ${settings.gelar}`,
    };

    storage.saveCourse(courseData);
    setIsEditingCourse(false);
    setCrsFormId(null);
    setCrsKode('');
    setCrsNama('');
    onRefreshData();
  };

  const handleEditCourse = (c: Course) => {
    setCrsFormId(c.id);
    setCrsKode(c.kodeMk);
    setCrsNama(c.namaMk);
    setCrsSks(c.sks);
    setCrsSemester(c.semester);
    setCrsKelasInput(c.kelas.join(', '));
    setIsEditingCourse(true);
  };

  const handleDeleteCourse = (id: string) => {
    if (window.confirm('Yakin ingin menghapus mata kuliah ini?')) {
      storage.deleteCourse(id);
      onRefreshData();
    }
  };

  // Delete submission
  const handleDeleteSubmission = (id: string) => {
    if (window.confirm(`Hapus data pengiriman tugas ${id}?`)) {
      storage.deleteSubmission(id);
      onRefreshData();
    }
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateSettings(settingsForm);
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 3000);
    onRefreshData();
  };

  // Test Webhook Online Status
  const handleTestWebhook = async () => {
    if (!settingsForm.googleAppsScriptWebhookUrl || settingsForm.googleAppsScriptWebhookUrl.trim().length < 10) {
      setTestWebhookStatus('⚠️ Masukkan URL Webhook Google Apps Script terlebih dahulu.');
      return;
    }
    setTestWebhookStatus('Menguji koneksi ke Google Apps Script...');
    const res = await pingWebhookUrl(settingsForm.googleAppsScriptWebhookUrl);
    setTestWebhookStatus(res.message);
  };

  // Test real dummy upload to Google Drive & send real test email
  const handleTestDispatchFile = async () => {
    if (!settingsForm.googleAppsScriptWebhookUrl || settingsForm.googleAppsScriptWebhookUrl.trim().length < 10) {
      setTestDispatchStatus('⚠️ Masukkan URL Webhook Google Apps Script terlebih dahulu!');
      return;
    }
    setIsTestingDispatch(true);
    setTestDispatchStatus('Sedang mengirim berkas uji coba ke Folder Google Drive & email ke ' + settingsForm.emailDosen + '...');

    const res = await testWebhookDispatch(settingsForm.googleAppsScriptWebhookUrl, settingsForm);

    setIsTestingDispatch(false);
    setTestDispatchStatus(res.message);
  };

  // Sync individual submission to Google Drive & trigger Gmail
  const handleSyncSubmissionToDrive = async (sub: Submission) => {
    if (!settingsForm.googleAppsScriptWebhookUrl || settingsForm.googleAppsScriptWebhookUrl.trim().length < 10) {
      alert('URL Webhook Google Apps Script belum dipasang! Silakan pasang dan simpan URL Webhook di tab "Integrasi GDrive & Gmail" terlebih dahulu.');
      setAdminTab('gdrive');
      return;
    }

    setSyncingSubmissionId(sub.id);
    const asg = assignments.find(a => a.id === sub.assignmentId) || ({
      id: sub.assignmentId,
      judul: sub.judulKarya,
      formatAllowed: ['.pdf'],
      maxFileSizeMb: 20,
    } as any);

    try {
      const res = await dispatchSubmissionToGoogle(sub, asg, settingsForm);
      if (res.success) {
        const updatedSub: Submission = {
          ...sub,
          file: {
            ...sub.file,
            driveFileUrl: res.driveFileUrl || sub.file.driveFileUrl,
            driveFileId: res.driveFileId || sub.file.driveFileId,
          },
        };
        storage.updateSubmission(updatedSub);
        onRefreshData();
        alert('✅ Berkas berhasil disinkronkan ke Google Drive Dosen dan email konfirmasi telah dikirim!');
      } else {
        alert('Gagal menyinkronkan: ' + res.message);
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat menyinkronkan ke Google Drive: ' + err.message);
    } finally {
      setSyncingSubmissionId(null);
    }
  };

  // Test custom folder in Assignment Form
  const handleTestAsgFolder = async () => {
    if (!settingsForm.googleAppsScriptWebhookUrl || settingsForm.googleAppsScriptWebhookUrl.trim().length < 10) {
      setAsgFolderTestResult('⚠️ Masukkan & simpan URL Webhook di tab "Integrasi GDrive & Gmail" terlebih dahulu.');
      return;
    }
    setIsTestingAsgFolder(true);
    setAsgFolderTestResult('Sedang menguji akses folder di Google Drive...');
    const target = asgDriveFolder.trim() || settingsForm.googleDriveDefaultFolderId;
    const res = await testWebhookDispatch(settingsForm.googleAppsScriptWebhookUrl, settingsForm, target);
    setIsTestingAsgFolder(false);
    setAsgFolderTestResult(res.message);
  };

  // Batch sync all unsynced submissions to Google Drive
  const handleBatchSyncSubmissions = async () => {
    if (!settingsForm.googleAppsScriptWebhookUrl || settingsForm.googleAppsScriptWebhookUrl.trim().length < 10) {
      alert('URL Webhook Google Apps Script belum dipasang! Buka tab "Integrasi GDrive & Gmail" terlebih dahulu.');
      setAdminTab('gdrive');
      return;
    }

    const unsynced = submissions.filter(s => !s.file.driveFileUrl);
    if (unsynced.length === 0) {
      alert('Semua berkas tugas sudah tersinkronkan ke Google Drive.');
      return;
    }

    setIsBatchSyncing(true);
    let successCount = 0;

    for (let i = 0; i < unsynced.length; i++) {
      const sub = unsynced[i];
      setBatchSyncProgress(`Menyinkronkan berkas ${i + 1} dari ${unsynced.length} (${sub.namaPengirim} - ${sub.nimPengirim})...`);
      
      const asg = assignments.find(a => a.id === sub.assignmentId) || ({
        id: sub.assignmentId,
        judul: sub.judulKarya,
        formatAllowed: ['.pdf'],
        maxFileSizeMb: 20,
      } as any);

      try {
        const res = await dispatchSubmissionToGoogle(sub, asg, settingsForm);
        if (res.success) {
          const updatedSub: Submission = {
            ...sub,
            file: {
              ...sub.file,
              driveFileUrl: res.driveFileUrl || sub.file.driveFileUrl,
              driveFileId: res.driveFileId || sub.file.driveFileId,
            },
          };
          storage.updateSubmission(updatedSub);
          successCount++;
        }
      } catch (e) {
        console.error('Batch sync error for submission:', sub.id, e);
      }
    }

    setIsBatchSyncing(false);
    setBatchSyncProgress(null);
    onRefreshData();
    alert(`✅ Selesai! Sebanyak ${successCount} dari ${unsynced.length} berkas berhasil disinkronkan ke Google Drive dan email tanda terima telah terkirim.`);
  };

  // Download portal-config.json for cPanel
  const handleDownloadPortalConfig = () => {
    const jsonStr = storage.exportPortalConfig();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portal-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Apps Script Code
  const appsScriptCode = generateAppsScriptCode(settingsForm);

  // .htaccess sample for cPanel
  const htaccessCode = `# .htaccess untuk Apache cPanel (Path: /penugasan-mahasiswa/)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /penugasan-mahasiswa/
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /penugasan-mahasiswa/index.html [L]
</IfModule>
`;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30">
              RUANG ADMINISTRASI KELAS DOSEN
            </span>
            <span className="text-xs text-slate-400">
              Akses Mandiri: <span className="text-slate-200 font-mono">{settings.domainHosting || 'rezalubis.com'}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Panel Pengelolaan Kelas: {settings.namaDosen}, {settings.gelar}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Sistem Mandiri Perkuliahan • NIP: {settings.nip} • Sinkronisasi: <strong className="text-teal-400">{settings.emailDosen}</strong>
          </p>
        </div>

        {/* Quick export / sync button & Logout */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Rekap Excel (CSV)</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-slate-800 hover:bg-rose-900/80 text-slate-200 hover:text-white text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 hover:border-rose-700 transition-colors cursor-pointer shadow-sm"
              title="Keluar dari sesi login dosen"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Keluar (Logout)</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: 'Dashboard & Statistik', icon: LayoutDashboard },
          { id: 'submissions', label: `Data Pengumpulan (${totalSubmissions})`, icon: FileSpreadsheet },
          { 
            id: 'gdrive', 
            label: 'Integrasi GDrive & Gmail', 
            icon: FolderSync,
            badge: settingsForm.googleAppsScriptWebhookUrl && settingsForm.googleAppsScriptWebhookUrl.trim().length > 10 ? 'Aktif' : 'Perlu Diatur',
            badgeBg: settingsForm.googleAppsScriptWebhookUrl && settingsForm.googleAppsScriptWebhookUrl.trim().length > 10 ? 'bg-emerald-600' : 'bg-rose-600 animate-pulse'
          },
          { id: 'assignments', label: `Manajemen Tugas (${assignments.length})`, icon: CalendarClock },
          { id: 'courses', label: `Mata Kuliah (${courses.length})`, icon: BookOpen },
          { id: 'deployment', label: 'Panduan GitHub & cPanel', icon: Server },
          { id: 'settings', label: 'Akun, Password & Keamanan', icon: SettingsIcon },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] text-white font-bold tracking-wider ${tab.badgeBg}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Real-time Status Alert for Google Drive & Gmail Sync */}
      {(!settingsForm.googleAppsScriptWebhookUrl || settingsForm.googleAppsScriptWebhookUrl.trim().length < 10) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <FolderSync className="w-6 h-6" />
            </div>
            <div>
              <strong className="text-amber-950 font-extrabold text-sm block">
                PERHATIAN: Berkas Belum Masuk Google Drive & Email Belum Terkirim
              </strong>
              <p className="text-amber-900 mt-0.5 leading-relaxed">
                ID Folder Google Drive sudah diatur, tetapi <strong>URL Webhook Google Apps Script masih KOSONG</strong>. Demi keamanan, Google Drive & Gmail memblokir request langsung dari domain web luar. Anda wajib memasang Webhook Google Apps Script (3 menit) agar file otomatis masuk ke Drive dan email konfirmasi terkirim.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAdminTab('gdrive')}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Pasang Webhook & Uji Coba Sekarang &rarr;</span>
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW & STATS */}
      {adminTab === 'overview' && (
        <div className="space-y-8">
          {/* Top 4 Stat Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Tugas Masuk</span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{totalSubmissions}</div>
              <p className="text-xs text-slate-500 mt-1">Seluruh berkas terdaftar di sistem</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Menunggu Review</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-amber-600">{pendingReview}</div>
              <p className="text-xs text-slate-500 mt-1">Perlu diperiksa & dinilai</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Perlu Revisi</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-rose-600">{needRevision}</div>
              <p className="text-xs text-slate-500 mt-1">Menunggu perbaikan mahasiswa</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Tepat Waktu</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-600">{onTimePercentage}%</div>
              <p className="text-xs text-slate-500 mt-1">{onTimeCount} dari {totalSubmissions} sebelum deadline</p>
            </div>
          </div>

          {/* Breakdown Charts / Progress Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Per Mata Kuliah */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Distribusi Pengumpulan per Mata Kuliah</span>
              </h3>
              <div className="space-y-3">
                {courses.map(course => {
                  const count = submissions.filter(s => s.courseId === course.id).length;
                  const pct = totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0;
                  return (
                    <div key={course.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{course.namaMk} ({course.kodeMk})</span>
                        <span className="font-bold text-slate-600">{count} tugas ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per Kelas */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Distribusi Pengumpulan per Kelas</span>
              </h3>
              <div className="space-y-3">
                {allClasses.map(kls => {
                  const count = submissions.filter(s => s.kelas === kls).length;
                  const pct = totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0;
                  return (
                    <div key={kls} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{kls}</span>
                        <span className="font-bold text-slate-600">{count} tugas ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Recent Submissions Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span>Aktivitas Pengiriman Terbaru Mahasiswa</span>
              </h3>
              <button
                onClick={() => setAdminTab('submissions')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                Lihat Seluruh Tabel &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {submissions.slice(0, 5).map(sub => {
                const badge = getStatusBadge(sub.status);
                return (
                  <div key={sub.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{sub.id}</span>
                        <span className="text-slate-500">•</span>
                        <span className="font-bold text-slate-800">{sub.namaPengirim} ({sub.nimPengirim})</span>
                        <span className="text-slate-400">Kelas: {sub.kelas}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5 truncate max-w-lg">
                        "{sub.judulKarya}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-400 text-[11px]">
                        {formatDateTimeIndo(sub.waktuKirim)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <button
                        onClick={() => setSelectedSubmissionForReview(sub)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-[11px] cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBMISSIONS DATA TABLE */}
      {adminTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari NIM, Nama, Judul Tugas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            {/* Course Filter */}
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Mata Kuliah</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.namaMk}</option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Kelas</option>
              {allClasses.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Status</option>
              <option value="menunggu_review">Menunggu Review</option>
              <option value="perlu_revisi">Perlu Revisi</option>
              <option value="disetujui">Disetujui</option>
              <option value="dinilai">Dinilai</option>
            </select>
          </div>

          {/* Unsynced Submissions Banner & Batch Action */}
          {submissions.filter(s => !s.file.driveFileUrl).length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Terdapat {submissions.filter(s => !s.file.driveFileUrl).length} tugas mahasiswa di portal lokal yang belum tersinkronkan ke Google Drive Dosen.
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Hal ini dapat terjadi jika tugas dikirim sebelum Webhook terpasang atau saat koneksi internet dialihkan. Klik tombol di samping untuk mengunggah seluruh berkas ke Google Drive dan mengirim email tanda terima secara otomatis.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isBatchSyncing}
                onClick={handleBatchSyncSubmissions}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shrink-0 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <FolderSync className={`w-3.5 h-3.5 ${isBatchSyncing ? 'animate-spin' : ''}`} />
                <span>{isBatchSyncing ? (batchSyncProgress || 'Sedang Menyinkronkan...') : `📤 Sinkronkan Semua (${submissions.filter(s => !s.file.driveFileUrl).length}) ke GDrive`}</span>
              </button>
            </div>
          )}

          {/* Submissions Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID & Waktu</th>
                  <th className="py-3 px-4">Mahasiswa (NIM & Kelompok)</th>
                  <th className="py-3 px-4">Mata Kuliah & Tugas</th>
                  <th className="py-3 px-4">Judul Karya & Berkas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Nilai</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map(sub => {
                    const course = courses.find(c => c.id === sub.courseId);
                    const statusBadge = getStatusBadge(sub.status);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* ID & Waktu */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-900 block">{sub.id}</span>
                          <span className="text-[11px] text-slate-400 font-sans block mt-0.5">
                            {formatDateTimeIndo(sub.waktuKirim)}
                          </span>
                        </td>

                        {/* Mahasiswa */}
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block">{sub.namaPengirim}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">NIM: {sub.nimPengirim}</span>
                          <span className="block text-[11px] text-slate-400">Kelas: {sub.kelas}</span>

                          {sub.anggotaKelompok.length > 1 && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                              <Users className="w-3 h-3" />
                              {sub.anggotaKelompok.length} Anggota
                            </span>
                          )}
                        </td>

                        {/* Mata Kuliah & Penugasan */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">
                            {course?.kodeMk} - {course?.namaMk}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Versi: <strong>v{sub.versi}</strong>
                          </span>
                        </td>

                        {/* Judul & File */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate" title={sub.judulKarya}>
                            "{sub.judulKarya}"
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                            <FileText className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[130px] font-medium">{sub.file.name}</span>
                            <span>({formatFileSize(sub.file.size)})</span>
                          </div>
                          {sub.file.driveFileUrl ? (
                            <a
                              href={sub.file.driveFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-teal-700 hover:text-teal-900 font-bold mt-1 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200"
                              title="Buka berkas di Google Drive"
                            >
                              <FolderSync className="w-3 h-3 text-teal-600" />
                              <span>Di Google Drive</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium mt-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Tersimpan di Portal Lokal</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>
                          {sub.status === 'perlu_revisi' && (
                            <span className="block text-[10px] text-rose-600 font-semibold mt-0.5">
                              Instruksi terkirim
                            </span>
                          )}
                        </td>

                        {/* Nilai */}
                        <td className="py-3.5 px-4 font-bold">
                          {sub.nilai !== undefined ? (
                            <div className="text-emerald-700">
                              <span className="text-sm font-black">{sub.nilai}</span>
                              {sub.gradeHuruf && (
                                <span className="text-[11px] ml-1 text-slate-500">({sub.gradeHuruf})</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal italic">Belum dinilai</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!sub.file.driveFileUrl && (
                              <button
                                onClick={() => handleSyncSubmissionToDrive(sub)}
                                disabled={syncingSubmissionId === sub.id}
                                className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 cursor-pointer disabled:opacity-50 border border-teal-200"
                                title="Sinkronkan Berkas ke Google Drive Sekarang"
                              >
                                <FolderSync className={`w-4 h-4 ${syncingSubmissionId === sub.id ? 'animate-spin' : ''}`} />
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedSubmissionForReview(sub)}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                              title="Buka Evaluasi, Nilai & Minta Revisi"
                            >
                              Review & Nilai
                            </button>

                            <button
                              onClick={() => setSelectedSubmissionForReceipt(sub)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                              title="Cetak Slip Tanda Terima"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data pengumpulan tugas yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MANAJEMEN TUGAS (CRUD & DEADLINE CONTROL) */}
      {adminTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manajemen Penugasan Mahasiswa</h2>
              <p className="text-xs text-slate-500">
                Atur jadwal mulai pengumpulan, batas waktu (deadline), format berkas, dan folder Google Drive
              </p>
            </div>

            {!isEditingAssignment && (
              <button
                onClick={() => {
                  resetAssignmentForm();
                  setIsEditingAssignment(true);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Tugas Baru</span>
              </button>
            )}
          </div>

          {/* Form Create/Edit Assignment */}
          {isEditingAssignment && (
            <form onSubmit={handleSaveAssignment} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                {asgFormId ? 'Edit Tugas Mahasiswa' : 'Buat Penugasan Baru'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Kuliah *</label>
                  <select
                    value={asgCourseId}
                    onChange={e => setAsgCourseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                    required
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.kodeMk} - {c.namaMk}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Penugasan *</label>
                  <select
                    value={asgTipe}
                    onChange={e => setAsgTipe(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="makalah_kelompok">Makalah Kelompok</option>
                    <option value="publikasi_jurnal">Publikasi Artikel Jurnal</option>
                    <option value="tugas_mandiri">Tugas Mandiri / Resume</option>
                    <option value="uts">Ujian Tengah Semester (UTS)</option>
                    <option value="uas">Ujian Akhir Semester (UAS)</option>
                    <option value="laporan_observasi">Laporan Observasi Lapangan</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Penugasan *</label>
                <input
                  type="text"
                  placeholder="Contoh: Makalah Kelompok Analisis Sistem Mutu Madrasah"
                  value={asgJudul}
                  onChange={e => setAsgJudul(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Tugas *</label>
                <textarea
                  rows={3}
                  placeholder="Petunjuk dan penjelasan tugas bagi mahasiswa..."
                  value={asgDeskripsi}
                  onChange={e => setAsgDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  required
                />
              </div>

              {/* Deadline & Window Control */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai Dibuka *</label>
                  <input
                    type="datetime-local"
                    value={asgWaktuMulai}
                    onChange={e => setAsgWaktuMulai(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Mahasiswa baru dapat mengirim mulai tanggal & jam ini.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tenggat Waktu (Deadline Akhir) *</label>
                  <input
                    type="datetime-local"
                    value={asgTenggatWaktu}
                    onChange={e => setAsgTenggatWaktu(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-rose-700"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Otomatis terhalangi & terkunci jika melewati batas waktu ini.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Format Berkas Diizinkan</label>
                  <input
                    type="text"
                    placeholder=".pdf, .docx, .zip"
                    value={asgFormats}
                    onChange={e => setAsgFormats(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maks. Ukuran File (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={asgMaxSizeMb}
                    onChange={e => setAsgMaxSizeMb(parseInt(e.target.value) || 20)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">ID / Link Folder Google Drive Khusus</label>
                    {asgDriveFolder.trim().length > 0 && (
                      <button
                        type="button"
                        disabled={isTestingAsgFolder}
                        onClick={handleTestAsgFolder}
                        className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        {isTestingAsgFolder ? 'Menguji...' : '🔍 Uji Akses Folder'}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Tempel link Google Drive atau ID folder khusus tugas ini..."
                    value={asgDriveFolder}
                    onChange={e => {
                      setAsgDriveFolder(extractCleanFolderId(e.target.value));
                      setAsgFolderTestResult(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                  {asgFolderTestResult && (
                    <div className={`text-[11px] font-semibold mt-1.5 p-2.5 rounded-lg ${
                      asgFolderTestResult.includes('✅') 
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}>
                      {asgFolderTestResult}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Bisa tempel link Google Drive, ID folder murni, atau nama folder (otomatis dibuat). Kosongkan untuk pakai folder default.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={asgIsKelompok}
                    onChange={e => setAsgIsKelompok(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Tugas Kelompok (Dapat Menambah Anggota)</span>
                </label>

                {asgIsKelompok && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Maks. Anggota:</span>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={asgMaxAnggota}
                      onChange={e => setAsgMaxAnggota(parseInt(e.target.value) || 5)}
                      className="w-16 px-2 py-1 rounded border border-slate-300"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Petunjuk Khusus / Format Sitasi (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Gunakan template APA Style 7th, minimal 15 halaman dan 8 jurnal SINTA."
                  value={asgPetunjuk}
                  onChange={e => setAsgPetunjuk(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditingAssignment(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-white cursor-pointer shadow-xs"
                >
                  Simpan Penugasan
                </button>
              </div>
            </form>
          )}

          {/* Assignment Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map(asg => {
              const course = courses.find(c => c.id === asg.courseId);
              const deadline = getDeadlineStatus(asg.waktuMulai, asg.tenggatWaktu);

              return (
                <div key={asg.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {course?.namaMk}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditAssignment(asg)}
                        className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded cursor-pointer"
                        title="Edit Tugas"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(asg.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                        title="Hapus Tugas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{asg.judul}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{asg.deskripsi}</p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Batas Waktu:</span>
                      <strong className="text-slate-800">{formatDateTimeIndo(asg.tenggatWaktu)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status Waktu:</span>
                      <span className={`font-bold ${deadline.status === 'open' ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {deadline.label} ({deadline.diffText})
                      </span>
                    </div>
                    {asg.driveFolderId && (
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Folder GDrive:</span>
                        <span className="text-teal-700">{asg.driveFolderId}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MATA KULIAH */}
      {adminTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Mata Kuliah & Kelas Perkuliahan</h2>
              <p className="text-xs text-slate-500">Dosen Pengampu: {settings.namaDosen}, {settings.gelar}</p>
            </div>

            {!isEditingCourse && (
              <button
                onClick={() => {
                  setCrsFormId(null);
                  setCrsKode('');
                  setCrsNama('');
                  setCrsKelasInput('PAI-A, PAI-B');
                  setIsEditingCourse(true);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Mata Kuliah</span>
              </button>
            )}
          </div>

          {isEditingCourse && (
            <form onSubmit={handleSaveCourse} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                {crsFormId ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode MK *</label>
                  <input
                    type="text"
                    placeholder="MPI-302"
                    value={crsKode}
                    onChange={e => setCrsKode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Mata Kuliah *</label>
                  <input
                    type="text"
                    placeholder="Manajemen Pendidikan Islam"
                    value={crsNama}
                    onChange={e => setCrsNama(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah SKS *</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={crsSks}
                    onChange={e => setCrsSks(parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester / Tahun *</label>
                  <input
                    type="text"
                    value={crsSemester}
                    onChange={e => setCrsSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Daftar Kelas (Pisahkan dengan koma) *</label>
                <input
                  type="text"
                  placeholder="MPI-III Reguler Pagi A, MPI-III Reguler Pagi B, Eksekutif Sore"
                  value={crsKelasInput}
                  onChange={e => setCrsKelasInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditingCourse(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 font-bold text-white shadow-xs"
                >
                  Simpan Mata Kuliah
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courses.map(crs => (
              <div key={crs.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                    {crs.kodeMk}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditCourse(crs)}
                      className="p-1 text-slate-600 hover:text-teal-700"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(crs.id)}
                      className="p-1 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{crs.namaMk}</h3>
                <p className="text-xs text-slate-500">{crs.sks} SKS • {crs.semester}</p>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Kelas Terdaftar ({crs.kelas.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {crs.kelas.map(k => (
                      <span key={k} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INTEGRASI GOOGLE DRIVE & GMAIL (SOLUSI RESMI & PENGUJIAN) */}
      {adminTab === 'gdrive' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 rounded-2xl border border-teal-800 shadow-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold border border-teal-400/30">
                <FolderSync className="w-3.5 h-3.5" />
                INTEGRASI GOOGLE DRIVE & GMAIL RESMI
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                settingsForm.googleAppsScriptWebhookUrl && settingsForm.googleAppsScriptWebhookUrl.trim().length > 10
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-500 text-white animate-pulse'
              }`}>
                {settingsForm.googleAppsScriptWebhookUrl && settingsForm.googleAppsScriptWebhookUrl.trim().length > 10
                  ? '🟢 Webhook Terpasang & Aktif'
                  : '🔴 Webhook Belum Dipasang'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Pusat Sinkronisasi Berkas Google Drive & Notifikasi Gmail Otomatis
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
              Hubungkan portal penugasan di cPanel (<code className="text-teal-300 font-mono">{settings.domainHosting}</code>) dengan akun Google Anda (<strong className="text-teal-200">{settings.emailDosen}</strong>) agar berkas mahasiswa langsung tersimpan di Google Drive dan bukti tanda terima terkirim otomatis via Gmail.
            </p>
          </div>

          {/* Explanation Alert: Mengapa ID Folder saja tidak cukup? */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 text-xs text-amber-950 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-black text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <span>PENTING DIPAHAMI: Mengapa Hanya Mengisi "ID Folder" Saja Belum Cukup?</span>
            </div>
            <div className="space-y-2 leading-relaxed text-amber-900">
              <p>
                <strong>1. Proteksi Keamanan Google:</strong> Google Drive dan Gmail memiliki keamanan akses yang sangat ketat. Sebuah aplikasi website di hosting cPanel <strong>tidak diizinkan oleh Google</strong> untuk langsung meng-upload berkas atau mengirim email lewat akun Google pribadi seseorang hanya bermodalkan teks "ID Folder".
              </p>
              <p>
                <strong>2. Jembatan Resmi (Google Apps Script):</strong> Untuk mengatasi hal tersebut secara legal dan gratis tanpa biaya server, Google menyediakan <strong>Google Apps Script</strong> yang dijalankan di akun Google Bapak (<code className="font-mono font-bold">{settings.emailDosen}</code>). Script ini bertindak sebagai "Pintu Gerbang / Webhook" yang menerima berkas dari portal mahasiswa lalu menyimpannya ke folder Drive Bapak dan mengirimkan email tanda terima dari Gmail Bapak.
              </p>
              <p className="bg-amber-100/70 p-3 rounded-xl border border-amber-200 font-medium">
                👉 <strong>Langkah yang Perlu Dilakukan:</strong> Cukup salin script di bawah ini ke <a href="https://script.google.com/home" target="_blank" rel="noreferrer" className="underline font-bold text-amber-950">script.google.com</a> (hanya butuh waktu ~3 menit), lalu tempelkan URL Web App hasil deploy ke form di bawah. Setelah itu, berkas dan email dijamin langsung masuk 100%!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Konfigurasi Webhook & Folder ID */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FolderSync className="w-5 h-5 text-teal-600" />
                  <span>Konfigurasi URL Webhook & Folder Drive</span>
                </h3>
              </div>

              {savedSettingsNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan Webhook & Google Drive berhasil disimpan!</span>
                </div>
              )}

              <div className="space-y-4 text-xs">
                {/* Webhook URL Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      URL Webhook Google Apps Script (akhiran /exec) *
                    </label>
                    <span className="text-[10px] text-teal-700 font-semibold">Wajib Dipasang</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    value={settingsForm.googleAppsScriptWebhookUrl}
                    onChange={e => {
                      const val = e.target.value;
                      setSettingsForm({ ...settingsForm, googleAppsScriptWebhookUrl: val });
                      const check = validateWebhookUrl(val);
                      setWebhookWarning(check.isValid ? null : check.warning || null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                  {webhookWarning && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{webhookWarning}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    URL ini didapatkan dari tombol <strong>Deploy &rarr; New deployment &rarr; Web app</strong> di script.google.com.
                  </p>
                </div>

                {/* Default Folder ID Input */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ID Folder Google Drive Utama (Tempat Penyimpanan Berkas) *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1AbCdEfGhIjKlMnOpQrStUvWxYz atau tautan drive.google.com/..."
                    value={settingsForm.googleDriveDefaultFolderId}
                    onChange={e => {
                      // Auto clean folder ID if user pastes full URL
                      const cleaned = extractCleanFolderId(e.target.value);
                      setSettingsForm({ ...settingsForm, googleDriveDefaultFolderId: cleaned });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bapak bisa menempelkan langsung link Google Drive (misal: <code>https://drive.google.com/drive/folders/<strong>ID_FOLDER</strong></code>), sistem akan otomatis mengekstrak ID murninya.
                  </p>
                </div>

                {/* Save Configuration Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      storage.updateSettings({
                        googleAppsScriptWebhookUrl: settingsForm.googleAppsScriptWebhookUrl.trim(),
                        googleDriveDefaultFolderId: extractCleanFolderId(settingsForm.googleDriveDefaultFolderId),
                      });
                      setSavedSettingsNotice(true);
                      setTimeout(() => setSavedSettingsNotice(false), 3000);
                      onRefreshData();
                    }}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Integrasi Google</span>
                  </button>
                </div>

                {/* Download portal-config.json for cPanel multi-device */}
                <div>
                  <button
                    type="button"
                    onClick={handleDownloadPortalConfig}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border border-slate-300 transition-colors"
                    title="Unduh file portal-config.json untuk di-upload ke cPanel"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Unduh portal-config.json (Untuk cPanel)</span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Upload file ini ke folder website di cPanel Anda (tempat yang sama dengan <code>index.html</code>) agar setiap mahasiswa yang mengakses dari HP atau laptop mana pun langsung terhubung ke Webhook ini.
                  </p>
                </div>

                {/* Interactive Live Testing */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <strong className="text-slate-900 block font-bold text-xs uppercase tracking-wider">
                    Uji Coba Langsung (Live Testing):
                  </strong>
                  <p className="text-[11px] text-slate-600">
                    Gunakan tombol di bawah untuk membuktikan secara langsung apakah Webhook berhasil membuat file di Google Drive Bapak dan mengirimkan email ke Gmail Bapak:
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      className="flex-1 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      1. 🔍 Uji Ping Webhook
                    </button>

                    <button
                      type="button"
                      disabled={isTestingDispatch}
                      onClick={handleTestDispatchFile}
                      className="flex-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isTestingDispatch ? (
                        <span>Sedang Mengirim Tes...</span>
                      ) : (
                        <span>2. 🧪 Uji Kirim File & Email Tes</span>
                      )}
                    </button>
                  </div>

                  {testWebhookStatus && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800">
                      {testWebhookStatus}
                    </div>
                  )}

                  {testDispatchStatus && (
                    <div className={`p-3.5 rounded-xl text-xs font-semibold ${
                      testDispatchStatus.includes('✅')
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}>
                      <p>{testDispatchStatus}</p>
                      {testDispatchStatus.includes('✅') && (
                        <p className="mt-1 text-[11px] font-normal text-emerald-800">
                          &rarr; Silakan buka Google Drive Bapak dan buka inbox Gmail di <strong>{settingsForm.emailDosen}</strong> untuk melihat hasilnya secara langsung!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step-by-Step Tutorial & Copy Script */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-teal-600" />
                  <span>Panduan Pemasangan Webhook (Hanya 3 Menit)</span>
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(appsScriptCode);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Tersalin!' : 'Salin Script Lengkap'}</span>
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-700 leading-relaxed">
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="text-slate-900">Buka Google Apps Script:</strong> Masuk ke <a href="https://script.google.com/home" target="_blank" rel="noreferrer" className="text-teal-700 font-bold underline">script.google.com</a> dengan akun <strong className="text-slate-900">{settingsForm.emailDosen}</strong>, lalu klik <strong>+ Proyek baru</strong> (+ New project).
                </li>
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="text-slate-900">Tempelkan Script:</strong> Hapus seluruh kode bawaan yang ada di editor, lalu klik tombol hijau <strong>"Salin Script Lengkap"</strong> di atas dan tempelkan (paste) di sana.
                </li>
                <li className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200">
                  <strong className="text-amber-950">Deploy / Update Web App:</strong>
                  <div className="mt-1 pl-1 space-y-1 text-[11px] text-amber-900 leading-relaxed">
                    <div>• <strong>Jika Proyek Baru:</strong> Klik tombol biru <strong>Deploy</strong> &rarr; pilih <strong>New deployment</strong> &rarr; klik gerigi &rarr; <strong>Web app</strong>.</div>
                    <div>• <strong>Jika Sudah Pernah Deploy:</strong> Klik tombol biru <strong>Deploy</strong> &rarr; pilih <strong>Manage deployments (Kelola penerapan)</strong> &rarr; klik ikon <strong>Pensil (Edit)</strong> &rarr; pada baris <em>Version</em> pilih <strong>"New version" (Versi Baru)</strong> &rarr; klik <strong>Deploy</strong>. <em>(Wajib pilih "New version" agar script baru aktif!)</em></div>
                    <div className="pt-1">• <em>Execute as:</em> <strong>Me ({settingsForm.emailDosen})</strong></div>
                    <div>• <em>Who has access:</em> <strong className="text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-black">Anyone (Siapa saja)</strong> &larr; <em>Wajib pilih "Anyone"!</em></div>
                  </div>
                </li>
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="text-slate-900">Otorisasi & Salin URL:</strong> Klik <strong>Deploy</strong> &rarr; klik <strong>Authorize access</strong> &rarr; pilih akun Google Anda &rarr; klik <strong>Advanced</strong> &rarr; klik <strong>Go to Webhook... (unsafe)</strong> &rarr; klik <strong>Allow</strong>. Salin Web App URL (berakhiran <code className="bg-slate-200 px-1 font-mono">/exec</code>) lalu tempelkan ke kolom URL Webhook di sebelah kiri!
                </li>
              </ol>

              {/* Script Preview Box */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">Preview Kode Google Apps Script:</span>
                  <span className="text-[10px] text-slate-400 font-mono">JavaScript (Apps Script)</span>
                </div>
                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-[10px] font-mono max-h-56 overflow-y-auto leading-relaxed border border-slate-800">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INTEGRASI GDRIVE, GITHUB & CPANEL */}
      {adminTab === 'deployment' && (
        <div className="space-y-6">
          {/* Sub Navigation between GitHub and cPanel */}
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <button
              onClick={() => setDeploymentSubTab('github')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                deploymentSubTab === 'github'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4 text-teal-400" />
              <span>Opsi 1: GitHub Pages (Gratis & Otomatis)</span>
            </button>

            <button
              onClick={() => setDeploymentSubTab('cpanel')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                deploymentSubTab === 'cpanel'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Opsi 2: Shared Hosting cPanel ({settings.domainHosting})</span>
            </button>
          </div>

          {/* GITHUB PAGES SUB-TAB */}
          {deploymentSubTab === 'github' && (
            <div className="space-y-6">
              {/* TROUBLESHOOTING ALERT: BLANK PAGE RESOLUTION */}
              <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-200/60 text-rose-900 font-bold text-[11px] mb-1">
                      PANDUAN SOLUSI: https://rezastaiuisu.github.io/Tugas-Mahasiswa/
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-rose-950">
                      Mengapa Website Tampil Blank (Putih Kosong) di GitHub Pages?
                    </h3>
                    <p className="text-xs text-rose-900 mt-1 leading-relaxed">
                      <strong>Penyebab:</strong> Ketika Bapak meng-upload repository ke GitHub, GitHub Pages secara default mencoba membaca file mentah <code className="bg-rose-150 px-1 py-0.5 rounded font-mono font-bold text-rose-950">index.html</code> yang memanggil <code className="font-mono text-rose-950">/src/main.tsx</code>. Browser biasa <strong>tidak bisa mengeksekusi file TypeScript (.tsx) mentah</strong> tanpa di-<em>build / compile</em> terlebih dahulu oleh Node.js, sehingga browser terhenti dan menampilkan layar putih.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-rose-200">
                  {/* Cara 1: Otomatis GitHub Actions */}
                  <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <strong className="text-xs text-slate-900 uppercase tracking-wider font-extrabold">
                        Solusi 1 (Paling Mudah & Rekomendasi):
                      </strong>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Cukup ubah <strong>1 pengaturan</strong> di repository GitHub Bapak:
                    </p>
                    <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1 pl-1">
                      <li>Buka repository: <code className="text-indigo-700 font-bold font-mono">github.com/rezastaiuisu/Tugas-Mahasiswa</code></li>
                      <li>Klik tab <strong>Settings</strong> (di bagian atas)</li>
                      <li>Di menu kiri, klik <strong>Pages</strong></li>
                      <li>Pada bagian <em>Build and deployment</em> &rarr; <em>Source</em>, ubah pilihan dari <span className="line-through text-rose-500">Deploy from a branch</span> menjadi <strong className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">GitHub Actions</strong>!</li>
                      <li>File <code className="font-mono text-[11px] bg-slate-100 px-1">.github/workflows/deploy.yml</code> yang sudah ada di proyek ini akan otomatis melakukan compile dan situs langsung aktif!</li>
                    </ol>
                  </div>

                  {/* Cara 2: Pakai File ZIP Siap Pakai */}
                  <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      <strong className="text-xs text-slate-900 uppercase tracking-wider font-extrabold">
                        Solusi 2 (Download ZIP Siap Deploy):
                      </strong>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Download file pre-compiled di bawah ini, ekstrak di komputer Bapak, lalu upload isinya (<code className="font-mono text-[11px]">index.html</code> dan folder <code className="font-mono text-[11px]">assets/</code>) langsung ke GitHub:
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      <a
                        href="./dist.zip"
                        download="dist.zip"
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-center"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Berkas Jadi: dist.zip (186 KB)</span>
                      </a>
                      <a
                        href="./portal-source-code.zip"
                        download="portal-source-code.zip"
                        className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-center"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Source Code: portal-source-code.zip (96 KB)</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* GitHub Explanation Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white p-6 sm:p-7 rounded-2xl border border-slate-800 shadow-md space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold border border-teal-400/30">
                  <Code2 className="w-3.5 h-3.5" />
                  DEVOPS: GITHUB REPOSITORY & GITHUB PAGES
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Kelebihan Menggunakan GitHub Pages untuk Dosen
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
                  GitHub Pages menyediakan hosting <em>100% gratis selamanya</em> dengan performa global super cepat (CDN) dan SSL HTTPS otomatis.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <strong className="text-teal-300 block mb-0.5">🔒 Login ID & Password:</strong>
                    Sistem login dosen tetap 100% aman beroperasi di browser Bapak dengan session token terproteksi dan verifikasi kredensial.
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <strong className="text-teal-300 block mb-0.5">📁 Google Drive & Gmail:</strong>
                    Mahasiswa tetap mengirim file langsung ke Folder Google Drive Bapak melalui Google Apps Script Webhook gratis.
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <strong className="text-teal-300 block mb-0.5">🌐 Custom Domain:</strong>
                    Bisa dipasangkan domain Bapak sendiri: <span className="font-mono text-teal-200">rezalubis.com</span> atau subdomain <span className="font-mono text-teal-200">tugas.rezalubis.com</span>.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step-by-Step GitHub Setup */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-teal-600" />
                    <span>Langkah Mudah Deploy ke GitHub</span>
                  </h3>

                  <ol className="list-decimal list-inside space-y-3 text-xs text-slate-700 leading-relaxed">
                    <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <strong className="text-slate-900">Buat Repository Baru di GitHub:</strong> Buka <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-teal-700 font-bold underline">github.com/new</a>, beri nama repository misalnya <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">penugasan-mahasiswa</code> (pilih Public).
                    </li>
                    <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <strong className="text-slate-900">Push Kode ke GitHub:</strong> Jalankan perintah git di terminal komputer Bapak (lihat kotak perintah di bawah).
                    </li>
                    <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <strong className="text-slate-900">Aktifkan GitHub Pages Otomatis:</strong> Di GitHub repo Anda, masuk ke menu <strong>Settings</strong> &rarr; <strong>Pages</strong> &rarr; Pada bagian <em>Build and deployment Source</em>, pilih <strong>GitHub Actions</strong>.
                    </li>
                    <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <strong className="text-slate-900">Selesai:</strong> Setiap kali Bapak melakukan update kode atau push, GitHub Actions akan otomatis men-deploy web Bapak dalam waktu ~30 detik!
                    </li>
                  </ol>

                  {/* Git CLI Snippet */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Perintah Terminal (Git Push):</span>
                      <button
                        onClick={() => {
                          const cmds = `# 1. Inisialisasi Git di folder aplikasi\ngit init\ngit add .\ngit commit -m "Portal Penugasan Dosen Reza Lubis"\n\n# 2. Hubungkan ke repository GitHub Anda\ngit branch -M main\ngit remote add origin https://github.com/rezalubis/penugasan-mahasiswa.git\n\n# 3. Push ke GitHub\ngit push -u origin main`;
                          navigator.clipboard.writeText(cmds);
                          setCopiedGitCommands(true);
                          setTimeout(() => setCopiedGitCommands(false), 2000);
                        }}
                        className="text-xs text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedGitCommands ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedGitCommands ? 'Tersalin!' : 'Salin Perintah Git'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 text-teal-400 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
{`git init
git add .
git commit -m "Portal Penugasan Dosen Reza Lubis"
git branch -M main
git remote add origin https://github.com/rezalubis/penugasan-mahasiswa.git
git push -u origin main`}
                    </pre>
                  </div>
                </div>

                {/* GitHub Actions Workflow (.github/workflows/deploy.yml) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Server className="w-5 h-5 text-indigo-600" />
                      <span>File GitHub Actions (.github/workflows/deploy.yml)</span>
                    </h3>
                    <button
                      onClick={() => {
                        const workflow = `name: Deploy to GitHub Pages\n\non:\n  push:\n    branches: [ main ]\n  workflow_dispatch:\n\npermissions:\n  contents: read\n  pages: write\n  id-token: write\n\nconcurrency:\n  group: 'pages'\n  cancel-in-progress: true\n\njobs:\n  build-and-deploy:\n    environment:\n      name: github-pages\n      url: \${{ steps.deployment.outputs.page_url }}\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n\n      - name: Setup Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n\n      - name: Install dependencies\n        run: npm ci\n\n      - name: Build Vite App\n        run: npm run build\n\n      - name: Upload Pages artifact\n        uses: actions/upload-pages-artifact@v3\n        with:\n          path: './dist'\n\n      - name: Deploy to GitHub Pages\n        id: deployment\n        uses: actions/deploy-pages@v4\n`;
                        navigator.clipboard.writeText(workflow);
                        setCopiedGithubWorkflow(true);
                        setTimeout(() => setCopiedGithubWorkflow(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copiedGithubWorkflow ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedGithubWorkflow ? 'Tersalin!' : 'Copy File deploy.yml'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Simpan file ini di dalam folder proyek Anda pada path: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-700 font-bold">.github/workflows/deploy.yml</code>. GitHub akan otomatis melakukan build dan publish setiap kali ada perubahan.
                  </p>

                  <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[10px] font-mono max-h-72 overflow-y-auto leading-relaxed">
{`name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Vite App
        run: npm run build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* CPANEL SUB-TAB */}
          {deploymentSubTab === 'cpanel' && (
            <div className="space-y-6">
              {/* Direct Answer & Explanation Banner */}
              <div className="bg-gradient-to-r from-teal-900 to-indigo-950 text-white p-6 sm:p-7 rounded-2xl border border-teal-800 shadow-md space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold border border-teal-400/30">
                  <Server className="w-3.5 h-3.5" />
                  SOLUSI HOSTING CPANEL ({settings.domainHosting})
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Pemasangan di CPanel Shared Hosting rezalubis.com
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
                  Pada Shared Hosting CPanel, kombinasi <strong>Static Frontend React</strong> (ditaruh di folder <code className="bg-black/30 px-1 py-0.5 rounded text-teal-300">public_html/penugasan-mahasiswa/</code>) 
                  ditambah <strong>Google Apps Script Webhook</strong> (berjalan gratis di akun Google <strong>{settings.emailDosen}</strong>) adalah <em>arsitektur paling hemat dan anti-overload</em>.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step by Step CPanel Deployment */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-600" />
                    <span>Panduan Upload ke CPanel (Langkah demi Langkah)</span>
                  </h3>

                  <ol className="list-decimal list-inside space-y-3 text-xs text-slate-700 leading-relaxed">
                    <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <strong className="text-slate-900">Build Aplikasi:</strong> Jalankan perintah <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">npm run build</code>. Folder output <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">dist/</code> sudah dikonfigurasi dengan <code className="font-mono text-teal-700">base: './'</code> sehingga fleksibel dimuat di subfolder manapun.
                    </li>
                    <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <strong className="text-slate-900">Buka CPanel File Manager:</strong> Masuk ke <code className="font-mono">public_html/</code>, buat folder baru bernama <code className="font-mono text-teal-700 font-bold">penugasan-mahasiswa</code>.
                    </li>
                    <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <strong className="text-slate-900">Upload Isi Folder dist:</strong> Upload file <code className="font-mono">index.html</code> dan folder <code className="font-mono">assets/</code> ke dalam folder <code className="font-mono">penugasan-mahasiswa</code> tadi.
                    </li>
                    <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <strong className="text-slate-900">Buat File .htaccess:</strong> Di dalam folder yang sama, buat file <code className="font-mono">.htaccess</code> dengan kode di samping agar URL routing berjalan mulus.
                    </li>
                  </ol>

                  {/* .htaccess snippet */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Kode File .htaccess:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(htaccessCode);
                          setCopiedHtaccess(true);
                          setTimeout(() => setCopiedHtaccess(false), 2000);
                        }}
                        className="text-xs text-indigo-700 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedHtaccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedHtaccess ? 'Tersalin!' : 'Salin Kode .htaccess'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto">
                      {htaccessCode}
                    </pre>
                  </div>
                </div>

                {/* Google Apps Script Integration */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-teal-600" />
                      <span>Google Apps Script Generator (Drive & Gmail)</span>
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(appsScriptCode);
                        setCopiedScript(true);
                        setTimeout(() => setCopiedScript(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'Tersalin!' : 'Copy Script Lengkap'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Script ini berjalan di akun Google <strong>{settings.emailDosen}</strong> Anda. Ketika mahasiswa submit, script otomatis menyimpan file ke ID Folder Drive dan mengirim email notifikasi ke mahasiswa via Gmail.
                  </p>

                  <div className="space-y-4 pt-2">
                    {/* Status Badge */}
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                      settingsForm.googleAppsScriptWebhookUrl && settingsForm.googleAppsScriptWebhookUrl.trim().length > 10
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        {settingsForm.googleAppsScriptWebhookUrl && settingsForm.googleAppsScriptWebhookUrl.trim().length > 10 ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>URL Webhook Terpasang & Siap Sinkronisasi</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                            <span>URL Webhook Masih Kosong (Sinkronisasi GDrive Belum Aktif)</span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] font-mono opacity-80">
                        Target: {settingsForm.emailDosen}
                      </span>
                    </div>

                    {/* 4 Steps Checklist */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
                      <strong className="text-slate-900 block font-bold text-xs uppercase tracking-wider">
                        4 Langkah Mudah Menghubungkan Google Drive & Gmail:
                      </strong>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                        <li>Buka <a href="https://script.google.com/home" target="_blank" rel="noreferrer" className="text-teal-700 font-bold underline">script.google.com</a> login dengan akun <strong>{settingsForm.emailDosen}</strong> & klik <strong>+ New project</strong>.</li>
                        <li>Hapus semua kode bawaan, lalu klik tombol hijau <strong>"Copy Script Lengkap"</strong> di atas dan paste ke sana.</li>
                        <li>Klik <strong>Deploy</strong> &rarr; <strong>New deployment</strong> &rarr; Pilih <strong>Web app</strong>. Atur:
                          <br />• <em>Execute as:</em> <strong>Me ({settingsForm.emailDosen})</strong>
                          <br />• <em>Who has access:</em> <strong className="text-rose-700 bg-rose-50 px-1 rounded">Anyone (Siapa saja)</strong> &larr; <em>Wajib pilih "Anyone"!</em>
                        </li>
                        <li>Klik <strong>Deploy</strong> &rarr; Berikan izin akses Google &rarr; Salin Web App URL yang berakhiran <code className="bg-slate-200 px-1 font-mono">/exec</code> lalu tempelkan di bawah ini:</li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tempelkan URL Web App Google Apps Script Di Sini (akhiran /exec): *
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                          value={settingsForm.googleAppsScriptWebhookUrl}
                          onChange={e => setSettingsForm({ ...settingsForm, googleAppsScriptWebhookUrl: e.target.value })}
                          className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            storage.updateSettings({ googleAppsScriptWebhookUrl: settingsForm.googleAppsScriptWebhookUrl });
                            setSavedSettingsNotice(true);
                            setTimeout(() => setSavedSettingsNotice(false), 3000);
                            onRefreshData();
                          }}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 shadow-xs"
                        >
                          Simpan URL
                        </button>
                      </div>

                      {/* Action Test Buttons */}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <button
                          type="button"
                          onClick={handleTestWebhook}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                        >
                          1. Uji Ping Online
                        </button>
                        <button
                          type="button"
                          disabled={isTestingDispatch}
                          onClick={handleTestDispatchFile}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isTestingDispatch ? (
                            <span>Sedang Menguji...</span>
                          ) : (
                            <>
                              <span>2. 🧪 Tes Kirim File & Email Uji Coba</span>
                            </>
                          )}
                        </button>
                      </div>

                      {testWebhookStatus && (
                        <p className="text-xs font-medium text-teal-700 mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {testWebhookStatus}
                        </p>
                      )}

                      {testDispatchStatus && (
                        <div className={`p-3 rounded-xl mt-2 text-xs font-semibold ${
                          testDispatchStatus.includes('✅')
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : 'bg-rose-50 text-rose-900 border border-rose-200'
                        }`}>
                          {testDispatchStatus}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ID Folder Google Drive Utama: *
                      </label>
                      <input
                        type="text"
                        value={settingsForm.googleDriveDefaultFolderId}
                        onChange={e => setSettingsForm({ ...settingsForm, googleDriveDefaultFolderId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        (ID folder ada pada tautan Google Drive Anda: drive.google.com/drive/folders/<strong>ID_FOLDER_DI_SINI</strong>)
                      </p>
                    </div>

                    {/* Script snippet preview */}
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1">Preview Script:</span>
                      <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-[10px] font-mono max-h-36 overflow-y-auto">
                        {appsScriptCode.slice(0, 500)}...
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SETTINGS, CREDENTIALS & SECURITY */}
      {adminTab === 'settings' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-teal-600" />
              <span>Pengaturan Kredensial Login, Akun & Keamanan</span>
            </h2>
          </div>

          {savedSettingsNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan & Kredensial berhasil disimpan!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            {/* Box Kredensial Login */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <KeyRound className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Kredensial Login Portal Dosen</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ID / Username Login Dosen *
                  </label>
                  <input
                    type="text"
                    value={settingsForm.adminUsername}
                    onChange={e => setSettingsForm({ ...settingsForm, adminUsername: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ID untuk masuk ke dashboard admin (saat ini: {settingsForm.adminUsername}).
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password Login Dosen *
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      value={settingsForm.adminPassword}
                      onChange={e => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold bg-white text-slate-900 focus:ring-2 focus:ring-teal-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Password rahasia Bapak untuk mengakses nilai dan data.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PIN Darurat Pemulihan *
                  </label>
                  <input
                    type="text"
                    value={settingsForm.secretAdminPin}
                    onChange={e => setSettingsForm({ ...settingsForm, secretAdminPin: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white text-slate-900"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Digunakan untuk me-reset password jika sewaktu-waktu lupa password.
                  </span>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={settingsForm.requireLoginForAdmin}
                      onChange={e => setSettingsForm({ ...settingsForm, requireLoginForAdmin: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>Wajibkan Login ID & Password untuk Akses Portal Dosen</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Biodata Dosen */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                Biodata & Profil Akademik Dosen
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Dosen *</label>
                  <input
                    type="text"
                    value={settingsForm.namaDosen}
                    onChange={e => setSettingsForm({ ...settingsForm, namaDosen: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gelar Akademik *</label>
                  <input
                    type="text"
                    value={settingsForm.gelar}
                    onChange={e => setSettingsForm({ ...settingsForm, gelar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Resmi (Gmail) *</label>
                  <input
                    type="email"
                    value={settingsForm.emailDosen}
                    onChange={e => setSettingsForm({ ...settingsForm, emailDosen: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP / NIDN Dosen</label>
                  <input
                    type="text"
                    value={settingsForm.nip}
                    onChange={e => setSettingsForm({ ...settingsForm, nip: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Perguruan Tinggi / Kampus *</label>
                <input
                  type="text"
                  value={settingsForm.kampus}
                  onChange={e => setSettingsForm({ ...settingsForm, kampus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL / Path Hosting Target</label>
                  <input
                    type="text"
                    value={settingsForm.domainHosting}
                    onChange={e => setSettingsForm({ ...settingsForm, domainHosting: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tautan Repository GitHub (Opsional)</label>
                  <input
                    type="text"
                    placeholder="https://github.com/rezalubis/penugasan-mahasiswa"
                    value={settingsForm.githubRepoUrl || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, githubRepoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Seluruh Pengaturan & Password</span>
              </button>
            </div>
          </form>

          {/* Backup & Reset Database Section */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Backup, Restore & Reset Database</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const json = storage.exportDataJson();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `backup_portal_tugas_${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Backup Data (JSON)</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Reset seluruh data tugas, nilai, dan mata kuliah ke data sampel awal?')) {
                    storage.resetToDefault();
                    onRefreshData();
                  }
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset ke Data Sampel Awal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedSubmissionForReview && (
        <AdminReviewModal
          submission={selectedSubmissionForReview}
          assignment={assignments.find(a => a.id === selectedSubmissionForReview.assignmentId)}
          course={courses.find(c => c.id === selectedSubmissionForReview.courseId)}
          settings={settings}
          onClose={() => setSelectedSubmissionForReview(null)}
          onSaveReview={updated => {
            storage.updateSubmission(updated);
            onRefreshData();
          }}
          onOpenReceipt={sub => {
            setSelectedSubmissionForReview(null);
            setSelectedSubmissionForReceipt(sub);
          }}
        />
      )}

      {/* Receipt Modal */}
      {selectedSubmissionForReceipt && (
        <SubmissionReceiptModal
          submission={selectedSubmissionForReceipt}
          assignment={assignments.find(a => a.id === selectedSubmissionForReceipt.assignmentId)}
          course={courses.find(c => c.id === selectedSubmissionForReceipt.courseId)}
          settings={settings}
          onClose={() => setSelectedSubmissionForReceipt(null)}
        />
      )}
    </div>
  );
};
