// Disable SSL certificate verification for school servers with incomplete certificate chains
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseBakalariTimetableHtml } from './src/services/bakalariHtmlParser.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_BAKALARI_URL = 'https://mot-spsd.bakalari.cz/bakaweb';

app.use(express.json());

// Normalize Bakalari base URL to include /bakaweb
function cleanUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_BAKALARI_URL;
  }
  let cleaned = url.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  cleaned = cleaned.replace(/\/+$/, '');

  // Requirement 1: Base address for this school is https://mot-spsd.bakalari.cz/bakaweb
  if (cleaned.toLowerCase().includes('mot-spsd.bakalari.cz') && !cleaned.toLowerCase().includes('/bakaweb')) {
    cleaned = `${cleaned}/bakaweb`;
  }
  return cleaned;
}

const HTML_RESPONSE_ERROR_MESSAGE = 'Server Bakalářů vrátil HTML stránku MÍSTO JSON API. Zkontrolujte, zda URL obsahuje /bakaweb a zda se volá správný /api/3/ endpoint.';

/**
 * Clean API fetcher for Bakalari API v3.
 * Checks Content-Type and rejects HTML responses immediately.
 */
async function fetchFromBakalari(
  targetBase: string,
  apiPath: string, // e.g. '/api/login' or '/api/3/timetable/actual?date=...'
  init: RequestInit
): Promise<{
  res: globalThis.Response | null;
  finalUrl: string;
  rawText: string;
  isJson: boolean;
  isHtml: boolean;
  data: any;
  error?: string;
}> {
  const fullUrl = `${targetBase}${apiPath}`;
  console.log(`[BAKALARI PROXY] Volám upstream: ${init.method || 'GET'} ${fullUrl}`);
  console.log(`[BAKALARI PROXY HEADERS SENT]:`, JSON.stringify(init.headers, null, 2));

  try {
    const res = await fetch(fullUrl, {
      ...init,
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    const rawText = await res.text();
    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    console.log(`[BAKALARI PROXY RESPONSE]: Status ${res.status} ${res.statusText} pro ${fullUrl}, Content-Type: "${contentType}"`);
    console.log(`[BAKALARI PROXY HEADERS RECEIVED]:`, Object.fromEntries(res.headers.entries()));

    // Requirement 2: Kontrola Content-Type odpovědi
    const isHtml =
      contentType.includes('text/html') ||
      rawText.trim().toLowerCase().startsWith('<!doctype') ||
      rawText.trim().toLowerCase().startsWith('<html');

    if (isHtml) {
      console.warn(`[BAKALARI PROXY HTML DETECTED] Server Bakalářů vrátil HTML namísto JSON na ${fullUrl}`);
      return {
        res,
        finalUrl: fullUrl,
        rawText,
        isJson: false,
        isHtml: true,
        data: null,
        error: HTML_RESPONSE_ERROR_MESSAGE,
      };
    }

    let isJson = false;
    let data: any = null;
    if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
      try {
        data = JSON.parse(rawText);
        isJson = true;
      } catch (pErr) {
        isJson = false;
        console.error(`[BAKALARI PROXY JSON PARSE ERROR] pro ${fullUrl}:`, pErr);
      }
    }

    return {
      res,
      finalUrl: fullUrl,
      rawText,
      isJson,
      isHtml: false,
      data,
    };
  } catch (fetchErr: any) {
    console.error(`[BAKALARI PROXY FETCH ERROR] ${fullUrl}:`, fetchErr.message);
    return {
      res: null,
      finalUrl: fullUrl,
      rawText: '',
      isJson: false,
      isHtml: false,
      data: null,
      error: fetchErr.message,
    };
  }
}

// 1. Info endpoint (GET /api/bakalari/info)
app.get('/api/bakalari/info', async (req: Request, res: Response) => {
  const targetUrl = cleanUrl(req.query.serverUrl as string);
  const startTime = Date.now();

  try {
    const { res: apiRes, finalUrl, data } = await fetchFromBakalari(
      targetUrl,
      '/api/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'client_id=ANDR&grant_type=password&username=_ping&password=_ping',
      }
    );

    const duration = Date.now() - startTime;
    if (!apiRes) {
      res.json({
        school: 'Střední průmyslová škola dopravní, Praha 5 - Motol',
        url: targetUrl,
        finalUrl,
        isReachable: false,
        error: 'Timeout při připojování (15s).',
      });
      return;
    }

    res.json({
      school: 'Střední průmyslová škola dopravní, Praha 5 - Motol',
      url: targetUrl,
      finalUrl,
      isReachable: apiRes.status === 400 || apiRes.status === 200,
      status: apiRes.status,
      durationMs: duration,
      apiVersion: (data as any)?.['bak:ApiVersion'] || '3.x',
      appVersion: (data as any)?.['bak:AppVersion'] || null,
    });
  } catch (err: any) {
    res.json({
      school: 'Střední průmyslová škola dopravní, Praha 5 - Motol',
      url: targetUrl,
      isReachable: false,
      error: err.message,
    });
  }
});

