import React, { useState, useEffect, useCallback } from 'react';
import {
  BakalariUser,
  NormalizedLesson,
  TimetableWeekData,
} from './types/bakalari';
import { BakalariService } from './services/bakalariService';
import { REAL_STUDENT_USER } from './data/realSpsdData';
import { Navbar } from './components/Navbar';
import { CurrentLessonBanner } from './components/CurrentLessonBanner';
import { TimetableControls } from './components/TimetableControls';
import { TimetableMatrix } from './components/TimetableMatrix';
import { DayScheduleView } from './components/DayScheduleView';
import { ChangesView } from './components/ChangesView';
import { ExportModal } from './components/ExportModal';
import { LoginModal } from './components/LoginModal';
import { LessonDetailModal } from './components/LessonDetailModal';
import { LoginScreen } from './components/LoginScreen';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { HtmlImportModal } from './components/HtmlImportModal';
import { generateStandaloneHtml } from './services/standaloneHtmlGenerator';
import {
  RotateCcw,
  AlertTriangle,
  Loader2,
  Calendar,
  School,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Terminal,
  FileCode,
  ClipboardPaste,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'week' | 'day' | 'changes'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => BakalariService.getMondayOfCurrentWeek());
  const [isPermanent, setIsPermanent] = useState<boolean>(false);
  const [weekMode, setWeekMode] = useState<'current' | 'next' | 'permanent'>('current');
  const [selectedClassId, setSelectedClassId] = useState<string>('ZI'); // 3.A by default
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'bakalari-rows' | 'calendar-cols'>('bakalari-rows');

  // Instant 0ms initial render: schedule is populated immediately from cache or embedded 3.A SPŠD dataset
  const [weekData, setWeekData] = useState<TimetableWeekData | null>(() => {
    return BakalariService.getInstantTimetable(new Date(), false);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncText, setLastSyncText] = useState<string>(() => {
    return new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  });

  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isHtmlImportOpen, setIsHtmlImportOpen] = useState<boolean>(false);
  const [selectedLesson, setSelectedLesson] = useState<NormalizedLesson | null>(null);

  const [currentUser, setCurrentUser] = useState<BakalariUser | null>(() => {
    return BakalariService.getStoredUser() || REAL_STUDENT_USER;
  });
  const [isDemo, setIsDemo] = useState<boolean>(() => BakalariService.isDemoMode());

  // Load timetable in background without wiping displayed content
  const loadTimetable = useCallback(async (date: Date, permanent: boolean, silent = false, classId?: string) => {
    if (!silent) {
      setIsRefreshing(true);
    }
    setErrorMessage(null);

    const activeClass = classId || selectedClassId;

    try {
      const data = await BakalariService.fetchTimetable(date, permanent, activeClass);
      if (data && data.days?.length > 0) {
        setWeekData(data);
        const now = new Date();
        setLastSyncText(
          now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      }
      setErrorMessage(null);
    } catch (err: any) {
      console.warn('Timetable fetch error:', err);
      const isAuthProblem =
        err.message === 'NOT_AUTHENTICATED' ||
        err.status === 401;

      if (isAuthProblem) {
        setIsLoginOpen(true);
        const urlPart = err.targetUrl ? ` na ${err.targetUrl}` : '';
        setErrorMessage(
          `[HTTP ${err.status || 401}${urlPart}]: Přístupový token expiroval. Zadejte prosím své přihlašovací údaje k Bakalářům.`
        );
      } else {
        const urlStr = err.targetUrl ? ` na ${err.targetUrl}` : '';
        const statusStr = err.status ? `[HTTP ${err.status}${urlStr}]: ` : '';
        const details = err.message || 'Nepodařilo se stáhnout rozvrh ze serveru Bakalářů.';
        setErrorMessage(
          details.includes('HTTP') ? details : `${statusStr}${details}`
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedClassId]);

  // Initial mount: authenticate check and silent background sync
  useEffect(() => {
    const isAuthed = BakalariService.isAuthenticated();
    const demo = BakalariService.isDemoMode();
    const user = BakalariService.getStoredUser() || REAL_STUDENT_USER;
    setCurrentUser(user);
    setIsDemo(demo);

    // If authenticated, check for fresh updates in the background
    if (isAuthed) {
      loadTimetable(currentDate, isPermanent, true);
    }
  }, []); // Run on mount

  // Automatic background auto-update interval (every 120 seconds / 2 minutes)
  useEffect(() => {
    if (!BakalariService.isAuthenticated()) return;

    const interval = setInterval(() => {
      loadTimetable(currentDate, isPermanent, true /* silent refresh */);
    }, 120000);

    return () => clearInterval(interval);
  }, [currentDate, isPermanent, loadTimetable]);

  // 3-Mode handler: Tento týden / Příští týden / Stálý rozvrh (0ms Instant Switch!)
  const handleSelectWeekMode = (mode: 'current' | 'next' | 'permanent') => {
    setWeekMode(mode);
    let targetDate = currentDate;
    let perm = false;

    if (mode === 'current') {
      perm = false;
      targetDate = BakalariService.getMondayOfCurrentWeek();
    } else if (mode === 'next') {
      perm = false;
      targetDate = BakalariService.getMondayOfNextWeek();
    } else if (mode === 'permanent') {
      perm = true;
      targetDate = BakalariService.getMondayOfCurrentWeek();
    }

    setIsPermanent(perm);
    setCurrentDate(targetDate);

    // INSTANT RENDER (0ms latency): Swap data from instant cache immediately!
    const instantData = BakalariService.getInstantTimetable(targetDate, perm);
    setWeekData(instantData);

    // Silent background check if authenticated
    if (BakalariService.isAuthenticated()) {
      loadTimetable(targetDate, perm, true);
    }
  };

  // Week navigation handlers (0ms Instant Switch!)
  const handlePrevWeek = () => {
    setWeekMode('current');
    const next = new Date(currentDate);
    next.setDate(next.getDate() - 7);
    setCurrentDate(next);

    const instantData = BakalariService.getInstantTimetable(next, isPermanent);
    setWeekData(instantData);

    if (BakalariService.isAuthenticated()) {
      loadTimetable(next, isPermanent, true);
    }
  };

  const handleNextWeek = () => {
    setWeekMode('current');
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);

    const instantData = BakalariService.getInstantTimetable(next, isPermanent);
    setWeekData(instantData);

    if (BakalariService.isAuthenticated()) {
      loadTimetable(next, isPermanent, true);
    }
  };

  const handleCurrentWeek = () => {
    handleSelectWeekMode('current');
  };

  const handleManualRefresh = () => {
    loadTimetable(currentDate, isPermanent, false);
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    loadTimetable(currentDate, isPermanent, false, classId);
  };

  const handleDownloadStandaloneHtml = () => {
    if (!weekData) return;
    const html = generateStandaloneHtml(weekData, currentUser);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rozvrh-spsd-motol-${currentUser?.Class?.Abbrev || 'jedno-html'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Login & Demo handlers
  const handleLoginSuccess = (user: BakalariUser) => {
    setCurrentUser(user);
    setIsDemo(false);
    BakalariService.setDemoMode(false);
    setIsPermanent(false);
    setWeekMode('current');
    const mon = BakalariService.getMondayOfCurrentWeek();
    setCurrentDate(mon);
    loadTimetable(mon, false);
  };

  const handleUseDemo = () => {
    BakalariService.setDemoMode(true);
    BakalariService.setStoredUser(null);
    BakalariService.setStoredToken(null);
    setIsDemo(true);
    setCurrentUser(null);
    setIsPermanent(false);
    setWeekMode('current');
    loadTimetable(currentDate, false);
  };

  const handleImportSuccess = (data: TimetableWeekData) => {
    setWeekData(data);
    setIsDemo(false);
    setCurrentUser(BakalariService.getStoredUser());
    const now = new Date();
    setLastSyncText(
      now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  const handleLogout = () => {
    BakalariService.logout();
    setIsDemo(false);
    setCurrentUser(REAL_STUDENT_USER);
    setWeekData(BakalariService.getInstantTimetable(new Date(), false));
    setWeekMode('current');
  };

  // Calculate total changes count for badge
  let changesCount = 0;
  if (weekData) {
    weekData.days.forEach((d) => {
      d.lessons.forEach((l) => {
        if (l.isCanceled || l.isSubstituted || l.isRoomChanged) {
          changesCount++;
        }
      });
    });
  }

  const isUserAuthenticated = !!currentUser && !isDemo;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      {/* Top Navbar adhering to 3-zone contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onDownloadHtml={handleDownloadStandaloneHtml}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenHtmlImport={() => setIsHtmlImportOpen(true)}
        isDemo={isDemo}
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        changesCount={changesCount}
      />

      {/* Main Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {/* If user is neither logged in nor in demo mode, show the dedicated LoginScreen */}
        {!isUserAuthenticated && !isDemo ? (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onUseDemo={handleUseDemo}
            onImportSuccess={handleImportSuccess}
            initialErrorMessage={errorMessage}
          />
        ) : (
          <>
            {/* Real-time Lesson status banner */}
            <CurrentLessonBanner
              weekData={weekData}
              onSelectLesson={(lesson) => setSelectedLesson(lesson)}
              onJumpToToday={handleCurrentWeek}
            />

            {/* Authenticated Real Account Notice Bar */}
            {isUserAuthenticated && currentUser && (
              <div className="mb-5 bg-white border border-emerald-200 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Skutečný rozvrh studenta: {currentUser.FullName}</span>
                      {currentUser.Class?.Name && (
                        <span className="text-slate-500 font-normal">· {currentUser.Class.Name}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Propojeno s: <strong className="text-slate-700 font-mono">mot-spsd.bakalari.cz/Timetable</strong></span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-medium">Aktivní synchronizace</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                    <span>{isRefreshing ? 'Aktualizuji...' : 'Aktualizovat'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Demo Mode Notice Banner if explicitly enabled */}
            {isDemo && (
              <div className="mb-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Prohlížíte ukázkový rozvrh (Třída 3.DP Dopravní prostředky)</span>
                    </div>
                    <div className="text-[11px] text-blue-200 mt-0.5">
                      Pro zobrazení vašeho skutečného rozvrhu se prosím přihlaste svým účtem ze školy.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer self-start sm:self-center shrink-0 shadow-xs"
                >
                  <span>Přihlásit k mot-spsd.bakalari.cz</span>
                </button>
              </div>
            )}

            {/* Timetable Controls: Week switcher, mode switch, filters */}
            <TimetableControls
              currentWeekText={weekData?.weekRangeText || ''}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onCurrentWeek={handleCurrentWeek}
              isPermanent={isPermanent}
              onTogglePermanent={(perm) => {
                setIsPermanent(perm);
                setWeekMode(perm ? 'permanent' : 'current');
              }}
              weekMode={weekMode}
              onSelectWeekMode={handleSelectWeekMode}
              selectedGroup={selectedGroup}
              onSelectGroup={(g) => setSelectedGroup(g)}
              groups={weekData?.groups || []}
              searchQuery={searchQuery}
              onSearchChange={(q) => setSearchQuery(q)}
              layoutMode={layoutMode}
              onToggleLayoutMode={(mode) => setLayoutMode(mode)}
              isDemo={isDemo}
              currentUser={currentUser}
              isRefreshing={isRefreshing}
              onRefresh={handleManualRefresh}
              lastSyncText={lastSyncText}
              selectedClassId={selectedClassId}
              onSelectClass={handleSelectClass}
            />

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-semibold">{errorMessage}</span>
                    <span className="block text-[11px] text-rose-700/80 mt-0.5">
                      Školní server mot-spsd.bakalari.cz může mít interní chybu 500 rozvrhového API. Můžete vložit HTML kód stránky přes Ctrl+U.
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsHtmlImportOpen(true)}
                    className="px-2.5 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs text-xs"
                    title="Vložit HTML zkopírované ze stránky mot-spsd.bakalari.cz/Timetable"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Vložit HTML z webu (Ctrl+U)</span>
                  </button>
                  <button
                    onClick={() => setIsDiagnosticsOpen(true)}
                    className="px-2.5 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs text-xs"
                  >
                    <Terminal className="w-3 h-3 text-blue-400" />
                    <span>Diagnostika chyby</span>
                  </button>
                  <button
                    onClick={() => loadTimetable(currentDate, isPermanent)}
                    className="px-2.5 py-1.5 bg-white hover:bg-rose-100 text-rose-800 font-semibold rounded-lg border border-rose-200 cursor-pointer text-xs"
                  >
                    Zkusit znovu
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && !weekData ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">
                  Stahuji váš skutečný rozvrh z mot-spsd.bakalari.cz...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Ověřování dat v systému Bakaláři SPŠD Motol
                </p>
              </div>
            ) : weekData ? (
              <>
                {/* Tab 1: Week Table Matrix */}
                {activeTab === 'week' && (
                  <TimetableMatrix
                    weekData={weekData}
                    layoutMode={layoutMode}
                    selectedGroup={selectedGroup}
                    searchQuery={searchQuery}
                    onSelectLesson={(lesson) => setSelectedLesson(lesson)}
                  />
                )}

                {/* Tab 2: Day Agenda */}
                {activeTab === 'day' && (
                  <DayScheduleView
                    weekData={weekData}
                    selectedGroup={selectedGroup}
                    onSelectLesson={(lesson) => setSelectedLesson(lesson)}
                  />
                )}

                {/* Tab 3: Suplování & Změny */}
                {activeTab === 'changes' && (
                  <ChangesView
                    weekData={weekData}
                    onSelectLesson={(lesson) => setSelectedLesson(lesson)}
                  />
                )}
              </>
            ) : null}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">
              Střední průmyslová škola dopravní, Praha 5 - Motol
            </span>
            <span aria-hidden="true">·</span>
            <span>Plzeňská 298/217a</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://mot-spsd.bakalari.cz/Timetable"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <span>mot-spsd.bakalari.cz/Timetable</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {weekData && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <button
                  onClick={() => setIsExportOpen(true)}
                  className="text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
                >
                  Export kalendáře
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {weekData && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          weekData={weekData}
          groups={weekData.groups || []}
          onDownloadHtml={handleDownloadStandaloneHtml}
        />
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onUseDemo={handleUseDemo}
        isDemo={isDemo}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      <LessonDetailModal
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onNoteUpdated={() => {
          if (weekData) {
            setWeekData({ ...weekData });
          }
        }}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        onUseSampleStudent={() => {
          const res = BakalariService.useSampleStudent();
          handleLoginSuccess(res.user);
        }}
      />

      <HtmlImportModal
        isOpen={isHtmlImportOpen}
        onClose={() => setIsHtmlImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
