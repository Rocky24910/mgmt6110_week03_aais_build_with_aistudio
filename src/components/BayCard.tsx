import React from 'react';
import { HydroBay } from '../types';
import { getBayEffectiveSeverity } from '../utils/bayPrioritization';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Flag, 
  ArrowUpRight, 
  ArrowDownRight, 
  Thermometer, 
  Activity, 
  Droplet,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface BayCardProps {
  bay: HydroBay;
  onInspect: (bayId: string) => void;
  onQuickFlag?: (bayId: string) => void;
}

export const BayCard: React.FC<BayCardProps> = ({ bay, onInspect }) => {
  const effectiveSeverity = getBayEffectiveSeverity(bay);

  // Determine pH state
  const isPhHigh = bay.pH > bay.targetPhMax;
  const isPhLow = bay.pH < bay.targetPhMin;
  const isPhNormal = !isPhHigh && !isPhLow;

  // Determine EC state
  const isEcHigh = bay.ec > bay.targetEcMax;
  const isEcLow = bay.ec < bay.targetEcMin;
  const isEcNormal = !isEcHigh && !isEcLow;

  // Status Styling
  const getStatusBadge = () => {
    const isFlagged = bay.status === 'Flagged' || Boolean(bay.activeFlag);

    return (
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {/* Severity indicator */}
        {effectiveSeverity === 'Critical' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 animate-pulse">
            <AlertOctagon className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Critical
          </span>
        )}
        {effectiveSeverity === 'Warning' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Warning
          </span>
        )}
        {effectiveSeverity === 'Normal' && !isFlagged && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Normal
          </span>
        )}

        {/* Handover Flag status badge */}
        {isFlagged && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800 shadow-sm">
            <Flag className="w-3 h-3 text-indigo-600 dark:text-indigo-400 fill-indigo-500" />
            Flagged
          </span>
        )}
      </div>
    );
  };

  const getBorderColor = () => {
    if (bay.status === 'Flagged' || bay.activeFlag) {
      return 'border-indigo-500 ring-1 ring-indigo-400/30';
    }
    switch (effectiveSeverity) {
      case 'Critical':
        return 'border-rose-500 ring-1 ring-rose-400/30';
      case 'Warning':
        return 'border-amber-400';
      case 'Normal':
        return 'border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div
      id={`bay-card-${bay.id.toLowerCase()}`}
      className={`bg-white dark:bg-slate-900 rounded-xl border ${getBorderColor()} p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
    >
      {/* Top Header: ID, Crop, Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                {bay.id}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {bay.growthStage}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
              {bay.cropType}
            </h3>
          </div>
          <div className="flex-shrink-0">{getStatusBadge()}</div>
        </div>

        {/* Status Message or Active Flag Callout */}
        {bay.activeFlag ? (
          <div className="mb-3 p-2.5 rounded-lg bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 text-xs">
            <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-300 mb-1">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                {bay.activeFlag.category}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-extrabold bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                {bay.activeFlag.priority} Priority
              </span>
            </div>
            <p className="text-indigo-800/90 dark:text-indigo-300/90 text-[11px] line-clamp-2 leading-relaxed">
              "{bay.activeFlag.notes}"
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-1">
            {bay.statusMessage}
          </p>
        )}

        {/* Primary Critical Metrics Grid: pH & EC */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* pH Metric Block */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col justify-between ${
              isPhNormal
                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                : isPhHigh
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>pH Level</span>
              <span className="text-[10px] font-mono">
                {bay.targetPhMin}-{bay.targetPhMax}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span
                className={`text-xl font-black font-mono ${
                  isPhNormal
                    ? 'text-slate-900 dark:text-slate-100'
                    : isPhHigh
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {bay.pH.toFixed(2)}
              </span>
              {!isPhNormal && (
                <span className="flex items-center text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  {isPhHigh ? (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5" /> High
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-3.5 h-3.5" /> Low
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* EC Metric Block */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col justify-between ${
              isEcNormal
                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                : isEcHigh
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>EC (Nutrient)</span>
              <span className="text-[10px] font-mono">
                {bay.targetEcMin}-{bay.targetEcMax}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span
                className={`text-xl font-black font-mono ${
                  isEcNormal
                    ? 'text-slate-900 dark:text-slate-100'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {bay.ec.toFixed(2)}
                <span className="text-[10px] font-normal text-slate-500 ml-0.5">mS</span>
              </span>
              {!isEcNormal && (
                <span className="flex items-center text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {isEcHigh ? (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5" /> Rich
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-3.5 h-3.5" /> Low
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Metrics Strip: Temp & Water Level */}
        <div className="flex items-center justify-between flex-wrap gap-y-1 gap-x-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 px-1 py-1.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-slate-400" />
            <span>Water Temp:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {bay.waterTemp.toFixed(1)}°C
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Droplet className="w-3.5 h-3.5 text-cyan-500" />
            <span>Res:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {bay.waterLevelPct}%
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">{bay.flowRateLpm} L/m</span>
          </div>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
        <button
          id={`inspect-bay-btn-${bay.id.toLowerCase()}`}
          onClick={() => onInspect(bay.id)}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-all active:scale-[0.99] cursor-pointer min-h-[44px] ${
            bay.status === 'Flagged'
              ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm'
              : bay.status === 'Critical' || bay.status === 'Warning'
              ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 text-slate-800 dark:text-slate-200'
          }`}
        >
          {bay.status === 'Flagged' ? (
            <>
              <div className="flex items-center gap-2">
                <Flag className="w-3.5 h-3.5 fill-current flex-shrink-0" />
                <span>Manage Flag & Notes</span>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-80" />
            </>
          ) : bay.status === 'Critical' || bay.status === 'Warning' ? (
            <>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Inspect & Flag Bay</span>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-80" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span>Inspect Diagnostics</span>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
