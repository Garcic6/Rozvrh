import {
  BakalariAuthToken,
  BakalariTimetableResponse,
  BakalariUser,
  NormalizedLesson,
  TimetableWeekData,
  LessonChangeInfo,
} from '../types/bakalari';
import { getMockSpsdTimetable } from '../data/mockSpsdData';
import { getRealSpsdTimetable, REAL_STUDENT_USER } from '../data/realSpsdData';
import { parseBakalariTimetableHtml, extractStudentFromHtml } from './bakalariHtmlParser';
import { DiagnosticsService } from './diagnosticsService';

const AUTH_STORAGE_KEY = 'bakalari_auth_token';
const USER_STORAGE_KEY = 'bakalari_user_info';
const SERVER_URL_STORAGE_KEY = 'bakalari_server_url';
const DEMO_MODE_STORAGE_KEY = 'bakalari_demo_mode';
const NOTES_STORAGE_KEY = 'spsd_lesson_notes';
const REAL_CACHE_STORAGE_KEY = 'bakalari_real_timetable_cache';
const LAST_SYNC_STORAGE_KEY = 'bakalari_last_sync_timestamp';

export const DEFAULT_SCHOOL_URL = 'https://mot-spsd.bakalari.cz/bakaweb';

export class BakalariService {
  // Check if currently in demo mode (default is true if not authenticated)
  static isDemoMode(): boolean {
    const token = this.getStoredToken();
    if (!token?.access_token) {
      return true;
    }
    const val = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
    return val === 'true';
  }

