import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  User,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  School,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { BakalariService, DEFAULT_SCHOOL_URL } from '../services/bakalariService';
import { BakalariUser } from '../types/bakalari';
import { DiagnosticsService } from '../services/diagnosticsService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: BakalariUser) => void;
  onUseDemo: () => void;
  isDemo: boolean;
  onOpenDiagnostics?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onUseDemo,
  isDemo,
  onOpenDiagnostics,
}) => {
  const [serverUrl, setServerUrl] = useState<string>(DEFAULT_SCHOOL_URL);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<{ isReachable: boolean; version?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setServerUrl(BakalariService.getServerUrl() || DEFAULT_SCHOOL_URL);
      setErrorMessage('');
      checkServer(BakalariService.getServerUrl() || DEFAULT_SCHOOL_URL);
    }
  }, [isOpen]);

  const checkServer = async (url: string) => {
    try {
      const res = await fetch(`/api/bakalari/info?serverUrl=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setServerStatus({ isReachable: data.isReachable, version: data.apiVersion });
      } else if (BakalariService.isStaticHost()) {
        setServerStatus({ isReachable: true, version: 'GitHub Pages (Statický režim)' });
      } else {
        setServerStatus({ isReachable: false });
      }
    } catch {
      if (BakalariService.isStaticHost()) {
        setServerStatus({ isReachable: true, version: 'GitHub Pages (Statický režim)' });
      } else {
        setServerStatus({ isReachable: false });
      }
    }
  };

  const handleCopyReport = async () => {
    const report = DiagnosticsService.generateReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Zadejte prosím své uživatelské jméno a heslo.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await BakalariService.login(username.trim(), password, serverUrl.trim());
      onLoginSuccess(result.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Chyba při přihlašování k Bakalářům.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 sm:p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Připojení k Bakalářům
            </h3>
            <p className="text-xs text-slate-500">
              Střední průmyslová škola dopravní, Praha 5 - Motol
            </p>
          </div>
        </div>

        {/* Server status badge */}
        <div className="mb-4 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-600 truncate">{serverUrl}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {serverStatus?.isReachable ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {serverStatus.version || 'API v3 aktivní'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                Ověřování...
              </span>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Přihlášení se nezdařilo: </span>
                {errorMessage}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-rose-200">
              <button
                type="button"
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-md font-semibold text-[11px] cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-rose-700" />}
                <span>{copied ? 'Zkopírováno!' : 'Kopírovat protokol'}</span>
              </button>
              {onOpenDiagnostics && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDiagnostics();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 hover:text-rose-950 underline cursor-pointer"
                >
                  <Terminal className="w-3 h-3" />
                  <span>Zobrazit diagnostiku</span>
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          {/* Server URL (advanced or default) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresa serveru Bakalářů
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => {
                setServerUrl(e.target.value);
                checkServer(e.target.value);
              }}
              placeholder="https://mot-spsd.bakalari.cz"
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Přihlašovací jméno (student / rodič)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="např. novak.jan"
              autoComplete="username"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Heslo</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Přihlašuji k Bakalářům...</span>
              </>
            ) : (
              <span>Přihlásit se k účtu SPŠD</span>
            )}
          </button>
        </form>

        {/* Demo Mode Option */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-center text-xs text-slate-500 mb-3">
            Nemáte u sebe zrovna přihlašovací údaje?
          </div>
          <button
            type="button"
            onClick={() => {
              onUseDemo();
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Spustit ukázkový rozvrh SPŠD Motol (Třída 3.DP)</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Zahrnuje odborné předměty Autotronika, Dopravní prostředky, Elektrotechnika i reálné ukázky suplování.
          </p>
        </div>
      </div>
    </div>
  );
};
