import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  User,
  Users,
  CalendarPlus,
  BookOpen,
  ArrowRightLeft,
  XCircle,
  FileEdit,
  Save,
  Check,
} from 'lucide-react';
import { NormalizedLesson } from '../types/bakalari';
import { CalendarExportService } from '../services/calendarExport';
import { BakalariService } from '../services/bakalariService';

interface LessonDetailModalProps {
  lesson: NormalizedLesson | null;
  onClose: () => void;
  onNoteUpdated?: () => void;
}

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  lesson,
  onClose,
  onNoteUpdated,
}) => {
  const [note, setNote] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (lesson) {
      setNote(BakalariService.getLessonNote(lesson.id));
      setIsSaved(false);
    }
  }, [lesson]);

  if (!lesson) return null;

  const handleSaveNote = () => {
    BakalariService.setLessonNote(lesson.id, note);
    setIsSaved(true);
    if (onNoteUpdated) onNoteUpdated();
    setTimeout(() => setIsSaved(false), 2000);
  };

  const googleCalUrl = CalendarExportService.getGoogleCalendarUrl(lesson);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
            <span className="text-base font-bold leading-none">{lesson.periodCaption}.</span>
            <span className="text-[10px] opacity-80 leading-none mt-1">hodina</span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>{lesson.dayName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{lesson.startTime} – {lesson.endTime}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {lesson.subjectName}
            </h3>
            <span className="text-xs font-semibold text-blue-600">
              Zkratka předmětu: {lesson.subjectAbbrev}
            </span>
          </div>
        </div>

        {/* Change Banner if any */}
        {lesson.change && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              lesson.isCanceled
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : lesson.isSubstituted
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            {lesson.isCanceled ? (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <ArrowRightLeft className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">
                {lesson.change.label}:
              </div>
              <div className="mt-0.5">{lesson.change.description}</div>
            </div>
          </div>
        )}

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Room */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Učebna</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {lesson.roomName || lesson.roomAbbrev || 'Neuvedeno'}
            </div>
            {lesson.roomAbbrev && lesson.roomName && (
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Kód místnosti: {lesson.roomAbbrev}
              </div>
            )}
          </div>

          {/* Teacher */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Vyučující</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {lesson.teacherName || lesson.teacherAbbrev || 'Neuvedeno'}
            </div>
            {lesson.teacherAbbrev && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                Zkratka: {lesson.teacherAbbrev}
              </div>
            )}
          </div>

          {/* Group */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Třída / Skupina</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {lesson.groupName || 'Celá třída'}
            </div>
          </div>

          {/* School Location */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Délka výuky</span>
            </div>
            <div className="text-sm font-semibold text-slate-900 font-mono tabular-nums">
              45 minut
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              SPŠD Motol, Praha 5
            </div>
          </div>
        </div>

        {/* Theme / Topic */}
        {lesson.theme && (
          <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Téma vyučovací hodiny</span>
            </div>
            <p className="text-xs text-slate-800 font-medium">
              {lesson.theme}
            </p>
          </div>
        )}

        {/* Personal Student Note */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileEdit className="w-3.5 h-3.5 text-slate-500" />
              <span>Moje osobní poznámka k hodině (písemka, úkol)</span>
            </span>
            {isSaved && (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Uloženo
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="např. Odevzdat laboratorní protokol, zkoušení z teorie..."
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleSaveNote}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Uložit</span>
            </button>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4 text-blue-600" />
            <span>Přidat tuto hodinu do Google Kalendáře</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
