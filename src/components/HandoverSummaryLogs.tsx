import React, { useState } from 'react';
import { HydroBay, ShiftInfo, ActivityLog, HandoverChecklistItem } from '../types';
import { 
  getBayEffectiveSeverity, 
  getUnresolvedAbnormalBays 
} from '../utils/bayPrioritization';
import { 
  FileCheck, 
  ShieldCheck, 
  AlertTriangle, 
  Flag, 
  CheckCircle2, 
  Clock, 
  CheckSquare, 
  Square, 
  Plus, 
  Printer, 
  Share2, 
  Send, 
  User, 
  Layers, 
  Sparkles,
  Lock,
  Unlock,
  AlertOctagon
} from 'lucide-react';

interface HandoverSummaryLogsProps {
  shiftInfo: ShiftInfo;
  bays: HydroBay[];
  activityLogs: ActivityLog[];
  checklist: HandoverChecklistItem[];
  onToggleChecklist: (id: string) => void;
  onAddLog: (details: string) => void;
  onInspectBay: (bayId: string) => void;
  onOpenConfirmModal: () => void;
  onUnlockShift: () => void;
}

export const HandoverSummaryLogs: React.FC<HandoverSummaryLogsProps> = ({
  shiftInfo,
  bays,
  activityLogs,
  checklist,
  onToggleChecklist,
  onAddLog,
  onInspectBay,
  onOpenConfirmModal,
  onUnlockShift,
}) => {
  const [newLogText, setNewLogText] = useState('');
  const [logInputError, setLogInputError] = useState<string | null>(null);

  const flaggedBays = bays.filter((b) => b.status === 'Flagged' || Boolean(b.activeFlag));
  // Unresolved abnormal bays prioritized: Critical -> Warning -> Normal
  const unflaggedAbnormal = getUnresolvedAbnormalBays(bays);
  const highestUnresolved = unflaggedAbnormal.length > 0 ? unflaggedAbnormal[0] : null;
  const highestUnresolvedSev = highestUnresolved ? getBayEffectiveSeverity(highestUnresolved) : null;
  const abnormalCtaLabel = highestUnresolved
    ? highestUnresolvedSev === 'Critical'
      ? `Inspect Critical (${highestUnresolved.id})`
      : `Inspect Warning (${highestUnresolved.id})`
    : null;

  const completedChecks = checklist.filter((c) => c.completed).length;
  const checklistPct = Math.round((completedChecks / checklist.length) * 100);

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shiftInfo.isLocked) return;
    const trimmed = newLogText.trim();
    if (!trimmed) {
      setLogInputError('Handover observation note is required and cannot be empty or whitespace only.');
      return;
    }
    setLogInputError(null);
    onAddLog(trimmed);
    setNewLogText('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-24 md:pb-10 max-w-5xl mx-auto">
      {/* Screen 3 Header / Shift Status Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" />
                Screen 3 • Shift Completion
              </span>
              <span className="text-xs text-slate-400">
                {shiftInfo.shiftDate}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Shift Handover Summary & Logs
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Official shift handover documentation for vertical farm operations. Review flagged bays, verify pre-handover facility systems, and confirm shift handover summary.
            </p>
          </div>

          {/* Buttons Row: Status Indicator, Print/Save PDF, and Confirm Handover */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-shrink-0 w-full lg:w-auto">
            {shiftInfo.isLocked ? (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 flex items-center justify-center gap-1.5 min-h-[44px] shadow-sm">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Locked & Confirmed</span>
                </div>
                <button
                  id="reopen-log-banner-btn"
                  onClick={onUnlockShift}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1"
                  title="Reopen shift log to make modifications"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reopen Log</span>
                </button>
              </div>
            ) : (
              <div className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80 flex items-center justify-center gap-1.5 min-h-[44px] text-center shadow-sm">
                <Unlock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Pending Handover Confirmation</span>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] shadow-sm"
            >
              <Printer className="w-4 h-4 flex-shrink-0" />
              <span>Print / Save PDF</span>
            </button>

            <button
              id="handover-main-cta-btn"
              onClick={onOpenConfirmModal}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer min-h-[44px] ${
                shiftInfo.isLocked
                  ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white'
              }`}
            >
              {shiftInfo.isLocked ? (
                <>
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>View Handover Summary</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 flex-shrink-0" />
                  <span>Confirm Shift Handover</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Handover Roster Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Shift Reference:</span>
            <span className="font-bold text-slate-200">{shiftInfo.shiftId}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Outgoing Lead:</span>
            <span className="font-bold text-slate-200">{shiftInfo.outgoingLead}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Incoming Shift Team:</span>
            <span className="font-bold text-purple-300">{shiftInfo.incomingTeam}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Bays Needing Attention:</span>
            <span className="font-bold text-amber-400">
              {flaggedBays.length} Flagged / {unflaggedAbnormal.length} Warning
            </span>
          </div>
        </div>
      </div>

      {/* Flagged Bays & Unresolved Alerts Section (Core) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex-shrink-0">
                <Flag className="w-5 h-5 fill-current" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Flagged Bays for Incoming Shift Team ({flaggedBays.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              These bays have been flagged with diagnostic notes and required actions for the incoming shift.
            </p>
          </div>

          <span className="self-start sm:self-auto text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {flaggedBays.length} Active in Handover
          </span>
        </div>

        {flaggedBays.length === 0 ? (
          <div className="p-6 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              All 12 automated bays are in nominal status!
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
              No bays are currently flagged for the incoming shift.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {flaggedBays.map((bay) => (
              <div
                key={bay.id}
                id={`handover-flagged-bay-${bay.id.toLowerCase()}`}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-slate-700">
                        {bay.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bay.cropType}
                      </span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                        {bay.activeFlag?.priority} Priority
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 sm:gap-3 text-xs text-slate-500 flex-wrap">
                      <span>Category: <strong className="text-slate-800 dark:text-slate-200">{bay.activeFlag?.category}</strong></span>
                      <span>•</span>
                      <span>Flagged: {bay.activeFlag?.flaggedAt} by {bay.activeFlag?.technicianName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      pH: {bay.pH.toFixed(2)} | EC: {bay.ec.toFixed(2)} mS
                    </span>
                    <button
                      onClick={() => onInspectBay(bay.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer min-h-[40px]"
                    >
                      {shiftInfo.isLocked ? 'View Flag (Locked)' : 'Edit Flag'}
                    </button>
                  </div>
                </div>

                {/* Technician Notes Box */}
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Technician Diagnostic Notes:
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{bay.activeFlag?.notes}"
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <div>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">Action Required:</span>{' '}
                      <span className="text-slate-800 dark:text-slate-200">{bay.activeFlag?.actionRequired}</span>
                    </div>
                    <div className="text-slate-500">
                      Assigned: <strong className="text-slate-700 dark:text-slate-300">{bay.activeFlag?.assignedTeam}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Warning if there are unflagged abnormal bays */}
        {unflaggedAbnormal.length > 0 && highestUnresolved && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {unflaggedAbnormal.length} Abnormal Bay(s) Not Yet Flagged:
                </span>{' '}
                <span className="text-amber-800 dark:text-amber-300">
                  {unflaggedAbnormal.map((b) => `${b.id} (${getBayEffectiveSeverity(b)} - ${b.cropType})`).join(', ')}
                </span>
              </div>
            </div>
            <button
              id="handover-inspect-top-abnormal-btn"
              onClick={() => onInspectBay(highestUnresolved.id)}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-bold text-white flex-shrink-0 cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                highestUnresolvedSev === 'Critical'
                  ? 'bg-rose-600 hover:bg-rose-500 animate-pulse'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              <span>{abnormalCtaLabel}</span>
            </button>
          </div>
        )}
      </div>

      {/* Facility Pre-Handover Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              Facility Pre-Handover Verification Checklist
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm physical and automated subsystems before signing off the shift.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              {completedChecks} of {checklist.length} Verified ({checklistPct}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${checklistPct}%` }}
          />
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!shiftInfo.isLocked) {
                  onToggleChecklist(item.id);
                }
              }}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                shiftInfo.isLocked
                  ? 'cursor-not-allowed opacity-80'
                  : 'cursor-pointer hover:border-slate-400'
              } ${
                item.completed
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
                <span className={`text-xs font-medium ${item.completed ? 'line-through text-slate-500' : ''}`}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {shiftInfo.isLocked && (
                  <span className="text-[10px] text-slate-400 italic">Locked</span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technician Shift Activity Log & Audit Trail */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:items-center justify-between gap-1 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
              Technician Shift Activity Log & Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological log of calibrations, automated alerts, and flag actions during this shift.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 self-start sm:self-auto">
            {activityLogs.length} events logged
          </span>
        </div>

        {/* Add quick observation log */}
        <form onSubmit={handleAddLogSubmit} className="mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="new-activity-log-input"
              type="text"
              disabled={shiftInfo.isLocked}
              placeholder={
                shiftInfo.isLocked
                  ? 'Shift log is locked & confirmed. Reopen log to add new entries.'
                  : "Add handover note (e.g., 'Checked RO permeate tank; UV bulb replaced')..."
              }
              value={newLogText}
              onChange={(e) => {
                setNewLogText(e.target.value);
                if (logInputError) setLogInputError(null);
              }}
              className={`flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:outline-none min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed ${
                logInputError
                  ? 'border-rose-500 ring-1 ring-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
              }`}
            />
            <button
              type="submit"
              disabled={shiftInfo.isLocked}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Add Entry</span>
            </button>
          </div>
          {logInputError && (
            <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{logInputError}</span>
            </p>
          )}
        </form>

        {/* Activity Logs Timeline */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {activityLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex items-start gap-3"
            >
              <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap mt-0.5">
                {log.timestamp}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      log.actionType === 'FLAG_CREATED'
                        ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200'
                        : log.actionType === 'HANDOVER_CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {log.actionType.replace('_', ' ')}
                  </span>
                  {log.bayId && (
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {log.bayId}
                    </span>
                  )}
                  <span className="text-slate-400 text-[11px]">
                    by {log.technician}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed break-words">
                  {log.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Handover Confirmation Callout Block */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-bold text-base text-white">
                Ready to Complete Shift Handover?
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Confirming locks this shift log, archives the {flaggedBays.length} active flag(s), and records the handover summary for the incoming shift ({shiftInfo.incomingTeam}).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {shiftInfo.isLocked && (
              <button
                onClick={onUnlockShift}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Reopen Log
              </button>
            )}

            <button
              id="confirm-shift-handover-action-btn"
              onClick={onOpenConfirmModal}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer min-h-[48px]"
            >
              <Send className="w-4 h-4 text-slate-950 flex-shrink-0" />
              <span>{shiftInfo.isLocked ? 'View Handover Summary' : 'Confirm Shift Handover'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
