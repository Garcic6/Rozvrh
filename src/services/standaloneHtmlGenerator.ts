import { TimetableWeekData, BakalariUser } from '../types/bakalari';
import { CalendarExportService } from './calendarExport';

export function generateStandaloneHtml(weekData: TimetableWeekData, user: BakalariUser | null): string {
  const jsonStr = JSON.stringify(weekData).replace(/<\/script>/gi, '<\\/script>');
  const userJson = JSON.stringify(user || { FullName: 'Student SPŠD', UserType: 'student' }).replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rozvrh hodin - SPŠD Motol</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --subst-bg: #fffbeb;
      --subst-border: #fcd34d;
      --subst-text: #92400e;
      --cancel-bg: #fef2f2;
      --cancel-border: #fca5a5;
      --cancel-text: #991b1b;
      --transport-bg: #f0f9ff;
      --transport-border: #bae6fd;
      --tech-bg: #eef2ff;
      --tech-border: #c7d2fe;
      --math-bg: #f5f3ff;
      --math-border: #ddd6fe;
      --lang-bg: #fffbeb;
      --lang-border: #fde68a;
      --pe-bg: #fff1f2;
      --pe-border: #fecdd3;
      --hum-bg: #ecfdf5;
      --hum-border: #a7f3d0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: var(--bg); color: var(--text-main); min-height: 100vh; padding-bottom: 40px; }
    header { background: #fff; border-bottom: 1px solid var(--border); padding: 12px 24px; position: sticky; top: 0; z-index: 20; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
    .header-inner { max-width: 1300px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.15rem; color: var(--text-main); text-decoration: none; }
    .brand-badge { background: var(--primary); color: #fff; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; }
    .top-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: #fff; color: var(--text-main); transition: all 0.15s ease; text-decoration: none; }
    .btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .btn-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
    .btn-primary:hover { background: var(--primary-hover); }
    main { max-width: 1300px; margin: 20px auto; padding: 0 16px; }
    .banner { background: #0f172a; color: #fff; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .banner-title { font-size: 14px; font-weight: 700; }
    .banner-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .controls-card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .table-container { background: #fff; border: 1px solid var(--border); border-radius: 12px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; min-width: 800px; }
    th, td { border: 1px solid #f1f5f9; padding: 8px; vertical-align: top; }
    th { background: #f8fafc; font-size: 12px; font-weight: 600; color: #475569; text-align: center; }
    th.day-th { text-align: left; width: 130px; padding-left: 12px; }
    td.day-td { background: #fff; font-weight: 700; font-size: 13px; padding-left: 12px; border-right: 2px solid var(--border); }
    .day-sub { font-size: 11px; font-weight: 400; color: #64748b; margin-top: 2px; }
    .lesson-card { border-radius: 8px; padding: 8px; border: 1px solid var(--border); font-size: 12px; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; margin-bottom: 4px; background: #f8fafc; }
    .lesson-card:hover { transform: translateY(-1px); box-shadow: 0 2px 5px rgba(0,0,0,0.06); }
    .lesson-header { display: flex; justify-content: space-between; align-items: baseline; font-weight: 700; font-size: 14px; }
    .lesson-room { font-size: 11px; font-family: monospace; font-weight: 600; color: #475569; }
    .lesson-name { font-size: 11px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    .lesson-footer { display: flex; justify-content: space-between; margin-top: 6px; padding-top: 4px; border-top: 1px solid rgba(0,0,0,0.05); font-size: 11px; color: #64748b; }
    .badge-subst { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; display: inline-block; margin-bottom: 4px; }
    .badge-cancel { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; display: inline-block; margin-bottom: 4px; }
    .canceled { text-decoration: line-through; opacity: 0.7; }
    .section-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .panel { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: none; align-items: center; justify-content: center; z-index: 50; padding: 16px; }
    .modal { background: #fff; border-radius: 16px; max-width: 500px; width: 100%; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto; }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <a href="#" class="brand">
        <div class="brand-badge">M</div>
        <span>SPŠD Motol · Rozvrh hodin</span>
      </a>
      <div class="top-actions">
        <button class="btn btn-primary" onclick="downloadIcsFile()">📅 Stáhnout kalendář (.ics)</button>
        <button class="btn" onclick="openImportModal()">📥 Importovat z webu</button>
      </div>
    </div>
  </header>

  <main>
    <div class="banner">
      <div>
        <div class="banner-title" id="studentHeader">Student SPŠD Motol · mot-spsd.bakalari.cz/Timetable</div>
        <div class="banner-sub">Kompletní samostatný rozvrh hodin s možností exportu do Google Kalendáře a Apple Kalendáře</div>
      </div>
      <button class="btn" onclick="downloadIcsFile()">Exportovat .ics</button>
    </div>

    <div class="controls-card">
      <div>
        <strong id="weekTitle">Tento týden</strong>
        <span style="color: #64748b; font-size: 13px; margin-left: 8px;" id="weekRange"></span>
      </div>
      <div style="display:flex; gap: 8px;">
        <button class="btn" onclick="downloadIcsFile()">Stáhnout do Apple/Outlook (.ics)</button>
        <button class="btn btn-primary" onclick="alert('Klikněte na jakoukoliv hodinu v rozvrhu pro její přidání do Google Kalendáře.')">Google Kalendář</button>
      </div>
    </div>

    <div class="table-container">
      <table id="timetable">
        <!-- Rendered by JS -->
      </table>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="section-title">⚠️ Změny a suplování v rozvrhu</div>
        <div id="changesList" style="font-size: 13px; color: #475569;">
          Načítám suplování...
        </div>
      </div>

      <div class="panel">
        <div class="section-title">📅 Možnosti exportu kalendáře</div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 14px;">
          Tento rozvrh lze přímo importovat do jakéhokoliv kalendáře v telefonu nebo počítači:
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button class="btn btn-primary" onclick="downloadIcsFile()" style="justify-content: center;">
            Stáhnout soubor .ICS pro aktuální týden
          </button>
          <button class="btn" onclick="copyIcsToClipboard()" style="justify-content: center;" id="copyBtn">
            Kopírovat iCal data do schránky
          </button>
        </div>
      </div>
    </div>
  </main>

  <!-- Lesson detail modal -->
  <div class="modal-overlay" id="detailModal">
    <div class="modal">
      <h3 id="modalSubject" style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">Předmět</h3>
      <p id="modalTime" style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Čas</p>
      <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; line-height: 1.6;">
        <div><strong>Učebna:</strong> <span id="modalRoom"></span></div>
        <div><strong>Vyučující:</strong> <span id="modalTeacher"></span></div>
        <div><strong>Skupina:</strong> <span id="modalGroup"></span></div>
        <div id="modalThemeRow"><strong>Téma:</strong> <span id="modalTheme"></span></div>
        <div id="modalChangeRow" style="color: #92400e; font-weight: 600;"></div>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <a id="modalGoogleLink" href="#" target="_blank" class="btn btn-primary">Přidat do Google Kalendáře</a>
        <button class="btn" onclick="closeModal()">Zavřít</button>
      </div>
    </div>
  </div>

  <script>
    const data = ${jsonStr};
    const user = ${userJson};

    document.getElementById('studentHeader').innerText = (user.FullName || 'Student SPŠD') + ' · mot-spsd.bakalari.cz/Timetable';
    document.getElementById('weekRange').innerText = data.weekRangeText || '';

    // Render Timetable
    function render() {
      const table = document.getElementById('timetable');
      let html = '<thead><tr><th class="day-th">Den / Hodina</th>';
      (data.hours || []).forEach(h => {
        html += '<th>' + h.Caption + '.<br><span style="font-size:11px;font-weight:400;color:#64748b;">' + h.BeginTime + ' - ' + h.EndTime + '</span></th>';
      });
      html += '</tr></thead><tbody>';

      let changesHtml = '';
      let changeCount = 0;

      (data.days || []).forEach(day => {
        html += '<tr><td class="day-td">' + day.dayDescription + '<div class="day-sub">' + (day.date ? day.date.split('T')[0] : '') + '</div></td>';

        (data.hours || []).forEach(h => {
          const lessons = (day.lessons || []).filter(l => l.hourId === h.Id);
          html += '<td>';
          lessons.forEach(l => {
            const isCanceled = l.isCanceled;
            const isSubst = l.isSubstituted;
            const bgClass = isCanceled ? 'var(--cancel-bg)' : isSubst ? 'var(--subst-bg)' : 'var(--card-bg)';
            const borderClass = isCanceled ? 'var(--cancel-border)' : isSubst ? 'var(--subst-border)' : 'var(--border)';

            if (l.change || isCanceled || isSubst) {
              changeCount++;
              changesHtml += '<div style="padding: 8px; border-bottom: 1px solid var(--border);"><strong style="color: ' + (isCanceled ? '#991b1b' : '#92400e') + ';">' + day.dayDescription + ' ' + l.periodCaption + '. hodina: ' + l.subjectName + '</strong><br>' + (l.change ? l.change.description : '') + '</div>';
            }

            html += '<div class="lesson-card" style="background:' + bgClass + '; border-color:' + borderClass + ';" onclick="showDetail(' + JSON.stringify(l).replace(/"/g, '&quot;') + ')">';
            if (isCanceled) html += '<span class="badge-cancel">Odpadá</span>';
            else if (isSubst) html += '<span class="badge-subst">Supl.</span>';
            html += '<div class="lesson-header"><span class="' + (isCanceled ? 'canceled' : '') + '">' + l.subjectAbbrev + '</span><span class="lesson-room">' + (l.roomAbbrev || '') + '</span></div>';
            html += '<div class="lesson-name">' + l.subjectName + '</div>';
            html += '<div class="lesson-footer"><span>' + (l.teacherAbbrev || l.teacherName || '') + '</span><span>' + (l.groupName && l.groupName !== 'Celá třída' ? l.groupName : '') + '</span></div>';
            html += '</div>';
          });
          html += '</td>';
        });

        html += '</tr>';
      });

      html += '</tbody>';
      table.innerHTML = html;

      if (changeCount === 0) {
        changesHtml = 'Tento týden nejsou hlášeny žádné změny ani suplování.';
      }
      document.getElementById('changesList').innerHTML = changesHtml;
    }

    render();

    function showDetail(l) {
      document.getElementById('modalSubject').innerText = l.subjectName + ' (' + l.subjectAbbrev + ')';
      document.getElementById('modalTime').innerText = l.dayName + ' · ' + l.periodCaption + '. hodina (' + l.startTime + ' – ' + l.endTime + ')';
      document.getElementById('modalRoom').innerText = l.roomName || l.roomAbbrev || 'Neuvedeno';
      document.getElementById('modalTeacher').innerText = l.teacherName || l.teacherAbbrev || 'Neuvedeno';
      document.getElementById('modalGroup').innerText = l.groupName || 'Celá třída';
      
      const themeRow = document.getElementById('modalThemeRow');
      if (l.theme) {
        themeRow.style.display = 'block';
        document.getElementById('modalTheme').innerText = l.theme;
      } else {
        themeRow.style.display = 'none';
      }

      const changeRow = document.getElementById('modalChangeRow');
      if (l.change) {
        changeRow.style.display = 'block';
        changeRow.innerText = l.change.label + ': ' + l.change.description;
      } else {
        changeRow.style.display = 'none';
      }

      // Google link
      const startParts = l.startTime.split(':');
      const endParts = l.endTime.split(':');
      const dParts = l.dayDate.split('-');
      const dStr = dParts[0] + dParts[1] + dParts[2];
      const startIso = dStr + 'T' + startParts[0] + startParts[1] + '00';
      const endIso = dStr + 'T' + endParts[0] + endParts[1] + '00';
      const gUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(l.subjectName + ' (' + (l.roomAbbrev || '') + ')') + '&dates=' + startIso + '/' + endIso + '&location=' + encodeURIComponent('SPŠD Motol - ' + (l.roomAbbrev || '')) + '&details=' + encodeURIComponent('Vyučující: ' + (l.teacherName || '') + '\\n' + (l.theme ? 'Téma: ' + l.theme : ''));
      document.getElementById('modalGoogleLink').href = gUrl;

      document.getElementById('detailModal').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('detailModal').style.display = 'none';
    }

    // Generate iCal string
    function makeIcs() {
      let lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SPSD Motol//Rozvrh//CS',
        'CALSCALE:GREGORIAN',
        'X-WR-CALNAME:Rozvrh SPŠD Motol'
      ];

      (data.days || []).forEach(day => {
        (day.lessons || []).forEach(l => {
          if (l.isCanceled) return;
          const dParts = l.dayDate.split('-');
          if (dParts.length !== 3) return;
          const sParts = l.startTime.split(':');
          const eParts = l.endTime.split(':');
          const dtStart = dParts[0] + dParts[1] + dParts[2] + 'T' + sParts[0] + sParts[1] + '00';
          const dtEnd = dParts[0] + dParts[1] + dParts[2] + 'T' + eParts[0] + eParts[1] + '00';

          lines.push('BEGIN:VEVENT');
          lines.push('UID:spsd-' + l.dayDate + '-' + l.hourId + '-' + l.subjectId + '@mot-spsd.bakalari.cz');
          lines.push('DTSTART;TZID=Europe/Prague:' + dtStart);
          lines.push('DTEND;TZID=Europe/Prague:' + dtEnd);
          lines.push('SUMMARY:' + l.subjectName + ' (' + (l.roomAbbrev || '') + ')');
          lines.push('DESCRIPTION:Vyučující: ' + (l.teacherName || '') + (l.theme ? '\\nTéma: ' + l.theme : ''));
          lines.push('LOCATION:SPŠD Motol ' + (l.roomAbbrev || ''));
          lines.push('END:VEVENT');
        });
      });

      lines.push('END:VCALENDAR');
      return lines.join('\\r\\n');
    }

    function downloadIcsFile() {
      const ics = makeIcs();
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Rozvrh_SPSD_Motol.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    function copyIcsToClipboard() {
      const ics = makeIcs();
      navigator.clipboard.writeText(ics);
      const btn = document.getElementById('copyBtn');
      btn.innerText = '✓ Zkopírováno!';
      setTimeout(() => { btn.innerText = 'Kopírovat iCal data do schránky'; }, 2000);
    }

    function openImportModal() {
      const html = prompt('Vložte zdrojový kód stránky z mot-spsd.bakalari.cz/Timetable:');
      if (html) {
        alert('Data byla načtena.');
      }
    }
  </script>
</body>
</html>`;
}
