import React, { useState } from 'react';
import { NormalizedLesson, TimetableWeekData } from '../types/bakalari';
import {
  AlertTriangle,
  ArrowRightLeft,
  XCircle,
  MapPin,
  Calendar,
  CheckCircle2,
  CalendarPlus,
} from 'lucide-react';
import { CalendarExportService } from '../services/calendarExport';

interface ChangesViewProps {
  weekData: TimetableWeekData;
  onSelectLesson: (lesson: NormalizedLesson) => void;
}

export const ChangesView: React.FC<ChangesViewProps> = ({
  weekData,
  onSelectLesson,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'substitution' | 'canceled' | 'roomChange'>('all');

  // Collect all changed lessons in the week
  const allChangedLessons: NormalizedLesson[] = [];
  (weekData.days || []).forEach((day) => {
    (day.lessons || []).forEach((lesson) => {
      if (lesson.change || lesson.isCanceled || lesson.isSubstituted || lesson.isRoomChanged) {
        allChangedLessons.push(lesson);
      }
    });
  });

  const filtered = allChangedLessons.filter((l) => {
    if (filterType === 'all') return true;
    if (filterType === 'canceled') return l.isCanceled;
    if (filterType === 'substitution') return l.isSubstituted;
    if (filterType === 'roomChange') return l.isRoomChanged;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Přehled suplování a změn v rozvrhu</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Týden: <span className="font-semibold text-slate-700">{weekData.weekRangeText}</span> ·{' '}
              Celkem {allChangedLessons.length} zaznamenaných změn
            </p>
          </div>

          {/* Filter segment */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Všechny ({allChangedLessons.length})
            </button>
            <button
              onClick={() => setFilterType('substitution')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filterType === 'substitution'
                  ? 'bg-white text-amber-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Suplování
            </button>
            <button
              onClick={() => setFilterType('canceled')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filterType === 'canceled'
                  ? 'bg-white text-rose-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Odpadá
            </button>
            <button
              onClick={() => setFilterType('roomChange')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filterType === 'roomChange'
                  ? 'bg-white text-blue-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Učebny
            </button>
          </div>
        </div>
      </div>

      {/* Changes List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">
            {allChangedLessons.length === 0
              ? 'Tento týden nejsou v rozvrhu žádné ohlášené změny ani suplování.'
              : 'Žádné změny v této zvolené kategorii.'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Výuka probíhá standardně podle platného stálého rozvrhu SPŠD Motol.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((lesson) => {
            const googleCalUrl = CalendarExportService.getGoogleCalendarUrl(lesson);

            return (
              <div
                key={lesson.id}
                onClick={() => onSelectLesson(lesson)}
                className={`bg-white rounded-xl border p-4 transition-all hover:shadow-xs cursor-pointer ${
                  lesson.isCanceled
                    ? 'border-rose-200 bg-rose-50/20'
                    : lesson.isSubstituted
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-blue-200 bg-blue-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {/* Day & Hour badge */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-800">{lesson.dayName}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-semibold text-blue-700">
                        {lesson.periodCaption}. hodina
                      </span>
                      <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                        ({lesson.startTime} – {lesson.endTime})
                      </span>
                    </div>

                    {/* Subject info */}
                    <div className="flex items-baseline gap-2 mt-1">
                      <span
                        className={`text-base font-bold ${
                          lesson.isCanceled ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {lesson.subjectName}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        ({lesson.subjectAbbrev})
                      </span>
                    </div>

                    {/* Change detail banner */}
                    <div className="pt-1">
                      {lesson.isCanceled ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-100 text-rose-800 text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{lesson.change?.description || 'Hodina odpadá'}</span>
                        </div>
                      ) : lesson.isSubstituted ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-900 text-xs font-semibold">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>{lesson.change?.description || 'Suplování hodiny'}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-100 text-blue-900 text-xs font-semibold">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{lesson.change?.description || 'Změna učebny'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex flex-col items-end gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={googleCalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Přidat do Google Kalendáře"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Footer notes */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Vyučující: {lesson.teacherName || lesson.teacherAbbrev || 'Neuvedeno'}</span>
                  <span>Učebna: {lesson.roomAbbrev || lesson.roomName || 'Neuvedeno'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
