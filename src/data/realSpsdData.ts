import { BakalariTimetableResponse, BakalariUser } from '../types/bakalari';

export const REAL_STUDENT_USER: BakalariUser = {
  FullName: 'Vojtěch Garčic',
  UserType: 'student',
  Class: {
    Id: '3.A',
    Abbrev: '3.A',
    Name: '3.A (SPŠD Motol)',
  },
};

export const REAL_SPSD_HOURS = [
  { Id: 0, Caption: '0', BeginTime: '07:10', EndTime: '07:55' },
  { Id: 1, Caption: '1', BeginTime: '08:00', EndTime: '08:45' },
  { Id: 2, Caption: '2', BeginTime: '08:50', EndTime: '09:35' },
  { Id: 3, Caption: '3', BeginTime: '09:45', EndTime: '10:30' },
  { Id: 4, Caption: '4', BeginTime: '10:50', EndTime: '11:35' },
  { Id: 5, Caption: '5', BeginTime: '11:40', EndTime: '12:25' },
  { Id: 6, Caption: '6', BeginTime: '12:35', EndTime: '13:20' },
  { Id: 7, Caption: '7', BeginTime: '13:25', EndTime: '14:10' },
  { Id: 8, Caption: '8', BeginTime: '14:20', EndTime: '15:05' },
  { Id: 9, Caption: '9', BeginTime: '15:10', EndTime: '15:55' },
];

