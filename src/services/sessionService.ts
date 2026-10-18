import { TrainingSession, WorkflowState, AuditLog } from '../types';
import { INITIAL_SESSIONS } from './mockDataService';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';

let localSessionStore: Record<string, TrainingSession> = {};

INITIAL_SESSIONS.forEach(s => {
  localSessionStore[s.id] = { ...s };
});

export async function getSessions(): Promise<TrainingSession[]> {
  try {
    const snapshot = await getDocs(collection(db, 'sessions'));
    if (!snapshot.empty) {
      snapshot.forEach(d => {
        localSessionStore[d.id] = { id: d.id, ...d.data() } as TrainingSession;
      });
    }
  } catch (err) {
    console.warn('[SessionService] Reading from local session store:', err);
  }

  return Object.values(localSessionStore).sort((a, b) => {
    return new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime();
  });
}

export async function getSessionById(sessionId: string): Promise<TrainingSession | null> {
  const sessions = await getSessions();
  return sessions.find(s => s.id === sessionId) || null;
}

export async function saveSession(session: TrainingSession): Promise<TrainingSession> {
  const updated: TrainingSession = {
    ...session,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'sessions', session.id), updated, { merge: true });
  } catch (err) {
    console.warn('[SessionService] Saved session locally:', err);
  }

  localSessionStore[session.id] = updated;
  return updated;
}

/**
 * Lead Coach submits attendance or assessment for publishing
 */
export async function submitWorkflow(
  sessionId: string,
  type: 'attendance' | 'assessment',
  leadCoachId: string,
  leadCoachName: string
): Promise<TrainingSession> {
  const session = await getSessionById(sessionId);
  if (!session) throw new Error('Session not found');

  const nowIso = new Date().toISOString();
  const updates: Partial<TrainingSession> = {};

  if (type === 'attendance') {
    updates.attendanceState = 'submitted';
    updates.attendanceSubmittedAt = nowIso;
    updates.attendanceSubmittedBy = leadCoachName;
  } else {
    updates.assessmentState = 'submitted';
    updates.assessmentSubmittedAt = nowIso;
    updates.assessmentSubmittedBy = leadCoachName;
  }

  const updatedSession: TrainingSession = {
    ...session,
    ...updates,
    updatedAt: nowIso
  };

  await logAuditAction(
    sessionId,
    type === 'attendance' ? 'SUBMIT_ATTENDANCE' : 'SUBMIT_ASSESSMENT',
    leadCoachId,
    leadCoachName,
    'Session Lead',
    { sessionId, type, version: 'locked' }
  );

  return saveSession(updatedSession);
}

/**
 * Admin (Coach Cheng Wei) publishes attendance or assessment
 */
export async function publishWorkflow(
  sessionId: string,
  type: 'attendance' | 'assessment',
  adminUid: string,
  adminName: string
): Promise<TrainingSession> {
  const session = await getSessionById(sessionId);
  if (!session) throw new Error('Session not found');

  // Verify that it is submitted before publishing
  const currentState = type === 'attendance' ? session.attendanceState : session.assessmentState;
  if (currentState !== 'submitted') {
    throw new Error(`Cannot publish ${type} directly from "${currentState}". Must be submitted by Session Lead first.`);
  }

  const nowIso = new Date().toISOString();
  const updates: Partial<TrainingSession> = {};

  if (type === 'attendance') {
    updates.attendanceState = 'published';
    updates.attendancePublishedAt = nowIso;
    updates.attendancePublishedBy = adminName;
  } else {
    updates.assessmentState = 'published';
    updates.assessmentPublishedAt = nowIso;
    updates.assessmentPublishedBy = adminName;
  }

  const updatedSession: TrainingSession = {
    ...session,
    ...updates,
    updatedAt: nowIso
  };

  await logAuditAction(
    sessionId,
    type === 'attendance' ? 'PUBLISH_ATTENDANCE' : 'PUBLISH_ASSESSMENT',
    adminUid,
    adminName,
    'Admin / Publisher',
    { sessionId, type }
  );

  return saveSession(updatedSession);
}

/**
 * Return for Revision
 */
export async function returnForRevision(
  sessionId: string,
  type: 'attendance' | 'assessment',
  coachUid: string,
  coachName: string,
  reason: string
): Promise<TrainingSession> {
  if (!reason.trim()) {
    throw new Error('A clear reason must be provided when returning for revision.');
  }

  const session = await getSessionById(sessionId);
  if (!session) throw new Error('Session not found');

  const nowIso = new Date().toISOString();
  const updates: Partial<TrainingSession> = {
    revisionReason: reason
  };

  if (type === 'attendance') {
    updates.attendanceState = 'revision_requested';
  } else {
    updates.assessmentState = 'revision_requested';
  }

  const updatedSession: TrainingSession = {
    ...session,
    ...updates,
    updatedAt: nowIso
  };

  await logAuditAction(
    sessionId,
    type === 'attendance' ? 'REJECT_ATTENDANCE' : 'REJECT_ASSESSMENT',
    coachUid,
    coachName,
    'Reviewer',
    { sessionId, type, reason }
  );

  return saveSession(updatedSession);
}

export async function logAuditAction(
  sessionId: string | undefined,
  action: string,
  performedBy: string,
  performedByName: string,
  role: string,
  details: Record<string, any>
): Promise<void> {
  const auditLog: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    sessionId,
    action,
    performedBy,
    performedByName,
    role,
    details,
    timestamp: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'audit_logs', auditLog.id), auditLog);
  } catch (err) {
    console.log('[AuditLog local]', auditLog);
  }
}
