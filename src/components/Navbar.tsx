import React from 'react';
import {
  Calendar,
  User,
  ShieldCheck,
  LogOut,
  Download,
  Sparkles,
  RefreshCw,
  FileCode,
  ClipboardPaste,
} from 'lucide-react';
import { BakalariUser } from '../types/bakalari';

interface NavbarProps {
  activeTab: 'week' | 'day' | 'changes';
  setActiveTab: (tab: 'week' | 'day' | 'changes') => void;
  onOpenExport: () => void;
  onOpenLogin: () => void;
  onDownloadHtml: () => void;
  onOpenHtmlImport?: () => void;
  isDemo: boolean;
  currentUser: BakalariUser | null;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  changesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenExport,
  onOpenLogin,
  onDownloadHtml,
  onOpenHtmlImport,
  isDemo,
  currentUser,
  onLogout,
  onRefresh,
  isRefreshing,
  changesCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="#" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-blue-700 transition-colors">
                M
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                SPŠD Motol · Rozvrh
              </span>
            </a>
          </div>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('week')}
              className={`hover:text-blue-600 transition-colors cursor-pointer py-1 ${
                activeTab === 'week' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
              }`}
            >
              Týdenní rozvrh
            </button>

            <button
              onClick={() => setActiveTab('day')}
              className={`hover:text-blue-600 transition-colors cursor-pointer py-1 ${
                activeTab === 'day' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
              }`}
            >
              Dnešní agenda
            </button>

            <button
              onClick={() => setActiveTab('changes')}
              className={`hover:text-blue-600 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
                activeTab === 'changes' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
              }`}
            >
              <span>Suplování</span>
              {changesCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded-full tabular-nums">
                  {changesCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync button for authenticated user */}
            {!isDemo && currentUser && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Synchronizovat s mot-spsd.bakalari.cz"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}

            {onOpenHtmlImport && (
              <button
                onClick={onOpenHtmlImport}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                title="Vložit HTML zdrojový kód z mot-spsd.bakalari.cz/Timetable"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Vložit HTML</span>
              </button>
            )}

            <button
              onClick={onDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              title="Stáhnout celou aplikaci jako jeden samostatný HTML soubor"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-600" />
              <span>V jednom HTML</span>
            </button>

            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              title="Exportovat rozvrh do iCal / Google Kalendáře"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export kalendáře</span>
            </button>

            {isDemo ? (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Přihlásit účet</span>
              </button>
            ) : currentUser ? (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                <button
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
                  title="Kliknutím změníte účet"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="max-w-[130px] truncate font-semibold">
                    {currentUser.FullName}
                    {currentUser.Class?.Abbrev ? ` (${currentUser.Class.Abbrev})` : ''}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Odhlásit z Bakalářů"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Přihlásit se</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('week')}
            className={`py-1 px-2 ${activeTab === 'week' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''}`}
          >
            Týdenní rozvrh
          </button>
          <button
            onClick={() => setActiveTab('day')}
            className={`py-1 px-2 ${activeTab === 'day' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''}`}
          >
            Dnes
          </button>
          <button
            onClick={() => setActiveTab('changes')}
            className={`py-1 px-2 flex items-center gap-1 ${activeTab === 'changes' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''}`}
          >
            <span>Suplování</span>
            {changesCount > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded-full tabular-nums">
                {changesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
