import React, { useState, useEffect } from 'react';
import { HydroBay, IssueCategory, PriorityLevel, BayFlag, BayDraft } from '../types';
import { ISSUE_CATEGORIES, PRIORITY_LEVELS } from '../data/mockData';
import { getBayEffectiveSeverity } from '../utils/bayPrioritization';
import { 
  AlertTriangle, 
  Flag, 
  CheckCircle2, 
  AlertOctagon, 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  Save, 
  RotateCcw,
  Sparkles,
  Layers,
  Thermometer,
  Droplets,
  Activity,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Lock,
  Edit3
} from 'lucide-react';

interface BayInspectionActionFormProps {
  bays: HydroBay[];
  selectedBayId: string;
  onSelectBay: (bayId: string) => void;
  onFlagBay: (bayId: string, flag: BayFlag) => void;
  onResolveFlag: (bayId: string) => void;
  onBackToOverview: () => void;
  onProceedToHandover: () => void;
  currentTechnician: string;
  isLocked?: boolean;
  bayDrafts?: Record<string, BayDraft>;
  onUpdateBayDraft?: (bayId: string, draft: BayDraft) => void;
  onClearBayDraft?: (bayId: string) => void;
}

// Helper to compute standard default sensor recommendations for a bay
function getDefaultSensorTemplate(bay: HydroBay) {
  if (bay.pH > bay.targetPhMax) {
    return {
      category: 'pH Spike (Alkaline Drift)' as IssueCategory,
      notes: `Detected abnormal pH spike to ${bay.pH.toFixed(2)} (Target max is ${bay.targetPhMax.toFixed(2)}). Buffer dosing response was delayed.`,
      actionRequired: 'Perform manual 100ml buffer dosing and recalibrate automated acid pump line.',
    };
  } else if (bay.pH < bay.targetPhMin) {
    return {
      category: 'pH Drop (Acidic Drift)' as IssueCategory,
      notes: `Detected rapid acidic drop to ${bay.pH.toFixed(2)} (Target min is ${bay.targetPhMin.toFixed(2)}). Root zone acidification suspected.`,
      actionRequired: 'Perform 15% reservoir water dilution and verify automated base doser valve.',
    };
  } else if (bay.ec < bay.targetEcMin) {
    return {
      category: 'EC Nutrient Depletion' as IssueCategory,
      notes: `Nutrient EC level depleted to ${bay.ec.toFixed(2)} mS/cm (Target min is ${bay.targetEcMin.toFixed(2)} mS/cm).`,
      actionRequired: 'Check nutrient concentrate A/B tanks and verify pump feed tubing.',
    };
  } else if (bay.ec > bay.targetEcMax) {
    return {
      category: 'EC Salt Concentration' as IssueCategory,
      notes: `Nutrient EC level spiked to ${bay.ec.toFixed(2)} mS/cm (Target max is ${bay.targetEcMax.toFixed(2)} mS/cm).`,
      actionRequired: 'Top up RO fresh water reservoir and verify auto-refill valve.',
    };
  } else if (bay.waterTemp > bay.targetTempMax) {
    return {
      category: 'Water Temp Anomaly' as IssueCategory,
      notes: `Chiller water temp reached ${bay.waterTemp.toFixed(1)}°C (Target max is ${bay.targetTempMax.toFixed(1)}°C).`,
      actionRequired: 'Inspect chiller unit coolant compressor and clean heat exchanger intake filter.',
    };
  } else {
    return {
      category: 'Sensor Drift / Desync' as IssueCategory,
      notes: `Manual test check recommended for ${bay.id}.`,
      actionRequired: 'Perform dual-probe cross-validation test.',
    };
  }
}

