import React, { useState, useEffect } from 'react';
import { HydroBay, BayFlag, ActivityLog, BayDraft } from './types';
import { 
  getBayEffectiveSeverity, 
  getHighestPriorityUnresolvedBay 
} from './utils/bayPrioritization';
import { 
  INITIAL_BAYS, 
  INITIAL_SHIFT_INFO, 
  INITIAL_CHECKLIST, 
  INITIAL_ACTIVITY_LOGS 
} from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ShiftHandoverOverview } from './components/ShiftHandoverOverview';
import { BayInspectionActionForm } from './components/BayInspectionActionForm';
import { HandoverSummaryLogs } from './components/HandoverSummaryLogs';
import { HandoverConfirmModal } from './components/HandoverConfirmModal';
import { DisqusComments } from './components/DisqusComments';

export default function App() {
  // Screen state: 3 clear screens without page reloads
  const [currentTab, setCurrentTab] = useState<'overview' | 'inspect' | 'handover'>('overview');
  // Initial bay prioritizes the highest-severity unresolved bay (BAY-07)
  const initialUnresolved = getHighestPriorityUnresolvedBay(INITIAL_BAYS);
  const [selectedBayId, setSelectedBayId] = useState<string>(initialUnresolved?.id || 'BAY-07');
  
  // Data states (Separated from UI, loaded from mockData.ts)
  const [bays, setBays] = useState<HydroBay[]>(INITIAL_BAYS);
  const [shiftInfo, setShiftInfo] = useState(INITIAL_SHIFT_INFO);
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  
  // In-session unsaved bay drafts preservation (prevents data loss when switching bays)
  const [bayDrafts, setBayDrafts] = useState<Record<string, BayDraft>>({});
  
  // Handover confirmation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Live facility clock display
  const [currentTime, setCurrentTime] = useState('15:18:20 SGT');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' SGT'
      );
    };
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Computed metrics
  const flaggedCount = bays.filter((b) => b.status === 'Flagged' || Boolean(b.activeFlag)).length;
  const abnormalCount = bays.filter((b) => {
    const sev = getBayEffectiveSeverity(b);
    return (sev === 'Warning' || sev === 'Critical') && (!b.activeFlag || b.activeFlag.resolved);
  }).length;

  // Handlers
  const handleInspectBay = (bayId: string) => {
    setSelectedBayId(bayId);
    setCurrentTab('inspect');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: 'overview' | 'inspect' | 'handover') => {
    if (tab === 'inspect') {
      // When navigating to inspect tab, prioritize the highest-severity unresolved bay
      const highestUnresolved = getHighestPriorityUnresolvedBay(bays);
      if (highestUnresolved) {
        setSelectedBayId(highestUnresolved.id);
      }
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFlagBay = (bayId: string, flag: BayFlag) => {
    if (shiftInfo.isLocked) return;

    setBays((prevBays) =>
      prevBays.map((bay) => {
        if (bay.id === bayId) {
          const effectiveSeverity = getBayEffectiveSeverity(bay);
          return {
            ...bay,
            severity: effectiveSeverity, // Preserves underlying severity (Critical/Warning)
            status: 'Flagged',
            statusMessage: `FLAGGED: ${flag.category} (${flag.priority} Priority). ${flag.notes}`,
            activeFlag: flag,
            lastUpdated: 'Just now',
          };
        }
        return bay;
      })
    );

    // Add activity log entry
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' SGT',
      technician: shiftInfo.outgoingLead,
      actionType: 'FLAG_CREATED',
      bayId,
      details: `Flagged ${bayId}: ${flag.category} [${flag.priority} Priority]. Action: "${flag.actionRequired}"`,
    };

    setActivityLogs((prev) => [newLog, ...prev]);
    // Clear unsaved draft once submitted as official flag
    handleClearBayDraft(bayId);
  };

  const handleResolveFlag = (bayId: string) => {
    if (shiftInfo.isLocked) return;

    setBays((prevBays) =>
      prevBays.map((bay) => {
        if (bay.id === bayId) {
          // Bay severity is determined by the underlying bay readings/conditions,
          // NOT by whether a handover flag is active, resolved, or removed.
          const effectiveSeverity = getBayEffectiveSeverity(bay);

          return {
            ...bay,
            severity: effectiveSeverity,
            status: effectiveSeverity, // Critical bays remain Critical!
            statusMessage:
              effectiveSeverity === 'Critical'
                ? `CRITICAL: High pH spike (${bay.pH.toFixed(2)}) and elevated chiller water temp (${bay.waterTemp.toFixed(1)}°C). Flag resolved; active monitoring ongoing.`
                : effectiveSeverity === 'Warning'
                ? 'WARNING: Telemetry slightly off target. Flag resolved; monitoring bay readings.'
                : 'Parameters stabilized within nominal range. Flag resolved.',
            activeFlag: null,
            lastUpdated: 'Just now',
          };
        }
        return bay;
      })
    );

    // Log resolution
    const resolveLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' SGT',
      technician: shiftInfo.outgoingLead,
      actionType: 'FLAG_RESOLVED',
      bayId,
      details: `Flag on ${bayId} resolved and removed from handover list by ${shiftInfo.outgoingLead}.`,
    };

    setActivityLogs((prev) => [resolveLog, ...prev]);
    handleClearBayDraft(bayId);
  };

  const handleUpdateBayDraft = (bayId: string, draft: BayDraft) => {
    setBayDrafts((prev) => ({
      ...prev,
      [bayId]: draft,
    }));
  };

  const handleClearBayDraft = (bayId: string) => {
    setBayDrafts((prev) => {
      const updated = { ...prev };
      delete updated[bayId];
      return updated;
    });
  };

  const handleToggleChecklist = (id: string) => {
    if (shiftInfo.isLocked) return;
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddLog = (details: string) => {
    if (shiftInfo.isLocked) return;
    const customLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' SGT',
      technician: shiftInfo.outgoingLead,
      actionType: 'CALIBRATION',
      details,
    };
    setActivityLogs((prev) => [customLog, ...prev]);
  };

  const handleConfirmLockShift = () => {
    const lockTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' SGT';
    
    setShiftInfo((prev) => ({
      ...prev,
      isLocked: true,
      lockedAt: lockTime,
      confirmationAlertDispatched: true,
    }));

    const confirmLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: lockTime,
      technician: shiftInfo.outgoingLead,
      actionType: 'HANDOVER_CONFIRMED',
      details: `Shift Handover confirmed & locked by ${shiftInfo.outgoingLead}. Handover summary recorded for ${shiftInfo.incomingTeam} with ${flaggedCount} flagged bay(s).`,
    };

    setActivityLogs((prev) => [confirmLog, ...prev]);
    setIsConfirmModalOpen(false);
  };

  const handleUnlockShift = () => {
    setShiftInfo((prev) => ({
      ...prev,
      isLocked: false,
    }));

    const unlockLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' SGT',
      technician: shiftInfo.outgoingLead,
      actionType: 'CALIBRATION',
      details: `Shift Handover log reopened for amendments by ${shiftInfo.outgoingLead}. Verification lock released.`,
    };

    setActivityLogs((prev) => [unlockLog, ...prev]);
  };

  const flaggedBaysList = bays.filter((b) => b.status === 'Flagged' || Boolean(b.activeFlag));

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header with Tab Switcher */}
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        shiftInfo={shiftInfo}
        flaggedCount={flaggedCount}
        abnormalCount={abnormalCount}
        currentTime={currentTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-24 md:pb-8 overflow-x-hidden min-w-0">
        {currentTab === 'overview' && (
          <div className="space-y-6">
            <ShiftHandoverOverview
              bays={bays}
              shiftInfo={shiftInfo}
              onInspectBay={handleInspectBay}
              onSwitchToHandover={() => setCurrentTab('handover')}
            />
            <DisqusComments />
          </div>
        )}

        {currentTab === 'inspect' && (
          <BayInspectionActionForm
            bays={bays}
            selectedBayId={selectedBayId}
            onSelectBay={setSelectedBayId}
            onFlagBay={handleFlagBay}
            onResolveFlag={handleResolveFlag}
            onBackToOverview={() => setCurrentTab('overview')}
            onProceedToHandover={() => setCurrentTab('handover')}
            currentTechnician={shiftInfo.outgoingLead}
            isLocked={shiftInfo.isLocked}
            bayDrafts={bayDrafts}
            onUpdateBayDraft={handleUpdateBayDraft}
            onClearBayDraft={handleClearBayDraft}
          />
        )}

        {currentTab === 'handover' && (
          <HandoverSummaryLogs
            shiftInfo={shiftInfo}
            bays={bays}
            activityLogs={activityLogs}
            checklist={checklist}
            onToggleChecklist={handleToggleChecklist}
            onAddLog={handleAddLog}
            onInspectBay={handleInspectBay}
            onOpenConfirmModal={() => setIsConfirmModalOpen(true)}
            onUnlockShift={handleUnlockShift}
          />
        )}
      </main>

      {/* Global Page Footer with Privacy Notice */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm py-4 px-4 sm:px-6 pb-20 md:pb-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto">
          <p className="leading-relaxed">
            This page uses Microsoft Clarity and Disqus, which use cookies to record how visitors use the site and to host comments. By using this page you agree that we and Microsoft may collect and use this data. See the{' '}
            <a
              href="https://www.microsoft.com/privacy/privacystatement"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              Microsoft Privacy Statement
            </a>
            , the{' '}
            <a
              href="https://disqus.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              Disqus privacy policy
            </a>{' '}
            and the{' '}
            <a
              href="https://disqus.com/data-sharing-settings/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              Disqus data sharing settings
            </a>
            .
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        flaggedCount={flaggedCount}
        abnormalCount={abnormalCount}
      />

      {/* Handover Confirmation & Summary Modal */}
      <HandoverConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        shiftInfo={shiftInfo}
        flaggedBays={flaggedBaysList}
        checklist={checklist}
        allBays={bays}
        onConfirmLock={handleConfirmLockShift}
      />
    </div>
  );
}
