import React, { useState } from 'react';
import {
  X,
  Download,
  Calendar,
  Bell,
  Layers,
  FileCheck,
  ExternalLink,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import {
  CalendarExportOptions,
  TimetableWeekData,
  BakalariGroupEntity,
} from '../types/bakalari';
import { CalendarExportService } from '../services/calendarExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekData: TimetableWeekData;
  groups: BakalariGroupEntity[];
  onDownloadHtml?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  weekData,
  groups,
  onDownloadHtml,
}) => {
  const [scope, setScope] = useState<'current-week' | 'current-month' | 'permanent-semester'>('current-week');
  const [includeSuplovani, setIncludeSuplovani] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [alertMinutes, setAlertMinutes] = useState<number>(10);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [summaryFormat, setSummaryFormat] = useState<'abbrev-room' | 'full-room' | 'abbrev-teacher-room'>('abbrev-room');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Options object
  const exportOptions: CalendarExportOptions = {
    scope,
    includeSuplovani,
    includeHomeworkNotes: includeNotes,
    alertMinutesBefore: alertMinutes,
    selectedGroupFilter: selectedGroup,
    customSummaryFormat: summaryFormat,
  };

  // Calculate total lessons in export
  let lessonCount = 0;
  weekData.days.forEach((day) => {
    day.lessons.forEach((lesson) => {
      if (selectedGroup !== 'all' && lesson.groupId && lesson.groupId !== selectedGroup && lesson.groupId !== 'G_ALL') {
        return;
      }
      if (lesson.isCanceled && !includeSuplovani) {
        return;
      }
      lessonCount++;
    });
  });

  const handleDownloadIcs = () => {
    const icsString = CalendarExportService.generateIcsContent(
      weekData,
      exportOptions,
      'SPŠD Motol'
    );
    const filename =
      scope === 'permanent-semester'
        ? 'Rozvrh_SPSD_Motol_Staly_Semestr.ics'
        : `Rozvrh_SPSD_Motol_${weekData.targetDate || 'Tyden'}.ics`;

    CalendarExportService.downloadIcsFile(icsString, filename);
  };

  const handleCopyIcs = () => {
    const icsString = CalendarExportService.generateIcsContent(
      weekData,
      exportOptions,
      'SPŠD Motol'
    );
    navigator.clipboard.writeText(icsString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-5 sm:p-6 relative">
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
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Export rozvrhu do kalendáře
            </h3>
            <p className="text-xs text-slate-500">
              Kompatibilní s Google Kalendářem, Apple Kalendářem (iPhone, Mac) a Outlookem
            </p>
          </div>
        </div>

        {/* Form Options */}
        <div className="space-y-4">
          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Rozsah exportu
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('current-week')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  scope === 'current-week'
                    ? 'border-blue-600 bg-blue-50/40 text-blue-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Aktuální týden</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Včetně aktuálního suplování a změn
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('permanent-semester')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  scope === 'permanent-semester'
                    ? 'border-blue-600 bg-blue-50/40 text-blue-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Celé pololetí (stálý)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Opakované týdenní hodiny až do konce roku
                </div>
              </button>
            </div>
          </div>

          {/* Group & Format Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Group Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Filtrovat skupinu
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Všechny hodiny (Celá třída)</option>
                {groups
                  .filter((g) => g.Abbrev !== 'Celá třída')
                  .map((g) => (
                    <option key={g.Id} value={g.Id}>
                      Jen {g.Abbrev} ({g.Name})
                    </option>
                  ))}
              </select>
            </div>

            {/* Event Title Format */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Formát názvu události
              </label>
              <select
                value={summaryFormat}
                onChange={(e) => setSummaryFormat(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="abbrev-room">Zkratka a učebna (např. DP (U12))</option>
                <option value="full-room">Celý název (např. Dopravní prostředky)</option>
                <option value="abbrev-teacher-room">Zkratka, učitel a učebna</option>
              </select>
            </div>
          </div>

          {/* Alarm / Reminder */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-slate-500" />
              <span>Připomenutí před vyučovací hodinou</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {[0, 5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setAlertMinutes(mins)}
                  className={`py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                    alertMinutes === mins
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mins === 0 ? 'Bez zvonění' : `${mins} min před`}
                </button>
              ))}
            </div>
          </div>

          {/* Checkbox options */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSuplovani}
                onChange={(e) => setIncludeSuplovani(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Zahrnout suplování a zrušené hodiny (s označením [ODPADÁ])</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Zahrnout témata hodin a poznámky k učivu do popisu události</span>
            </label>
          </div>

          {/* Summary info card */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Připraveno k exportu:</span>
            </div>
            <span className="font-bold text-slate-900 font-mono tabular-nums">
              {lessonCount} vyučovacích hodin
            </span>
          </div>

          {/* Guide for Google Calendar & Apple Calendar */}
          <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-blue-900 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Jak importovat do kalendáře:</span>
            </div>
            <p>
              1. Klikněte níže na <strong>Stáhnout iCalendar (.ics)</strong>.
            </p>
            <p>
              2. V <strong>Google Kalendáři</strong> otevřete Nastavení → Importovat a exportovat → Nahrajte soubor .ics.
            </p>
            <p>
              3. V <strong>iPhone / Mac Kalendáři</strong> stačí stažený soubor jednoduše otevřít.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          {onDownloadHtml && (
            <button
              type="button"
              onClick={onDownloadHtml}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              title="Stáhnout jako jeden samostatný offline HTML soubor"
            >
              <span>💾 Stáhnout v jednom HTML</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyIcs}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Zkopírováno!' : 'Kopírovat iCal text'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadIcs}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Stáhnout kalendář (.ics)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
