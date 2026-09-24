import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import NoteEditorPage from './pages/NoteEditorPage';
import NotesListPage from './pages/NotesListPage';
import CalendarPage from './pages/CalendarPage';
import SearchPage from './pages/SearchPage';
import StatisticsPage from './pages/StatisticsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ErrorBoundary from './components/layout/ErrorBoundary';

export default function App() {
  const { user, loading } = useAuth();

  // Navigation state
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'register' | 'forgot-password'
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [initialNoteDate, setInitialNoteDate] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1329] text-slate-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-medium">Memuat DailyNote...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated
  if (!user) {
    if (authPage === 'register') {
      return <RegisterPage onNavigate={setAuthPage} />;
    }
    if (authPage === 'forgot-password') {
      return <ForgotPasswordPage onNavigate={setAuthPage} />;
    }
    return <LoginPage onNavigate={setAuthPage} />;
  }

  // Navigation handlers
  const handleNavigate = (tab, params = {}) => {
    if (tab === 'new-note') {
      setEditingNoteId(null);
      setInitialNoteDate(params.date || new Date().toISOString().split('T')[0]);
      setCurrentTab('new-note');
      return;
    }
    setCurrentTab(tab);
  };

  const handleOpenNote = (note) => {
    setEditingNoteId(note.id);
    setInitialNoteDate(note.note_date);
    setCurrentTab('edit-note');
  };

  // Render current tab content
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenNote={handleOpenNote}
          />
        );

      case 'new-note':
      case 'edit-note':
        return (
          <NoteEditorPage
            noteId={editingNoteId}
            initialDate={initialNoteDate}
            onBack={() => setCurrentTab('dashboard')}
            onSaveSuccess={(savedNote) => {
              if (!editingNoteId && savedNote?.id) {
                setEditingNoteId(savedNote.id);
              }
            }}
          />
        );

      case 'notes':
        return (
          <NotesListPage
            initialTab="all"
            onNavigate={handleNavigate}
            onOpenNote={handleOpenNote}
          />
        );

      case 'favorites':
        return (
          <NotesListPage
            initialTab="favorites"
            onNavigate={handleNavigate}
            onOpenNote={handleOpenNote}
          />
        );

      case 'archive':
        return (
          <NotesListPage
            initialTab="archive"
            onNavigate={handleNavigate}
            onOpenNote={handleOpenNote}
          />
        );

      case 'trash':
        return (
          <NotesListPage
            initialTab="trash"
            onNavigate={handleNavigate}
            onOpenNote={handleOpenNote}
          />
        );

      case 'calendar':
        return (
          <CalendarPage
            onNavigate={handleNavigate}
            onOpenNote={handleOpenNote}
          />
        );

      case 'search':
        return (
          <SearchPage
            onOpenNote={handleOpenNote}
          />
        );

      case 'statistics':
        return <StatisticsPage />;

      case 'profile':
        return <ProfilePage />;

      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} onBack={() => handleNavigate('dashboard')} />;

      default:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenNote={handleOpenNote}
          />
        );
    }
  };

  return (
    <AppLayout activeTab={currentTab} onNavigate={handleNavigate}>
      <ErrorBoundary onReset={() => setCurrentTab('dashboard')}>
        {renderContent()}
      </ErrorBoundary>
    </AppLayout>
  );
}

