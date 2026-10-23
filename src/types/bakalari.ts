export interface BakalariHour {
  Id: number;
  Caption: string;
  BeginTime: string; // e.g. "08:00"
  EndTime: string;   // e.g. "08:45"
}

export interface BakalariChange {
  ChangeSubject?: string;
  Day?: string;
  Hours?: string;
  ChangeType: string; // 'Canceled' | 'Added' | 'Removed' | 'RoomChanged' | 'Substitution'
  Description: string;
  Time?: string;
  TypeDescription?: string;
}

export interface BakalariAtom {
  HourId: number;
  GroupIds: string[];
  SubjectId: string;
  TeacherId: string;
  RoomId: string;
  Theme: string;
  Notice?: string;
  Change?: BakalariChange | null;
  CycleIds?: string[];
}

export interface BakalariDay {
  Date: string; // ISO date
  DayOfWeek: number; // 1 = Po, 2 = Út, 3 = St, 4 = Čt, 5 = Pá
  DayDescription: string;
  DayType: string;
  Atoms: BakalariAtom[];
}

export interface BakalariEntity {
  Id: string;
  Abbrev: string;
  Name: string;
}

export interface BakalariClassEntity extends BakalariEntity {}
export interface BakalariGroupEntity extends BakalariEntity {
  ClassId?: string;
}

export interface BakalariTimetableResponse {
  Hours: BakalariHour[];
  Days: BakalariDay[];
  Classes: BakalariClassEntity[];
  Groups: BakalariGroupEntity[];
  Subjects: BakalariEntity[];
  Teachers: BakalariEntity[];
  Rooms: BakalariEntity[];
  Cycles: BakalariEntity[];
}

export interface BakalariUser {
  FullName: string;
  UserType: string; // "student" | "parent" | "teacher"
  Class?: {
    Id: string;
    Abbrev: string;
    Name: string;
  };
}

export interface BakalariAuthToken {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export interface LessonChangeInfo {
  type: 'canceled' | 'substitution' | 'roomChange' | 'added' | 'none';
  label: string;
  description: string;
}

export interface NormalizedLesson {
  id: string;
  dayIndex: number; // 0 = Po, 1 = Út, 2 = St, 3 = Čt, 4 = Pá
  dayDate: string; // YYYY-MM-DD
  dayName: string; // "Pondělí", etc.
  hourId: number;
  periodCaption: string; // "1", "2" ...
  startTime: string; // "08:00"
  endTime: string; // "08:45"
  subjectId: string;
  subjectName: string;
  subjectAbbrev: string;
  teacherId: string;
  teacherName: string;
  teacherAbbrev: string;
  roomId: string;
  roomName: string;
  roomAbbrev: string;
  groupId: string;
  groupName: string;
  theme: string;
  notice?: string;
  change: LessonChangeInfo | null;
  isCanceled: boolean;
  isSubstituted: boolean;
  isRoomChanged: boolean;
  isAdded: boolean;
  colorCategory: string; // e.g. 'tech', 'math', 'lang', 'humanities', 'pe', 'general'
}

export interface TimetableWeekData {
  hours: BakalariHour[];
  days: {
    dayOfWeek: number;
    date: string;
    dayDescription: string;
    lessons: NormalizedLesson[];
  }[];
  classes: BakalariClassEntity[];
  teachers: BakalariEntity[];
  rooms: BakalariEntity[];
  subjects: BakalariEntity[];
  groups: BakalariGroupEntity[];
  weekRangeText: string;
  targetDate: string;
}

export interface CalendarExportOptions {
  scope: 'current-week' | 'current-month' | 'permanent-semester';
  includeSuplovani: boolean;
  includeHomeworkNotes: boolean;
  alertMinutesBefore: number; // 0, 5, 10, 15, 30
  selectedGroupFilter?: string; // all or specific group id
  customSummaryFormat: 'abbrev-room' | 'full-room' | 'abbrev-teacher-room';
}
