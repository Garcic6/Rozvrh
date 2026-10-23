import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, AlertCircle, Coffee, ChevronRight } from 'lucide-react';
import { NormalizedLesson, TimetableWeekData } from '../types/bakalari';

interface CurrentLessonBannerProps {
  weekData: TimetableWeekData | null;
  onSelectLesson: (lesson: NormalizedLesson) => void;
  onJumpToToday: () => void;
}

export const CurrentLessonBanner: React.FC<CurrentLessonBannerProps> = ({
  weekData,
  onSelectLesson,
  onJumpToToday,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  if (!weekData || !weekData.days || weekData.days.length === 0) {
    return null;
  }

  const dayOfWeek = currentTime.getDay(); // 0 = Ne, 1 = Po, ... 5 = Pá, 6 = So
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Format current time HH:MM
  const timeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
  const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Find today's day data in current week
  const todayDayIndex = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek - 1 : 0;
  const todaySchedule = weekData.days[todayDayIndex];

  let currentLesson: NormalizedLesson | null = null;
  let nextLesson: NormalizedLesson | null = null;
  let isBreak = false;
  let breakMinutesRemaining = 0;
  let lessonMinutesRemaining = 0;

  if (!isWeekend && todaySchedule && todaySchedule.lessons.length > 0) {
    const sorted = [...todaySchedule.lessons].sort((a, b) => a.hourId - b.hourId);

    for (let i = 0; i < sorted.length; i++) {
      const l = sorted[i];
      const [startH, startM] = l.startTime.split(':').map(Number);
      const [endH, endM] = l.endTime.split(':').map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      if (currentTotalMins >= startMins && currentTotalMins < endMins) {
        currentLesson = l;
        lessonMinutesRemaining = endMins - currentTotalMins;
        break;
      }

      if (currentTotalMins < startMins) {
        nextLesson = l;
        isBreak = i > 0;
        breakMinutesRemaining = startMins - currentTotalMins;
        break;
      }
    }
  }

  const timeFormatted = currentTime.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = currentTime.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="bg-slate-900 text-white rounded-xl shadow-xs p-3.5 sm:p-4 mb-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Real-time context */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center shrink-0">
            {currentLesson ? (
              <BookOpen className="w-5 h-5 text-blue-400" />
            ) : isBreak ? (
              <Coffee className="w-5 h-5 text-amber-400" />
            ) : (
              <Clock className="w-5 h-5 text-slate-300" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="capitalize">{dateFormatted}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-300 font-medium">{timeFormatted}</span>
            </div>

            <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-2 flex-wrap">
              {isWeekend ? (
                <span className="text-slate-300">Víkendové volno · Připraven rozvrh na následující týden</span>
              ) : currentLesson ? (
                <>
                  <span className="text-blue-300">Právě probíhá {currentLesson.periodCaption}. hodina:</span>
                  <span className="font-bold underline decoration-blue-500/50 underline-offset-2">
                    {currentLesson.subjectName} ({currentLesson.subjectAbbrev})
                  </span>
                  <span className="text-slate-300 text-xs">v {currentLesson.roomAbbrev || currentLesson.roomName}</span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono tabular-nums">
                    zbývá {lessonMinutesRemaining} min
                  </span>
                </>
              ) : isBreak && nextLesson ? (
                <>
                  <span className="text-amber-300">Školní přestávka:</span>
                  <span className="text-slate-300 text-xs">do zvonění {breakMinutesRemaining} min</span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="text-xs text-slate-300">
                    Následuje {nextLesson.periodCaption}. h: {nextLesson.subjectAbbrev} ({nextLesson.roomAbbrev})
                  </span>
                </>
              ) : nextLesson ? (
                <>
                  <span className="text-slate-300">Před začátkem výuky ·</span>
                  <span>1. hodina začíná v {nextLesson.startTime} ({nextLesson.subjectName})</span>
                </>
              ) : (
                <span className="text-slate-300">Dnešní výuka podle rozvrhu již skončila</span>
              )}
            </div>
          </div>
        </div>

        {/* Right action */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {currentLesson && (
            <button
              onClick={() => onSelectLesson(currentLesson!)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              <span>Detail hodiny</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onJumpToToday}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <span>Přejít na dnešek</span>
          </button>
        </div>
      </div>
    </div>
  );
};
