import React, { useState } from 'react';
import {
  Home,
  BookOpen,
  Calendar as CalendarIcon,
  Search as SearchIcon,
  Star,
  Archive,
  Trash2,
  BarChart2,
  User,
  Settings,
  Plus,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function AppLayout({ activeTab, onNavigate, children }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'notes', label: 'Semua Catatan', icon: BookOpen },
    { id: 'favorites', label: 'Favorit', icon: Star },
    { id: 'calendar', label: 'Kalender', icon: CalendarIcon },
    { id: 'search', label: 'Pencarian', icon: SearchIcon },
    { id: 'statistics', label: 'Statistik & Streak', icon: BarChart2 },
    { id: 'archive', label: 'Arsip', icon: Archive },
    { id: 'trash', label: 'Sampah', icon: Trash2 },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b1329] text-slate-800 dark:text-slate-100">
      {/* DESKTOP & TABLET SIDEBAR */}
      <aside className="hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-md transition-all duration-300 w-20 lg:w-64 z-30 shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-100 dark:border-slate-800/60">
          <button 
            onClick={() => handleNavClick('dashboard')} 
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="hidden lg:block">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                DailyNote
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Personal Daily Journal</p>
            </div>
          </button>
        </div>

        {/* Quick Add Action */}
        <div className="p-3 lg:p-4">
          <button
            onClick={() => handleNavClick('new-note')}
            className="w-full flex items-center justify-center lg:justify-start gap-2.5 px-3 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-sm shadow-sky-500/25 transition-all active:scale-95"
            title="Catatan Baru"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline text-sm">Catatan Baru</span>
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-sky-600 dark:text-sky-400' : ''}`} />
                <span className="hidden lg:inline truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Profile & Settings Section */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 shrink-0 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 shrink-0 text-slate-500" />
            )}
            <span className="hidden lg:inline">{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>

          <button
            onClick={() => handleNavClick('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            title="Profil Pengguna"
          >
            <User className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline truncate">{user?.name || 'Profil'}</span>
          </button>

          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            title="Pengaturan"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline">Pengaturan</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Keluar"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline">Keluar</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOP HEADER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="md:hidden h-14 bg-white/90 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-bold text-base bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
              DailyNote
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Ubah Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Drawer for extra items (Settings, Archive, Trash, Logout) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1 shadow-lg z-30 animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => handleNavClick('notes')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <BookOpen className="w-4 h-4 text-sky-500" /> Semua Catatan
            </button>
            <button
              onClick={() => handleNavClick('favorites')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Star className="w-4 h-4 text-amber-500" /> Catatan Favorit
            </button>
            <button
              onClick={() => handleNavClick('statistics')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <BarChart2 className="w-4 h-4 text-indigo-500" /> Statistik & Streak
            </button>
            <button
              onClick={() => handleNavClick('archive')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Archive className="w-4 h-4 text-slate-500" /> Arsip
            </button>
            <button
              onClick={() => handleNavClick('trash')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Trash2 className="w-4 h-4 text-rose-500" /> Sampah
            </button>
            <button
              onClick={() => handleNavClick('settings')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings className="w-4 h-4 text-slate-500" /> Pengaturan
            </button>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                <LogOut className="w-4 h-4" /> Keluar ({user?.name})
              </button>
            </div>
          </div>
        )}

        {/* MAIN SCROLLABLE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 focus:outline-none">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION (Section 28 PRD: Home | Calendar | + | Search | Profile) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-30">
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`flex flex-col items-center justify-center w-14 py-1 text-xs font-medium ${
              activeTab === 'dashboard'
                ? 'text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleNavClick('calendar')}
            className={`flex flex-col items-center justify-center w-14 py-1 text-xs font-medium ${
              activeTab === 'calendar'
                ? 'text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <CalendarIcon className="w-5 h-5 mb-0.5" />
            <span>Calendar</span>
          </button>

          {/* Center "+" Quick Add button */}
          <button
            onClick={() => handleNavClick('new-note')}
            className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-transform"
            aria-label="Catatan Baru"
          >
            <Plus className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleNavClick('search')}
            className={`flex flex-col items-center justify-center w-14 py-1 text-xs font-medium ${
              activeTab === 'search'
                ? 'text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <SearchIcon className="w-5 h-5 mb-0.5" />
            <span>Search</span>
          </button>

          <button
            onClick={() => handleNavClick('profile')}
            className={`flex flex-col items-center justify-center w-14 py-1 text-xs font-medium ${
              activeTab === 'profile'
                ? 'text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

