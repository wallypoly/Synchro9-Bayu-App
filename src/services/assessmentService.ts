import {
  SkaterSessionAssessment,
  SubIndicatorScore,
  SessionType
} from '../types';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where
} from 'firebase/firestore';

let localAssessmentStore: Record<string, SkaterSessionAssessment> = {};

export async function getAssessmentsForSession(sessionId: string): Promise<Record<string, SkaterSessionAssessment>> {
  const result: Record<string, SkaterSessionAssessment> = {};
  
  // Seed with local in-memory
  Object.values(localAssessmentStore).forEach(a => {
    if (a.sessionId === sessionId) {
      result[a.skaterId] = a;
    }
  });

  try {
    const q = query(collection(db, 'assessments'), where('sessionId', '==', sessionId));
    const snapshot = await getDocs(q);
    snapshot.forEach(d => {
      const data = d.data() as SkaterSessionAssessment;
      result[data.skaterId] = { ...data, id: d.id };
      localAssessmentStore[d.id] = result[data.skaterId];
    });
  } catch (err) {
    console.warn('[AssessmentService] Using local store fallback:', err);
  }

  return result;
}

export async function saveSkaterAssessment(
  assessment: SkaterSessionAssessment
): Promise<SkaterSessionAssessment> {
  const docId = assessment.id || `${assessment.sessionId}_${assessment.skaterId}`;
  const updatedAssessment: SkaterSessionAssessment = {
    ...assessment,
    id: docId,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'assessments', docId), updatedAssessment, { merge: true });
  } catch (err) {
    console.warn('[AssessmentService] Saved assessment locally:', err);
  }

  localAssessmentStore[docId] = updatedAssessment;
  return updatedAssessment;
}

export async function updateSubIndicatorScore(
  sessionId: string,
  skaterId: string,
  skaterName: string,
  subIndicatorId: string,
  scoreValue: number | null,
  isNotObserved: boolean,
  context: SessionType,
  coachId: string,
  coachName: string,
  notes?: string
): Promise<SkaterSessionAssessment> {
  const docId = `${sessionId}_${skaterId}`;
  const existing = localAssessmentStore[docId] || {
    id: docId,
    sessionId,
    skaterId,
    skaterName,
    templateVersion: 'v1.0-working',
    scores: {},
    coachId,
    coachName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const newScores: Record<string, SubIndicatorScore> = {
    ...existing.scores,
    [subIndicatorId]: {
      score: scoreValue,
      isNotObserved,
      context,
      notes
    }
  };

  const updated: SkaterSessionAssessment = {
    ...existing,
    scores: newScores,
    coachId,
    coachName,
    updatedAt: new Date().toISOString()
  };

  return saveSkaterAssessment(updated);
}
