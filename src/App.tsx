import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentSubmissionForm } from './components/StudentSubmissionForm';
import { StudentValidationPage } from './components/StudentValidationPage';
import { AssignmentCatalog } from './components/AssignmentCatalog';
import { AdminDashboard } from './components/AdminDashboard';
import { SubmissionReceiptModal } from './components/SubmissionReceiptModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { storage } from './services/storage';
import { Course, Assignment, Submission, LecturerSettings } from './types';
import { 
  GraduationCap, 
  ShieldCheck, 
  Clock, 
  FolderSync, 
  Mail, 
  ExternalLink,
  BookOpen,
  Send,
  SearchCheck,
  LayoutDashboard
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'submit' | 'validate' | 'assignments' | 'admin'>('submit');
  
  // App State from persistent storage
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [settings, setSettings] = useState<LecturerSettings>(storage.getSettings());

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return Boolean(
      localStorage.getItem('dosen_auth_token') || sessionStorage.getItem('dosen_auth_token')
    );
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Inter-tab communication
  const [activeReceipt, setActiveReceipt] = useState<{
    submission: Submission;
    assignment: Assignment;
    course: Course;
  } | null>(null);

  const [validateNimTarget, setValidateNimTarget] = useState<string>('');
  const [preselectedAssignmentId, setPreselectedAssignmentId] = useState<string | undefined>();

  const loadData = () => {
    setCourses(storage.getCourses());
    setAssignments(storage.getAssignments());
    setSubmissions(storage.getSubmissions());
    setSettings(storage.getSettings());
  };

  useEffect(() => {
    loadData();
    // Sync global config if on server (cPanel)
    storage.syncGlobalConfig().then(updated => {
      if (updated) {
        setSettings(updated);
      }
    });
  }, []);

  const handleSubmissionSuccess = (
    newSubmission: Submission,
    assignment: Assignment,
    course: Course
  ) => {
    loadData();
    setActiveReceipt({
      submission: newSubmission,
      assignment,
      course,
    });
  };

  const handleGoToValidate = (nim: string) => {
    setValidateNimTarget(nim);
    setActiveTab('validate');
  };

  const handleSelectAssignmentFromCatalog = (assignmentId: string) => {
    setPreselectedAssignmentId(assignmentId);
    setActiveTab('submit');
  };

  const handleAdminNavClick = () => {
    if (!settings.requireLoginForAdmin || isLoggedIn) {
      setActiveTab('admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dosen_auth_token');
    sessionStorage.removeItem('dosen_auth_token');
    setIsLoggedIn(false);
    setActiveTab('submit');
  };

  const handleResetPassword = (newPass: string) => {
    const updated = storage.updateSettings({ adminPassword: newPass });
    setSettings(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-teal-500 selection:text-white overflow-x-hidden w-full max-w-full">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        submissionCount={submissions.length}
        isLoggedIn={isLoggedIn}
        onAdminClick={handleAdminNavClick}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'submit' && (
          <StudentSubmissionForm
            courses={courses}
            assignments={assignments}
            settings={settings}
            onSubmissionSuccess={handleSubmissionSuccess}
            preselectedAssignmentId={preselectedAssignmentId}
          />
        )}

        {activeTab === 'validate' && (
          <StudentValidationPage
            initialNim={validateNimTarget}
            courses={courses}
            assignments={assignments}
            settings={settings}
            onGoToSubmit={() => setActiveTab('submit')}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentCatalog
            assignments={assignments}
            courses={courses}
            onSelectAssignmentForSubmit={handleSelectAssignmentFromCatalog}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            courses={courses}
            assignments={assignments}
            submissions={submissions}
            settings={settings}
            onRefreshData={loadData}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        settings={settings}
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setActiveTab('admin');
        }}
        onResetPassword={handleResetPassword}
      />

      {/* Receipt Modal if a student just submitted */}
      {activeReceipt && (
        <SubmissionReceiptModal
          submission={activeReceipt.submission}
          assignment={activeReceipt.assignment}
          course={activeReceipt.course}
          settings={settings}
          onClose={() => setActiveReceipt(null)}
          onGoToValidate={handleGoToValidate}
        />
      )}

      {/* Footer - Minimalist & Responsive */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-5 border-t border-slate-800 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold shrink-0">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <p className="text-slate-300 font-medium text-xs">
              Portal Kelas Mandiri • Dosen Pengampu: <strong className="text-white">{settings.namaDosen}, {settings.gelar}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
            <button
              onClick={() => setActiveTab('submit')}
              className="hover:text-teal-300 transition-colors cursor-pointer"
            >
              Kirim Tugas
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={() => setActiveTab('validate')}
              className="hover:text-teal-300 transition-colors cursor-pointer"
            >
              Cek Status NIM
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={() => setActiveTab('assignments')}
              className="hover:text-teal-300 transition-colors cursor-pointer"
            >
              Daftar Tugas
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={handleAdminNavClick}
              className="hover:text-teal-300 transition-colors cursor-pointer text-slate-300 font-semibold"
            >
              {isLoggedIn ? 'Area Dosen' : 'Login Dosen'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
