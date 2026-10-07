import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  AlertCircle, 
  Send, 
  History, 
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Submission, Assignment, LecturerSettings } from '../types';
import { formatFileSize, getDeadlineStatus } from '../utils/formatters';
import { storage } from '../services/storage';

interface RevisionModalProps {
  submission: Submission;
  assignment?: Assignment;
  settings: LecturerSettings;
  onClose: () => void;
  onRevisionSuccess: (updated: Submission) => void;
}

export const RevisionModal: React.FC<RevisionModalProps> = ({
  submission,
  assignment,
  onClose,
  onRevisionSuccess,
}) => {
  const [catatanRevisi, setCatatanRevisi] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if deadline is still open or revision is specifically requested by lecturer
  const isDeadlineOpen = assignment
    ? getDeadlineStatus(assignment.waktuMulai, assignment.tenggatWaktu).status === 'open'
    : false;

  const isLecturerRequested = submission.status === 'perlu_revisi';

  const canSubmitRevision = isDeadlineOpen || isLecturerRequested;

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setFileBase64('');
      return;
    }

    if (assignment) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAllowed = assignment.formatAllowed.some(f => f.toLowerCase() === ext);
      if (!isAllowed) {
        setErrorMsg(`Format tidak didukung. Gunakan format: ${assignment.formatAllowed.join(', ')}`);
        return;
      }

      if (file.size > assignment.maxFileSizeMb * 1024 * 1024) {
        setErrorMsg(`Ukuran file melebihi batas ${assignment.maxFileSizeMb} MB.`);
        return;
      }
    }

    setErrorMsg(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setFileBase64(res.split(',')[1] || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Pilih file revisi yang ingin diunggah.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newVersion = submission.versi + 1;
      const nowIso = new Date().toISOString();

      const newHistoryItem = {
        version: newVersion,
        timestamp: nowIso,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        catatanMahasiswa: catatanRevisi.trim() || 'Perbaikan berkas tugas',
      };

      const updated: Submission = {
        ...submission,
        versi: newVersion,
        file: {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          lastModified: selectedFile.lastModified,
          base64Data: fileBase64,
        },
        waktuKirim: nowIso,
        status: 'menunggu_review', // reset to pending review
        riwayatRevisi: [...submission.riwayatRevisi, newHistoryItem],
      };

      storage.updateSubmission(updated);
      onRevisionSuccess(updated);
      onClose();
    } catch (err) {
      setErrorMsg('Gagal mengirimkan revisi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base">Kirim Revisi Tugas (Versi {submission.versi + 1})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-800 text-sm">
          {/* Context box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tugas yang Direvisi
            </span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">
              "{submission.judulKarya}"
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Pengirim: <strong>{submission.namaPengirim}</strong> ({submission.nimPengirim}) • Kelas: {submission.kelas}
            </p>

            {submission.catatanDosen && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                <strong className="block font-bold text-rose-950 mb-0.5">Catatan Perbaikan dari Dosen Reza Lubis:</strong>
                {submission.catatanDosen}
              </div>
            )}
          </div>

          {!canSubmitRevision && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Peringatan: Batas waktu penugasan ini sudah berakhir, namun Anda masih dapat mengajukan jika Dosen memberikan izin revisi khusus.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Catatan Revisi Mahasiswa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Perubahan / Keterangan Revisi *
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Sudah menambahkan 3 referensi jurnal SINTA dan memperbaiki pembahasan bab 2 sesuai arahan Bapak Dosen..."
              value={catatanRevisi}
              onChange={e => setCatatanRevisi(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Unggah Berkas Baru (File Revisi) *
            </label>

            <input
              type="file"
              id="file-revision"
              className="hidden"
              onChange={e => handleFileChange(e.target.files ? e.target.files[0] : null)}
              accept={assignment?.formatAllowed.join(',') || '.pdf,.docx,.zip'}
            />

            {!selectedFile ? (
              <label
                htmlFor="file-revision"
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-5 text-center cursor-pointer block bg-slate-50 hover:bg-teal-50/30 transition-colors"
              >
                <Upload className="w-8 h-8 text-teal-600 mx-auto mb-1.5" />
                <span className="font-bold text-xs text-slate-700 block">
                  Klik untuk Memilih File Perbaikan Baru
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Format: {assignment?.formatAllowed.join(', ') || '.pdf, .docx'}
                </span>
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleFileChange(null)}
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Berkas Revisi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
