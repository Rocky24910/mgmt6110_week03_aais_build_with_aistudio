import React, { useState, useEffect } from 'react';
import { ShiftInfo, HydroBay, HandoverChecklistItem } from '../types';
import { 
  getBayEffectiveSeverity, 
  getUnresolvedAbnormalBays 
} from '../utils/bayPrioritization';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Send, 
  Bell, 
  X, 
  AlertTriangle, 
  Sparkles,
  Lock,
  Unlock,
  ArrowLeft,
  CheckSquare,
  AlertOctagon
} from 'lucide-react';

interface HandoverConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftInfo: ShiftInfo;
  flaggedBays: HydroBay[];
  checklist: HandoverChecklistItem[];
  allBays: HydroBay[];
  onConfirmLock: () => void;
}

export const HandoverConfirmModal: React.FC<HandoverConfirmModalProps> = ({
  isOpen,
  onClose,
  shiftInfo,
  flaggedBays,
  checklist,
  allBays,
  onConfirmLock,
}) => {
  const [copied, setCopied] = useState(false);
  const [isWarningStage, setIsWarningStage] = useState(false);
  const [overrideAcknowledged, setOverrideAcknowledged] = useState(false);

  // Reset internal modal stage whenever modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      setIsWarningStage(false);
      setOverrideAcknowledged(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' SGT';

  // Audit checklist completeness
  const completedChecks = checklist.filter((c) => c.completed).length;
  const totalChecks = checklist.length;
  const isChecklistComplete = completedChecks === totalChecks;
  const incompleteChecklist = checklist.filter((c) => !c.completed);

  // Audit unresolved abnormal bays (Critical or Warning without active unresolved flag)
  const unresolvedAbnormalBays = getUnresolvedAbnormalBays(allBays);
  const hasOutstandingItems = incompleteChecklist.length > 0 || unresolvedAbnormalBays.length > 0;

  // Construct truthful checklist status text
  const checklistStatusText = isChecklistComplete
    ? `Facility automated systems verified (${completedChecks} of ${totalChecks} verified).`
    : `Incomplete - ${completedChecks} of ${totalChecks} verified (${totalChecks - completedChecks} pending verification).`;

  // Construct truthful handover status text
  const handoverStatusText = shiftInfo.isLocked
    ? `LOCKED & CONFIRMED BY OUTGOING TECHNICIAN (${shiftInfo.lockedAt || timestamp}).`
    : `DRAFT / PENDING CONFIRMATION (Not Locked).`;

  const summaryHeader = shiftInfo.isLocked
    ? `[HYDROCROP OPS SHIFT HANDOVER SUMMARY - LOCKED & CONFIRMED]`
    : `[HYDROCROP OPS SHIFT HANDOVER SUMMARY - DRAFT / PENDING CONFIRMATION]`;

  // Construct the shift handover summary broadcast payload
  const broadcastText = `${summaryHeader}
Shift: ${shiftInfo.shiftId} (${shiftInfo.shiftName})
Outgoing Lead: ${shiftInfo.outgoingLead}
Incoming Team: ${shiftInfo.incomingTeam}
Timestamp: ${timestamp}
Facility: ${shiftInfo.facilityName} - ${shiftInfo.facilityZone}

FLAGGED BAYS & ACTION REQUIRED (${flaggedBays.length} active):
${
  flaggedBays.length === 0
    ? 'All 12 automated bays nominal. Zero abnormal flags.'
    : flaggedBays
        .map(
          (b, idx) =>
            `${idx + 1}. [${b.id}] ${b.cropType} - ${b.activeFlag?.priority.toUpperCase()} PRIORITY: ${b.activeFlag?.category} (Current pH: ${b.pH.toFixed(2)}, EC: ${b.ec.toFixed(2)} mS)\n   Action: ${b.activeFlag?.actionRequired}\n   Assigned: ${b.activeFlag?.assignedTeam}`
        )
        .join('\n\n')
}

Checklist Status: ${checklistStatusText}
Handover Status: ${handoverStatusText}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(broadcastText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleInitialConfirmClick = () => {
    if (hasOutstandingItems) {
      // Do not silently confirm; show clear warning and require explicit acknowledgment
      setIsWarningStage(true);
    } else {
      onConfirmLock();
    }
  };

  const handleOverrideConfirmClick = () => {
    if (!overrideAcknowledged) return;
    onConfirmLock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-4 sm:p-6">
        
        {/* VIEW 1: INCOMPLETE HANDOVER WARNING & EXPLICIT OVERRIDE */}
        {isWarningStage ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Incomplete Handover Verification Warning
                  </h3>
                  <p className="text-xs text-amber-300 font-medium">
                    {incompleteChecklist.length} checklist item{incompleteChecklist.length !== 1 ? 's' : ''} and {unresolvedAbnormalBays.length} abnormal bay{unresolvedAbnormalBays.length !== 1 ? 's' : ''} are still unresolved.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWarningStage(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Callout Box */}
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 leading-relaxed">
              <p className="font-semibold text-amber-300">
                You are about to lock this shift log, but facility verification is incomplete.
              </p>
              <p className="mt-1 text-slate-300">
                To guarantee safe operations for the incoming shift team ({shiftInfo.incomingTeam}), all facility checklist items should be verified and abnormal bays flagged.
              </p>
            </div>

            {/* List of Incomplete Checklist Items */}
            {incompleteChecklist.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unverified Checklist Items ({incompleteChecklist.length} pending):</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  {incompleteChecklist.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-slate-400">
                      <span className="text-amber-400 font-mono font-bold">•</span>
                      <span>
                        <strong className="text-slate-200">[{item.category}]</strong> {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List of Unresolved Abnormal Bays */}
            {unresolvedAbnormalBays.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Unresolved Abnormal Bays ({unresolvedAbnormalBays.length} unflagged):</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  {unresolvedAbnormalBays.map((bay) => {
                    const sev = getBayEffectiveSeverity(bay);
                    return (
                      <div key={bay.id} className="flex items-center justify-between gap-2 text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100">{bay.id}</span>
                          <span className="text-slate-400">({bay.cropType})</span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          sev === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {sev}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Explicit Override Acknowledgment */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="acknowledge-override-checkbox"
                  checked={overrideAcknowledged}
                  onChange={(e) => setOverrideAcknowledged(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-slate-200 leading-snug">
                  I acknowledge that <strong className="text-amber-400">{incompleteChecklist.length} checklist item{incompleteChecklist.length !== 1 ? 's' : ''}</strong> and <strong className="text-amber-400">{unresolvedAbnormalBays.length} abnormal bay{unresolvedAbnormalBays.length !== 1 ? 's' : ''}</strong> remain unresolved, and I explicitly authorize locking this shift handover log.
                </span>
              </label>
            </div>

            {/* Warning Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsWarningStage(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Resolve Items</span>
              </button>

              <button
                type="button"
                id="confirm-incomplete-override-btn"
                onClick={handleOverrideConfirmClick}
                disabled={!overrideAcknowledged}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all min-h-[44px] ${
                  overrideAcknowledged
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm & Lock with Explicit Override</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: STANDARD HANDOVER SUMMARY PREVIEW */
          <div>
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                  shiftInfo.isLocked
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                }`}>
                  {shiftInfo.isLocked ? (
                    <Lock className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Bell className="w-5 h-5 animate-bounce" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white truncate">
                      Shift Handover Summary
                    </h3>
                    {shiftInfo.isLocked ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Locked & Confirmed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        Draft / Pending Confirmation
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    Records handover summary for incoming team: {shiftInfo.incomingTeam}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dispatch Overview Box */}
            <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                <span className={`flex items-center gap-1.5 font-bold ${shiftInfo.isLocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {shiftInfo.isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Locked & Confirmed Summary
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      Draft Summary Preview (Pending Confirmation)
                    </>
                  )}
                </span>
                <span>{timestamp}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Shift ID:</span>{' '}
                  <span className="text-slate-200 font-bold">{shiftInfo.shiftId}</span>
                </div>
                <div>
                  <span className="text-slate-500">Outgoing:</span>{' '}
                  <span className="text-slate-200">{shiftInfo.outgoingLead}</span>
                </div>
                <div>
                  <span className="text-slate-500">Receiver:</span>{' '}
                  <span className="text-slate-200">{shiftInfo.incomingTeam}</span>
                </div>
                <div>
                  <span className="text-slate-500">Checklist Verified:</span>{' '}
                  <span className={isChecklistComplete ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {completedChecks} of {totalChecks}
                  </span>
                </div>
              </div>

              {/* Broadcast Payload Box */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {broadcastText}
              </div>
            </div>

            {/* Flagged Summary Badges */}
            <div className="mt-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Handover Action Queue ({flaggedBays.length}):
              </div>
              <div className="space-y-2">
                {flaggedBays.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No bays flagged for incoming team.</p>
                ) : (
                  flaggedBays.map((bay) => (
                    <div
                      key={bay.id}
                      className="p-2.5 rounded-lg bg-slate-800/80 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-300">{bay.id}</span>
                          <span className="font-semibold text-white">{bay.cropType}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900 text-indigo-200 font-bold uppercase">
                            {bay.activeFlag?.priority} Priority
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1">
                          {bay.activeFlag?.category} • Action: {bay.activeFlag?.actionRequired}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                        {bay.activeFlag?.assignedTeam}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handleCopy}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Handover Summary</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
                >
                  Close
                </button>

                {!shiftInfo.isLocked && (
                  <button
                    id="confirm-lock-shift-btn"
                    onClick={handleInitialConfirmClick}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer min-h-[44px]"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Lock Shift Log</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
