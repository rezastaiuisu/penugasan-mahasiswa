import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { LecturerSettings } from '../types';

interface AdminLoginModalProps {
  settings: LecturerSettings;
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onResetPassword?: (newPass: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  settings,
  isOpen,
  onClose,
  onLoginSuccess,
  onResetPassword,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Recovery PIN mode
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const inputUser = username.trim().toLowerCase();
    const correctUser = (settings.adminUsername || 'rezalubis').toLowerCase();
    const correctEmail = (settings.emailDosen || 'rezastaiuisu@gmail.com').toLowerCase();
    const correctNip = (settings.nip || '').trim();

    const isUserValid =
      inputUser === correctUser ||
      inputUser === correctEmail ||
      (correctNip && inputUser === correctNip);

    const correctPass = settings.adminPassword || 'dosen2026';

    setTimeout(() => {
      setIsLoading(false);
      if (isUserValid && password === correctPass) {
        if (rememberMe) {
          localStorage.setItem('dosen_auth_token', 'logged_in_' + Date.now());
        } else {
          sessionStorage.setItem('dosen_auth_token', 'logged_in_' + Date.now());
        }
        onLoginSuccess();
        onClose();
      } else {
        setErrorMsg('ID / Username atau Password salah. Silakan periksa kembali.');
      }
    }, 350);
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (recoveryPin.trim() === settings.secretAdminPin) {
      if (!newPassword.trim() || newPassword.length < 4) {
        setErrorMsg('Password baru minimal 4 karakter.');
        return;
      }
      if (onResetPassword) {
        onResetPassword(newPassword.trim());
      }
      setRecoverySuccess(true);
      setTimeout(() => {
        setIsRecoveryMode(false);
        setRecoverySuccess(false);
        setPassword(newPassword.trim());
      }, 1500);
    } else {
      setErrorMsg('PIN Darurat tidak sesuai.');
    }
  };

  const handleQuickFill = () => {
    setUsername(settings.adminUsername || 'rezalubis');
    setPassword(settings.adminPassword || 'dosen2026');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-teal-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400 block">
                OTENTIKASI DOSEN
              </span>
              <h3 className="text-lg font-bold text-white leading-tight">
                Portal Admin & Penilaian
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2">
            Area khusus Dosen Pengampu <strong>{settings.namaDosen}, {settings.gelar}</strong> ({settings.kampus}).
          </p>
        </div>

        {/* Demo Fast Autofill Chip */}
        <div className="bg-teal-50/70 border-b border-teal-100 px-6 py-2.5 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Akun Default: <strong>{settings.adminUsername}</strong></span>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            Isi Otomatis
          </button>
        </div>

        {/* Body Content */}
        {!isRecoveryMode ? (
          <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs text-slate-800">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ID / Username / Email Dosen *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="rezalubis atau rezastaiuisu@gmail.com"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 bg-white"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Bisa menggunakan username, email Gmail, atau NIP Bapak.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setIsRecoveryMode(true)}
                  className="text-[11px] text-teal-700 hover:underline font-semibold cursor-pointer"
                >
                  Lupa Password?
                </button>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password admin"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 bg-white font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 absolute right-2.5 top-2 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-600 font-medium">Ingat Saya (Tetap Masuk)</span>
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-teal-700 to-indigo-800 hover:from-teal-800 hover:to-indigo-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-[0.99]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Masuk ke Portal Dosen</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Emergency Recovery Mode */
          <form onSubmit={handleRecovery} className="p-6 space-y-4 text-xs text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span>Pemulihan Password Dosen</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsRecoveryMode(false)}
                className="text-teal-700 font-semibold hover:underline"
              >
                &larr; Kembali ke Login
              </button>
            </div>

            {recoverySuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">Password Berhasil Diperbarui!</p>
                <p className="text-xs text-emerald-700">Mengalihkan kembali ke halaman login...</p>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-medium">{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PIN Darurat Dosen *
                  </label>
                  <input
                    type="password"
                    placeholder="PIN Darurat Default: 123456"
                    value={recoveryPin}
                    onChange={e => setRecoveryPin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-center tracking-widest text-sm focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    PIN rahasia bawaan adalah <code className="font-bold text-teal-700">123456</code> (dapat diubah nanti di Pengaturan).
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password Baru yang Diinginkan *
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik password baru (min. 4 karakter)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    Simpan & Terapkan Password Baru
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