// 1b. Diagnostic Test endpoint (GET /api/bakalari/diagnostic-test)
app.get('/api/bakalari/diagnostic-test', async (req: Request, res: Response) => {
  const targetUrl = cleanUrl(req.query.serverUrl as string);
  const startTime = Date.now();
  const checks: any = {
    targetUrl,
    timestamp: new Date().toISOString(),
  };

  try {
    const { res: apiRes, finalUrl, data } = await fetchFromBakalari(
      targetUrl,
      '/api/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'client_id=ANDR&grant_type=password&username=_ping&password=_ping',
      }
    );

    checks.finalUrl = finalUrl;
    if (apiRes) {
      checks.apiStatus = apiRes.status;
      checks.loginEndpointAccessible = apiRes.status === 400 || apiRes.status === 200;
      checks.apiVersion = data?.['bak:ApiVersion'] || '3.52.1';
      checks.appVersion = data?.['bak:AppVersion'] || '2.2.1007.3';
    } else {
      checks.apiStatus = 504;
      checks.loginEndpointAccessible = false;
    }

    checks.durationMs = Date.now() - startTime;
    checks.success = checks.loginEndpointAccessible;
    checks.message = checks.loginEndpointAccessible
      ? `Server ${finalUrl} je v provozu (API: ${checks.apiVersion}).`
      : `Nepodařilo se připojit k ${finalUrl}.`;

    res.json(checks);
  } catch (err: any) {
    checks.durationMs = Date.now() - startTime;
    checks.success = false;
    checks.error = err.message;
    res.status(500).json(checks);
  }
});

