import React, { useState, useEffect } from 'react';
import { 
  Search, 
  SearchCheck, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Printer, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert,
  Award,
  History,
  Info
} from 'lucide-react';
import { Submission, Course, Assignment, LecturerSettings } from '../types';
import { storage } from '../services/storage';
import { formatDateTimeIndo, formatFileSize, getStatusBadge, getDeadlineStatus } from '../utils/formatters';
import { SubmissionReceiptModal } from './SubmissionReceiptModal';
import { RevisionModal } from './RevisionModal';

interface StudentValidationPageProps {
  initialNim?: string;
  courses: Course[];
  assignments: Assignment[];
  settings: LecturerSettings;
  onGoToSubmit: () => void;
}

export const StudentValidationPage: React.FC<StudentValidationPageProps> = ({
  initialNim = '',
  courses,
  assignments,
  settings,
  onGoToSubmit,
}) => {
  const [searchNim, setSearchNim] = useState(initialNim);
  const [hasSearched, setHasSearched] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentName, setStudentName] = useState<string | null>(null);

  // Modals state
  const [activeReceiptSubmission, setActiveReceiptSubmission] = useState<Submission | null>(null);
  const [activeRevisionSubmission, setActiveRevisionSubmission] = useState<Submission | null>(null);

  // Auto perform search if initialNim provided
  useEffect(() => {
    if (initialNim) {
      setSearchNim(initialNim);
      handleSearch(initialNim);
    }
  }, [initialNim]);

  const handleSearch = (nimToSearch?: string) => {
    const nim = (nimToSearch ?? searchNim).trim();
    if (!nim) return;

    const result = storage.getSubmissionsByNIM(nim);
    setSubmissions(result.submissions);
    setStudentName(result.matchingMemberName || null);
    setHasSearched(true);
  };

  const handleRevisionSuccess = (updated: Submission) => {
    // refresh list
    handleSearch();
  };

  const getCourseForSubmission = (sub: Submission) => {
    return courses.find(c => c.id === sub.courseId);
  };

  const getAssignmentForSubmission = (sub: Submission) => {
    return assignments.find(a => a.id === sub.assignmentId);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold mb-2">
          <SearchCheck className="w-3.5 h-3.5 text-indigo-600" />
          VALIDASI & REKAP TUGAS KELAS MANDIRI
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Cek & Validasi Tugas Perkuliahan
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Masukkan NIM Anda untuk melihat seluruh riwayat tugas yang telah dikumpulkan, status verifikasi berkas, catatan evaluasi dari Dosen <strong>{settings.namaDosen}, {settings.gelar}</strong>, dan pengajuan revisi tugas.
        </p>
      </div>

      {/* NIM Search Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 mb-8">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Masukkan Nomor Induk Mahasiswa (NIM)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Ketik NIM Anda (contoh: 210101001)"
              value={searchNim}
              onChange={e => setSearchNim(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 font-mono text-base font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <SearchCheck className="w-4 h-4" />
            <span>Periksa Validasi</span>
          </button>
        </div>

        {/* Quick Demo Chips */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Coba NIM Sampel:</span>
          {[
            { nim: '210101001', name: 'Ahmad Fauzi (Disetujui/Nilai A)' },
            { nim: '210101015', name: 'Muhammad Zikri (Perlu Revisi)' },
            { nim: '210102008', name: 'Putri Rahmadani (Menunggu Review)' },
          ].map(item => (
            <button
              key={item.nim}
              onClick={() => {
                setSearchNim(item.nim);
                handleSearch(item.nim);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono text-[11px] transition-colors cursor-pointer"
            >
              {item.nim} <span className="font-sans text-slate-500">({item.name})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Area */}
      {hasSearched && (
        <div className="space-y-6">
          {submissions.length > 0 ? (
            <>
              {/* Student Identity Card */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-teal-300 uppercase tracking-widest block">
                      MAHASISWA TERVERIFIKASI
                    </span>
                    <h2 className="text-xl font-bold tracking-tight">
                      {studentName || 'Mahasiswa Terdaftar'}
                    </h2>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      NIM: {searchNim} • STAI UISU Medan
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 text-center sm:text-right">
                  <span className="text-[10px] text-slate-300 uppercase font-bold block">
                    TOTAL TUGAS TERKIRIM
                  </span>
                  <span className="text-2xl font-black text-white">
                    {submissions.length} Tugas
                  </span>
                </div>
              </div>

              {/* Submissions List */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Daftar Riwayat Penyerahan Tugas</span>
                </h3>

                {submissions.map(sub => {
                  const course = getCourseForSubmission(sub);
                  const asg = getAssignmentForSubmission(sub);
                  const statusBadge = getStatusBadge(sub.status);

                  // Check if revision is allowed:
                  const isDeadlineStillOpen = asg
                    ? getDeadlineStatus(asg.waktuMulai, asg.tenggatWaktu).status === 'open'
                    : false;

                  const canRevise = sub.status === 'perlu_revisi' || (isDeadlineStillOpen && sub.bisaRevisi);

                  return (
                    <div
                      key={sub.id}
                      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-4"
                    >
                      {/* Top Bar with Registration ID & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-800">
                            ID: {sub.id}
                          </span>
                          <span className="text-xs text-slate-500">
                            Versi: <strong>v{sub.versi}</strong>
                          </span>
                        </div>

                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </div>
                      </div>

                      {/* Title & Info */}
                      <div>
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                          {course ? `${course.kodeMk} - ${course.namaMk}` : 'Mata Kuliah'}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                          "{sub.judulKarya}"
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Penugasan: <strong className="text-slate-700">{asg?.judul || '-'}</strong> • Kelas: {sub.kelas}
                        </p>
                      </div>

                      {/* Lecturer Grade / Feedback Card */}
                      {sub.nilai !== undefined && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-emerald-600" />
                              Penilaian Dosen Reza Lubis
                            </span>
                            {sub.catatanDosen && (
                              <p className="text-xs text-emerald-950 mt-1 leading-relaxed">
                                "{sub.catatanDosen}"
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0 bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shadow-xs">
                            <span className="text-2xl font-black text-emerald-700">
                              {sub.nilai}
                            </span>
                            {sub.gradeHuruf && (
                              <span className="text-xs font-bold text-slate-500 block">
                                Grade: {sub.gradeHuruf}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Revision Requested Notice */}
                      {sub.status === 'perlu_revisi' && sub.catatanDosen && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-1">
                          <strong className="font-bold flex items-center gap-1.5 text-rose-950 text-sm">
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            Instruksi Revisi dari Dosen Reza Lubis:
                          </strong>
                          <p className="leading-relaxed bg-white p-3 rounded-lg border border-rose-100 text-slate-800 font-medium">
                            {sub.catatanDosen}
                          </p>
                        </div>
                      )}

                      {/* Submission Meta Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[11px] font-semibold">
                            WAKTU PENERIMAAN RESMI
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatDateTimeIndo(sub.waktuKirim)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px] font-semibold">
                            BERKAS TERCATAT
                          </span>
                          <span className="font-semibold text-slate-800 truncate block" title={sub.file.name}>
                            {sub.file.name} ({formatFileSize(sub.file.size)})
                          </span>
                        </div>
                      </div>

                      {/* Group members preview if any */}
                      {sub.anggotaKelompok.length > 1 && (
                        <div className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-700 block mb-1">
                            Anggota Kelompok ({sub.anggotaKelompok.length} Orang):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {sub.anggotaKelompok.map((m, idx) => (
                              <span key={m.id || idx} className="bg-white px-2 py-1 rounded border border-slate-200 text-[11px]">
                                {m.nama} ({m.nim}) {m.peran === 'Ketua' && '👑'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                        <button
                          onClick={() => setActiveReceiptSubmission(sub)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Lihat / Cetak Slip Tanda Terima</span>
                        </button>

                        {canRevise ? (
                          <button
                            onClick={() => setActiveRevisionSubmission(sub)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Kirim Berkas Revisi Sekarang</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Revisi ditutup (Sesuai status & deadline)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200 max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Tidak Ditemukan Berkas untuk NIM "{searchNim}"
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Belum ada catatan pengumpulan tugas atas NIM tersebut di database. 
                  Pastikan digit NIM benar atau kirimkan tugas baru melalui formulir pengumpulan.
                </p>
              </div>
              <button
                onClick={onGoToSubmit}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <span>Buka Formulir Pengiriman Tugas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Digital Receipt Modal */}
      {activeReceiptSubmission && (
        <SubmissionReceiptModal
          submission={activeReceiptSubmission}
          assignment={getAssignmentForSubmission(activeReceiptSubmission)}
          course={getCourseForSubmission(activeReceiptSubmission)}
          settings={settings}
          onClose={() => setActiveReceiptSubmission(null)}
        />
      )}

      {/* Revision Modal */}
      {activeRevisionSubmission && (
        <RevisionModal
          submission={activeRevisionSubmission}
          assignment={getAssignmentForSubmission(activeRevisionSubmission)}
          settings={settings}
          onClose={() => setActiveRevisionSubmission(null)}
          onRevisionSuccess={handleRevisionSuccess}
        />
      )}
    </div>
  );
};
