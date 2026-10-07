import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Mail, 
  FileText, 
  Users, 
  Award, 
  Printer, 
  Save, 
  RefreshCw,
  ExternalLink,
  Send
} from 'lucide-react';
import { Submission, Assignment, Course, LecturerSettings, SubmissionStatus } from '../types';
import { formatDateTimeIndo, formatFileSize } from '../utils/formatters';
import { createMailtoLink } from '../services/appsScriptService';

interface AdminReviewModalProps {
  submission: Submission;
  assignment?: Assignment;
  course?: Course;
  settings: LecturerSettings;
  onClose: () => void;
  onSaveReview: (updated: Submission) => void;
  onOpenReceipt: (sub: Submission) => void;
}

export const AdminReviewModal: React.FC<AdminReviewModalProps> = ({
  submission,
  assignment,
  course,
  settings,
  onClose,
  onSaveReview,
  onOpenReceipt,
}) => {
  const [status, setStatus] = useState<SubmissionStatus>(submission.status);
  const [nilai, setNilai] = useState<string>(submission.nilai !== undefined ? String(submission.nilai) : '');
  const [gradeHuruf, setGradeHuruf] = useState<string>(submission.gradeHuruf || '');
  const [catatanDosen, setCatatanDosen] = useState<string>(submission.catatanDosen || '');
  const [bisaRevisi, setBisaRevisi] = useState<boolean>(submission.bisaRevisi);

  // Auto calculate grade letter when score changes
  const handleScoreChange = (val: string) => {
    setNilai(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (num >= 85) setGradeHuruf('A');
      else if (num >= 80) setGradeHuruf('A-');
      else if (num >= 75) setGradeHuruf('B+');
      else if (num >= 70) setGradeHuruf('B');
      else if (num >= 65) setGradeHuruf('B-');
      else if (num >= 60) setGradeHuruf('C+');
      else if (num >= 55) setGradeHuruf('C');
      else setGradeHuruf('D');
    }
  };

  const handleSave = () => {
    const numNilai = nilai !== '' ? parseFloat(nilai) : undefined;
    const updated: Submission = {
      ...submission,
      status,
      nilai: numNilai,
      gradeHuruf: gradeHuruf || undefined,
      catatanDosen: catatanDosen.trim(),
      bisaRevisi: status === 'perlu_revisi' ? true : bisaRevisi,
      tanggalReview: new Date().toISOString(),
    };

    onSaveReview(updated);
    onClose();
  };

  // Gmail mailto link
  const mailtoUrl = createMailtoLink(
    submission.emailPengirim,
    submission.namaPengirim,
    submission.judulKarya,
    status,
    catatanDosen,
    settings
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Evaluasi & Penilaian Tugas Mahasiswa</h3>
            <p className="text-xs text-slate-400">ID Registrasi: {submission.id} • Versi {submission.versi}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-slate-800 text-sm">
          {/* Submission Info Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div>
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                {course ? `${course.kodeMk} - ${course.namaMk}` : 'Mata Kuliah'} ({submission.kelas})
              </span>
              <h4 className="font-bold text-slate-950 text-base mt-0.5">
                "{submission.judulKarya}"
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Pengirim: <strong>{submission.namaPengirim}</strong> ({submission.nimPengirim}) • Email: {submission.emailPengirim}
              </p>
            </div>

            {submission.abstrakRingkas && (
              <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                Ringkasan/Abstrak: {submission.abstrakRingkas}
              </p>
            )}

            {/* Group Members if any */}
            {submission.anggotaKelompok.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Anggota Kelompok ({submission.anggotaKelompok.length} Orang):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {submission.anggotaKelompok.map((m, idx) => (
                    <span key={m.id || idx} className="text-xs bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <strong>{m.nama}</strong> ({m.nim})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* File info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800">{submission.file.name}</span>
                <span className="text-slate-400">({formatFileSize(submission.file.size)})</span>
              </div>

              <div className="flex items-center gap-2">
                {submission.file.base64Data && (
                  <a
                    href={`data:${submission.file.type};base64,${submission.file.base64Data}`}
                    download={submission.file.name}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 underline"
                  >
                    Unduh Berkas
                  </a>
                )}
                {submission.file.driveFileUrl && (
                  <a
                    href={submission.file.driveFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Buka di Google Drive
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Review & Grading Form */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
              <Award className="w-4 h-4 text-teal-600" />
              <span>Status Penilaian & Catatan Dosen</span>
            </h4>

            {/* Status Radio Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tentukan Status Berkas *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'menunggu_review', label: 'Menunggu', color: 'hover:border-amber-400' },
                  { id: 'perlu_revisi', label: 'Perlu Revisi', color: 'hover:border-rose-400' },
                  { id: 'disetujui', label: 'Disetujui', color: 'hover:border-emerald-400' },
                  { id: 'dinilai', label: 'Dinilai', color: 'hover:border-blue-400' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatus(item.id as SubmissionStatus)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      status === item.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : `bg-slate-50 text-slate-700 border-slate-200 ${item.color}`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Score & Grade Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai Angka (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="Contoh: 85"
                  value={nilai}
                  onChange={e => handleScoreChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grade Huruf (A / B+ / B / C / D)
                </label>
                <input
                  type="text"
                  placeholder="A"
                  value={gradeHuruf}
                  onChange={e => setGradeHuruf(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Lecturer Feedback / Revision Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Evaluasi / Instruksi Revisi untuk Mahasiswa
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan catatan perbaikan jika perlu revisi atau apresiasi hasil kerja tugas..."
                value={catatanDosen}
                onChange={e => setCatatanDosen(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Catatan ini akan langsung terlihat oleh mahasiswa saat mereka memeriksa status dengan NIM.
              </p>
            </div>

            {/* Quick Gmail Notification Button */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-700 shrink-0" />
                <span className="text-indigo-900 font-medium">
                  Kirim Notifikasi Status via Gmail ({settings.emailDosen})
                </span>
              </div>
              <a
                href={mailtoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Buka Gmail</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenReceipt(submission)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Slip Tanda Terima</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Evaluasi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