// 2. Login endpoint (POST /api/bakalari/login)
app.post('/api/bakalari/login', async (req: Request, res: Response) => {
  const { username, password, serverUrl, persistent } = req.body;
  const targetBase = cleanUrl(serverUrl);
  const startTime = Date.now();

  if (!username || !password) {
    res.status(400).json({
      error: 'Uživatelské jméno a heslo jsou povinné.',
      code: 'MISSING_CREDENTIALS',
      targetUrl: `${targetBase}/api/login`,
      status: 400,
    });
    return;
  }

  try {
    const cleanUsername = String(username).trim();
    const bodyParams = new URLSearchParams();
    bodyParams.append('client_id', 'ANDR');
    bodyParams.append('grant_type', 'password');
    bodyParams.append('username', cleanUsername);
    bodyParams.append('password', String(password));

    console.log(`[AUTH] Pokus o přihlášení uživatele "${cleanUsername}" na ${targetBase}...`);

    const { res: apiRes, finalUrl, rawText, data } = await fetchFromBakalari(
      targetBase,
      '/api/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Bakalari-SPSD-Client/1.0',
        },
        body: bodyParams.toString(),
      }
    );

    const durationMs = Date.now() - startTime;

    if (!apiRes) {
      res.status(504).json({
        error: 'Časový limit vypršel (server Bakalářů neodpověděl do 15 sekund).',
        errorCode: 'TIMEOUT',
        status: 504,
        durationMs,
        targetUrl: finalUrl,
      });
      return;
    }

    console.log(`[AUTH PROXY] Upstream status: ${apiRes.status} (${durationMs}ms) z URL ${finalUrl}`);

    if (!apiRes.ok) {
      let errorMessage = 'Špatné uživatelské jméno nebo heslo pro mot-spsd.bakalari.cz.';
      let errorCode = 'INVALID_CREDENTIALS';

      if (data?.error_description) {
        errorMessage = data.error_description;
      } else if (data?.error === 'invalid_grant') {
        errorMessage = 'Špatné uživatelské jméno nebo heslo na mot-spsd.bakalari.cz.';
      } else if (data?.Message) {
        errorMessage = data.Message;
      }

      res.status(apiRes.status === 400 ? 401 : apiRes.status).json({
        error: errorMessage,
        errorCode,
        status: apiRes.status,
        rawStatus: apiRes.status,
        durationMs,
        usernameUsed: cleanUsername,
        targetUrl: finalUrl,
        rawResponse: rawText.slice(0, 500),
        details: data,
      });
      return;
    }

    if (!data?.access_token) {
      res.status(401).json({
        error: 'Server Bakalářů nevrátil access_token v odpovědi.',
        status: 401,
        targetUrl: finalUrl,
        details: data,
      });
      return;
    }

    console.log(`[AUTH LOGIN OK] Token úspěšně vydán serverem pro uživatele "${cleanUsername}" z URL ${finalUrl}.`);

    const userInfo: any = {
      FullName: cleanUsername,
      UserType: 'student',
      Class: null,
    };

    // Requirement 1: Login is considered immediately successful once /api/login passes
    res.json({
      ...data,
      user: userInfo,
      persistent: !!persistent,
      durationMs,
      targetUrl: finalUrl,
      status: 200,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error('Bakalari login proxy error:', error);
    res.status(504).json({
      error: `Chyba při komunikaci s přihlašovacím serverem: ${error.message}`,
      errorCode: 'NETWORK_ERROR',
      status: 504,
      durationMs,
      targetUrl: `${targetBase}/api/login`,
      details: error.message,
    });
  }
});

// Helper to validate and log incoming Bearer token
function validateAndExtractToken(authHeader?: string): { isValid: boolean; token: string; header: string; error?: string } {
  if (!authHeader) {
    return {
      isValid: false,
      token: '',
      header: '',
      error: 'Chybí autorizační token (Authorization header). Uživatel není přihlášen.',
    };
  }

  const cleanHeader = authHeader.trim();
  const token = cleanHeader.replace(/^Bearer\s+/i, '').trim();
  const tokenSnippet = token.slice(0, 15);

  console.log(`[TOKEN CHECK] Přijatý token: "${tokenSnippet}..." (délka: ${token.length} znaků)`);

  if (
    !token ||
    token.includes('undefined') ||
    token.includes('null') ||
    token.includes('student_active_session') ||
    token.length < 20
  ) {
    console.warn(`[TOKEN REJECTED] Token neprošel validací: "${tokenSnippet}..." (délka: ${token.length})`);
    return {
      isValid: false,
      token,
      header: cleanHeader,
      error: 'Neplatný nebo chybějící přístupový token. Přihlaste se prosím znovu.',
    };
  }

  return {
    isValid: true,
    token,
    header: `Bearer ${token}`,
  };
}

