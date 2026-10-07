import React, { useState } from 'react';
import { 
  GraduationCap, 
  Send, 
  SearchCheck, 
  LayoutDashboard, 
  BookOpen, 
  CalendarClock,
  Lock,
  Menu,
  X,
  ChevronRight,
  UserCheck,
  FolderSync
} from 'lucide-react';
import { LecturerSettings } from '../types';

interface NavbarProps {
  activeTab: 'submit' | 'validate' | 'assignments' | 'admin';
  setActiveTab: (tab: 'submit' | 'validate' | 'assignments' | 'admin') => void;
  settings: LecturerSettings;
  submissionCount: number;
  isLoggedIn: boolean;
  onAdminClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  submissionCount,
  isLoggedIn,
  onAdminClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNav = (tab: 'submit' | 'validate' | 'assignments') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleMobileAdmin = () => {
    setIsMobileMenuOpen(false);
    onAdminClick();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner - Independent Classroom Workspace Identity */}
      <div className="bg-slate-900 text-slate-200 text-xs px-4 py-1.5 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-semibold text-[10px] tracking-wide shrink-0 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              PORTAL KELAS MANDIRI
            </span>
            <span className="text-slate-300 text-[11px] truncate">
              Administrasi Perkuliahan: <strong className="text-white font-medium">{settings.namaDosen}, {settings.gelar}</strong>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
            <span className="inline-flex items-center gap-1 text-slate-300">
              <CalendarClock className="w-3.5 h-3.5 text-teal-400" />
              Semester Perkuliahan 2026/2027
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-teal-300 font-mono text-[11px]">
              {settings.emailDosen}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div 
            onClick={() => handleMobileNav('submit')}
            className="flex items-center gap-3 cursor-pointer group select-none min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-indigo-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Kelas<span className="text-teal-600">Mandiri</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  Ruang Dosen
                </span>
              </div>
              <p className="text-xs text-slate-500 -mt-0.5 hidden sm:block truncate">
                Portal Tugas & Administrasi Kelas {settings.namaDosen}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'submit'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Send className="w-4 h-4 text-teal-600" />
              <span>Kirim Tugas</span>
            </button>

            <button
              onClick={() => setActiveTab('validate')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'validate'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <SearchCheck className="w-4 h-4 text-indigo-600" />
              <span>Cek Status NIM</span>
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'assignments'
                  ? 'bg-slate-100 text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Daftar Tugas</span>
            </button>

            {/* Separator */}
            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Admin Switch */}
            <button
              onClick={onAdminClick}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={isLoggedIn ? 'Panel Dosen (Aktif)' : 'Login Dosen Pengampu'}
            >
              {isLoggedIn ? (
                <LayoutDashboard className="w-4 h-4 text-teal-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Area Dosen</span>
              {submissionCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-teal-500 text-white">
                  {submissionCount}
                </span>
              )}
            </button>
          </nav>

          {/* Mobile Right Controls: Quick Admin Action & Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onAdminClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={isLoggedIn ? 'Panel Dosen' : 'Login Dosen'}
            >
              {isLoggedIn ? (
                <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Dosen</span>
              {submissionCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-teal-500 text-white text-[10px]">
                  {submissionCount}
                </span>
              )}
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-800" />
              ) : (
                <Menu className="w-6 h-6 text-slate-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 space-y-1.5">
            <button
              onClick={() => handleMobileNav('submit')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'submit'
                  ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold'
                  : 'text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  activeTab === 'submit' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Kirim Tugas Mahasiswa</div>
                  <div className="text-xs text-slate-500">Unggah berkas tugas & dapatkan slip tanda terima</div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'submit' ? 'text-teal-600' : 'text-slate-400'}`} />
            </button>

            <button
              onClick={() => handleMobileNav('validate')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'validate'
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold'
                  : 'text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  activeTab === 'validate' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <SearchCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Cek Status & Validasi NIM</div>
                  <div className="text-xs text-slate-500">Periksa riwayat berkas, status nilai & evaluasi</div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'validate' ? 'text-indigo-600' : 'text-slate-400'}`} />
            </button>

            <button
              onClick={() => handleMobileNav('assignments')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'assignments'
                  ? 'bg-slate-100 text-slate-900 border border-slate-300 font-bold'
                  : 'text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  activeTab === 'assignments' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Daftar Tugas Kelas</div>
                  <div className="text-xs text-slate-500">Jadwal pengumpulan, tenggat waktu & instruksi</div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'assignments' ? 'text-slate-900' : 'text-slate-400'}`} />
            </button>

            <div className="pt-2 border-t border-slate-100 mt-2">
              <button
                onClick={handleMobileAdmin}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    activeTab === 'admin' ? 'bg-teal-500 text-white' : 'bg-white text-slate-700 shadow-2xs'
                  }`}>
                    {isLoggedIn ? (
                      <LayoutDashboard className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>Area Dosen Pengampu</span>
                      {submissionCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-teal-500 text-white text-[10px]">
                          {submissionCount} data
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${activeTab === 'admin' ? 'text-slate-300' : 'text-slate-500'}`}>
                      {isLoggedIn ? 'Sesi Dosen Aktif • Buka Dashboard' : 'Login khusus pengampu kelas'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Mobile Info Footer inside Menu */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700">{settings.namaDosen}, {settings.gelar}</span>
              <p className="text-[11px] text-slate-400">{settings.emailDosen}</p>
            </div>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
              Kelas Mandiri
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
