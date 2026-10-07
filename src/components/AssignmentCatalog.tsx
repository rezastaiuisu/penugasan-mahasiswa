import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  Users, 
  FileText, 
  Send, 
  Lock, 
  FolderSync,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Assignment, Course } from '../types';
import { getDeadlineStatus, formatDateTimeIndo } from '../utils/formatters';

interface AssignmentCatalogProps {
  assignments: Assignment[];
  courses: Course[];
  onSelectAssignmentForSubmit: (assignmentId: string) => void;
}

export const AssignmentCatalog: React.FC<AssignmentCatalogProps> = ({
  assignments,
  courses,
  onSelectAssignmentForSubmit,
}) => {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');

  const filtered = assignments.filter(asg => {
    if (selectedCourseFilter !== 'all' && asg.courseId !== selectedCourseFilter) {
      return false;
    }
    const deadline = getDeadlineStatus(asg.waktuMulai, asg.tenggatWaktu);
    if (filterStatus === 'open' && deadline.status !== 'open') return false;
    if (filterStatus === 'closed' && deadline.status !== 'closed') return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            PANDUAN & DAFTAR TUGAS KELAS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Daftar Tugas & Jadwal Pengumpulan
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Informasi lengkap seluruh penugasan kuliah, instruksi pengerjaan, ketentuan berkas, dan batas akhir pengumpulan di kelas.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCourseFilter}
            onChange={e => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Semua Mata Kuliah</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.kodeMk} - {c.namaMk}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Semua Status Jadwal</option>
            <option value="open">Sedang Dibuka</option>
            <option value="closed">Tenggat Berakhir</option>
          </select>
        </div>
      </div>

      {/* Grid of Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(asg => {
          const course = courses.find(c => c.id === asg.courseId);
          const deadline = getDeadlineStatus(asg.waktuMulai, asg.tenggatWaktu);
          const isOpen = deadline.status === 'open';

          return (
            <div
              key={asg.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                isOpen ? 'border-slate-200/90 hover:border-teal-400' : 'border-slate-200 bg-slate-50/50 opacity-90'
              }`}
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                    {course ? `${course.kodeMk} • ${course.namaMk}` : 'Mata Kuliah'}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isOpen
                        ? deadline.isUrgent
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{deadline.diffText}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-950 text-base leading-snug">
                  {asg.judul}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {asg.deskripsi}
                </p>

                {/* Meta details */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{asg.isKelompok ? `Kelompok (Maks. ${asg.maxAnggota || 5})` : 'Tugas Mandiri'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Format: {asg.formatAllowed.join(', ')}</span>
                  </div>
                  <div className="col-span-2 text-[11px] text-slate-400">
                    Batas Akhir: <strong>{formatDateTimeIndo(asg.tenggatWaktu)}</strong>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                {isOpen ? (
                  <button
                    onClick={() => onSelectAssignmentForSubmit(asg.id)}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Berkas Tugas Ini</span>
                  </button>
                ) : (
                  <div className="w-full py-2 px-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pengumpulan Ditutup (Melewati Batas Waktu)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