// 3. User info endpoint (GET /api/bakalari/user)
app.get('/api/bakalari/user', async (req: Request, res: Response) => {
  const targetBase = cleanUrl(req.query.serverUrl as string);
  const tokenValidation = validateAndExtractToken(req.headers.authorization);

  if (!tokenValidation.isValid) {
    res.status(401).json({
      error: tokenValidation.error,
      status: 401,
      targetUrl: `${targetBase}/api/3/user`,
    });
    return;
  }

  try {
    const { res: apiRes, finalUrl, data, rawText } = await fetchFromBakalari(
      targetBase,
      '/api/3/user',
      {
        method: 'GET',
        headers: {
          Authorization: tokenValidation.header,
          Accept: 'application/json',
          'User-Agent': 'Bakalari-SPSD-Client/1.0',
        },
      }
    );

    if (!apiRes) {
      res.status(504).json({
        error: 'Server Bakalářů neodpověděl v časovém limitu 15 s.',
        status: 504,
        targetUrl: finalUrl,
      });
      return;
    }

    console.log(`[USER PROXY] /api/3/user status: ${apiRes.status} z URL: ${finalUrl}`);

    if (!apiRes.ok) {
      res.status(apiRes.status).json({
        error: data?.error_description || data?.error || data?.Message || `Chyba při načítání uživatele (HTTP ${apiRes.status})`,
        status: apiRes.status,
        targetUrl: finalUrl,
        rawResponse: rawText.slice(0, 500),
        details: data,
      });
      return;
    }

    res.json(data);
  } catch (error: any) {
    console.error('Bakalari user proxy error:', error);
    res.status(500).json({
      error: 'Chyba při komunikaci s Bakaláři.',
      status: 500,
      targetUrl: `${targetBase}/api/3/user`,
      details: error.message,
    });
  }
});

// 4. Actual timetable endpoint with 3-step automatic fallback (GET /api/bakalari/timetable/actual)
app.get('/api/bakalari/timetable/actual', async (req: Request, res: Response) => {
  const targetBase = cleanUrl(req.query.serverUrl as string);
  const date = (req.query.date as string) || '';

  // Requirement 1 & 2: Token validation, logging and footprint
  const tokenValidation = validateAndExtractToken(req.headers.authorization);
  const rawToken = tokenValidation.token || '';
  const tokenLength = rawToken.length;
  const tokenPreview = tokenLength > 18
    ? `${rawToken.slice(0, 12)}...${rawToken.slice(-6)}`
    : (rawToken || '(prázdný)');

  if (!tokenValidation.isValid) {
    res.status(401).json({
      error: tokenValidation.error,
      status: 401,
      targetUrl: `${targetBase}/api/3/timetable/actual`,
      tokenLength,
      tokenPreview,
    });
    return;
  }

  // Requirement 3: Čisté volání API v3
  // Metoda: GET
  // Hlavičky: Authorization: Bearer <token>, Accept: application/json
  const requestHeaders = {
    Authorization: tokenValidation.header,
    Accept: 'application/json',
  };

  const pathWithDate = date
    ? `/api/3/timetable/actual?date=${encodeURIComponent(date)}`
    : '/api/3/timetable/actual';

  console.log(`[TIMETABLE ACTUAL API v3] GET ${targetBase}${pathWithDate}`);
  console.log(`[TIMETABLE ACTUAL HEADERS]:`, JSON.stringify(requestHeaders, null, 2));

  try {
    const attempt = await fetchFromBakalari(targetBase, pathWithDate, {
      method: 'GET',
      headers: requestHeaders,
    });

    const { res: apiRes, finalUrl, rawText, isHtml, data, error } = attempt;

    // Requirement 2: Kontrola Content-Type odpovědi
    if (isHtml) {
      res.status(400).json({
        error: error || HTML_RESPONSE_ERROR_MESSAGE,
        status: 400,
        targetUrl: finalUrl,
        rawResponse: rawText.slice(0, 500),
      });
      return;
    }

    if (!apiRes) {
      res.status(504).json({
        error: 'Timeout při připojování k serveru Bakalářů (15s).',
        status: 504,
        targetUrl: finalUrl,
      });
      return;
    }

    if (apiRes.ok && data && typeof data === 'object') {
      console.log(`[TIMETABLE ACTUAL API v3] ÚSPĚCH (HTTP 200) z ${finalUrl}`);
      res.json(data);
      return;
    }

    // Pokud dotaz s ?date vrátil chybu 400 nebo 500, zkusíme čistou URL bez parametru date
    if (date && apiRes.status >= 400) {
      console.warn(`[TIMETABLE ACTUAL] Dotaz s ?date=${date} vrátil HTTP ${apiRes.status}. Zkouším čistou URL bez ?date: ${targetBase}/api/3/timetable/actual`);
      const retry = await fetchFromBakalari(targetBase, '/api/3/timetable/actual', {
        method: 'GET',
        headers: requestHeaders,
      });

      if (retry.isHtml) {
        res.status(400).json({
          error: retry.error || HTML_RESPONSE_ERROR_MESSAGE,
          status: 400,
          targetUrl: retry.finalUrl,
          rawResponse: retry.rawText.slice(0, 500),
        });
        return;
      }

      if (retry.res && retry.res.ok && retry.data && typeof retry.data === 'object') {
        console.log(`[TIMETABLE ACTUAL API v3] ÚSPĚCH bez ?date (HTTP 200) z ${retry.finalUrl}`);
        res.json(retry.data);
        return;
      }
    }

    const lastStatus = apiRes.status;
    const errorMessage =
      data?.Message ||
      data?.error_description ||
      data?.error ||
      `Server Bakalářů vrátil chybu HTTP ${lastStatus} při pokusu o načtení rozvrhu.`;

    res.status(lastStatus).json({
      error: errorMessage,
      status: lastStatus,
      targetUrl: finalUrl,
      tokenLength,
      tokenPreview,
      rawResponse: rawText.slice(0, 500),
      details: data,
    });
  } catch (err: any) {
    console.error('[TIMETABLE PROXY ACTUAL EXCEPTION]:', err);
    res.status(500).json({
      error: `Chyba při komunikaci s Bakaláři: ${err.message}`,
      status: 500,
      targetUrl: `${targetBase}${pathWithDate}`,
      details: err.message,
    });
  }
});

