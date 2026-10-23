// Diagnostic Logger and Self-Test Service for Bakalari SPŠD Motol

export interface DiagnosticLogEntry {
  id: string;
  timestamp: string;
  category: 'NETWORK' | 'AUTH' | 'TIMETABLE' | 'SYSTEM' | 'ERROR';
  level: 'info' | 'warn' | 'error' | 'success';
  title: string;
  url?: string;
  method?: string;
  status?: number | string;
  statusText?: string;
  durationMs?: number;
  requestData?: any;
  responseData?: any;
  recommendation?: string;
}

export interface DiagnosticTestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
  durationMs?: number;
}

type LogListener = (logs: DiagnosticLogEntry[]) => void;

class DiagnosticsServiceManager {
  private logs: DiagnosticLogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 100;

  constructor() {
    this.addLog({
      category: 'SYSTEM',
      level: 'info',
      title: 'Diagnostický systém inicializován',
      responseData: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        targetServer: 'https://mot-spsd.bakalari.cz',
        timestamp: new Date().toISOString(),
      },
    });
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = [...this.logs];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error notifying log listener:', err);
      }
    });
  }

  addLog(entry: Omit<DiagnosticLogEntry, 'id' | 'timestamp'>): DiagnosticLogEntry {
    const fullEntry: DiagnosticLogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      } as any),
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.notify();
    return fullEntry;
  }

  getLogs(): DiagnosticLogEntry[] {
    return [...this.logs];
  }

  getLastError(): DiagnosticLogEntry | undefined {
    return this.logs.find((l) => l.level === 'error');
  }

  clearLogs(): void {
    this.logs = [];
    this.notify();
  }

  // Generates a markdown report that the user can copy and paste into the chat
  generateReport(): string {
    const now = new Date().toISOString();
    let report = `=== DIAGNOSTICKÝ PROTOKOL BAKALÁŘI SPŠD MOTOL ===\n`;
    report += `Čas vygenerování: ${now}\n`;
    report += `Cílový server: https://mot-spsd.bakalari.cz\n`;
    report += `Prohlížeč: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}\n\n`;

    report += `--- HISTORIE ZÁZNAMŮ (celkem ${this.logs.length}) ---\n`;
    this.logs.slice(0, 20).forEach((log, index) => {
      report += `[#${index + 1}] ${log.timestamp} | [${log.level.toUpperCase()}] ${log.title}\n`;
      if (log.url) report += `  URL: ${log.method || 'GET'} ${log.url}\n`;
      if (log.status !== undefined) report += `  HTTP Status: ${log.status} ${log.statusText || ''}\n`;
      if (log.durationMs !== undefined) report += `  Doba odezvy: ${log.durationMs} ms\n`;
      if (log.recommendation) report += `  Doporučení: ${log.recommendation}\n`;
      if (log.responseData) {
        report += `  Odpověď:\n${JSON.stringify(log.responseData, null, 2)}\n`;
      }
      report += `--------------------------------------------------\n`;
    });

    return report;
  }

  // Run comprehensive self-test of the Bakalari connection
  async runSelfTest(serverUrl = 'https://mot-spsd.bakalari.cz'): Promise<DiagnosticTestResult[]> {
    const results: DiagnosticTestResult[] = [];

    // Step 1: Check proxy health
    const step1Start = performance.now();
    try {
      const res = await fetch(`/api/bakalari/info?serverUrl=${encodeURIComponent(serverUrl)}`);
      const data = await res.json();
      const step1Duration = Math.round(performance.now() - step1Start);

      if (res.ok && data.isReachable) {
        results.push({
          step: '1. Dostupnost serveru Bakalářů',
          status: 'success',
          message: `Server mot-spsd.bakalari.cz odpovídá (API ${data.apiVersion || 'v3'}).`,
          details: data,
          durationMs: step1Duration,
        });
      } else {
        results.push({
          step: '1. Dostupnost serveru Bakalářů',
          status: 'error',
          message: `Server neodpovídá nebo je nedostupný: ${data.error || 'Neznámá chyba'}`,
          details: data,
          durationMs: step1Duration,
        });
      }
    } catch (e: any) {
      results.push({
        step: '1. Dostupnost serveru Bakalářů',
        status: 'error',
        message: `Chyba při kontaktování serveru: ${e.message}`,
        durationMs: Math.round(performance.now() - step1Start),
      });
    }

    // Step 2: Check Web Login page
    const step2Start = performance.now();
    try {
      const res = await fetch(`/api/bakalari/diagnostic-test?serverUrl=${encodeURIComponent(serverUrl)}`);
      const data = await res.json();
      const step2Duration = Math.round(performance.now() - step2Start);

      if (res.ok) {
        results.push({
          step: '2. Kontrola webového rozhraní a API login endpointu',
          status: data.loginEndpointAccessible ? 'success' : 'error',
          message: data.message || 'API endpoint byl úspěšně prověřen.',
          details: data,
          durationMs: step2Duration,
        });
      } else {
        results.push({
          step: '2. Kontrola webového rozhraní a API login endpointu',
          status: 'error',
          message: data.error || 'Nepodařilo se prověřit login endpoint.',
          details: data,
          durationMs: step2Duration,
        });
      }
    } catch (e: any) {
      results.push({
        step: '2. Kontrola webového rozhraní a API login endpointu',
        status: 'error',
        message: `Chyba testu endpointu: ${e.message}`,
        durationMs: Math.round(performance.now() - step2Start),
      });
    }

    return results;
  }
}

export const DiagnosticsService = new DiagnosticsServiceManager();