export const BayInspectionActionForm: React.FC<BayInspectionActionFormProps> = ({
  bays,
  selectedBayId,
  onSelectBay,
  onFlagBay,
  onResolveFlag,
  onBackToOverview,
  onProceedToHandover,
  currentTechnician,
  isLocked = false,
  bayDrafts = {},
  onUpdateBayDraft,
  onClearBayDraft,
}) => {
  const selectedBay = bays.find((b) => b.id === selectedBayId) || bays[0];

  // Form states
  const [category, setCategory] = useState<IssueCategory>(
    selectedBay.activeFlag?.category || 'pH Spike (Alkaline Drift)'
  );
  const [priority, setPriority] = useState<PriorityLevel>(
    selectedBay.activeFlag?.priority || 'High'
  );
  const [notes, setNotes] = useState(
    selectedBay.activeFlag?.notes || ''
  );
  const [actionRequired, setActionRequired] = useState(
    selectedBay.activeFlag?.actionRequired || ''
  );
  const [assignedTeam, setAssignedTeam] = useState(
    selectedBay.activeFlag?.assignedTeam || 'Night Shift Dosing Specialist'
  );
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ assignedTeam?: string; notes?: string }>({});

  // Horizontal scroll controls for the 12-bay selector row
  const bayScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (bayScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = bayScrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const el = bayScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScrollButtons, { passive: true });
    window.addEventListener('resize', checkScrollButtons);
    return () => {
      el.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [bays]);

  // Keep currently selected bay in view via auto-scroll
  useEffect(() => {
    if (bayScrollRef.current) {
      const activeBtn = bayScrollRef.current.querySelector<HTMLElement>(
        `#select-bay-pill-${selectedBayId.toLowerCase()}`
      );
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [selectedBayId]);

  const scrollBays = (direction: 'left' | 'right') => {
    if (bayScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      bayScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Support standard desktop mouse wheel horizontal scrolling
  const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && e.deltaX === 0 && bayScrollRef.current) {
      bayScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Restore unsaved draft or auto-fill form if switching to another bay
  useEffect(() => {
    // Clear validation errors when switching bays
    setValidationErrors({});

    // Check if an unsaved draft exists for this bay during the current session
    if (bayDrafts && bayDrafts[selectedBay.id]) {
      const draft = bayDrafts[selectedBay.id];
      setCategory(draft.category);
      setPriority(draft.priority);
      setNotes(draft.notes);
      setActionRequired(draft.actionRequired);
      setAssignedTeam(draft.assignedTeam);
      return;
    }

    if (selectedBay.activeFlag) {
      setCategory(selectedBay.activeFlag.category);
      setPriority(selectedBay.activeFlag.priority);
      setNotes(selectedBay.activeFlag.notes);
      setActionRequired(selectedBay.activeFlag.actionRequired);
      setAssignedTeam(selectedBay.activeFlag.assignedTeam);
    } else {
      const template = getDefaultSensorTemplate(selectedBay);
      setCategory(template.category);
      setPriority('High');
      setNotes(template.notes);
      setActionRequired(template.actionRequired);
      setAssignedTeam('Night Shift Dosing Specialist');
    }
  }, [selectedBay.id, selectedBay.activeFlag]);

  // Save current form fields as draft for the active bay
  const saveCurrentDraft = (bayId: string) => {
    onUpdateBayDraft?.(bayId, {
      category,
      priority,
      notes,
      actionRequired,
      assignedTeam,
      isDirty: true,
    });
  };

  // Safe bay switching: preserves in-progress draft before switching
  const handleSelectBay = (targetBayId: string) => {
    if (targetBayId === selectedBay.id) return;
    saveCurrentDraft(selectedBay.id);
    onSelectBay(targetBayId);
  };

  const handleBackToOverview = () => {
    saveCurrentDraft(selectedBay.id);
    onBackToOverview();
  };

  const handleProceedToHandover = () => {
    saveCurrentDraft(selectedBay.id);
    onProceedToHandover();
  };

  const handleDiscardDraft = () => {
    onClearBayDraft?.(selectedBay.id);
    setValidationErrors({});
    if (selectedBay.activeFlag) {
      setCategory(selectedBay.activeFlag.category);
      setPriority(selectedBay.activeFlag.priority);
      setNotes(selectedBay.activeFlag.notes);
      setActionRequired(selectedBay.activeFlag.actionRequired);
      setAssignedTeam(selectedBay.activeFlag.assignedTeam);
    } else {
      const template = getDefaultSensorTemplate(selectedBay);
      setCategory(template.category);
      setPriority('High');
      setNotes(template.notes);
      setActionRequired(template.actionRequired);
      setAssignedTeam('Night Shift Dosing Specialist');
    }
  };

  // Handlers to update draft state continuously so edits are never lost
  const handleCategoryChange = (val: IssueCategory) => {
    setCategory(val);
    onUpdateBayDraft?.(selectedBay.id, {
      category: val,
      priority,
      notes,
      actionRequired,
      assignedTeam,
      isDirty: true,
    });
  };

  const handlePriorityChange = (val: PriorityLevel) => {
    setPriority(val);
    onUpdateBayDraft?.(selectedBay.id, {
      category,
      priority: val,
      notes,
      actionRequired,
      assignedTeam,
      isDirty: true,
    });
  };

  const handleAssignedTeamChange = (val: string) => {
    setAssignedTeam(val);
    if (validationErrors.assignedTeam) {
      setValidationErrors((prev) => ({ ...prev, assignedTeam: undefined }));
    }
    onUpdateBayDraft?.(selectedBay.id, {
      category,
      priority,
      notes,
      actionRequired,
      assignedTeam: val,
      isDirty: true,
    });
  };

  const handleActionRequiredChange = (val: string) => {
    setActionRequired(val);
    onUpdateBayDraft?.(selectedBay.id, {
      category,
      priority,
      notes,
      actionRequired: val,
      assignedTeam,
      isDirty: true,
    });
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (validationErrors.notes) {
      setValidationErrors((prev) => ({ ...prev, notes: undefined }));
    }
    onUpdateBayDraft?.(selectedBay.id, {
      category,
      priority,
      notes: val,
      actionRequired,
      assignedTeam,
      isDirty: true,
    });
  };

  const handleSubmitFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    // Trim whitespace before validation
    const trimmedNotes = notes.trim();
    const trimmedAssignedTeam = assignedTeam.trim();
    const trimmedActionRequired = actionRequired.trim();

    const errors: { assignedTeam?: string; notes?: string } = {};

    // Whitespace-only input must be treated as empty with a clear validation message
    if (!trimmedAssignedTeam) {
      errors.assignedTeam = 'Assign Action to Incoming Team is required and cannot be empty or whitespace only.';
    }

    // Do NOT automatically generate diagnostic notes when input is only whitespace
    if (!trimmedNotes) {
      errors.notes = 'Technician Diagnostic Notes are required and cannot be empty or whitespace only.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    const newFlag: BayFlag = {
      flagId: selectedBay.activeFlag?.flagId || `FLG-${selectedBay.id.replace('BAY-', '')}-${Date.now().toString().slice(-4)}`,
      flaggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' SGT',
      technicianName: currentTechnician,
      category,
      priority,
      notes: trimmedNotes,
      actionRequired: trimmedActionRequired || 'Inspect bay sensors and verify automated dosing.',
      assignedTeam: trimmedAssignedTeam,
      resolved: false,
    };

    onFlagBay(selectedBay.id, newFlag);
    // Clear draft for this bay upon successful submission
    onClearBayDraft?.(selectedBay.id);

    setToastMessage(`Bay ${selectedBay.id} flagged! Status updated to "Flagged" and added to incoming shift handover list.`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  const handleResolve = () => {
    if (isLocked) return;
    onResolveFlag(selectedBay.id);
    onClearBayDraft?.(selectedBay.id);
    setToastMessage(`Flag on Bay ${selectedBay.id} resolved and marked cleared.`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  // Metric status checks
  const phDeviation = (selectedBay.pH - (selectedBay.targetPhMin + selectedBay.targetPhMax) / 2).toFixed(2);
  const isPhOff = selectedBay.pH < selectedBay.targetPhMin || selectedBay.pH > selectedBay.targetPhMax;
  const isEcOff = selectedBay.ec < selectedBay.targetEcMin || selectedBay.ec > selectedBay.targetEcMax;
  const isTempOff = selectedBay.waterTemp < selectedBay.targetTempMin || selectedBay.waterTemp > selectedBay.targetTempMax;

  return (
    <div className="space-y-6 pb-24 md:pb-10 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900 text-white border-2 border-indigo-500 rounded-xl p-4 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-sm text-indigo-300">Shift Action Recorded</div>
            <p className="mt-0.5 text-slate-200">{toastMessage}</p>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            id="back-to-overview-btn"
            onClick={handleBackToOverview}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex-shrink-0"
            title="Back to Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Screen 2 • Diagnostics & Flagging
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">
              Bay Inspection & Action Form
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleProceedToHandover}
            className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Proceed to Handover Logs</span>
          </button>
        </div>
      </div>

      {/* Quick 12-Bay Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 px-0.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              Select Bay to Inspect (12 Prototype Bays):
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              Currently on: <strong className="text-slate-900 dark:text-slate-100 font-mono font-bold">{selectedBay.id}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Subtle visual cue to inform users that all 12 bays are horizontally scrollable */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px] sm:text-[11px] border border-slate-200 dark:border-slate-700/60 flex-shrink-0">
              <span className="text-emerald-500 font-bold">↔</span> Swipe / scroll to view all 12 bays
            </span>

            {/* Desktop & Trackpad Quick Scroll Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                id="bay-selector-scroll-left"
                onClick={() => scrollBays('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                title="Scroll left"
                className={`p-1.5 rounded-lg border transition-all cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
                  canScrollLeft
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-300 dark:text-slate-700 border-transparent cursor-not-allowed opacity-30'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="bay-selector-scroll-right"
                onClick={() => scrollBays('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                title="Scroll right to reach BAY-12"
                className={`p-1.5 rounded-lg border transition-all cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
                  canScrollRight
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-300 dark:text-slate-700 border-transparent cursor-not-allowed opacity-30'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontally scrollable 12-bay row with touch and mouse support */}
        <div
          ref={bayScrollRef}
          onWheel={handleWheelScroll}
          tabIndex={0}
          aria-label="Select Bay to Inspect (12 Bays Automated)"
          className="bay-selector-scroll flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-2.5 pt-1 w-full max-w-full min-w-0 overscroll-x-contain touch-pan-x outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 rounded-lg select-none"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
          }}
        >
          {bays.map((bay) => {
            const isSelected = bay.id === selectedBayId;
            const baySev = getBayEffectiveSeverity(bay);
            const isFlagged = bay.status === 'Flagged' || Boolean(bay.activeFlag);

            return (
              <button
                key={bay.id}
                id={`select-bay-pill-${bay.id.toLowerCase()}`}
                onClick={() => handleSelectBay(bay.id)}
                className={`flex-shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer min-h-[44px] min-w-[88px] justify-center whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md ring-2 ring-emerald-500 font-black scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {/* Status Dot */}
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    isFlagged
                      ? 'bg-indigo-500 animate-pulse'
                      : baySev === 'Critical'
                      ? 'bg-rose-500 animate-ping'
                      : baySev === 'Warning'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="font-mono">{bay.id}</span>
                {bayDrafts?.[bay.id]?.isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" title="Unsaved draft notes" />
                )}
                {isFlagged && (
                  <Flag className="w-3 h-3 text-indigo-400 fill-indigo-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Bay Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Bay Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono font-black px-2.5 py-1 rounded bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200">
                {selectedBay.id}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {selectedBay.name}
              </span>
              {bayDrafts?.[selectedBay.id]?.isDirty && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Unsaved Draft
                  </span>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-[10px] font-bold text-slate-500 hover:text-rose-500 underline cursor-pointer"
                    title="Discard unsaved draft changes"
                  >
                    Discard Draft
                  </button>
                </div>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {selectedBay.cropType}
            </h3>
            <p className="text-xs text-slate-500 italic mt-0.5">
              {selectedBay.cropVariety} • {selectedBay.growthStage}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedBay.activeFlag ? (
              <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 flex items-center gap-2 text-xs font-bold">
                <Flag className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-500" />
                Active Flag: {selectedBay.activeFlag.priority} Priority
              </div>
            ) : (
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  getBayEffectiveSeverity(selectedBay) === 'Normal'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : getBayEffectiveSeverity(selectedBay) === 'Warning'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                }`}
              >
                {getBayEffectiveSeverity(selectedBay) === 'Normal' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                Status: {getBayEffectiveSeverity(selectedBay)}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Diagnostics Comparison Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
          {/* Metric 1: pH */}
          <div
            className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between ${
              isPhOff
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-slate-500 font-medium flex-wrap">
              <span>pH Reading</span>
              <span className="font-mono text-[10px] text-slate-400">
                Tgt: {selectedBay.targetPhMin}-{selectedBay.targetPhMax}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between flex-wrap gap-1">
              <span
                className={`text-xl sm:text-2xl font-black font-mono ${
                  isPhOff
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {selectedBay.pH.toFixed(2)}
              </span>
              <span
                className={`text-[10px] sm:text-[11px] font-bold ${
                  isPhOff ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {Number(phDeviation) > 0 ? `+${phDeviation}` : phDeviation}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              {isPhOff ? (selectedBay.pH > selectedBay.targetPhMax ? 'Spike (Alkaline)' : 'Drop (Acidic)') : 'In Safe Zone'}
            </div>
          </div>

          {/* Metric 2: EC */}
          <div
            className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between ${
              isEcOff
                ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-slate-500 font-medium flex-wrap">
              <span>EC (Nutrient)</span>
              <span className="font-mono text-[10px] text-slate-400">
                Tgt: {selectedBay.targetEcMin}-{selectedBay.targetEcMax}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between flex-wrap gap-1">
              <span
                className={`text-xl sm:text-2xl font-black font-mono ${
                  isEcOff
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {selectedBay.ec.toFixed(2)}
                <span className="text-xs font-normal text-slate-500 ml-0.5">mS</span>
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              {isEcOff ? (selectedBay.ec > selectedBay.targetEcMax ? 'Over-concentrated' : 'Depleted') : 'Optimal Nutrients'}
            </div>
          </div>

          {/* Metric 3: Water Temp */}
          <div
            className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between ${
              isTempOff
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-slate-500 font-medium">
              <span>Water Temp</span>
              <Thermometer className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {selectedBay.waterTemp.toFixed(1)}°C
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              Target: {selectedBay.targetTempMin}-{selectedBay.targetTempMax}°C
            </div>
          </div>

          {/* Metric 4: DO & Water Level */}
          <div className="p-2.5 sm:p-3 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-slate-500 font-medium">
              <span>DO / Res</span>
              <Droplets className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between flex-wrap gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {selectedBay.dissolvedOxygen}
                <span className="text-[10px] sm:text-xs font-normal text-slate-500 ml-0.5">mg/L</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {selectedBay.waterLevelPct}%
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              Flow: {selectedBay.flowRateLpm} L/min
            </div>
          </div>
        </div>

        {/* Detailed Trend Logs (Past 7 Hours) */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Shift Trend Logs (Past 7 Hours of Prototype Dosing Readings)
              </h4>
              <p className="text-xs text-slate-500">
                Inspect how pH and EC shifted during the active operational cycle.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="sm:hidden text-[10px] text-slate-400">Swipe for all columns →</span>
              <span className="text-[11px] font-mono text-slate-400">
                Logged hourly
              </span>
            </div>
          </div>

          {/* Hourly Trend Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 -mx-1 sm:mx-0">
            <table className="w-full min-w-[540px] text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">pH Value</th>
                  <th className="py-2.5 px-3">pH Target</th>
                  <th className="py-2.5 px-3">EC (Nutrient)</th>
                  <th className="py-2.5 px-3">EC Target</th>
                  <th className="py-2.5 px-3">Water Temp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {selectedBay.trendHistory.map((reading, idx) => {
                  const isLast = idx === selectedBay.trendHistory.length - 1;
                  const rowPhOff = reading.pH < selectedBay.targetPhMin || reading.pH > selectedBay.targetPhMax;
                  const rowEcOff = reading.ec < selectedBay.targetEcMin || reading.ec > selectedBay.targetEcMax;
                  return (
                    <tr
                      key={reading.time}
                      className={isLast ? 'bg-slate-50/80 dark:bg-slate-800/40 font-bold' : ''}
                    >
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                        {reading.time} {isLast && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans ml-1">(Latest)</span>}
                      </td>
                      <td className={`py-2 px-3 ${rowPhOff ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-slate-100'}`}>
                        {reading.pH.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">
                        {selectedBay.targetPhMin} - {selectedBay.targetPhMax}
                      </td>
                      <td className={`py-2 px-3 ${rowEcOff ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-900 dark:text-slate-100'}`}>
                        {reading.ec.toFixed(2)} mS
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">
                        {selectedBay.targetEcMin} - {selectedBay.targetEcMax}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                        {reading.temp.toFixed(1)}°C
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Flag for Inspection Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                <Flag className="w-5 h-5 fill-current" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {selectedBay.activeFlag ? `Manage Active Flag for ${selectedBay.id}` : `Flag ${selectedBay.id} for Inspection`}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Submitting updates bay status to <strong className="text-indigo-600 dark:text-indigo-400">"Flagged"</strong> and records it in the handover summary for the incoming shift ({currentTechnician} → Night Shift Bravo).
            </p>
          </div>

          {selectedBay.activeFlag && (
            <button
              onClick={handleResolve}
              disabled={isLocked}
              className={`w-full sm:w-auto justify-center px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[44px] ${
                isLocked
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 cursor-pointer'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Resolve & Clear Flag
            </button>
          )}
        </div>

        {isLocked && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Shift Log Locked & Confirmed.</strong> Handover flags and technician notes are read-only. Reopen the shift log from the Handover tab to make modifications.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmitFlag} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Issue Category */}
            <div>
              <label htmlFor="issue-category-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Issue Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="issue-category-select"
                disabled={isLocked}
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as IssueCategory)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                required
              >
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority Level <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRIORITY_LEVELS.map((lvl) => {
                  const isSelected = priority === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      disabled={isLocked}
                      onClick={() => handlePriorityChange(lvl)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all min-h-[44px] flex items-center justify-center ${
                        isLocked
                          ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          : isSelected
                          ? lvl === 'Critical'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm cursor-pointer'
                            : lvl === 'High'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm cursor-pointer'
                            : 'bg-indigo-600 text-white border-indigo-600 shadow-sm cursor-pointer'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assigned Incoming Team */}
            <div>
              <label htmlFor="assigned-team-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Assign Action to Incoming Team <span className="text-rose-500">*</span>
              </label>
              <input
                id="assigned-team-input"
                type="text"
                disabled={isLocked}
                value={assignedTeam}
                onChange={(e) => handleAssignedTeamChange(e.target.value)}
                placeholder="e.g. Night Shift Dosing Specialist"
                className={`w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:outline-none min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed ${
                  validationErrors.assignedTeam
                    ? 'border-rose-500 ring-1 ring-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                }`}
                required
              />
              {validationErrors.assignedTeam && (
                <p id="assigned-team-validation-error" className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{validationErrors.assignedTeam}</span>
                </p>
              )}
            </div>

            {/* Outgoing Tech Signature */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Reporting Technician
              </label>
              <div className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between min-h-[44px]">
                <span>{currentTechnician}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  Active Shift Tech
                </span>
              </div>
            </div>
          </div>

          {/* Action Required for Incoming Shift */}
          <div>
            <label htmlFor="action-required-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Specific Action Required for Incoming Shift
            </label>
            <input
              id="action-required-input"
              type="text"
              disabled={isLocked}
              value={actionRequired}
              onChange={(e) => handleActionRequiredChange(e.target.value)}
              placeholder="e.g. Perform 15% reservoir water dilution and verify automated acid solenoid valve."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Technician Diagnostic Notes */}
          <div>
            <label htmlFor="technician-notes-textarea" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Technician Diagnostic Notes & Observations <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="technician-notes-textarea"
              rows={3}
              disabled={isLocked}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Detail observations, troubleshooting performed, manual test strip comparisons, or physical pump symptoms..."
              className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:outline-none leading-relaxed min-h-[90px] disabled:opacity-60 disabled:cursor-not-allowed ${
                validationErrors.notes
                  ? 'border-rose-500 ring-1 ring-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
              }`}
              required
            />
            {validationErrors.notes && (
              <p id="technician-notes-validation-error" className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{validationErrors.notes}</span>
              </p>
            )}
          </div>

          {/* Submit CTA Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              id="submit-flag-btn"
              type="submit"
              disabled={isLocked}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                isLocked
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isLocked ? 'Shift Log Locked (Read-Only)' : selectedBay.activeFlag ? 'Update Flag & Alerts' : 'Submit Flag for Incoming Shift'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