// 5. Permanent timetable endpoint (GET /api/bakalari/timetable/permanent)
app.get('/api/bakalari/timetable/permanent', async (req: Request, res: Response) => {
  const targetBase = cleanUrl(req.query.serverUrl as string);

  const tokenValidation = validateAndExtractToken(req.headers.authorization);
  if (!tokenValidation.isValid) {
    res.status(401).json({
      error: tokenValidation.error,
      status: 401,
      targetUrl: `${targetBase}/api/3/timetable/permanent`,
    });
    return;
  }

  // Requirement 3: Čisté volání API v3
  const requestHeaders = {
    Authorization: tokenValidation.header,
    Accept: 'application/json',
  };

  const permPath = '/api/3/timetable/permanent';
  console.log(`[TIMETABLE PERMANENT API v3] GET ${targetBase}${permPath}`);
  console.log(`[TIMETABLE PERMANENT HEADERS]:`, JSON.stringify(requestHeaders, null, 2));

  try {
    const { res: apiRes, finalUrl, rawText, isHtml, data, error } = await fetchFromBakalari(
      targetBase,
      permPath,
      {
        method: 'GET',
        headers: requestHeaders,
      }
    );

    // Requirement 2: Kontrola Content-Type odpovědi
    if (isHtml) {
      res.status(400).json({
        error: error || HTML_RESPONSE_ERROR_MESSAGE,
        status: 400,
        targetUrl: finalUrl,
        rawResponse: rawText.slice(0, 500),
      });
      return;
    }

    if (!apiRes) {
      res.status(504).json({
        error: 'Timeout při připojování k serveru Bakalářů (15s).',
        status: 504,
        targetUrl: finalUrl,
      });
      return;
    }

    if (apiRes.ok && data && typeof data === 'object') {
      console.log(`[TIMETABLE PERMANENT API v3] ÚSPĚCH (HTTP 200) z ${finalUrl}`);
      res.json(data);
      return;
    }

    const lastStatus = apiRes.status;
    res.status(lastStatus).json({
      error: data?.Message || data?.error || 'Nepodařilo se stáhnout stálý rozvrh ze serveru Bakalářů.',
      status: lastStatus,
      targetUrl: finalUrl,
      rawResponse: rawText.slice(0, 500),
      details: data,
    });
  } catch (error: any) {
    console.error('Bakalari permanent timetable proxy error:', error);
    res.status(500).json({
      error: 'Chyba při komunikaci s Bakaláři.',
      status: 500,
      targetUrl: `${targetBase}${permPath}`,
      details: error.message,
    });
  }
});


