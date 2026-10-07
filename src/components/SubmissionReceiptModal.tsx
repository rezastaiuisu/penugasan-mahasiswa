import React, { useRef } from 'react';
import { 
  CheckCircle2, 
  Printer, 
  Copy, 
  X, 
  FileText, 
  Users, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  Check
} from 'lucide-react';
import { Submission, Assignment, Course, LecturerSettings } from '../types';
import { formatDateTimeIndo, formatFileSize } from '../utils/formatters';
import { QRCodeBadge } from './QRCodeBadge';

interface SubmissionReceiptModalProps {
  submission: Submission;
  assignment?: Assignment;
  course?: Course;
  settings: LecturerSettings;
  onClose: () => void;
  onGoToValidate?: (nim: string) => void;
}

export const SubmissionReceiptModal: React.FC<SubmissionReceiptModalProps> = ({
  submission,
  assignment,
  course,
  settings,
  onClose,
  onGoToValidate,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(submission.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Controls Bar */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Bukti Tanda Terima Resmi Penyerahan Tugas</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="p-6 sm:p-8 bg-white print:p-0 print:m-0 text-slate-800">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-teal-700">
                  {settings.kampus}
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight mt-0.5">
                  Tanda Terima Penyerahan Tugas
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Dosen Pengampu: <strong className="text-slate-800">{settings.namaDosen}, {settings.gelar}</strong> (NIP: {settings.nip})
                </p>
              </div>

              {/* QR Stamp */}
              <div className="text-center shrink-0">
                <QRCodeBadge value={submission.id} size={84} />
                <p className="text-[10px] font-mono font-bold text-slate-500 mt-1 uppercase">
                  VERIFIED STAMP
                </p>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-medium">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                STATUS: TUGAS DITERIMA SISTEM ELEKTRONIK
              </span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-slate-700">ID: {submission.id}</span>
                <button
                  onClick={handleCopyId}
                  className="p-1 hover:bg-emerald-100 rounded text-slate-600 print:hidden cursor-pointer"
                  title="Salin ID Registrasi"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4 text-sm">
            {/* Mata Kuliah & Tugas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Mata Kuliah
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {course ? `${course.kodeMk} - ${course.namaMk}` : 'Manajemen Pendidikan Islam'}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Kelas: <strong className="text-slate-700">{submission.kelas}</strong> ({submission.semesterTahun})
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Penugasan
                </span>
                <span className="font-semibold text-slate-900 text-sm">
                  {assignment ? assignment.judul : submission.judulKarya}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Versi Pengiriman: <strong>v{submission.versi}</strong>
                </span>
              </div>
            </div>

            {/* Judul Karya */}
            <div className="border border-slate-200 rounded-xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Judul Karya / Topik Tugas
              </span>
              <p className="font-bold text-slate-900 text-base mt-0.5 leading-snug">
                "{submission.judulKarya}"
              </p>
              {submission.abstrakRingkas && (
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                  Abstrak/Catatan: {submission.abstrakRingkas}
                </p>
              )}
            </div>

            {/* Pengirim & Anggota Kelompok */}
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-600" />
                  Daftar Anggota / Penulis ({submission.anggotaKelompok.length} Mahasiswa)
                </span>
                <span className="text-[11px] text-slate-500">
                  Pengirim: <strong>{submission.namaPengirim}</strong> ({submission.nimPengirim})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {submission.anggotaKelompok.map((m, idx) => (
                  <div 
                    key={m.id || idx}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs border border-slate-100"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{idx + 1}. {m.nama}</span>
                      <span className="text-slate-500 block text-[11px]">NIM: {m.nim}</span>
                    </div>
                    {m.peran && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        m.peran === 'Ketua' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {m.peran}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dokumen & Waktu Presisi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-indigo-600" />
                  File Berkas Terunggah
                </span>
                <p className="font-semibold text-slate-800 text-xs truncate" title={submission.file.name}>
                  {submission.file.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ukuran: {formatFileSize(submission.file.size)} • Format: {submission.file.name.split('.').pop()?.toUpperCase()}
                </p>
                {submission.file.driveFileUrl ? (
                  <p className="text-[11px] text-teal-600 mt-1 flex items-center gap-1 font-medium">
                    <ExternalLink className="w-3 h-3" />
                    Tersinkron ke Google Drive Dosen
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                    Tersimpan di Sistem Portal Akademik
                  </p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Waktu & Tanggal Masuk
                </span>
                <p className="font-bold text-slate-900 text-xs">
                  {formatDateTimeIndo(submission.waktuKirim)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {submission.isLate ? (
                    <span className="text-rose-600 font-semibold">Tercatat Lewat Batas Waktu</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">Tepat Waktu (Sebelum Deadline)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Electronic Signature Note */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              <p className="font-medium text-slate-700">
                Dokumen ini sah dan diterbitkan secara digital oleh Sistem Penugasan Dosen {settings.namaDosen}, {settings.gelar}.
              </p>
              <p>Simpan slip tanda terima ini sebagai bukti sah pengumpulan tugas Anda.</p>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-400">
              HASH: {submission.id}-{new Date(submission.waktuKirim).getTime().toString(36).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          {onGoToValidate ? (
            <button
              onClick={() => {
                onClose();
                onGoToValidate(submission.nimPengirim);
              }}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Periksa Status Validasi Mandiri dengan NIM ({submission.nimPengirim}) &rarr;</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-colors shadow-xs"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
