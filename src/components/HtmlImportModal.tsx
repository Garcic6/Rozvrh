import React, { useState } from 'react';
import {
  X,
  FileCode,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
  School,
  ArrowRight,
  ClipboardPaste,
} from 'lucide-react';
import { BakalariService } from '../services/bakalariService';
import { TimetableWeekData, BakalariUser } from '../types/bakalari';

interface HtmlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: TimetableWeekData, user?: BakalariUser) => void;
}

export const HtmlImportModal: React.FC<HtmlImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [weekTarget, setWeekTarget] = useState<'current' | 'next' | 'permanent'>('current');
  const [htmlText, setHtmlText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    studentName?: string;
    className?: string;
    daysCount?: number;
    hoursCount?: number;
    weekRange?: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleProcessHtml = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const trimmed = htmlText.trim();
    if (!trimmed) {
      setError('Nejprve prosím vložte HTML kód ze stránky Bakalářů.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Check if the text is from Bakalari
      const hasTimetableData =
        trimmed.includes('timetableData') ||
        trimmed.includes('TimetableDataAvailable') ||
        trimmed.includes('bk-timetable') ||
        trimmed.includes('bakalari');

      if (!hasTimetableData && trimmed.length < 500) {
        throw new Error(
          'Vložený text nevypadá jako zdrojový kód stránky Bakalářů. Ujistěte se, že kopírujete kód přes Ctrl+U na stránce mot-spsd.bakalari.cz/Timetable.'
        );
      }

      // Determine target date
      let targetDateStr: string | undefined = undefined;
      if (weekTarget === 'next') {
        targetDateStr = BakalariService.formatDateIso(BakalariService.getMondayOfNextWeek());
      } else if (weekTarget === 'current') {
        targetDateStr = BakalariService.formatDateIso(BakalariService.getMondayOfCurrentWeek());
      }

      // 2. Parse using BakalariService
      const normalizedData = BakalariService.importFromHtml(trimmed, targetDateStr);
      const detectedUser = BakalariService.getStoredUser();

      setSuccessInfo({
        studentName: detectedUser?.FullName || 'Vojtěch Garčic',
        className: detectedUser?.Class?.Name || '3.A (SPŠD)',
        daysCount: normalizedData.days.length,
        hoursCount: normalizedData.hours.length,
        weekRange: normalizedData.weekRangeText,
      });

      // Call parent callback after brief success animation
      setTimeout(() => {
        onImportSuccess(normalizedData, detectedUser || undefined);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('HTML import error:', err);
      setError(
        err.message ||
          'Nepodařilo se rozpoznat rozvrh. Zkontrolujte, zda jste zkopírovali kompletní zdrojový kód stránky (Ctrl+U) a nikoli jen část textu.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setHtmlText(text);
        setError(null);
      }
    } catch (e) {
      setError('Nelze automaticky číst ze schránky. Vložte text ručně klávesovou zkratkou Ctrl + V do textového pole.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="html-import-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 id="html-import-title" className="text-base font-bold text-slate-900">
                Vložit HTML kód z webu Bakalářů
              </h2>
              <p className="text-xs text-slate-500">
                Obejít chybu 500 načtením rozvrhu přímo ze zdrojového kódu stránky
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
            aria-label="Zavřít okno"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Instructions card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2.5">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
              <School className="w-4 h-4 text-blue-600" />
              <span>Jak získat HTML kód rozvrhu (návod ve 3 krocích):</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li className="leading-relaxed">
                Otevřete stránku rozvrhu ve svém prohlížeči:{' '}
                <a
                  href="https://mot-spsd.bakalari.cz/Timetable/Public"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  <span>mot-spsd.bakalari.cz/Timetable/Public</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {' '}nebo{' '}
                <a
                  href="https://mot-spsd.bakalari.cz/Timetable"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  <span>/Timetable</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {' '}(vyberte třídu 3.A nebo požadovaný týden).
              </li>
              <li className="leading-relaxed">
                Stiskněte klávesovou zkratku <kbd className="px-1.5 py-0.5 font-mono text-[11px] bg-white border border-slate-300 rounded shadow-2xs font-bold text-slate-800">Ctrl + U</kbd> (nebo klikněte pravým tlačítkem a zvolte <em>Zobrazit zdrojový kód stránky</em>).
              </li>
              <li className="leading-relaxed">
                Označte vše (<kbd className="px-1.5 py-0.5 font-mono text-[11px] bg-white border border-slate-300 rounded shadow-2xs font-bold text-slate-800">Ctrl + A</kbd>), zkopírujte (<kbd className="px-1.5 py-0.5 font-mono text-[11px] bg-white border border-slate-300 rounded shadow-2xs font-bold text-slate-800">Ctrl + C</kbd>) a vložte níže.
              </li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleProcessHtml} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                Pro který týden kód vkládáte?
              </label>
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setWeekTarget('current')}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    weekTarget === 'current'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  📅 Tento týden
                </button>
                <button
                  type="button"
                  onClick={() => setWeekTarget('next')}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    weekTarget === 'next'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  ⏩ Příští týden
                </button>
                <button
                  type="button"
                  onClick={() => setWeekTarget('permanent')}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    weekTarget === 'permanent'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  🏛️ Stálý rozvrh
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="html-textarea" className="text-xs font-semibold text-slate-800">
                Zdrojový kód stránky (HTML):
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Vložit ze schránky</span>
              </button>
            </div>

            <textarea
              id="html-textarea"
              value={htmlText}
              onChange={(e) => {
                setHtmlText(e.target.value);
                setError(null);
              }}
              rows={8}
              placeholder="Vložte sem zkopírovaný HTML kód (začíná např. <!DOCTYPE html> nebo obsahuje const timetableData = { ... })..."
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successInfo && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <strong>Úspěšně zpracováno!</strong> Rozpoznán student {successInfo.studentName} ({successInfo.className}) s rozvrhem na {successInfo.daysCount} dní.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                {htmlText.length > 0 ? `${htmlText.length.toLocaleString()} znaků` : 'Pole je prázdné'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !htmlText.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? 'Analyzuji...' : 'Načíst a zobrazit rozvrh'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