export function getRealSpsdTimetable(baseDateStr?: string): BakalariTimetableResponse {
  let mondayDate: Date;
  if (baseDateStr) {
    const parts = baseDateStr.split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const day = d.getDay(); // 0 is Sunday, 1 is Monday
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      mondayDate = new Date(parts[0], parts[1] - 1, diff);
    } else {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      mondayDate = new Date(now.getFullYear(), now.getMonth(), diff);
    }
  } else {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    mondayDate = new Date(now.getFullYear(), now.getMonth(), diff);
  }

  const getIsoDate = (offset: number) => {
    const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayNum}T00:00:00`;
  };

  return {
    Hours: REAL_SPSD_HOURS,
    Classes: [{ Id: '3.A', Abbrev: '3.A', Name: '3.A (SPŠD Motol)' }],
    Groups: [
      { Id: '3.A', Abbrev: '3.A celá', Name: '3.A celá třída', ClassId: '3.A' },
      { Id: '3.A sk1', Abbrev: '3.A sk1', Name: '1. skupina', ClassId: '3.A' },
      { Id: '3.A sem', Abbrev: '3.A sem', Name: 'Volitelné semináře', ClassId: '3.A' },
      { Id: '3.A ak1', Abbrev: '3.A ak1', Name: '1. skupina AK', ClassId: '3.A' },
      { Id: '3.A tvk1', Abbrev: '3.A tvk1', Name: 'Tělesná výchova kluci', ClassId: '3.A' },
    ],
    Subjects: [
      { Id: 'DT', Abbrev: 'DT', Name: 'Dopravní telematika' },
      { Id: 'AJ', Abbrev: 'AJ', Name: 'Anglický jazyk' },
      { Id: 'TKS', Abbrev: 'TKS', Name: 'Telekomunikace a sítě' },
      { Id: 'MOD', Abbrev: 'MOD', Name: 'Modelování a aditivní technologie' },
      { Id: 'OBN', Abbrev: 'OBN', Name: 'Občanská nauka' },
      { Id: 'SFY', Abbrev: 'SFY', Name: 'Seminář z fyziky' },
      { Id: 'MAT', Abbrev: 'MAT', Name: 'Matematika' },
      { Id: 'DBS', Abbrev: 'DBS', Name: 'Databázové systémy' },
      { Id: 'GTV', Abbrev: 'GTV', Name: 'Grafická tvorba' },
      { Id: 'ČJL', Abbrev: 'ČJL', Name: 'Český jazyk a literatura' },
      { Id: 'EKF', Abbrev: 'EKF', Name: 'Ekonomika a finance' },
      { Id: 'SMA', Abbrev: 'SMA', Name: 'Seminář z matematiky' },
      { Id: 'PRX', Abbrev: 'PRX', Name: 'Praxe' },
      { Id: 'PRG', Abbrev: 'PRG', Name: 'Programování' },
      { Id: 'TV', Abbrev: 'TV', Name: 'Tělesná výchova' },
    ],
    Teachers: [
      { Id: 'TE', Abbrev: 'TE', Name: 'Ing. Bc. Jan Tesař MBA' },
      { Id: 'BA', Abbrev: 'BA', Name: 'Lee Barber' },
      { Id: 'HB', Abbrev: 'HB', Name: 'Mgr. Miroslav Habrovanský' },
      { Id: 'BL', Abbrev: 'BL', Name: 'Ing. Veronika Bártlová' },
      { Id: 'VT', Abbrev: 'VT', Name: 'Mgr. Karel Vítek' },
      { Id: 'HD', Abbrev: 'HD', Name: 'Ing. Dagmar Hadová' },
      { Id: 'TŽ', Abbrev: 'TŽ', Name: 'Ing. Jitka Tužilová' },
      { Id: 'KK', Abbrev: 'KK', Name: 'Ing. Kamila Kozakovičová' },
      { Id: 'FO', Abbrev: 'FO', Name: 'Mgr. Anna Formáčková' },
      { Id: 'CH', Abbrev: 'CH', Name: 'Ing. Lukáš Chalupa' },
      { Id: 'PR', Abbrev: 'PR', Name: 'Mgr. Jiřina Procházková' },
      { Id: 'ŠE', Abbrev: 'ŠE', Name: 'Mgr. Dominik Šefčík' },
      { Id: 'VO', Abbrev: 'VO', Name: 'Mgr. Šárka Voráčová Ph.D.' },
      { Id: 'RŮ', Abbrev: 'RŮ', Name: 'Mgr. Adam Růžek' },
    ],
    Rooms: [
      { Id: 'A104', Abbrev: 'A104', Name: 'A104 - počítačová učebna' },
      { Id: 'A205', Abbrev: 'A205', Name: 'A205 - jazyková učebna' },
      { Id: 'D121', Abbrev: 'D121', Name: 'D121 - CISCO' },
      { Id: 'A314', Abbrev: 'A314', Name: 'A314 - počítačová grafika' },
      { Id: 'A210', Abbrev: 'A210', Name: 'A210 - běžná učebna' },
      { Id: 'A208', Abbrev: 'A208', Name: 'A208 - běžná učebna' },
      { Id: 'A315', Abbrev: 'A315', Name: 'A315 - přírodovědecká učebna' },
      { Id: 'A312', Abbrev: 'A312', Name: 'A312 - počítačová učebna' },
      { Id: 'A103', Abbrev: 'A103', Name: 'A103 - běžná učebna' },
      { Id: 'A206', Abbrev: 'A206', Name: 'A206 - elektrotechnická učebna' },
      { Id: 'A211', Abbrev: 'A211', Name: 'A211 - běžná učebna' },
      { Id: 'A209', Abbrev: 'A209', Name: 'A209 - běžná učebna' },
      { Id: 'A313', Abbrev: 'A313', Name: 'A313 - počítačová grafika' },
      { Id: 'SOK', Abbrev: 'SOK', Name: 'SOK - sokolovna' },
    ],
    Cycles: [],
    Days: [
      // 1. PONDĚLÍ
      {
        Date: getIsoDate(0),
        DayOfWeek: 1,
        DayDescription: 'Pondělí',
        DayType: 'Workday',
        Atoms: [
          {
            HourId: 0,
            GroupIds: ['3.A'],
            SubjectId: 'DT',
            TeacherId: 'TE',
            RoomId: 'A104',
            Theme: 'Dopravní data a detektory/aktory',
          },
          {
            HourId: 1,
            GroupIds: ['3.A'],
            SubjectId: 'DT',
            TeacherId: 'TE',
            RoomId: 'A104',
            Theme: 'Dopravní data a detektory/aktory',
          },
          {
            HourId: 2,
            GroupIds: ['3.A sk1'],
            SubjectId: 'AJ',
            TeacherId: 'BA',
            RoomId: 'A205',
            Theme: 'Unit 1: page 10, past continuous review & Kahoot quiz',
          },
          {
            HourId: 3,
            GroupIds: ['3.A'],
            SubjectId: 'TKS',
            TeacherId: 'HB',
            RoomId: 'D121',
            Theme: 'směrování mezi sítěmi',
          },
          {
            HourId: 5,
            GroupIds: ['3.A sk1'],
            SubjectId: 'MOD',
            TeacherId: 'BL',
            RoomId: 'A314',
            Theme: 'AutoCAD 3D',
            Notice: 'Lego kostka',
          },
          {
            HourId: 6,
            GroupIds: ['3.A sk1'],
            SubjectId: 'MOD',
            TeacherId: 'BL',
            RoomId: 'A314',
            Theme: 'AutoCAD 3D',
            Notice: 'Lego kostka',
          },
          {
            HourId: 7,
            GroupIds: ['3.A'],
            SubjectId: 'UI',
            TeacherId: 'KOZ',
            RoomId: '',
            Theme: '',
            Change: {
              ChangeType: 'Canceled',
              Description: 'Zrušeno: UI, Kozakovič Radko',
            },
          },
        ],
      },

      // 2. ÚTERÝ
      {
        Date: getIsoDate(1),
        DayOfWeek: 2,
        DayDescription: 'Úterý',
        DayType: 'Workday',
        Atoms: [
          {
            HourId: 1,
            GroupIds: ['3.A'],
            SubjectId: 'OBN',
            TeacherId: 'VT',
            RoomId: 'A210',
            Theme: 'Národní banka',
            Notice: 'Domácí úkol: Příští týden Test',
          },
          {
            HourId: 2,
            GroupIds: ['3.A sem'],
            SubjectId: 'SFY',
            TeacherId: 'HD',
            RoomId: 'A208',
            Theme: 'Pohyb po kružnici',
            Change: {
              ChangeType: 'Substitution',
              Description: 'Suplování: Hadová Dagmar zastupuje za RO',
            },
          },
          {
            HourId: 3,
            GroupIds: ['3.A'],
            SubjectId: 'MAT',
            TeacherId: 'TŽ',
            RoomId: 'A315',
            Theme: 'příprava na test Pythagorova a Euklidovy věty',
            Notice: 'Domácí úkol: Opakování k testu',
          },
          {
            HourId: 4,
            GroupIds: ['3.A'],
            SubjectId: 'MAT',
            TeacherId: 'TŽ',
            RoomId: 'A315',
            Theme: 'test Pythagorova a Euklidovy věty',
          },
          {
            HourId: 5,
            GroupIds: ['3.A'],
            SubjectId: 'DBS',
            TeacherId: 'KK',
            RoomId: 'A312',
            Theme: 'opakování',
            Notice: 'Písemná práce: klíče, relační model, datové typy',
          },
          {
            HourId: 6,
            GroupIds: ['3.A sk1'],
            SubjectId: 'DBS',
            TeacherId: 'KK',
            RoomId: 'A312',
            Theme: 'Písemná práce',
          },
        ],
      },

      // 3. STŘEDA
      {
        Date: getIsoDate(2),
        DayOfWeek: 3,
        DayDescription: 'Středa',
        DayType: 'Workday',
        Atoms: [
          {
            HourId: 0,
            GroupIds: ['3.A sk1'],
            SubjectId: 'GTV',
            TeacherId: 'BL',
            RoomId: 'A314',
            Theme: 'Vektorová grafika',
            Notice: 'Práce v Adobe Illustrator',
          },
          {
            HourId: 1,
            GroupIds: ['3.A sk1'],
            SubjectId: 'GTV',
            TeacherId: 'BL',
            RoomId: 'A314',
            Theme: 'Vektorová grafika',
            Notice: 'Práce v Adobe Illustrator',
          },
          {
            HourId: 2,
            GroupIds: ['3.A'],
            SubjectId: 'ČJL',
            TeacherId: 'FO',
            RoomId: 'A103',
            Theme: 'Otokar Březina',
          },
          {
            HourId: 3,
            GroupIds: ['3.A sk1'],
            SubjectId: 'AJ',
            TeacherId: 'BA',
            RoomId: 'A206',
            Theme: 'Unit 1: Review of phrasal verbs, Used to, Family tension',
          },
          {
            HourId: 4,
            GroupIds: ['3.A ak1'],
            SubjectId: 'AJ',
            TeacherId: 'ŠE',
            RoomId: 'A206',
            Theme: 'Prezentace: Inflatable ducks; Diskuze - rozmazlování dětí',
          },
          {
            HourId: 5,
            GroupIds: ['3.A'],
            SubjectId: 'ČJL',
            TeacherId: 'FO',
            RoomId: 'A211',
            Theme: 'Březina',
          },
          {
            HourId: 7,
            GroupIds: ['3.A'],
            SubjectId: 'EKF',
            TeacherId: 'CH',
            RoomId: 'A209',
            Theme: 'Marketing',
          },
          {
            HourId: 8,
            GroupIds: ['3.A'],
            SubjectId: 'MAT',
            TeacherId: 'TŽ',
            RoomId: 'A208',
            Theme: 'pravoúhlý trojúhelník - slovní úlohy',
          },
        ],
      },

      // 4. ČTVRTEK
      {
        Date: getIsoDate(3),
        DayOfWeek: 4,
        DayDescription: 'Čtvrtek',
        DayType: 'Workday',
        Atoms: [
          {
            HourId: 3,
            GroupIds: ['3.A'],
            SubjectId: 'SFY',
            TeacherId: 'ROL',
            RoomId: '',
            Theme: '',
            Change: {
              ChangeType: 'Canceled',
              Description: 'Zrušeno: SFY, Rollová Jitka',
            },
          },
          {
            HourId: 4,
            GroupIds: ['3.A'],
            SubjectId: 'TKS',
            TeacherId: 'HB',
            RoomId: 'A104',
            Theme: 'směrování mezi sítěmi',
          },
          {
            HourId: 5,
            GroupIds: ['3.A sem'],
            SubjectId: 'SMA',
            TeacherId: 'PR',
            RoomId: 'A315',
            Theme: 'Definiční obor výrazů',
          },
          {
            HourId: 6,
            GroupIds: ['3.A sem'],
            SubjectId: 'SMA',
            TeacherId: 'PR',
            RoomId: 'A315',
            Theme: 'Definiční obor výrazů a jejich úpravy',
          },
          {
            HourId: 7,
            GroupIds: ['3.A'],
            SubjectId: 'ČJL',
            TeacherId: 'FO',
            RoomId: 'A313',
            Theme: 'Česká moderna',
          },
          {
            HourId: 8,
            GroupIds: ['3.A sk1'],
            SubjectId: 'PRX',
            TeacherId: 'HB',
            RoomId: 'D121',
            Theme: 'Opakování sítě',
          },
          {
            HourId: 9,
            GroupIds: ['3.A sk1'],
            SubjectId: 'PRX',
            TeacherId: 'HB',
            RoomId: 'D121',
            Theme: 'Opakování sítě',
          },
        ],
      },

      // 5. PÁTEK
      {
        Date: getIsoDate(4),
        DayOfWeek: 5,
        DayDescription: 'Pátek',
        DayType: 'Workday',
        Atoms: [
          {
            HourId: 1,
            GroupIds: ['3.A'],
            SubjectId: 'ČJL',
            TeacherId: 'FO',
            RoomId: '',
            Theme: '',
            Change: {
              ChangeType: 'Canceled',
              Description: 'Vyjmuto z rozvrhu: ČJL, Formáčková Anna',
            },
          },
          {
            HourId: 2,
            GroupIds: ['3.A'],
            SubjectId: 'PRG',
            TeacherId: 'VO',
            RoomId: 'A104',
            Theme: 'Agentní programování',
          },
          {
            HourId: 3,
            GroupIds: ['3.A sk1'],
            SubjectId: 'PRG',
            TeacherId: 'VO',
            RoomId: 'A104',
            Theme: 'Programování v laboratoři',
          },
          {
            HourId: 5,
            GroupIds: ['3.A tvk1'],
            SubjectId: 'TV',
            TeacherId: 'RŮ',
            RoomId: 'SOK',
            Theme: 'Tělesná výchova v sokolovně',
          },
          {
            HourId: 6,
            GroupIds: ['3.A tvk1'],
            SubjectId: 'TV',
            TeacherId: 'RŮ',
            RoomId: 'SOK',
            Theme: 'Tělesná výchova v sokolovně',
          },
        ],
      },
    ],
  };
}
