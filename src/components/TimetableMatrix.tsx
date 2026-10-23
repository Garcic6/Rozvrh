import React from 'react';
import {
  NormalizedLesson,
  TimetableWeekData,
  BakalariHour,
} from '../types/bakalari';
import { AlertTriangle, XCircle, ArrowRightLeft, Sparkles, MapPin, User } from 'lucide-react';

interface TimetableMatrixProps {
  weekData: TimetableWeekData;
  layoutMode: 'bakalari-rows' | 'calendar-cols';
  selectedGroup: string;
  searchQuery: string;
  onSelectLesson: (lesson: NormalizedLesson) => void;
}

export const TimetableMatrix: React.FC<TimetableMatrixProps> = ({
  weekData,
  layoutMode,
  selectedGroup,
  searchQuery,
  onSelectLesson,
}) => {
  const hours = weekData.hours || [];
  const days = weekData.days || [];

  // Filter helper
  const isLessonVisible = (l: NormalizedLesson): boolean => {
    // Group filter
    if (selectedGroup !== 'all' && l.groupId && l.groupId !== selectedGroup && l.groupId !== 'G_ALL') {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        l.subjectName.toLowerCase().includes(q) ||
        l.subjectAbbrev.toLowerCase().includes(q) ||
        l.teacherName.toLowerCase().includes(q) ||
        l.teacherAbbrev.toLowerCase().includes(q) ||
        l.roomName.toLowerCase().includes(q) ||
        l.roomAbbrev.toLowerCase().includes(q) ||
        l.theme.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  };

  // Color mapper based on category
  const getSubjectColorStyles = (lesson: NormalizedLesson) => {
    if (lesson.isCanceled) {
      return 'bg-slate-100/90 text-slate-400 border-dashed border-rose-300';
    }
    if (lesson.isSubstituted) {
      return 'bg-amber-50/90 text-amber-950 border-amber-300 hover:border-amber-400';
    }
    if (lesson.isRoomChanged) {
      return 'bg-blue-50/90 text-blue-950 border-blue-300 hover:border-blue-400';
    }

    switch (lesson.colorCategory) {
      case 'transport':
        return 'bg-sky-50 text-sky-950 border-sky-200 hover:border-sky-400 hover:bg-sky-100/70';
      case 'tech':
        return 'bg-indigo-50 text-indigo-950 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-100/70';
      case 'math':
        return 'bg-violet-50 text-violet-950 border-violet-200 hover:border-violet-400 hover:bg-violet-100/70';
      case 'languages':
        return 'bg-amber-50 text-amber-950 border-amber-200 hover:border-amber-400 hover:bg-amber-100/70';
      case 'pe':
        return 'bg-rose-50 text-rose-950 border-rose-200 hover:border-rose-400 hover:bg-rose-100/70';
      case 'humanities':
        return 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/70';
      default:
        return 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70';
    }
  };

  // Render an individual lesson card
  const renderLessonCard = (lesson: NormalizedLesson) => {
    const isVisible = isLessonVisible(lesson);
    const colorStyle = getSubjectColorStyles(lesson);

    return (
      <div
        key={lesson.id}
        onClick={() => onSelectLesson(lesson)}
        className={`group relative p-2 rounded-lg border text-left cursor-pointer transition-all duration-150 ${colorStyle} ${
          !isVisible ? 'opacity-25 grayscale' : 'shadow-2xs hover:shadow-xs'
        }`}
      >
        {/* Top badges: group & change notice */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight truncate max-w-[65px]">
            {lesson.groupName && lesson.groupName !== 'Celá třída' ? lesson.groupName : ''}
          </span>

          {lesson.isCanceled && (
            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
              <XCircle className="w-3 h-3" /> Odpadá
            </span>
          )}

          {lesson.isSubstituted && !lesson.isCanceled && (
            <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
              <ArrowRightLeft className="w-3 h-3" /> Supl.
            </span>
          )}

          {lesson.isRoomChanged && (
            <span className="text-[10px] font-bold text-blue-700 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" /> Změna
            </span>
          )}
        </div>

        {/* Subject code & Name */}
        <div className="flex items-baseline justify-between gap-1">
          <div
            className={`text-sm sm:text-base font-bold tracking-tight ${
              lesson.isCanceled ? 'line-through text-slate-400' : 'text-slate-900'
            }`}
          >
            {lesson.subjectAbbrev}
          </div>
          <span className="text-[11px] font-semibold font-mono text-slate-700 tabular-nums">
            {lesson.roomAbbrev}
          </span>
        </div>

        {/* Full subject name preview on desktop */}
        <div className="text-[11px] text-slate-600 truncate mt-0.5 hidden sm:block">
          {lesson.subjectName}
        </div>

        {/* Footer: Teacher */}
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/50 text-[11px] text-slate-500">
          <span className="truncate max-w-[80px]" title={lesson.teacherName}>
            {lesson.teacherAbbrev || lesson.teacherName}
          </span>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------
     MODE 1: Traditional Czech Bakaláři Rows Layout (Days in rows)
  ------------------------------------------------------------- */
  if (layoutMode === 'bakalari-rows') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[850px] text-sm">
            {/* Header: Hour Numbers and Times */}
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="py-3 px-3 text-left font-semibold text-slate-600 text-xs w-32 border-r border-slate-200 uppercase tracking-wider">
                  Den / Hodina
                </th>
                {hours.map((h) => (
                  <th
                    key={h.Id}
                    className="py-2.5 px-2 text-center font-semibold text-slate-700 border-r border-slate-100 last:border-r-0 min-w-[105px]"
                  >
                    <div className="text-sm font-bold text-slate-900">{h.Caption}</div>
                    <div className="text-[11px] font-normal font-mono text-slate-500 tabular-nums mt-0.5">
                      {h.BeginTime} – {h.EndTime}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body: Days as Rows */}
            <tbody className="divide-y divide-slate-200">
              {days.map((day) => {
                const dayDateObj = day.date ? new Date(day.date) : null;
                const isToday =
                  dayDateObj &&
                  new Date().toDateString() === dayDateObj.toDateString();

                return (
                  <tr
                    key={day.dayOfWeek}
                    className={`transition-colors ${isToday ? 'bg-blue-50/20' : 'hover:bg-slate-50/40'}`}
                  >
                    {/* Day label */}
                    <td className="py-3 px-3.5 border-r border-slate-200 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {day.dayDescription}
                        </span>
                        {isToday && (
                          <span className="text-[10px] bg-blue-600 text-white font-semibold px-1.5 py-0.2 rounded-sm uppercase tracking-wide">
                            Dnes
                          </span>
                        )}
                      </div>
                      {day.date && (
                        <div className="text-xs font-mono text-slate-500 tabular-nums mt-0.5">
                          {new Date(day.date).toLocaleDateString('cs-CZ', {
                            day: 'numeric',
                            month: 'numeric',
                          })}
                        </div>
                      )}
                    </td>

                    {/* Lesson cells for each hour */}
                    {hours.map((hour) => {
                      const hourLessons = day.lessons.filter((l) => l.hourId === hour.Id);

                      return (
                        <td
                          key={hour.Id}
                          className="p-1.5 border-r border-slate-100 last:border-r-0 align-top min-w-[105px]"
                        >
                          {hourLessons.length === 0 ? (
                            <div className="h-16 rounded-md bg-slate-50/50 border border-transparent" />
                          ) : (
                            <div className="space-y-1">
                              {hourLessons.map((lesson) => renderLessonCard(lesson))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     MODE 2: Calendar Columns Layout (Days as columns)
  ------------------------------------------------------------- */
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[850px] text-sm">
          {/* Header: Days */}
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="py-3 px-2 text-center font-semibold text-slate-600 text-xs w-24 border-r border-slate-200 uppercase tracking-wider">
                Čas
              </th>
              {days.map((day) => {
                const dayDateObj = day.date ? new Date(day.date) : null;
                const isToday =
                  dayDateObj &&
                  new Date().toDateString() === dayDateObj.toDateString();

                return (
                  <th
                    key={day.dayOfWeek}
                    className={`py-3 px-2 text-center font-semibold border-r border-slate-200 last:border-r-0 ${
                      isToday ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
                      <span>{day.dayDescription}</span>
                      {isToday && (
                        <span className="text-[10px] bg-blue-600 text-white font-semibold px-1.5 py-0.2 rounded-sm uppercase tracking-wide">
                          Dnes
                        </span>
                      )}
                    </div>
                    {day.date && (
                      <div className="text-xs font-mono text-slate-500 tabular-nums mt-0.5">
                        {new Date(day.date).toLocaleDateString('cs-CZ', {
                          day: 'numeric',
                          month: 'numeric',
                        })}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body: Hours as Rows */}
          <tbody className="divide-y divide-slate-200">
            {hours.map((hour) => (
              <tr key={hour.Id} className="hover:bg-slate-50/30 transition-colors">
                {/* Hour indicator */}
                <td className="py-2.5 px-2 border-r border-slate-200 text-center align-top bg-slate-50/40">
                  <div className="text-sm font-bold text-slate-900">{hour.Caption}.</div>
                  <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                    {hour.BeginTime}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {hour.EndTime}
                  </div>
                </td>

                {/* Day columns */}
                {days.map((day) => {
                  const hourLessons = day.lessons.filter((l) => l.hourId === hour.Id);

                  return (
                    <td
                      key={day.dayOfWeek}
                      className="p-1.5 border-r border-slate-100 last:border-r-0 align-top"
                    >
                      {hourLessons.length === 0 ? (
                        <div className="h-14 rounded-md bg-slate-50/30" />
                      ) : (
                        <div className="space-y-1">
                          {hourLessons.map((lesson) => renderLessonCard(lesson))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