  static setDemoMode(active: boolean): void {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, active ? 'true' : 'false');
  }

  static getServerUrl(): string {
    const stored = localStorage.getItem(SERVER_URL_STORAGE_KEY) || DEFAULT_SCHOOL_URL;
    let clean = stored.trim().replace(/\/+$/, '');
    if (clean.toLowerCase().includes('mot-spsd.bakalari.cz') && !clean.toLowerCase().includes('/bakaweb')) {
      clean = `${clean}/bakaweb`;
    }
    return clean;
  }

  static setServerUrl(url: string): void {
    let clean = url.trim().replace(/\/+$/, '');
    if (clean.toLowerCase().includes('mot-spsd.bakalari.cz') && !clean.toLowerCase().includes('/bakaweb')) {
      clean = `${clean}/bakaweb`;
    }
    localStorage.setItem(SERVER_URL_STORAGE_KEY, clean);
  }

  static getStoredToken(): BakalariAuthToken | null {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setStoredToken(token: BakalariAuthToken | null): void {
    if (!token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(token));
    }
  }

  static getStoredUser(): BakalariUser | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setStoredUser(user: BakalariUser | null): void {
    if (!user) {
      localStorage.removeItem(USER_STORAGE_KEY);
    } else {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  }

  static getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_STORAGE_KEY);
  }

  static setLastSyncTime(): void {
    localStorage.setItem(LAST_SYNC_STORAGE_KEY, new Date().toISOString());
  }

  static isAuthenticated(): boolean {
    return !this.isDemoMode() && !!this.getStoredToken()?.access_token;
  }

  static logout(): void {
    this.setStoredToken(null);
    this.setStoredUser(null);
    this.setDemoMode(true);
    localStorage.removeItem(REAL_CACHE_STORAGE_KEY);
    localStorage.removeItem(LAST_SYNC_STORAGE_KEY);
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('bakalari_cache_')) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // ignore
    }
  }

  // Calculate Monday of the given date
  static getMondayOf(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay(); // 0 is Sunday, 1 is Monday
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  static getMondayOfCurrentWeek(): Date {
    return this.getMondayOf(new Date());
  }

  static getMondayOfNextWeek(): Date {
    const mon = this.getMondayOf(new Date());
    mon.setDate(mon.getDate() + 7);
    return mon;
  }

  // Login to Bakalari via our Express proxy
  static async login(
    username: string,
    password: string,
    serverUrl?: string,
    persistent = true
  ): Promise<{ user: BakalariUser; token: BakalariAuthToken; details?: any }> {
    const targetUrl = serverUrl || this.getServerUrl();
    const cleanUser = username.trim();
    const start = performance.now();

    DiagnosticsService.addLog({
      category: 'AUTH',
      level: 'info',
      title: `Zahájeno přihlašování uživatele "${cleanUser}"`,
      url: `${targetUrl}/api/login`,
      method: 'POST',
      requestData: {
        username: cleanUser,
        targetServer: targetUrl,
        persistent,
      },
    });

    let res: Response;
    let data: any;

    try {
      console.log(`[FRONTEND LOGIN] Odesílám POST /api/bakalari/login pro uživatele "${cleanUser}" na server "${targetUrl}"`);
      res = await fetch('/api/bakalari/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password, serverUrl: targetUrl, persistent }),
      });

      // On GitHub Pages or static host, /api/* returns 404 HTML
      if (res.status === 404) {
        console.log('[FRONTEND LOGIN] /api/bakalari/login vrátil 404 (statický web / GitHub Pages). Zkouším CORS proxy...');
        try {
          const bodyParams = new URLSearchParams();
          bodyParams.append('client_id', 'ANDR');
          bodyParams.append('grant_type', 'password');
          bodyParams.append('username', cleanUser);
          bodyParams.append('password', password);

          const corsRes = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(targetUrl + '/api/login')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: bodyParams.toString(),
          });

          if (corsRes.ok) {
            const corsData = await corsRes.json();
            if (corsData?.access_token) {
              res = corsRes;
              data = corsData;
            }
          }
        } catch (corsErr) {
          console.warn('[CORS PROXY ERROR]:', corsErr);
        }
      }

      if (!data) {
        const rawText = await res.text();
        console.log(`[FRONTEND LOGIN] HTTP Status: ${res.status}, Surová odpověď:`, rawText.slice(0, 300));
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          console.error('[FRONTEND LOGIN] Chyba parsování JSON:', parseErr);
        }
      }
    } catch (fetchErr: any) {
      console.error('[FRONTEND LOGIN CATCH ERROR]:', fetchErr);
      const isStatic = this.isStaticHost();
      const message = isStatic
        ? 'Na GitHub Pages neběží Node.js proxy server. Použijte prosím tlačítko "Spustit ukázkový rozvrh 3.A" nebo importujte HTML kód rozvrhu.'
        : `Chyba spojení s proxy: ${fetchErr.message}`;

      const err: any = new Error(message);
      err.networkError = true;
      throw err;
    }

    const durationMs = Math.round(performance.now() - start);

    if (!res.ok) {
      const isBadCredentials =
        res.status === 401 ||
        data?.errorCode === 'INVALID_CREDENTIALS' ||
        data?.details?.error === 'invalid_grant' ||
        data?.details?.error_description?.includes('Špatný');

      let recommendation = isBadCredentials
        ? 'Uživatelské jméno nebo heslo nebylo serverem mot-spsd.bakalari.cz přijato. Zkontrolujte prosím velikost písmen (Caps Lock).'
        : `Server vrátil kód ${res.status}.`;

      if (res.status === 404 && this.isStaticHost()) {
        recommendation = 'Tato aplikace je nasazena na GitHub Pages (statický hosting). Přímé přihlášení vyžaduje backend proxy, ale můžete okamžitě využít ukázkový režim 3.A nebo importovat HTML (Ctrl+U).';
      }

      DiagnosticsService.addLog({
        category: 'AUTH',
        level: 'error',
        title: `Přihlášení selhalo (HTTP ${res.status}): ${data?.error || 'Neznámá chyba'}`,
        url: `${targetUrl}/api/login`,
        method: 'POST',
        status: res.status,
        durationMs,
        responseData: data,
        recommendation,
      });

      const status = res.status;
      const targetEndpoint = data?.targetUrl || `${targetUrl}/api/login`;
      let baseError = data?.error || 'Přihlášení se nezdařilo.';
      if (status === 404 && this.isStaticHost()) {
        baseError = 'Na GitHub Pages není dostupný backend proxy server. Použijte import HTML (Ctrl+U) nebo ukázkový rozvrh 3.A.';
      }
      const detailedMessage = `[HTTP ${status}]: ${baseError}`;

      const err: any = new Error(detailedMessage);
      err.status = status;
      err.targetUrl = targetEndpoint;
      err.details = data;
      err.recommendation = recommendation;
      throw err;
    }

    DiagnosticsService.addLog({
      category: 'AUTH',
      level: 'success',
      title: `Přihlášení úspěšné! Token získán pro uživatele "${cleanUser}"`,
      url: `${targetUrl}/api/login`,
      method: 'POST',
      status: 200,
      durationMs,
      responseData: {
        token_type: data.token_type,
        expires_in: data.expires_in,
        user: data.user,
      },
    });

    const token: BakalariAuthToken = {
      access_token: data.access_token,
      token_type: data.token_type || 'Bearer',
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };

    this.setStoredToken(token);
    this.setServerUrl(targetUrl);
    this.setDemoMode(false);

    const userInfo: BakalariUser = data.user || {
      FullName: cleanUser,
      UserType: 'student',
    };

    console.log(`[AUTH LOGIN SUCCESS] Přihlášení úspěšné pro uživatele "${cleanUser}". Token uložen.`);

    if (data?.initialTimetable && typeof data.initialTimetable === 'object') {
      try {
        localStorage.setItem(REAL_CACHE_STORAGE_KEY, JSON.stringify(data.initialTimetable));
      } catch (e) {
        console.warn('Nepodařilo se uložit initialTimetable:', e);
      }
    }

    this.setStoredUser(userInfo);
    this.setLastSyncTime();
    return { user: userInfo, token, details: data };
  }

  // Quick helper to enable sample student profile for testing
  static useSampleStudent(): { user: BakalariUser; data: TimetableWeekData } {
    this.setStoredUser(REAL_STUDENT_USER);
    this.setDemoMode(false);
    this.setLastSyncTime();
    const raw = getRealSpsdTimetable();
    const normalized = this.normalizeBakalariTimetable(raw, this.formatDateIso(new Date()));
    localStorage.setItem(REAL_CACHE_STORAGE_KEY, JSON.stringify(raw));
    return { user: REAL_STUDENT_USER, data: normalized };
  }

  // Refresh token using refresh_token grant
  static async refreshToken(): Promise<boolean> {
    const currentToken = this.getStoredToken();
    if (!currentToken?.refresh_token) return false;

    try {
      const res = await fetch('/api/bakalari/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: currentToken.refresh_token,
          serverUrl: this.getServerUrl(),
        }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      if (!data?.access_token) return false;

      const newToken: BakalariAuthToken = {
        access_token: data.access_token,
        token_type: data.token_type || 'Bearer',
        refresh_token: data.refresh_token || currentToken.refresh_token,
        expires_in: data.expires_in,
      };
      this.setStoredToken(newToken);
      return true;
    } catch {
      return false;
    }
  }

  static isStaticHost(): boolean {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return (
      host.endsWith('github.io') ||
      host.includes('pages.dev') ||
      window.location.protocol === 'file:' ||
      (host === 'localhost' && window.location.port === '5173')
    );
  }

  static getCacheKey(dateStr: string, forcePermanent = false): string {
    return forcePermanent ? 'bakalari_cache_permanent' : `bakalari_cache_${dateStr}`;
  }

  // Synchronously retrieves timetable for 0ms instant render from cache or embedded real SPŠD dataset
  static getInstantTimetable(targetDate: Date, forcePermanent = false): TimetableWeekData {
    const dateStr = this.formatDateIso(targetDate);

    // 0. If in demo mode (not logged in), return official demo timetable
    if (this.isDemoMode()) {
      const mockRaw = getMockSpsdTimetable(dateStr);
      return this.normalizeBakalariTimetable(mockRaw, dateStr);
    }

    const cacheKey = this.getCacheKey(dateStr, forcePermanent);

    // 1. Week-specific cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const raw = JSON.parse(cached);
        if (raw && (raw.Days?.length > 0 || raw.Hours?.length > 0)) {
          return this.normalizeBakalariTimetable(raw, dateStr);
        }
      }
    } catch {
      // ignore
    }

    // 2. Generic real cache (from previous login or HTML import)
    try {
      const realCached = localStorage.getItem(REAL_CACHE_STORAGE_KEY);
      if (realCached) {
        const raw = JSON.parse(realCached);
        if (raw && (raw.Days?.length > 0 || raw.Hours?.length > 0)) {
          return this.normalizeBakalariTimetable(raw, dateStr);
        }
      }
    } catch {
      // ignore
    }

    // 3. Fallback to authentic SPŠD Motol 3.A schedule (immediate 0ms response)
    const defaultRaw = getRealSpsdTimetable(dateStr);
    return this.normalizeBakalariTimetable(defaultRaw, dateStr);
  }

  // Fetch timetable for a given reference date with GitHub Pages resilience & instant caching
  static async fetchTimetable(targetDate: Date, forcePermanent = false, classId = 'ZI'): Promise<TimetableWeekData> {
    const dateStr = this.formatDateIso(targetDate);
    const cacheKey = this.getCacheKey(dateStr, forcePermanent);

    // 1. If user explicitly enabled Demo mode:
    if (this.isDemoMode()) {
      const mockRaw = getMockSpsdTimetable(dateStr);
      return this.normalizeBakalariTimetable(mockRaw, dateStr);
    }

    const token = this.getStoredToken();
    const serverUrl = this.getServerUrl();

    // If no active token, immediately return instant timetable without erroring
    if (!token?.access_token || token.access_token.length < 20) {
      return this.getInstantTimetable(targetDate, forcePermanent);
    }

    const authHeader = `Bearer ${token.access_token}`;

    // Helper to perform authenticated request with auto-refresh on 401
    const executeFetch = async (url: string) => {
      console.log(`[FRONTEND TIMETABLE REQUEST] GET ${url}`);
      let res: Response;
      try {
        res = await fetch(url, {
          headers: { Authorization: authHeader },
        });
      } catch (err) {
        console.warn(`[FRONTEND TIMETABLE FETCH ERROR] pro URL ${url} (pravděpodobně GitHub Pages):`, err);
        throw err;
      }

      // Clone to inspect raw text in console
      const clone = res.clone();
      const rawText = await clone.text().catch(() => '');
      console.log(`[FRONTEND TIMETABLE RESPONSE] Status: ${res.status} pro URL: ${url}`);

      // If token expired, try refreshing once
      if (res.status === 401 && token?.refresh_token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const newToken = this.getStoredToken();
          if (newToken?.access_token) {
            res = await fetch(url, {
              headers: { Authorization: `Bearer ${newToken.access_token}` },
            });
          }
        }
      }

      return res;
    };

    try {
      const endpoint = forcePermanent
        ? `/api/bakalari/timetable/permanent?serverUrl=${encodeURIComponent(serverUrl)}`
        : `/api/bakalari/timetable/actual?date=${encodeURIComponent(dateStr)}&serverUrl=${encodeURIComponent(serverUrl)}`;

      let res: Response;
      try {
        res = await executeFetch(endpoint);
      } catch (fetchErr) {
        // Network error (running on GitHub Pages or offline) -> return instant cache
        console.warn('[BAKALARI OFFLINE/STATIC] Nelze kontaktovat proxy server. Používám lokální rozvrh.');
        return this.getInstantTimetable(targetDate, forcePermanent);
      }

      // If 404 from static host (e.g. GitHub Pages without Express backend)
      if (res.status === 404) {
        console.warn('[BAKALARI GITHUB PAGES] Endpoint vrátil 404 (statický web). Používám lokální data.');
        return this.getInstantTimetable(targetDate, forcePermanent);
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const status = res.status;
        const targetUrl = err.targetUrl || endpoint;

        // If 401 Unauthorized, token has genuinely expired - clear auth state
        if (status === 401) {
          console.warn(`[AUTH] Obdrženo HTTP 401 ze serveru Bakalářů. Token expiroval. Odhlašuji uživatele.`);
          this.logout();
        }

        const errorMsg =
          err.error ||
          err.message ||
          (status === 401 ? 'Platnost přihlášení vypršela' : `Chyba HTTP ${status}`);

        const detailedError = `[HTTP ${status} na ${targetUrl}]: ${errorMsg}`;

        DiagnosticsService.addLog({
          category: 'TIMETABLE',
          level: 'error',
          title: `Chyba stahování rozvrhu (HTTP ${status}): ${errorMsg}`,
          url: targetUrl,
          method: 'GET',
          status: status,
          responseData: err,
          recommendation: status === 401
            ? 'Platnost vašeho tokenu vypršela. Přihlaste se prosím znovu.'
            : `Školní server Bakalářů vrátil kód ${status}. Zkuste přepnout na stálý rozvrh nebo načíst veřejný rozvrh.`,
        });

        const errorObj: any = new Error(detailedError);
        errorObj.status = status;
        errorObj.targetUrl = targetUrl;
        errorObj.details = err;
        errorObj.tokenPreview = err.tokenPreview;
        errorObj.tokenLength = err.tokenLength;
        errorObj.userTokenValid = status !== 401;
        if (status === 401) {
          errorObj.message = 'NOT_AUTHENTICATED';
        }
        throw errorObj;
      }

      const rawData: BakalariTimetableResponse = await res.json();
      const normalized = this.normalizeBakalariTimetable(rawData, dateStr);

      DiagnosticsService.addLog({
        category: 'TIMETABLE',
        level: 'success',
        title: `Rozvrh úspěšně stažen z Bakalářů (${normalized.days.length} dní, týden ${normalized.weekRangeText})`,
        url: endpoint,
        method: 'GET',
        status: 200,
        responseData: {
          days: normalized.days.length,
          weekRange: normalized.weekRangeText,
          type: (rawData as any).actualType || (forcePermanent ? 'permanent' : 'actual'),
        },
      });

      // Cache real data in localStorage for this specific week
      try {
        localStorage.setItem(cacheKey, JSON.stringify(rawData));
        localStorage.setItem(REAL_CACHE_STORAGE_KEY, JSON.stringify(rawData));
        this.setLastSyncTime();
      } catch (e) {
        console.warn('Cache write failed:', e);
      }

      return normalized;
    } catch (err: any) {
      console.warn('[FRONTEND TIMETABLE FALLBACK]: Používám instantní cache.');
      const fallback = this.getInstantTimetable(targetDate, forcePermanent);
      if (fallback) {
        return fallback;
      }
      throw err;
    }
  }

  // Import timetable directly from pasted Bakalari web HTML (mot-spsd.bakalari.cz/Timetable)
  static importFromHtml(html: string, targetDateStr?: string): TimetableWeekData {
    const effectiveDate = targetDateStr || this.formatDateIso(new Date());
    const raw = parseBakalariTimetableHtml(html, effectiveDate);
    const student = extractStudentFromHtml(html);
    if (student) {
      this.setStoredUser(student);
    }
    const normalized = this.normalizeBakalariTimetable(raw, effectiveDate);
    const cacheKey = this.getCacheKey(effectiveDate, false);
    localStorage.setItem(cacheKey, JSON.stringify(raw));
    this.setLastSyncTime();
    return normalized;
  }

  // Normalize Bakalari API data
  static normalizeBakalariTimetable(raw: BakalariTimetableResponse, targetDateStr: string): TimetableWeekData {
    // Robust Map keys using String conversion for integer/string IDs
    const subjectsMap = new Map((raw.Subjects || []).map((s) => [String(s.Id), s]));
    const teachersMap = new Map((raw.Teachers || []).map((t) => [String(t.Id), t]));
    const roomsMap = new Map((raw.Rooms || []).map((r) => [String(r.Id), r]));
    const groupsMap = new Map((raw.Groups || []).map((g) => [String(g.Id), g]));
    const hoursMap = new Map((raw.Hours || []).map((h) => [String(h.Id), h]));

    // If Hours array is empty, provide standard SPŠD Motol periods
    const standardHours = [
      { Id: 1, Caption: '1', BeginTime: '08:00', EndTime: '08:45' },
      { Id: 2, Caption: '2', BeginTime: '08:55', EndTime: '09:40' },
      { Id: 3, Caption: '3', BeginTime: '10:00', EndTime: '10:45' },
      { Id: 4, Caption: '4', BeginTime: '10:55', EndTime: '11:40' },
      { Id: 5, Caption: '5', BeginTime: '11:50', EndTime: '12:35' },
      { Id: 6, Caption: '6', BeginTime: '12:45', EndTime: '13:30' },
      { Id: 7, Caption: '7', BeginTime: '13:35', EndTime: '14:20' },
      { Id: 8, Caption: '8', BeginTime: '14:25', EndTime: '15:10' },
    ];
    const finalHours = raw.Hours && raw.Hours.length > 0 ? raw.Hours : standardHours;

    const normalizedDays = (raw.Days || []).map((day, dIdx) => {
      // Calculate expected date for this dayIndex based on targetDateStr Monday
      let expectedDayDate = '';
      if (targetDateStr) {
        const parts = targetDateStr.split('-').map(Number);
        if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
          const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
          const dayOfWeek = dObj.getDay();
          const diffToMon = dObj.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          const dayD = new Date(parts[0], parts[1] - 1, diffToMon + dIdx);
          expectedDayDate = this.formatDateIso(dayD);
        }
      }

      const dayDate = expectedDayDate || (day.Date ? day.Date.split('T')[0] : '');
      const lessons: NormalizedLesson[] = [];

      (day.Atoms || []).forEach((atom, aIdx) => {
        const hour = hoursMap.get(String(atom.HourId)) ||
          standardHours.find((h) => h.Id === atom.HourId) || {
            Id: atom.HourId,
            Caption: String(atom.HourId),
            BeginTime: '08:00',
            EndTime: '08:45',
          };

        const subject = subjectsMap.get(String(atom.SubjectId)) || {
          Id: String(atom.SubjectId || ''),
          Abbrev: '—',
          Name: 'Neznámý předmět',
        };

        const teacher = teachersMap.get(String(atom.TeacherId)) || {
          Id: String(atom.TeacherId || ''),
          Abbrev: '',
          Name: '',
        };

        const room = roomsMap.get(String(atom.RoomId)) || {
          Id: String(atom.RoomId || ''),
          Abbrev: '',
          Name: '',
        };

        const primaryGroupId = atom.GroupIds?.[0] ? String(atom.GroupIds[0]) : '';
        const group = groupsMap.get(primaryGroupId) || {
          Id: primaryGroupId,
          Abbrev: 'Celá třída',
          Name: 'Celá třída',
        };

        // Determine change info
        let changeInfo: LessonChangeInfo | null = null;
        let isCanceled = false;
        let isSubstituted = false;
        let isRoomChanged = false;
        let isAdded = false;

        if (atom.Change) {
          const type = (atom.Change.ChangeType || '').toLowerCase();
          if (type.includes('cancel') || type.includes('odpad') || type.includes('zruš')) {
            isCanceled = true;
            changeInfo = {
              type: 'canceled',
              label: 'Odpadá',
              description: atom.Change.Description || 'Hodina odpadá',
            };
          } else if (type.includes('substit') || type.includes('supl')) {
            isSubstituted = true;
            changeInfo = {
              type: 'substitution',
              label: 'Suplování',
              description: atom.Change.Description || 'Změna vyučujícího nebo předmětu',
            };
          } else if (type.includes('room') || type.includes('učebn') || type.includes('ucebn')) {
            isRoomChanged = true;
            changeInfo = {
              type: 'roomChange',
              label: 'Změna učebny',
              description: atom.Change.Description || 'Výuka probíhá v jiné učebně',
            };
          } else if (type.includes('add') || type.includes('přid')) {
            isAdded = true;
            changeInfo = {
              type: 'added',
              label: 'Přidáno',
              description: atom.Change.Description || 'Mimořádně přidaná hodina',
            };
          } else {
            changeInfo = {
              type: 'substitution',
              label: atom.Change.ChangeType || 'Změna',
              description: atom.Change.Description || 'Změna v rozvrhu',
            };
          }
        }

        const lessonId = `${dayDate}_h${atom.HourId}_s${atom.SubjectId}_${aIdx}`;
        const colorCategory = this.classifySubject(subject.Abbrev, subject.Name);

        lessons.push({
          id: lessonId,
          dayIndex: dIdx,
          dayDate,
          dayName: day.DayDescription || this.getDayNameCzech(dIdx),
          hourId: atom.HourId,
          periodCaption: hour.Caption,
          startTime: hour.BeginTime,
          endTime: hour.EndTime,
          subjectId: subject.Id,
          subjectName: subject.Name,
          subjectAbbrev: subject.Abbrev,
          teacherId: teacher.Id,
          teacherName: teacher.Name,
          teacherAbbrev: teacher.Abbrev,
          roomId: room.Id,
          roomName: room.Name,
          roomAbbrev: room.Abbrev,
          groupId: group.Id,
          groupName: group.Abbrev || group.Name,
          theme: atom.Theme || '',
          notice: atom.Notice,
          change: changeInfo,
          isCanceled,
          isSubstituted,
          isRoomChanged,
          isAdded,
          colorCategory,
        });
      });

      return {
        dayOfWeek: day.DayOfWeek || dIdx + 1,
        date: dayDate,
        dayDescription: day.DayDescription || this.getDayNameCzech(dIdx),
        lessons,
      };
    });

    const firstDay = normalizedDays[0]?.date || targetDateStr;
    const lastDay = normalizedDays[normalizedDays.length - 1]?.date || targetDateStr;

    return {
      hours: finalHours,
      days: normalizedDays,
      classes: raw.Classes || [],
      teachers: raw.Teachers || [],
      rooms: raw.Rooms || [],
      subjects: raw.Subjects || [],
      groups: raw.Groups || [],
      weekRangeText: this.formatRangeText(firstDay, lastDay),
      targetDate: targetDateStr,
    };
  }

  static getDayNameCzech(idx: number): string {
    const names = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
    return names[idx] || 'Den';
  }

  // Classify subjects into distinct color groups
  static classifySubject(abbrev: string, name: string): string {
    const s = (abbrev + ' ' + name).toLowerCase();
    if (s.includes('dp') || s.includes('dt') || s.includes('doprav') || s.includes('aut') || s.includes('str') || s.includes('vozid') || s.includes('telemat')) {
      return 'transport'; // Automotive & Transportation
    }
    if (s.includes('tks') || s.includes('mod') || s.includes('dbs') || s.includes('prg') || s.includes('prx') || s.includes('gtv') || s.includes('ele') || s.includes('inf') || s.includes('cad') || s.includes('sítě') || s.includes('databáz') || s.includes('program') || s.includes('grafic')) {
      return 'tech'; // Tech / IT / Networks / Programming
    }
    if (s.includes('mat') || s.includes('sma') || s.includes('sfy') || s.includes('fyz') || s.includes('che')) {
      return 'math'; // Sciences & Math
    }
    if (s.includes('čjl') || s.includes('česk') || s.includes('aj') || s.includes('anj') || s.includes('anglic') || s.includes('nej') || s.includes('jazyk')) {
      return 'languages'; // Languages
    }
    if (s.includes('tv') || s.includes('tev') || s.includes('těl') || s.includes('sport')) {
      return 'pe'; // Physical education
    }
    if (s.includes('obn') || s.includes('ekf') || s.includes('eko') || s.includes('dej') || s.includes('obč') || s.includes('financ')) {
      return 'humanities'; // Humanities / Civics / Economy
    }
    return 'general';
  }

  static formatDateIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static formatRangeText(startIso: string, endIso: string): string {
    if (!startIso) return '';
    try {
      const sParts = startIso.split('T')[0].split('-').map(Number);
      const eParts = (endIso || startIso).split('T')[0].split('-').map(Number);
      if (sParts.length === 3 && eParts.length === 3) {
        const sDay = sParts[2];
        const sMonth = sParts[1];
        const eDay = eParts[2];
        const eMonth = eParts[1];
        const eYear = eParts[0];
        return `${sDay}. ${sMonth}. – ${eDay}. ${eMonth}. ${eYear}`;
      }
      return `${startIso} – ${endIso}`;
    } catch {
      return `${startIso} – ${endIso}`;
    }
  }

  // Notes persistence
  static getAllUserNotes(): Record<string, string> {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static getLessonNote(lessonKey: string): string {
    const notes = this.getAllUserNotes();
    return notes[lessonKey] || '';
  }

  static setLessonNote(lessonKey: string, note: string): void {
    const notes = this.getAllUserNotes();
    if (note.trim()) {
      notes[lessonKey] = note.trim();
    } else {
      delete notes[lessonKey];
    }
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }
}
