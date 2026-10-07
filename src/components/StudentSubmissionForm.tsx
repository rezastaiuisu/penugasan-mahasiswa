import React, { useState, useId } from 'react';
import confetti from 'canvas-confetti';
import { 
  Upload, 
  Users, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  HelpCircle,
  FolderSync,
  Mail,
  Phone,
  BookOpen,
  Send,
  Lock,
  Layers
} from 'lucide-react';
import { Course, Assignment, Submission, GroupMember, LecturerSettings } from '../types';
import { getDeadlineStatus, formatDateTimeIndo } from '../utils/formatters';
import { storage } from '../services/storage';
import { dispatchSubmissionToGoogle } from '../services/appsScriptService';

interface StudentSubmissionFormProps {
  courses: Course[];
  assignments: Assignment[];
  settings: LecturerSettings;
  onSubmissionSuccess: (submission: Submission, assignment: Assignment, course: Course) => void;
  preselectedAssignmentId?: string;
}

export const StudentSubmissionForm: React.FC<StudentSubmissionFormProps> = ({
  courses,
  assignments,
  settings,
  onSubmissionSuccess,
  preselectedAssignmentId,
}) => {
  // Selection state
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    if (preselectedAssignmentId) {
      const match = assignments.find(a => a.id === preselectedAssignmentId);
      if (match) return match.courseId;
    }
    return courses[0]?.id || '';
  });

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(() => {
    if (preselectedAssignmentId) return preselectedAssignmentId;
    const available = assignments.filter(a => a.courseId === (courses[0]?.id || ''));
    return available[0]?.id || '';
  });

  // Sender details
  const [namaPengirim, setNamaPengirim] = useState('');
  const [nimPengirim, setNimPengirim] = useState('');
  const [emailPengirim, setEmailPengirim] = useState('');
  const [noHpPengirim, setNoHpPengirim] = useState('');
  const [kelas, setKelas] = useState('');

  // Additional group members
  const [anggotaKelompok, setAnggotaKelompok] = useState<GroupMember[]>([]);

  // Task work details
  const [judulKarya, setJudulKarya] = useState('');
  const [abstrakRingkas, setAbstrakRingkas] = useState('');
  const [linkTambahan, setLinkTambahan] = useState('');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  // Status & UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active objects
  const activeCourse = courses.find(c => c.id === selectedCourseId);
  const activeAssignment = assignments.find(a => a.id === selectedAssignmentId);

  // Filter assignments for selected course
  const courseAssignments = assignments.filter(a => a.courseId === selectedCourseId);

  // Deadline calculation
  const deadlineInfo = activeAssignment
    ? getDeadlineStatus(activeAssignment.waktuMulai, activeAssignment.tenggatWaktu)
    : null;

  const isLocked = deadlineInfo?.status === 'closed' || deadlineInfo?.status === 'upcoming';

  // Handle course change
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const relatedAssignments = assignments.filter(a => a.courseId === courseId);
    if (relatedAssignments.length > 0) {
      setSelectedAssignmentId(relatedAssignments[0].id);
    } else {
      setSelectedAssignmentId('');
    }
  };

  // Group member handling
  const handleAddMember = () => {
    const newMember: GroupMember = {
      id: 'mem_' + Date.now() + Math.random().toString(36).substring(2, 6),
      nama: '',
      nim: '',
      peran: 'Anggota',
    };
    setAnggotaKelompok([...anggotaKelompok, newMember]);
  };

  const handleUpdateMember = (id: string, field: 'nama' | 'nim', val: string) => {
    setAnggotaKelompok(
      anggotaKelompok.map(m => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  const handleRemoveMember = (id: string) => {
    setAnggotaKelompok(anggotaKelompok.filter(m => m.id !== id));
  };

  // Helper to safely convert file to Base64 with Promise guarantee
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1] || '';
        resolve(base64Data);
      };
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // File handling
  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setFileBase64('');
      return;
    }

    if (!activeAssignment) return;

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowed = activeAssignment.formatAllowed.some(fmt =>
      fmt.toLowerCase() === extension
    );

    if (!isAllowed) {
      setErrorMessage(
        `Format file "${extension}" tidak didukung. Format yang diizinkan: ${activeAssignment.formatAllowed.join(', ')}`
      );
      return;
    }

    // Check size in MB
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > activeAssignment.maxFileSizeMb) {
      setErrorMessage(
        `Ukuran file (${fileSizeMb.toFixed(1)} MB) melebihi batas maksimal ${activeAssignment.maxFileSizeMb} MB.`
      );
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    // Read base64
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || '';
      setFileBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!activeCourse || !activeAssignment) {
      setErrorMessage('Pilih Mata Kuliah dan Tugas terlebih dahulu.');
      return;
    }

    if (isLocked) {
      setErrorMessage(
        'Pengumpulan tugas ini telah ditutup oleh sistem karena batas waktu (deadline) telah berakhir.'
      );
      return;
    }

    if (!namaPengirim.trim() || !nimPengirim.trim()) {
      setErrorMessage('Nama Lengkap dan NIM pengirim utama wajib diisi.');
      return;
    }

    if (!emailPengirim.trim() || !emailPengirim.includes('@')) {
      setErrorMessage('Email Mahasiswa wajib diisi dengan alamat email aktif (contoh: mahasiswa@gmail.com) agar Anda menerima bukti tanda terima otomatis via Gmail dari Dosen.');
      return;
    }

    if (!judulKarya.trim()) {
      setErrorMessage('Judul Karya / Judul Makalah / Publikasi wajib diisi.');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Silakan pilih dan unggah file tugas Anda terlebih dahulu.');
      return;
    }

    // Prepare all group members
    const finalMembers: GroupMember[] = [
      {
        id: 'lead',
        nama: namaPengirim.trim(),
        nim: nimPengirim.trim(),
        peran: 'Ketua',
      },
      ...anggotaKelompok
        .filter(m => m.nama.trim() !== '' && m.nim.trim() !== '')
        .map(m => ({ ...m, peran: 'Anggota' as const })),
    ];

    setIsSubmitting(true);

    try {
      // Ensure base64 file data is completely resolved
      let resolvedBase64 = fileBase64;
      if (!resolvedBase64 && selectedFile) {
        resolvedBase64 = await convertFileToBase64(selectedFile);
      }

      const nowIso = new Date().toISOString();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `TGS-${new Date().getFullYear()}-${randomSuffix}`;

      const newSubmission: Submission = {
        id: ticketId,
        assignmentId: activeAssignment.id,
        courseId: activeCourse.id,
        kelas: kelas.trim() || (activeCourse.kelas[0] ?? 'Reguler'),
        semesterTahun: activeCourse.semester,
        namaPengirim: namaPengirim.trim(),
        nimPengirim: nimPengirim.trim(),
        emailPengirim: emailPengirim.trim(),
        noHpPengirim: noHpPengirim.trim(),
        anggotaKelompok: finalMembers,
        judulKarya: judulKarya.trim(),
        abstrakRingkas: abstrakRingkas.trim(),
        linkTambahan: linkTambahan.trim(),
        file: {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          lastModified: selectedFile.lastModified,
          base64Data: resolvedBase64,
        },
        waktuKirim: nowIso,
        isLate: false,
        status: 'menunggu_review',
        versi: 1,
        riwayatRevisi: [
          {
            version: 1,
            timestamp: nowIso,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            catatanMahasiswa: 'Pengiriman awal berkas tugas',
          },
        ],
        bisaRevisi: true,
      };

      // Dispatch to Google Apps Script / Google Drive
      const dispatchRes = await dispatchSubmissionToGoogle(
        newSubmission,
        activeAssignment,
        settings
      );

      if (dispatchRes.driveFileUrl) {
        newSubmission.file.driveFileUrl = dispatchRes.driveFileUrl;
      }
      if (dispatchRes.driveFileId) {
        newSubmission.file.driveFileId = dispatchRes.driveFileId;
      }

      // Save to persistent storage
      storage.addSubmission(newSubmission);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0d9488', '#0284c7', '#6366f1', '#10b981'],
        });
      } catch (err) {
        // ignore
      }

      // Notify parent & open receipt modal
      onSubmissionSuccess(newSubmission, activeAssignment, activeCourse);

      // Reset form fields
      setJudulKarya('');
      setAbstrakRingkas('');
      setLinkTambahan('');
      setSelectedFile(null);
      setFileBase64('');
      setAnggotaKelompok([]);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMessage('Terjadi kesalahan saat menyimpan tugas. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Intro Header */}
      <div className="mb-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            PENGUMPULAN TUGAS KELAS MANDIRI
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pengumpulan Tugas Perkuliahan
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Ruang mandiri pengumpulan tugas kuliah untuk kelas Dosen <strong>{settings.namaDosen}, {settings.gelar}</strong>. Berkas Anda langsung terarsip di Google Drive pengampu dan tanda terima resmi otomatis dikirimkan ke email Anda.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Pilih Mata Kuliah & Tugas */}
        <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200/90 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
              1
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                Pilih Mata Kuliah & Penugasan
              </h2>
              <p className="text-xs text-slate-500">
                Pilih mata kuliah yang Anda ikuti dan jenis tugas yang ingin dikumpulkan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mata Kuliah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Mata Kuliah
              </label>
              <select
                value={selectedCourseId}
                onChange={e => handleCourseChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.kodeMk} - {course.namaMk} ({course.sks} SKS)
                  </option>
                ))}
              </select>
            </div>

            {/* Penugasan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Jenis Tugas / Penugasan
              </label>
              <select
                value={selectedAssignmentId}
                onChange={e => setSelectedAssignmentId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              >
                {courseAssignments.map(asg => (
                  <option key={asg.id} value={asg.id}>
                    {asg.judul} {asg.isKelompok ? '(Kelompok)' : '(Mandiri)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignment Banner & Deadline Info */}
          {activeAssignment && (
            <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Detail Petunjuk Dosen:
                </span>

                {/* Deadline Badge */}
                {deadlineInfo && (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      deadlineInfo.status === 'open'
                        ? deadlineInfo.isUrgent
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{deadlineInfo.diffText}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      (Batas: {formatDateTimeIndo(activeAssignment.tenggatWaktu)})
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                {activeAssignment.deskripsi}
              </p>

              {activeAssignment.petunjukKhusus && (
                <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/80 text-xs text-amber-900">
                  <strong className="font-semibold block mb-0.5">Petunjuk Teknis / Format:</strong>
                  {activeAssignment.petunjukKhusus}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500 border-t border-slate-200/60">
                <span>
                  Tipe: <strong className="text-slate-700">{activeAssignment.isKelompok ? 'Tugas Kelompok' : 'Tugas Mandiri'}</strong>
                </span>
                <span>
                  Format Diizinkan: <strong className="text-slate-700">{activeAssignment.formatAllowed.join(', ')}</strong>
                </span>
                <span>
                  Batas Ukuran: <strong className="text-slate-700">Maks. {activeAssignment.maxFileSizeMb} MB</strong>
                </span>
                {activeAssignment.driveFolderId && (
                  <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                    <FolderSync className="w-3.5 h-3.5" />
                    Folder Drive: {activeAssignment.driveFolderId}
                  </span>
                )}
              </div>

              {/* Locked Warning Alert */}
              {isLocked && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2.5 text-xs font-semibold">
                  <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    PENGUMPULAN DITUTUP: Waktu pengumpulan untuk tugas ini telah berakhir. Sistem secara otomatis menolak berkas baru sesuai instruksi Dosen.
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Step 2: Identitas Mahasiswa & Anggota Kelompok */}
        <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200/90 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">
                  Data Mahasiswa & Anggota Kelompok
                </h2>
                <p className="text-xs text-slate-500">
                  Masukkan identitas Anda dan tambahkan nama anggota lain jika tugas kelompok
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddMember}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Anggota</span>
            </button>
          </div>

          {/* Primary Submitter (Ketua / Pengirim) */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                Pengirim Utama (Ketua / PIC Kelompok)
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Wajib Diisi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Mahasiswa *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Fauzi Harahap"
                  value={namaPengirim}
                  onChange={e => setNamaPengirim(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIM (Nomor Induk Mahasiswa) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 210101001"
                  value={nimPengirim}
                  onChange={e => setNimPengirim(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelas Perkuliahan *
                </label>
                {activeCourse && activeCourse.kelas.length > 0 ? (
                  <select
                    value={kelas || activeCourse.kelas[0]}
                    onChange={e => setKelas(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500"
                  >
                    {activeCourse.kelas.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: MPI-III Pagi A"
                    value={kelas}
                    onChange={e => setKelas(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Mahasiswa (Wajib untuk Tanda Terima Gmail) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="nama.mahasiswa@gmail.com"
                    value={emailPengirim}
                    onChange={e => setEmailPengirim(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500 font-medium"
                    required
                  />
                </div>
                <span className="text-[10px] text-teal-700 block mt-0.5">
                  Bukti resmi penyerahan tugas akan dikirimkan otomatis ke alamat ini.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. WhatsApp (Opsional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={noHpPengirim}
                    onChange={e => setNoHpPengirim(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Additional Group Members */}
          {anggotaKelompok.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Anggota Kelompok Tambahan ({anggotaKelompok.length} Orang)
              </span>

              {anggotaKelompok.map((member, idx) => (
                <div 
                  key={member.id}
                  className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 2}
                  </span>

                  <input
                    type="text"
                    placeholder={`Nama Anggota ${idx + 2}`}
                    value={member.nama}
                    onChange={e => handleUpdateMember(member.id, 'nama', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500"
                    required
                  />

                  <input
                    type="text"
                    placeholder={`NIM Anggota ${idx + 2}`}
                    value={member.nim}
                    onChange={e => handleUpdateMember(member.id, 'nim', e.target.value)}
                    className="w-full sm:w-44 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono focus:ring-2 focus:ring-teal-500"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Anggota"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Step 3: Detail Berkas & Dokumen */}
        <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200/90 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
              3
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                Detail Karya & Upload Berkas File
              </h2>
              <p className="text-xs text-slate-500">
                Judul tugas dan upload berkas makalah / publikasi jurnal Anda
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Makalah / Artikel Ilmiah / Topik Karya *
              </label>
              <input
                type="text"
                placeholder="Contoh: Analisis Manajemen Mutu Terpadu di Madrasah Aliyah Negeri Medan"
                value={judulKarya}
                onChange={e => setJudulKarya(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ringkasan Abstrak / Catatan untuk Dosen (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan ringkasan 2-3 kalimat atau pesan khusus untuk Bapak Reza Lubis..."
                  value={abstrakRingkas}
                  onChange={e => setAbstrakRingkas(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tautan Lampiran / Google Drive Tambahan (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Jika ada file pendukung berukuran besar, link Canva, atau jurnal OJS..."
                  value={linkTambahan}
                  onChange={e => setLinkTambahan(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Unggah Berkas Tugas *
              </label>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50/50'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-teal-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={e => handleFileChange(e.target.files ? e.target.files[0] : null)}
                  accept={activeAssignment?.formatAllowed.join(',') || '.pdf,.docx,.zip'}
                />

                {!selectedFile ? (
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Klik untuk memilih file <span className="text-slate-500 font-normal">atau seret file ke sini</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Format: {activeAssignment?.formatAllowed.join(', ') || '.pdf, .docx, .zip'} (Maksimal {activeAssignment?.maxFileSizeMb || 20} MB)
                    </p>
                  </label>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-sm text-slate-900 truncate max-w-xs sm:max-w-md">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Terpilih & Siap Dikirim
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="file-upload"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                      >
                        Ganti File
                      </label>
                      <button
                        type="button"
                        onClick={() => handleFileChange(null)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sync Status Banner */}
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${
          settings.googleAppsScriptWebhookUrl && settings.googleAppsScriptWebhookUrl.trim().length > 10
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            {settings.googleAppsScriptWebhookUrl && settings.googleAppsScriptWebhookUrl.trim().length > 10 ? (
              <>
                <FolderSync className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Sinkronisasi Cloud Aktif: Berkas Anda otomatis diunggah ke Google Drive Dosen & tanda terima dikirim ke Gmail Anda.</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Penyimpanan Lokal Aktif: Berkas Anda tersimpan di server portal. (Google Drive Dosen sedang menunggu aktivasi Webhook).</span>
              </>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-500 shrink-0">
            Dosen: {settings.namaDosen}, {settings.gelar}
          </span>
        </div>

        {/* Submit Actions Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span className="font-semibold text-slate-700">Catatan Keamanan:</span> Sistem merekam tanggal dan waktu kirim secara presisi (WIB) sebagai bukti akademik yang sah.
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLocked}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              isLocked
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-teal-700 to-indigo-800 hover:from-teal-800 hover:to-indigo-900 text-white hover:scale-[1.01] active:scale-[0.99] shadow-teal-700/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mengunggah & Menyinkronkan ke GDrive...</span>
              </>
            ) : isLocked ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Pengumpulan Tugas Ditutup</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Tugas & Dapatkan Slip Tanda Terima</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
