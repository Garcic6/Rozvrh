# Integrace modulu veřejného rozvrhu (Timetable/Public) a oprava přepínání týdnů

Umožnění stahování a parsování rozvrhů přímo ze stránky `https://mot-spsd.bakalari.cz/Timetable/Public` včetně podpory termínů (Tento týden, Příští týden, Stálý) a tříd (3.A kód `ZI`), s opravou cachování a navigace mezi týdny.

> [!IMPORTANT]
> **Klíčová zjištění z poskytnutého HTML:**
> 1. Web Bakalářů SPŠD Motol na `/Timetable/Public` používá strukturu URL: `/Timetable/Public/{Term}/{ObjectType}/{ObjectId}` (např. `/Timetable/Public/Actual/Class/ZI` pro 3.A tento týden a `/Timetable/Public/Next/Class/ZI` pro 3.A příští týden).
> 2. Rozvrhová data jsou v HTML přímo vložena jako JavaScript proměnná `const timetableData = { ... };`, která obsahuje kompletní dny, hodiny, atomy, místnosti a suplování.
> 3. Současná chyba, kdy po kliknutí na „Příští týden“ zůstal starý rozvrh, byla způsobena sdílenou cache klíčem bez rozlišení týdne (`bakalari_real_cache` vracel stále dny 5.10.–9.10.).

---

## 1. Přehled a cíl řešení

- **Co změna přináší:**
  - Podporu stahování rozvrhů z veřejného rozhraní `/Timetable/Public` (pro třídu 3.A `ZI`, případně další třídy/učitele SPŠD Motol).
  - Plnohodnotný parser pro objekt `timetableData` vložený ve skriptu stránky i pro šablonu `atomTemplate`.
  - Opravu přepínače týdnů: kliknutí na „Příští týden“ stáhne / vygeneruje rozvrh přesně pro zvolený týden s odpovídajícími daty.
  - Oddělenou cache rozvrhů podle data a režimu (tento týden vs. příští týden vs. stálý rozvrh).
  - Vylepšený dialog pro vložení HTML, který automaticky detekuje, zda jde o tento týden, příští týden nebo stálý rozvrh.

---

## 2. Uživatelské rozhraní a práce s týdny

```
┌────────────────────────────────────────────────────────────────────────┐
│  SPŠD Motol · Rozvrh  [3.A]  [Tento týden / Příští týden / Stálý]      │
├────────────────────────────────────────────────────────────────────────┤
│  Výběr zobrazení:                                                      │
│  [ Tento týden (19.10. - 23.10.) ]  [ Příští týden (26.10. - 30.10.) ] │
│  Zdroj: mot-spsd.bakalari.cz/Timetable/Public/Actual/Class/ZI           │
├────────────────────────────────────────────────────────────────────────┤
│  Pondělí 19.10. │ Úterý 20.10. │ Středa 21.10. │ Čtvrtek 22.10. ...    │
│  [PRG A208]     │ [MAT A208]   │ [CJL A208]    │ [ELE A103]            │
└────────────────────────────────────────────────────────────────────────┘
```

- **Přepínač týdnů:**
  - Při přepnutí na **Příští týden** aplikace nastaví datum na následující pondělí a pošle dotaz na server na termín `Next` nebo `actual?date=YYYY-MM-DD`.
  - Pokud API vrací chybu 500, server i klient použijí data rozvrhu přepočtená na příslušný týden (pondělí až pátek daného data) bez přepsání starou cache z aktuálního týdne.
- **Rychlý import HTML:**
  - Možnost vložit HTML přímo ze stránky `/Timetable/Public/Actual/Class/ZI` i `/Timetable/Public/Next/Class/ZI`.
  - Automatické uložení importovaného týdne do správného časového slotu.

---

## 3. Technická architektura a změny

```
                   ┌───────────────────────────────────┐
                   │    Bakalari Web SPŠD Motol        │
                   │  /Timetable/Public/{Term}/Class/ZI│
                   └─────────────────┬─────────────────┘
                                     │
                     ┌───────────────▼────────────────┐
                     │          server.ts             │
                     │  1. /api/bakalari/public/page  │
                     │  2. /api/bakalari/timetable/*  │
                     └───────────────┬────────────────┘
                                     │
                     ┌───────────────▼────────────────┐
                     │   bakalariHtmlParser.ts        │
                     │  - parse timetableData JSON    │
                     │  - parse atomTemplate & DOM    │
                     └───────────────┬────────────────┘
                                     │
                     ┌───────────────▼────────────────┐
                     │      bakalariService.ts        │
                     │  - week-specific caching       │
                     │  - dynamic date synthesis      │
                     └───────────────┬────────────────┘
                                     │
                     ┌───────────────▼────────────────┐
                     │       React UI (App.tsx)       │
                     │  - Responsive Timetable Grid   │
                     │  - Instant Week Switching      │
                     └────────────────────────────────┘
```

### Plánované úpravy:
1. **`server.ts`**:
   - Přidat proxy endpoint `/api/bakalari/public/timetable?term=Actual&type=Class&id=ZI` pro stahování veřejného rozvrhu přímo z webu školy.
   - Zajistit, aby selhání API pro konkrétní datum nevracelo obecnou chybu 500, ale vrátilo adekvátní rozvrh s dynamicky dopočítanými dny pro požadované pondělí.
2. **`src/services/bakalariHtmlParser.ts`**:
   - Rozšířit parser o extrakci objektu `timetableData` z tagu `<script>`, který Bakaláři vkládají na stránce `/Timetable/Public/...`.
   - Podporovat atributy `DayAbbrev`, `Date`, `Atoms`, `DayOff`, `Hours`, `CssX`, `CssWidth` z Knockout modelu.
3. **`src/services/bakalariService.ts`**:
   - Opravit cachování: klíč `bakalari_cache_${term}_${weekStartDate}` namísto jednoho globálního klíče.
   - Při volání `fetchTimetable(nextWeekDate)` generovat nebo načítat rozvrh pro správné datum bez zacyklení na starý týden.
4. **`src/App.tsx` & `TimetableControls.tsx`**:
   - Propojit tlačítka „Tento týden“ a „Příští týden“ s novým systémem načítání.
   - Přidat informativní odznak zdroje (API / Veřejný rozvrh / Vložené HTML).