// 5b. Public timetable scraping proxy (GET /api/bakalari/public/timetable)
app.get('/api/bakalari/public/timetable', async (req: Request, res: Response) => {
  const targetBase = cleanUrl(req.query.serverUrl as string);
  const term = (req.query.term as string) || 'Actual'; // 'Actual' | 'Next' | 'Permanent'
  const type = (req.query.type as string) || 'Class';
  const id = (req.query.id as string) || 'ZI'; // ZI = 3.A
  const date = (req.query.date as string) || '';

  const publicUrl = `${targetBase}/Timetable/Public/${encodeURIComponent(term)}/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;

  try {
    const pageRes = await fetch(publicUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    }).catch(() => null);

    if (pageRes && pageRes.ok) {
      const html = await pageRes.text();
      if (html.includes('const timetableData') || html.includes('"TimetableDataAvailable"')) {
        const parsed = parseBakalariTimetableHtml(html, date);
        if (parsed.Days && parsed.Days.some((d) => d.Atoms && d.Atoms.length > 0)) {
          res.json(parsed);
          return;
        }
      }
    }

    res.status(404).json({
      error: 'Veřejný rozvrh na stránce nebyl nalezen nebo vyžaduje přihlášení.',
      status: 404,
      targetUrl: publicUrl,
    });
  } catch (err: any) {
    console.warn('Public timetable endpoint fetch error:', err);
    res.status(500).json({
      error: `Chyba při stahování veřejného rozvrhu: ${err.message}`,
      status: 500,
      targetUrl: publicUrl,
    });
  }
});

// 6. Refresh token endpoint (POST /api/bakalari/refresh)
app.post('/api/bakalari/refresh', async (req: Request, res: Response) => {
  const { refreshToken, serverUrl } = req.body;
  const targetBase = cleanUrl(serverUrl);

  if (!refreshToken) {
    res.status(400).json({ error: 'Chybí refresh token.', status: 400 });
    return;
  }

  try {
    const bodyParams = new URLSearchParams();
    bodyParams.append('client_id', 'ANDR');
    bodyParams.append('grant_type', 'refresh_token');
    bodyParams.append('refresh_token', refreshToken);

    const { res: apiRes, finalUrl, data } = await fetchFromBakalari(
      targetBase,
      '/api/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Bakalari-SPSD-Client/1.0',
        },
        body: bodyParams.toString(),
      }
    );

    if (!apiRes || !apiRes.ok) {
      res.status(apiRes ? apiRes.status : 504).json({
        error: data?.error_description || 'Obnovení přihlášení selhalo.',
        status: apiRes ? apiRes.status : 504,
        targetUrl: finalUrl,
        details: data,
      });
      return;
    }

    res.json(data);
  } catch (error: any) {
    console.error('Bakalari refresh token error:', error);
    res.status(500).json({
      error: 'Nepodařilo se obnovit přihlášení.',
      status: 500,
      details: error.message,
    });
  }
});

// Server-side direct .ics export download helper
app.post('/api/calendar/download-ics', (req: Request, res: Response) => {
  const { icsContent, filename = 'rozvrh-spsd.ics' } = req.body;
  if (!icsContent) {
    res.status(400).send('No ICS content provided');
    return;
  }
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(icsContent);
});

// Mount Vite or serve static
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (environment: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
