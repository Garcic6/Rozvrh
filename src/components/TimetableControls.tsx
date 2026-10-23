import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CalendarDays,
  Filter,
  Search,
  LayoutGrid,
  Columns3,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { BakalariGroupEntity, BakalariUser } from '../types/bakalari';
import { SPSD_PUBLIC_CLASSES } from '../services/bakalariHtmlParser';

interface TimetableControlsProps {
  currentWeekText: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  isPermanent: boolean;
  onTogglePermanent: (permanent: boolean) => void;
  weekMode?: 'current' | 'next' | 'permanent' | 'custom';
  onSelectWeekMode?: (mode: 'current' | 'next' | 'permanent') => void;
  selectedGroup: string;
  onSelectGroup: (groupId: string) => void;
  groups: BakalariGroupEntity[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  layoutMode: 'bakalari-rows' | 'calendar-cols';
  onToggleLayoutMode: (mode: 'bakalari-rows' | 'calendar-cols') => void;
  isDemo: boolean;
  currentUser: BakalariUser | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  lastSyncText?: string;
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
}

export const TimetableControls: React.FC<TimetableControlsProps> = ({
  currentWeekText,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  isPermanent,
  onTogglePermanent,
  weekMode = 'current',
  onSelectWeekMode,
  selectedGroup,
  onSelectGroup,
  groups,
  searchQuery,
  onSearchChange,
  layoutMode,
  onToggleLayoutMode,
  isDemo,
  currentUser,
  isRefreshing = false,
  onRefresh,
  lastSyncText,
  selectedClassId = 'ZI',
  onSelectClass,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-5 shadow-2xs space-y-3">
      {/* Primary Auto-Sync & 3-Mode Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        {/* 3-Mode Tabs: Tento týden / Příští týden / Stálý rozvrh */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            onClick={() => onSelectWeekMode ? onSelectWeekMode('current') : (onCurrentWeek(), onTogglePermanent(false))}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              weekMode === 'current' && !isPermanent
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>📅 Tento týden</span>
          </button>

          <button
            onClick={() => onSelectWeekMode ? onSelectWeekMode('next') : (onNextWeek(), onTogglePermanent(false))}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              weekMode === 'next' && !isPermanent
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>⏩ Příští týden</span>
          </button>

          <button
            onClick={() => onSelectWeekMode ? onSelectWeekMode('permanent') : onTogglePermanent(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              isPermanent || weekMode === 'permanent'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>🏛️ Stálý rozvrh</span>
          </button>
        </div>

        {/* Live Auto-Sync badge & refresh trigger */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Automatická aktualizace aktivní</span>
            {lastSyncText && (
              <span className="text-emerald-600 font-normal hidden md:inline">({lastSyncText})</span>
            )}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Aktualizovat rozvrh z mot-spsd.bakalari.cz"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Second row: Week Navigation & Schedule Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Week selector arrows & label */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={onPrevWeek}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
              title="Předchozí týden"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onCurrentWeek}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
            >
              Dnes
            </button>
            <button
              onClick={onNextWeek}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
              title="Další týden"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-900 tabular-nums">
              {isPermanent ? 'Stálý týdenní rozvrh' : currentWeekText || 'Tento týden'}
            </span>

            {isDemo ? (
              <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Ukázkový rozvrh (3.DP)
              </span>
            ) : (
              <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 font-medium">Třída:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => onSelectClass && onSelectClass(e.target.value)}
                  className="bg-transparent font-bold text-emerald-950 hover:text-blue-700 outline-none cursor-pointer text-[11px] border-b border-emerald-300"
                  title="Přepnout třídu SPŠD Motol"
                >
                  {SPSD_PUBLIC_CLASSES.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900 bg-white font-medium">
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="text-emerald-600 text-[10px] hidden sm:inline">(SPŠD Motol)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Layout view toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Grid layout mode switcher */}
          <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => onToggleLayoutMode('bakalari-rows')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                layoutMode === 'bakalari-rows'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Bakaláři zobrazení (dny v řádcích)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleLayoutMode('calendar-cols')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                layoutMode === 'calendar-cols'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Sloupcové kalendářní zobrazení (dny ve sloupcích)"
            >
              <Columns3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Group filter and Subject search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
        {/* Group filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Skupina:
          </span>
          <button
            onClick={() => onSelectGroup('all')}
            className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors shrink-0 ${
              selectedGroup === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Všechny
          </button>
          {groups
            .filter((g) => g.Abbrev !== 'Celá třída')
            .map((g) => (
              <button
                key={g.Id}
                onClick={() => onSelectGroup(g.Id)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors shrink-0 ${
                  selectedGroup === g.Id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {g.Abbrev}
              </button>
            ))}
        </div>

        {/* Search filter */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Hledat předmět, učitele, učebnu..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
