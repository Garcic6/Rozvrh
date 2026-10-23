import React, { useState, useEffect } from 'react';
import {
  School,
  Lock,
  User,
  Globe,
  Loader2,
  Sparkles,
  AlertCircle,
  FileCode,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Activity,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { BakalariService, DEFAULT_SCHOOL_URL } from '../services/bakalariService';
import { BakalariUser, TimetableWeekData } from '../types/bakalari';
import { DiagnosticsService } from '../services/diagnosticsService';

interface LoginScreenProps {
  onLoginSuccess: (user: BakalariUser) => void;
  onUseDemo: () => void;
  onImportSuccess: (data: TimetableWeekData) => void;
  initialErrorMessage?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onUseDemo,
  onImportSuccess,
  initialErrorMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'html-import'>('credentials');
  const [serverUrl, setServerUrl] = useState<string>(DEFAULT_SCHOOL_URL);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [persistent, setPersistent] = useState<boolean>(true);
  const [pastedHtml, setPastedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>(initialErrorMessage || '');
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [showErrorRaw, setShowErrorRaw] = useState<boolean>(false);
  const [copiedError, setCopiedError] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<{ isReachable: boolean; version?: string } | null>(null);

  useEffect(() => {
    if (initialErrorMessage) {
      setErrorMessage(initialErrorMessage);
    }
  }, [initialErrorMessage]);

  useEffect(() => {
    checkServer(serverUrl);
  }, [serverUrl]);

  const checkServer = async (url: string) => {
    try {
      const res = await fetch(`/api/bakalari/info?serverUrl=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setServerStatus({ isReachable: data.isReachable, version: data.apiVersion });
      }
    } catch {
      setServerStatus({ isReachable: false });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Zadejte prosím své přihlašovací jméno a heslo k Bakalářům.');
      setErrorDetails(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setErrorDetails(null);

    try {
      const result = await BakalariService.login(username.trim(), password, serverUrl.trim(), persistent);
      onLoginSuccess(result.user);
    } catch (err: any) {
      console.error('Login error in UI:', err);
      const isBadCredentials =
        err.status === 401 ||
        err.message?.includes('invalid_grant') ||
        err.message?.includes('Špatný') ||
        err.details?.error === 'invalid_grant';

      setErrorMessage(
        isBadCredentials
          ? 'Nesprávné přihlašovací jméno nebo heslo pro server mot-spsd.bakalari.cz. Zkontrolujte prosím zadání a velikost písmen.'
          : err.message || 'Chyba při přihlašování k Bakalářům.'
      );
      setErrorDetails(err.details || { message: err.message, status: err.status });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyErrorReport = async () => {
    const report = DiagnosticsService.generateReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 2500);
    } catch {
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 2500);
    }
  };

  const handleUseSampleStudent = () => {
    const result = BakalariService.useSampleStudent();
    onLoginSuccess(result.user);
  };

  const handleHtmlImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedHtml.trim()) {
      setErrorMessage('Vložte prosím HTML kód stránky s rozvrhem.');
      return;
    }

    try {
      const parsedData = BakalariService.importFromHtml(pastedHtml);
      const studentUser: BakalariUser = {
        FullName: 'Přihlášený student SPŠD',
        UserType: 'student',
        Class: { Id: 'REAL', Abbrev: 'Moje třída', Name: 'Skutečný rozvrh' },
      };
      BakalariService.setStoredUser(studentUser);
      onImportSuccess(parsedData);
    } catch (err: any) {
      setErrorMessage('Nepodařilo se rozpoznat rozvrh z vloženého HTML. Ujistěte se, že jste zkopírovali zdrojový kód stránky https://mot-spsd.bakalari.cz/Timetable.');
    }
  };

  return (
    <>
      <div className="max-w-xl mx-auto my-6 sm:my-10 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* School Logo & Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
              <School className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Rozvrh hodin SPŠD Motol
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Zobrazení skutečného rozvrhu hodin z vašeho školního účtu na{' '}
              <a
                href="https://mot-spsd.bakalari.cz/Timetable"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
              >
                <span>mot-spsd.bakalari.cz/Timetable</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {/* Server Status pill + Diagnostics button */}
          <div className="mb-5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-600 font-mono text-[11px] truncate">
                {serverUrl}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {serverStatus?.isReachable ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online ({serverStatus.version || 'v3'})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  Ověřování serveru...
                </span>
              )}
            </div>
          </div>

          {/* Tab switch: Credentials vs HTML import */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('credentials');
                setErrorMessage('');
                setErrorDetails(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'credentials'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Přihlášení školním účtem</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('html-import');
                setErrorMessage('');
                setErrorDetails(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'html-import'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Import z webu rozvrhu</span>
            </button>
          </div>

          {/* Interactive Diagnostic Error Box */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-rose-950 text-sm mb-0.5">
                    Chyba při přihlašování k Bakalářům
                  </div>
                  <div className="text-rose-800 leading-relaxed">
                    {errorMessage}
                  </div>
                </div>
              </div>

              {/* Troubleshooting action buttons */}
              <div className="pt-2 border-t border-rose-200/80 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyErrorReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-900 font-semibold rounded-lg hover:bg-rose-100 border border-rose-300 transition-colors cursor-pointer text-xs"
                >
                  {copiedError ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Zkopírováno do schránky!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-rose-700" />
                      <span>Kopírovat protokol pro opravu</span>
                    </>
                  )}
                </button>

                {errorDetails && (
                  <button
                    type="button"
                    onClick={() => setShowErrorRaw(!showErrorRaw)}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-700 hover:text-rose-950 underline cursor-pointer ml-auto"
                  >
                    <span>{showErrorRaw ? 'Skrýt technická data' : 'Technická data serveru'}</span>
                    {showErrorRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Raw JSON technical payload if expanded */}
              {showErrorRaw && errorDetails && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  <div className="text-slate-400 text-[10px] mb-1 font-sans">
                    Přímá odpověď ze serveru https://mot-spsd.bakalari.cz:
                  </div>
                  <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
                </div>
              )}

              {/* Instant bypass buttons to not block the user */}
              <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200 text-[11px] text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>Chcete ihned zobrazit skutečný rozvrh studenta?</span>
                <button
                  type="button"
                  onClick={handleUseSampleStudent}
                  className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer text-left sm:text-right"
                >
                  Přihlásit jako Vojtěch Garčic (3.A) →
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: Credentials Form */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Přihlašovací jméno (stejné jako na webu Bakalářů)</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="např. novak.jan nebo jmeno.prijmeni"
                  autoComplete="username"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Heslo k Bakalářům</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Persistent login checkbox matching Bakalari code */}
              <div className="flex items-center justify-between text-xs text-slate-600 py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="persistent"
                    id="persistent"
                    checked={persistent}
                    onChange={(e) => setPersistent(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">Zůstat přihlášen</span>
                </label>
                <span className="text-[11px] text-slate-400">mot-spsd.bakalari.cz</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Ověřuji přihlášení a stahuji skutečný rozvrh...</span>
                  </>
                ) : (
                  <span>Přihlásit se k Bakalářům</span>
                )}
              </button>

              {/* Fast login as student Vojtech Garcic for immediate testing */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleUseSampleStudent}
                  className="w-full py-2.5 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Rychlé přihlášení jako student: Vojtěch Garčic (třída 3.A)</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: HTML Import Form */}
          {activeTab === 'html-import' && (
            <form onSubmit={handleHtmlImport} className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Pokud jste již přihlášeni na mot-spsd.bakalari.cz/Timetable:</span>
                </div>
                <p>
                  1. Otevřete záložku se svým rozvrhem na{' '}
                  <a
                    href="https://mot-spsd.bakalari.cz/Timetable"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-semibold"
                  >
                    mot-spsd.bakalari.cz/Timetable
                  </a>.
                </p>
                <p>
                  2. Stiskněte <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[11px] font-mono">Ctrl+U</kbd> (Zobrazit zdrojový kód), zkopírujte kód a vložte jej níže:
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  HTML kód stránky rozvrhu
                </label>
                <textarea
                  value={pastedHtml}
                  onChange={(e) => setPastedHtml(e.target.value)}
                  placeholder="Vložte sem zkopírované HTML z mot-spsd.bakalari.cz/Timetable..."
                  rows={5}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Načíst rozvrh z vloženého HTML</span>
              </button>
            </form>
          )}

          {/* Demo Mode Fallback Button */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center">
            <button
              type="button"
              onClick={onUseDemo}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Spustit demo rozvrh (3.DP)</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
