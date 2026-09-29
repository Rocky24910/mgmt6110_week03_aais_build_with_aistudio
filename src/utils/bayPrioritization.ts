import { HydroBay, HealthStatus } from '../types';

export type BaySeverity = 'Normal' | 'Warning' | 'Critical';

/**
 * Calculates a bay's intrinsic operational severity strictly based on its sensor readings
 * and target thresholds, completely independent of whether a handover flag exists.
 */
export function calculateBaySeverity(bay: {
  pH: number;
  targetPhMin: number;
  targetPhMax: number;
  ec: number;
  targetEcMin: number;
  targetEcMax: number;
  waterTemp: number;
  targetTempMin: number;
  targetTempMax: number;
  dissolvedOxygen?: number;
  flowRateLpm?: number;
}): BaySeverity {
  // Critical operational thresholds
  const isPhCritical = bay.pH >= bay.targetPhMax + 0.35 || bay.pH <= bay.targetPhMin - 0.5;
  const isTempCritical = bay.waterTemp >= bay.targetTempMax + 0.8;
  const isEcCritical = bay.ec <= bay.targetEcMin * 0.65 || bay.ec >= bay.targetEcMax * 1.3;
  const isDoCritical = bay.dissolvedOxygen !== undefined && bay.dissolvedOxygen < 7.0;
  const isFlowCritical = bay.flowRateLpm !== undefined && bay.flowRateLpm < 10.0;

  if (isPhCritical || isTempCritical || isEcCritical || isDoCritical || isFlowCritical) {
    return 'Critical';
  }

  // Warning thresholds
  const isPhWarning = bay.pH < bay.targetPhMin || bay.pH > bay.targetPhMax;
  const isEcWarning = bay.ec < bay.targetEcMin || bay.ec > bay.targetEcMax;
  const isTempWarning = bay.waterTemp < bay.targetTempMin || bay.waterTemp > bay.targetTempMax;

  if (isPhWarning || isEcWarning || isTempWarning) {
    return 'Warning';
  }

  return 'Normal';
}

/**
 * Returns the effective operational severity of a bay, preferring its explicit severity property
 * or falling back to calculating from real-time telemetry.
 */
export function getBayEffectiveSeverity(bay: HydroBay): BaySeverity {
  if (bay.severity) {
    return bay.severity;
  }
  return calculateBaySeverity(bay);
}

/**
 * Severity ranking for strict sorting: Critical (0) -> Warning (1) -> Normal (2)
 */
export function getSeverityRank(severity: BaySeverity): number {
  switch (severity) {
    case 'Critical':
      return 0;
    case 'Warning':
      return 1;
    case 'Normal':
      return 2;
  }
}

/**
 * Returns all unresolved abnormal bays (Critical or Warning without an active unresolved flag),
 * strictly sorted Critical -> Warning.
 */
export function getUnresolvedAbnormalBays(bays: HydroBay[]): HydroBay[] {
  return bays
    .filter((bay) => {
      const sev = getBayEffectiveSeverity(bay);
      const isAbnormal = sev === 'Critical' || sev === 'Warning';
      const isUnresolved = !bay.activeFlag || bay.activeFlag.resolved;
      return isAbnormal && isUnresolved;
    })
    .sort((a, b) => {
      const rankA = getSeverityRank(getBayEffectiveSeverity(a));
      const rankB = getSeverityRank(getBayEffectiveSeverity(b));
      if (rankA !== rankB) return rankA - rankB;
      return a.id.localeCompare(b.id);
    });
}

/**
 * Returns the highest-priority unresolved bay (Critical first, then Warning),
 * or null if all abnormal bays are resolved/flagged.
 */
export function getHighestPriorityUnresolvedBay(bays: HydroBay[]): HydroBay | null {
  const unresolved = getUnresolvedAbnormalBays(bays);
  return unresolved.length > 0 ? unresolved[0] : null;
}
