import React, { useState } from 'react';
import {
  NormalizedLesson,
  TimetableWeekData,
} from '../types/bakalari';
import {
  CalendarPlus,
  Clock,
  MapPin,
  User,
  ArrowRightLeft,
  XCircle,
  FileText,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CalendarExportService } from '../services/calendarExport';

interface DayScheduleViewProps {
  weekData: TimetableWeekData;
  selectedGroup: string;
  onSelectLesson: (lesson: NormalizedLesson) => void;
}

export const DayScheduleView: React.FC<DayScheduleViewProps> = ({
  weekData,
  selectedGroup,
  onSelectLesson,
}) => {
  const days = weekData.days || [];
  const todayIndex = (() => {
    const dow = new Date().getDay();
    if (dow >= 1 && dow <= 5) return dow - 1;
    return 0; // Default to Monday
  })();

  const [activeDayIndex, setActiveDayIndex] = useState<number>(todayIndex);
  const activeDay = days[activeDayIndex] || days[0];

  // Filter lessons
  const visibleLessons = (activeDay?.lessons || []).filter((l) => {
    if (selectedGroup !== 'all' && l.groupId && l.groupId !== selectedGroup && l.groupId !== 'G_ALL') {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Day Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-1.5 rounded-xl border border-slate-200">
        {days.map((day, idx) => {
          const isSelected = idx === activeDayIndex;
          const dayDate = day.date ? new Date(day.date) : null;
          const isToday =
            dayDate && new Date().toDateString() === dayDate.toDateString();

          return (
            <button
              key={day.dayOfWeek}
              onClick={() => setActiveDayIndex(idx)}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {day.dayDescription}
                </span>
                {isToday && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm uppercase tracking-wide ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    Dnes
                  </span>
                )}
              </div>
              <div
                className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                  isSelected ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {dayDate
                  ? dayDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })
                  : ''}
                {' · '}
                {day.lessons.length} hod.
              </div>
            </button>
          );
        })}
      </div>

      {/* Lessons List for Selected Day */}
      {visibleLessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">Na tento den není naplánována žádná výuka</h3>
          <p className="text-xs text-slate-400 mt-1">Užijte si volný den nebo zkontrolujte jiný den v týdnu.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleLessons.map((lesson) => {
            const googleCalUrl = CalendarExportService.getGoogleCalendarUrl(lesson);

            return (
              <div
                key={lesson.id}
                onClick={() => onSelectLesson(lesson)}
                className={`bg-white rounded-xl border p-3.5 sm:p-4 transition-all hover:shadow-xs cursor-pointer ${
                  lesson.isCanceled
                    ? 'border-dashed border-rose-300 bg-slate-50/50'
                    : lesson.isSubstituted
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Hour & Subject */}
                  <div className="flex items-start gap-3.5">
                    {/* Hour badge */}
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-base font-bold text-slate-900 leading-none">
                        {lesson.periodCaption}.
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 tabular-nums leading-none mt-1">
                        {lesson.startTime}
                      </span>
                    </div>

                    <div>
                      {/* Top metadata tags */}
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className="font-semibold text-slate-600 font-mono">
                          {lesson.startTime} – {lesson.endTime}
                        </span>

                        {lesson.groupName && lesson.groupName !== 'Celá třída' && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-[11px] font-medium text-slate-500">
                              {lesson.groupName}
                            </span>
                          </>
                        )}

                        {lesson.isCanceled && (
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Hodina odpadá
                          </span>
                        )}

                        {lesson.isSubstituted && (
                          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3" /> Suplování
                          </span>
                        )}
                      </div>

                      {/* Main Title */}
                      <div className="flex items-baseline gap-2">
                        <h4
                          className={`text-base font-bold ${
                            lesson.isCanceled ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {lesson.subjectName}
                        </h4>
                        <span className="text-xs font-semibold text-slate-500">
                          ({lesson.subjectAbbrev})
                        </span>
                      </div>

                      {/* Topic theme */}
                      {lesson.theme && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                          Téma: {lesson.theme}
                        </p>
                      )}

                      {/* Change description if substitution */}
                      {lesson.change && (
                        <p className="text-xs text-amber-800 font-medium mt-1">
                          {lesson.change.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Room & Teacher & Google Calendar export */}
                  <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-900 justify-end">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{lesson.roomName || lesson.roomAbbrev || 'Neuvedeno'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 justify-end mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lesson.teacherName || lesson.teacherAbbrev || 'Neuvedeno'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={googleCalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Přidat přímo do Google Kalendáře"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Do kalendáře</span>
                      </a>

                      <button
                        onClick={() => onSelectLesson(lesson)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Otevřít detail"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
