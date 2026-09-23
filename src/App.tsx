import React, { useState, useEffect } from 'react';
import { HydroBay, BayFlag, ActivityLog } from './types';
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
  const [selectedBayId, setSelectedBayId] = useState<string>('BAY-04'); // Start with an interesting abnormal bay
  
  // Data states (Separated from UI, loaded from mockData.ts)
  const [bays, setBays] = useState<HydroBay[]>(INITIAL_BAYS);
  const [shiftInfo, setShiftInfo] = useState(INITIAL_SHIFT_INFO);
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  
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
  const flaggedCount = bays.filter((b) => b.status === 'Flagged' || b.activeFlag).length;
  const abnormalCount = bays.filter((b) => b.status === 'Warning' || b.status === 'Critical').length;

  // Handlers
  const handleInspectBay = (bayId: string) => {
    setSelectedBayId(bayId);
    setCurrentTab('inspect');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFlagBay = (bayId: string, flag: BayFlag) => {
    setBays((prevBays) =>
      prevBays.map((bay) => {
        if (bay.id === bayId) {
          return {
            ...bay,
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
  };

  const handleResolveFlag = (bayId: string) => {
    setBays((prevBays) =>
      prevBays.map((bay) => {
        if (bay.id === bayId) {
          // Check whether sensors are currently normal or warning
          const isPhOff = bay.pH < bay.targetPhMin || bay.pH > bay.targetPhMax;
          const isEcOff = bay.ec < bay.targetEcMin || bay.ec > bay.targetEcMax;
          const newStatus = isPhOff || isEcOff ? 'Warning' : 'Normal';

          return {
            ...bay,
            status: newStatus,
            statusMessage: newStatus === 'Normal' ? 'Parameters stabilized. Flag resolved.' : 'Flag resolved. Monitoring bay readings.',
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
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddLog = (details: string) => {
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
  };

  const flaggedBaysList = bays.filter((b) => b.status === 'Flagged' || b.activeFlag);

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header with Tab Switcher */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
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

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        flaggedCount={flaggedCount}
        abnormalCount={abnormalCount}
      />

      {/* Handover Confirmation & Summary Modal */}
      <HandoverConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        shiftInfo={shiftInfo}
        flaggedBays={flaggedBaysList}
        onConfirmLock={handleConfirmLockShift}
      />
    </div>
  );
}
