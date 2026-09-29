import React, { useState, useMemo } from 'react';
import { HydroBay, ShiftInfo } from '../types';
import { 
  getBayEffectiveSeverity, 
  getHighestPriorityUnresolvedBay 
} from '../utils/bayPrioritization';
import { BayCard } from './BayCard';
import { LiveExternalConditions } from './LiveExternalConditions';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Flag, 
  Search, 
  Layers, 
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface ShiftHandoverOverviewProps {
  bays: HydroBay[];
  shiftInfo: ShiftInfo;
  onInspectBay: (bayId: string) => void;
  onSwitchToHandover: () => void;
}

type FilterOption = 'all' | 'action_needed' | 'flagged' | 'optimal';

export const ShiftHandoverOverview: React.FC<ShiftHandoverOverviewProps> = ({
  bays,
  shiftInfo,
  onInspectBay,
  onSwitchToHandover,
}) => {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate KPIs using underlying bay severity
  const totalBays = bays.length;
  const normalBays = bays.filter((b) => getBayEffectiveSeverity(b) === 'Normal').length;
  const warningBays = bays.filter((b) => getBayEffectiveSeverity(b) === 'Warning').length;
  const criticalBays = bays.filter((b) => getBayEffectiveSeverity(b) === 'Critical').length;
  const flaggedBays = bays.filter((b) => b.status === 'Flagged' || Boolean(b.activeFlag)).length;
  const abnormalCount = warningBays + criticalBays;

  const avgPh = (bays.reduce((acc, b) => acc + b.pH, 0) / totalBays).toFixed(2);
  const avgEc = (bays.reduce((acc, b) => acc + b.ec, 0) / totalBays).toFixed(2);

  // Filtered Bays
  const filteredBays = useMemo(() => {
    return bays.filter((bay) => {
      // Search matching
      const matchesSearch =
        bay.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bay.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bay.cropVariety.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const sev = getBayEffectiveSeverity(bay);

      // Filter matching
      if (filter === 'action_needed') {
        return sev === 'Warning' || sev === 'Critical' || bay.status === 'Flagged' || Boolean(bay.activeFlag);
      }
      if (filter === 'flagged') {
        return bay.status === 'Flagged' || Boolean(bay.activeFlag);
      }
      if (filter === 'optimal') {
        return sev === 'Normal';
      }
      return true;
    });
  }, [bays, filter, searchQuery]);

  // Find highest-priority unresolved bay (Critical -> Warning -> Normal)
  const prioritizedAbnormal = getHighestPriorityUnresolvedBay(bays);
  const prioritizedSeverity = prioritizedAbnormal ? getBayEffectiveSeverity(prioritizedAbnormal) : null;
  const abnormalCtaLabel = prioritizedAbnormal
    ? prioritizedSeverity === 'Critical'
      ? `Inspect Critical (${prioritizedAbnormal.id})`
      : `Inspect Warning (${prioritizedAbnormal.id})`
    : null;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Shift Banner & Facility Context */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-4 -mr-4 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Facility Zone 4 Handover
              </span>
              <span className="text-xs text-slate-400">
                {shiftInfo.shiftName}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Shift Handover Facility Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Review prototype facility pH and nutrient (EC) dosing readings across all 12 bays. Flag abnormal bays with technician diagnostic notes for incoming team ({shiftInfo.incomingTeam}).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0 w-full sm:w-auto">
            {prioritizedAbnormal && (
              <button
                id="cta-inspect-first-abnormal"
                onClick={() => onInspectBay(prioritizedAbnormal.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer min-h-[44px] whitespace-nowrap ${
                  prioritizedSeverity === 'Critical'
                    ? 'bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-white animate-pulse'
                    : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${prioritizedSeverity === 'Critical' ? 'text-white' : 'text-slate-950 fill-amber-300'}`} />
                <span>{abnormalCtaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
              </button>
            )}
            <button
              id="cta-review-handover-summary"
              onClick={onSwitchToHandover}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer min-h-[44px] whitespace-nowrap"
            >
              <Flag className="w-4 h-4 flex-shrink-0" />
              <span>Review Handover Logs ({flaggedBays})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Bays */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Monitored Bays</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {totalBays}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              12 / 12 Bays Available
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
            <span>Avg pH: <strong className="font-mono text-slate-800 dark:text-slate-200">{avgPh}</strong></span>
            <span>•</span>
            <span>Avg EC: <strong className="font-mono text-slate-800 dark:text-slate-200">{avgEc}</strong></span>
          </div>
        </div>

        {/* Card 2: Optimal Bays */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setFilter('optimal')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter('optimal'); } }}
          className={`bg-white dark:bg-slate-900 rounded-xl p-3.5 sm:p-4 border shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            filter === 'optimal' ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Optimal Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {normalBays}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              of {totalBays} bays
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${(normalBays / totalBays) * 100}%` }}
            />
          </div>
        </div>

        {/* Card 3: Action Needed / Out of Range */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setFilter('action_needed')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter('action_needed'); } }}
          className={`bg-white dark:bg-slate-900 rounded-xl p-3.5 sm:p-4 border shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            filter === 'action_needed' ? 'ring-2 ring-amber-500 border-amber-500' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Attention Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {abnormalCount + flaggedBays}
            </span>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              {criticalBays} Critical
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {abnormalCount === 0 ? 'All parameters nominal' : `${abnormalCount} unflagged out of target`}
          </div>
        </div>

        {/* Card 4: Flagged for Shift */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setFilter('flagged')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter('flagged'); } }}
          className={`bg-white dark:bg-slate-900 rounded-xl p-3.5 sm:p-4 border shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            filter === 'flagged' ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Flagged for Handover</span>
            <Flag className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {flaggedBays}
            </span>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              In Report
            </span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Handover flag list updated in app
          </div>
        </div>
      </div>

      {/* Live External Conditions (Screen 1 Integration - NEA / data.gov.sg S111) */}
      <LiveExternalConditions />

      {/* Filters & Search Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Filter Segmented Control Button Group */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 w-full lg:w-auto">
          <button
            id="filter-btn-all"
            onClick={() => setFilter('all')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 ${
              filter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <span>All Bays</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              filter === 'all'
                ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {totalBays}
            </span>
          </button>

          <button
            id="filter-btn-action"
            onClick={() => setFilter('action_needed')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 ${
              filter === 'action_needed'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Action Needed</span>
            <span className="sm:hidden">Attention</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              filter === 'action_needed'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
            }`}>
              {abnormalCount + flaggedBays}
            </span>
          </button>

          <button
            id="filter-btn-flagged"
            onClick={() => setFilter('flagged')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 ${
              filter === 'flagged'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <Flag className="w-3.5 h-3.5 fill-current flex-shrink-0" />
            <span className="hidden sm:inline">Flagged for Shift</span>
            <span className="sm:hidden">Flagged</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              filter === 'flagged'
                ? 'bg-indigo-700 text-white'
                : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
            }`}>
              {flaggedBays}
            </span>
          </button>

          <button
            id="filter-btn-optimal"
            onClick={() => setFilter('optimal')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 ${
              filter === 'optimal'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Optimal</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              filter === 'optimal'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
            }`}>
              {normalBays}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-bays-input"
            type="text"
            placeholder="Search bay ID or crop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid of 12 Hydroponic Bays */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 px-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Hydroponic Bays ({filteredBays.length} of {totalBays} displayed)
          </h3>
          <span className="text-[11px] sm:text-xs text-slate-500">
            Prototype facility readings • Click any bay to inspect trend logs & flag
          </span>
        </div>

        {filteredBays.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-spin" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No bays match your current filter or search criteria
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try resetting filters or searching with a different crop name.
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}
              className="mt-3 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBays.map((bay) => (
              <BayCard
                key={bay.id}
                bay={bay}
                onInspect={onInspectBay}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
