import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Terminal,
  Activity,
  ChevronDown,
  ChevronUp,
  Server,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  DiagnosticsService,
  DiagnosticLogEntry,
  DiagnosticTestResult,
} from '../services/diagnosticsService';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseSampleStudent?: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  onUseSampleStudent,
}) => {
  const [logs, setLogs] = useState<DiagnosticLogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'errors' | 'auth'>('all');
  const [copied, setCopied] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<DiagnosticTestResult[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = DiagnosticsService.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyReport = async () => {
    const report = DiagnosticsService.generateReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = report;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRunSelfTest = async () => {
    setIsRunningTest(true);
    try {
      const results = await DiagnosticsService.runSelfTest();
      setTestResults(results);
    } finally {
      setIsRunningTest(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'errors') return log.level === 'error';
    if (filter === 'auth') return log.category === 'AUTH';
    return true;
  });

  const errorCount = logs.filter((l) => l.level === 'error').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostics-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 id="diagnostics-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Diagnostika a protokol chyb</span>
                {errorCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                    {errorCount} {errorCount === 1 ? 'chyba' : 'chyby'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Přesný záznam komunikace s mot-spsd.bakalari.cz pro rychlou identifikaci a opravu problému
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar / Action buttons */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSelfTest}
              disabled={isRunningTest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${isRunningTest ? 'animate-spin' : ''}`} />
              <span>{isRunningTest ? 'Testuji spojení...' : 'Spustit test spojení se školou'}</span>
            </button>

            <button
              onClick={handleCopyReport}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors cursor-pointer border ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-2xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Zkopírováno do schránky!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopírovat protokol do chatu</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Vše ({logs.length})
            </button>
            <button
              onClick={() => setFilter('errors')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'errors'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Chyby ({errorCount})
            </button>
            <button
              onClick={() => setFilter('auth')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'auth'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Přihlášení
            </button>
            <button
              onClick={() => DiagnosticsService.clearLogs()}
              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer ml-1"
              title="Vymazat záznamy"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Test results banner if run */}
        {testResults && (
          <div className="px-5 py-3 bg-blue-50/70 border-b border-blue-200 text-xs">
            <div className="font-bold text-blue-900 mb-2 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-700" />
              <span>Výsledek živého testu serveru mot-spsd.bakalari.cz:</span>
            </div>
            <div className="space-y-1.5">
              {testResults.map((r, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg flex items-center justify-between ${
                    r.status === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {r.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold">{r.step}:</span>
                    <span>{r.message}</span>
                  </div>
                  {r.durationMs !== undefined && (
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {r.durationMs} ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Žádné diagnostické záznamy pro vybraný filtr.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isError = log.level === 'error';
              const isSuccess = log.level === 'success';

              return (
                <div
                  key={log.id}
                  className={`rounded-xl border transition-all ${
                    isError
                      ? 'bg-rose-50/60 border-rose-200'
                      : isSuccess
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                          isError
                            ? 'bg-rose-600 text-white'
                            : isSuccess
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isError ? '!' : isSuccess ? '✓' : 'i'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold text-xs ${
                              isError
                                ? 'text-rose-900'
                                : isSuccess
                                ? 'text-emerald-900'
                                : 'text-slate-900'
                            }`}
                          >
                            {log.title}
                          </span>
                          {log.status !== undefined && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                Number(log.status) >= 400
                                  ? 'bg-rose-200 text-rose-900'
                                  : 'bg-emerald-200 text-emerald-900'
                              }`}
                            >
                              HTTP {log.status}
                            </span>
                          )}
                          {log.durationMs !== undefined && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.durationMs} ms
                            </span>
                          )}
                        </div>

                        {log.url && (
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate max-w-xl">
                            {log.method || 'GET'} {log.url}
                          </div>
                        )}

                        {log.recommendation && (
                          <div className="mt-1.5 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-semibold">Vysvětlení: </strong>
                              {log.recommendation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.timestamp}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded JSON payload */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-200/60 space-y-2">
                      {log.requestData && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Odeslaná data (Request):
                          </div>
                          <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto max-h-40">
                            {JSON.stringify(log.requestData, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.responseData && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Odpověď ze serveru (Response Body):
                          </div>
                          <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto max-h-56">
                            {JSON.stringify(log.responseData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with quick action */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 text-[11px]">
            Tip: Klikněte na tlačítko <strong>„Kopírovat protokol do chatu“</strong> a vložte text sem.
          </div>
          {onUseSampleStudent && (
            <button
              onClick={() => {
                onUseSampleStudent();
                onClose();
              }}
              className="px-3 py-1.5 font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              Pokračovat se vzorovým studentem (Vojtěch Garčic, 3.A)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
