import { AttendanceRecord, AttendanceStatus, TrainingSession } from '../types';
import { evaluateCheckInWindow } from '../utils/date';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

// In-memory local cache/fallback for offline demo & emulator
let localAttendanceStore: Record<string, AttendanceRecord> = {};

export async function getAttendanceForSession(
  sessionId: string,
  skatersList: { id: string; fullName: string }[]
): Promise<AttendanceRecord[]> {
  try {
    const q = query(collection(db, 'attendance'), where('sessionId', '==', sessionId));
    const snapshot = await getDocs(q);
    
    const recordsMap: Record<string, AttendanceRecord> = {};
    snapshot.forEach((d) => {
      recordsMap[d.data().skaterId] = { id: d.id, ...d.data() } as AttendanceRecord;
    });

    // Merge with any in-memory local records
    Object.values(localAttendanceStore).forEach(rec => {
      if (rec.sessionId === sessionId && !recordsMap[rec.skaterId]) {
        recordsMap[rec.skaterId] = rec;
      }
    });

    // Ensure all session skaters have at least a 'not_marked' representation in UI
    return skatersList.map((skater) => {
      if (recordsMap[skater.id]) {
        return recordsMap[skater.id];
      }
      return {
        id: `${sessionId}_${skater.id}`,
        sessionId,
        skaterId: skater.id,
        skaterName: skater.fullName,
        status: 'not_marked',
        updatedAt: new Date().toISOString()
      };
    });
  } catch (err) {
    console.warn('[AttendanceService] Falling back to local store:', err);
    return skatersList.map((skater) => {
      const key = `${sessionId}_${skater.id}`;
      return localAttendanceStore[key] || {
        id: key,
        sessionId,
        skaterId: skater.id,
        skaterName: skater.fullName,
        status: 'not_marked',
        updatedAt: new Date().toISOString()
      };
    });
  }
}

/**
 * Self check-in for an athlete or parent.
 * Enforces T-15 minutes start, non-cancelled session, and sets status to 'checked_in_pending'.
 * Does NOT set status to 'present' or 'late'.
 */
export async function recordSelfCheckIn(
  session: TrainingSession,
  skaterId: string,
  skaterName: string,
  userUid: string,
  customTime: Date = new Date()
): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> {
  const windowCheck = evaluateCheckInWindow(session, customTime);
  if (!windowCheck.canCheckIn) {
    return { success: false, message: windowCheck.reason || 'Check-in window is not active.' };
  }

  const recordId = `${session.id}_${skaterId}`;
  const nowIso = customTime.toISOString();

  const record: AttendanceRecord = {
    id: recordId,
    sessionId: session.id,
    skaterId,
    skaterName,
    status: 'checked_in_pending',
    selfCheckedInAt: nowIso,
    selfCheckedInBy: userUid,
    updatedAt: nowIso
  };

  try {
    await setDoc(doc(db, 'attendance', recordId), {
      ...record,
      serverCheckInTimestamp: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('[AttendanceService] Saved check-in to local store:', err);
  }

  localAttendanceStore[recordId] = record;
  return {
    success: true,
    message: 'Checked in successfully. Status: Checked In · Pending Coach Verification.',
    record
  };
}

/**
 * Coach marks/verifies attendance for a single skater.
 */
export async function verifySkaterAttendance(
  sessionId: string,
  skaterId: string,
  skaterName: string,
  status: AttendanceStatus,
  coachUid: string,
  coachName: string,
  reason?: string
): Promise<AttendanceRecord> {
  const recordId = `${sessionId}_${skaterId}`;
  const nowIso = new Date().toISOString();

  const existing = localAttendanceStore[recordId];
  const record: AttendanceRecord = {
    id: recordId,
    sessionId,
    skaterId,
    skaterName,
    status,
    verifiedBy: coachUid,
    verifiedByName: coachName,
    verifiedAt: nowIso,
    lateReason: status === 'late' ? reason : existing?.lateReason,
    excusedReason: status === 'excused' ? reason : existing?.excusedReason,
    correctionReason: reason || existing?.correctionReason,
    lastModifiedBy: coachUid,
    selfCheckedInAt: existing?.selfCheckedInAt,
    selfCheckedInBy: existing?.selfCheckedInBy,
    updatedAt: nowIso
  };

  try {
    await setDoc(doc(db, 'attendance', recordId), record, { merge: true });
  } catch (err) {
    console.warn('[AttendanceService] Verified attendance locally:', err);
  }

  localAttendanceStore[recordId] = record;
  return record;
}

/**
 * Batch confirm selected skaters
 */
export async function batchVerifyAttendance(
  sessionId: string,
  skaters: { id: string; fullName: string }[],
  status: AttendanceStatus,
  coachUid: string,
  coachName: string
): Promise<AttendanceRecord[]> {
  const results: AttendanceRecord[] = [];
  for (const s of skaters) {
    const updated = await verifySkaterAttendance(
      sessionId,
      s.id,
      s.fullName,
      status,
      coachUid,
      coachName
    );
    results.push(updated);
  }
  return results;
}
