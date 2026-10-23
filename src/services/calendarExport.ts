import { CalendarExportOptions, NormalizedLesson, TimetableWeekData } from '../types/bakalari';

export class CalendarExportService {
  /**
   * Generates a standard RFC 5545 iCalendar (.ics) string
   */
  static generateIcsContent(
    weekData: TimetableWeekData,
    options: CalendarExportOptions,
    schoolName = 'SPŠD Praha - Motol'
  ): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SPSD Motol//Rozvrh Hodin Bakalari//CS',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Rozvrh ${schoolName}`,
      'X-WR-TIMEZONE:Europe/Prague',
    ];

    // Standard VTIMEZONE component for Europe/Prague
    lines.push(
      'BEGIN:VTIMEZONE',
      'TZID:Europe/Prague',
      'X-LIC-LOCATION:Europe/Prague',
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'DTSTART:19700329T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'DTSTART:19701025T030000',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD',
      'END:VTIMEZONE'
    );

    const nowStamp = this.formatIcsTimestamp(new Date());

    weekData.days.forEach((day) => {
      day.lessons.forEach((lesson) => {
        // Group filter
        if (options.selectedGroupFilter && options.selectedGroupFilter !== 'all') {
          if (lesson.groupId && lesson.groupId !== options.selectedGroupFilter && lesson.groupId !== 'G_ALL') {
            return;
          }
        }

        // Canceled check
        if (lesson.isCanceled && !options.includeSuplovani) {
          return;
        }

        const dateParts = lesson.dayDate.split('-');
        if (dateParts.length !== 3) return;

        const [startH, startM] = lesson.startTime.split(':').map(Number);
        const [endH, endM] = lesson.endTime.split(':').map(Number);

        const dtStartStr = `${dateParts[0]}${dateParts[1]}${dateParts[2]}T${String(startH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;
        const dtEndStr = `${dateParts[0]}${dateParts[1]}${dateParts[2]}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

        // Compose Summary based on format option
        let summary = '';
        if (lesson.isCanceled) {
          summary += '[ODPADÁ] ';
        } else if (lesson.isSubstituted) {
          summary += '[SUPLOVÁNÍ] ';
        } else if (lesson.isRoomChanged) {
          summary += '[ZMĚNA UČEBNY] ';
        }

        if (options.customSummaryFormat === 'full-room') {
          summary += `${lesson.subjectName} (${lesson.roomAbbrev || 'Učebna'})`;
        } else if (options.customSummaryFormat === 'abbrev-teacher-room') {
          summary += `${lesson.subjectAbbrev} - ${lesson.teacherAbbrev || lesson.teacherName} (${lesson.roomAbbrev})`;
        } else {
          // abbrev-room
          summary += `${lesson.subjectAbbrev} (${lesson.roomAbbrev || lesson.roomName})`;
        }

        // Description
        const descLines: string[] = [
          `Předmět: ${lesson.subjectName} (${lesson.subjectAbbrev})`,
          `Vyučující: ${lesson.teacherName || lesson.teacherAbbrev || 'Neuvedeno'}`,
          `Učebna: ${lesson.roomName || lesson.roomAbbrev || 'Neuvedeno'}`,
          `Skupina: ${lesson.groupName || 'Celá třída'}`,
          `Hodina: ${lesson.periodCaption}. vyučovací hodina (${lesson.startTime} – ${lesson.endTime})`,
        ];

        if (lesson.theme) {
          descLines.push(`Téma výuky: ${lesson.theme}`);
        }

        if (lesson.change) {
          descLines.push(`Změna/Suplování: ${lesson.change.description}`);
        }

        if (options.includeHomeworkNotes && lesson.notice) {
          descLines.push(`Poznámka: ${lesson.notice}`);
        }

        descLines.push(`Zdroj: Bakaláři SPŠD Motol`);

        const formattedDesc = descLines.join('\\n');
        const uid = `spsd-${lesson.dayDate}-${lesson.hourId}-${lesson.subjectId}@mot-spsd.bakalari.cz`;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${nowStamp}`);
        lines.push(`DTSTART;TZID=Europe/Prague:${dtStartStr}`);
        lines.push(`DTEND;TZID=Europe/Prague:${dtEndStr}`);
        lines.push(`SUMMARY:${this.escapeIcsText(summary)}`);
        lines.push(`DESCRIPTION:${this.escapeIcsText(formattedDesc)}`);
        if (lesson.roomAbbrev || lesson.roomName) {
          lines.push(`LOCATION:${this.escapeIcsText(`SPŠD Motol - ${lesson.roomAbbrev || lesson.roomName}`)}`);
        }

        if (lesson.isCanceled) {
          lines.push('STATUS:CANCELLED');
        } else {
          lines.push('STATUS:CONFIRMED');
        }

        // Recurring for permanent semester if selected
        if (options.scope === 'permanent-semester') {
          // Recur weekly until end of current school semester (e.g. 2027-01-31 or 2027-06-30)
          const nowYear = new Date().getFullYear();
          const untilDate = `${nowYear + 1}0630T235959Z`;
          lines.push(`RRULE:FREQ=WEEKLY;UNTIL=${untilDate}`);
        }

        // Notification alarm
        if (options.alertMinutesBefore > 0) {
          lines.push('BEGIN:VALARM');
          lines.push('ACTION:DISPLAY');
          lines.push(`DESCRIPTION:Za ${options.alertMinutesBefore} minut začíná hodina: ${this.escapeIcsText(lesson.subjectName)}`);
          lines.push(`TRIGGER:-PT${options.alertMinutesBefore}M`);
          lines.push('END:VALARM');
        }

        lines.push('END:VEVENT');
      });
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Generates a direct Google Calendar Web add link for an individual lesson
   */
  static getGoogleCalendarUrl(lesson: NormalizedLesson): string {
    const dateParts = lesson.dayDate.split('-');
    if (dateParts.length !== 3) return '';

    const [startH, startM] = lesson.startTime.split(':').map(Number);
    const [endH, endM] = lesson.endTime.split(':').map(Number);

    // Google Calendar format in UTC or local
    const startStr = `${dateParts[0]}${dateParts[1]}${dateParts[2]}T${String(startH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;
    const endStr = `${dateParts[0]}${dateParts[1]}${dateParts[2]}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

    let title = `${lesson.subjectName} (${lesson.roomAbbrev || 'Učebna'})`;
    if (lesson.isCanceled) title = `[ODPADÁ] ${title}`;
    else if (lesson.isSubstituted) title = `[SUPLOVÁNÍ] ${title}`;

    const details = [
      `Vyučující: ${lesson.teacherName || lesson.teacherAbbrev}`,
      `Učebna: ${lesson.roomName || lesson.roomAbbrev}`,
      `Skupina: ${lesson.groupName}`,
      lesson.theme ? `Téma: ${lesson.theme}` : '',
      lesson.change ? `Změna: ${lesson.change.description}` : '',
      'Bakaláři SPŠD Motol',
    ]
      .filter(Boolean)
      .join('\n');

    const location = `SPŠD Motol, Plzeňská 298/217a, Praha 5 - ${lesson.roomAbbrev || lesson.roomName}`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${startStr}/${endStr}`,
      ctz: 'Europe/Prague',
      details: details,
      location: location,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Triggers download of generated .ics file in browser
   */
  static downloadIcsFile(icsString: string, filename = 'Rozvrh_SPSD_Motol.ics'): void {
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  private static formatIcsTimestamp(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  }

  private static escapeIcsText(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }
}
