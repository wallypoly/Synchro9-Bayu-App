import { describe, it, expect, beforeEach } from 'vitest';
import { calculateCategoryAverage, formatCategoryScore, formatCoverageBadge } from '../src/utils/scoring';
import { evaluateCheckInWindow } from '../src/utils/date';
import { WORKING_ASSESSMENT_TEMPLATE } from '../src/constants/assessmentTemplate';
import { TrainingSession, Skater, UserProfile } from '../src/types';
import { saveSession, submitWorkflow, publishWorkflow, returnForRevision } from '../src/services/sessionService';
import { recordSelfCheckIn } from '../src/services/attendanceService';

describe('Synchro9 Scoring & Arithmetic Mean Rules', () => {
  const sampleCategory = WORKING_ASSESSMENT_TEMPLATE.categories[0]; // Skating Skills (5 indicators)
  const activeIds = sampleCategory.subIndicators.slice(0, 4).map(i => i.id);

  it('prompt example: scores [3, 4, 3.5, N/O] yields 3.50 / 5 and observed 3 / 4', () => {
    const scores = {
      [activeIds[0]]: { score: 3.0, isNotObserved: false, context: 'Off-Ice' as const },
      [activeIds[1]]: { score: 4.0, isNotObserved: false, context: 'Off-Ice' as const },
      [activeIds[2]]: { score: 3.5, isNotObserved: false, context: 'Off-Ice' as const },
      [activeIds[3]]: { score: null, isNotObserved: true, context: 'Off-Ice' as const }
    };

    const res = calculateCategoryAverage(sampleCategory, activeIds, scores);
    expect(res.average).toBe(3.50);
    expect(formatCategoryScore(res.average)).toBe('3.50 / 5');
    expect(res.scoredCount).toBe(3);
    expect(res.notObservedCount).toBe(1);
    expect(res.uncompletedCount).toBe(0);

    const badge = formatCoverageBadge(res);
    expect(badge.text).toBe('Observed 4/4');
    expect(badge.isComplete).toBe(true);
  });

  it('unscored / all blank category displays "No score", never "0"', () => {
    const res = calculateCategoryAverage(sampleCategory, activeIds, {});
    expect(res.average).toBeNull();
    expect(formatCategoryScore(res.average)).toBe('No score');
    expect(res.uncompletedCount).toBe(4);
  });

  it('all N/O items yield "No score", never "0"', () => {
    const scores = {
      [activeIds[0]]: { score: null, isNotObserved: true, context: 'Off-Ice' as const },
      [activeIds[1]]: { score: null, isNotObserved: true, context: 'Off-Ice' as const }
    };
    const res = calculateCategoryAverage(sampleCategory, activeIds.slice(0, 2), scores);
    expect(res.average).toBeNull();
    expect(formatCategoryScore(res.average)).toBe('No score');
    expect(res.notObservedCount).toBe(2);
  });

  it('explicit 0.0 is included in arithmetic mean', () => {
    const scores = {
      [activeIds[0]]: { score: 0.0, isNotObserved: false, context: 'Off-Ice' as const },
      [activeIds[1]]: { score: 4.0, isNotObserved: false, context: 'Off-Ice' as const }
    };
    const res = calculateCategoryAverage(sampleCategory, activeIds.slice(0, 2), scores);
    expect(res.average).toBe(2.00); // (0 + 4) / 2 = 2.00
    expect(formatCategoryScore(res.average)).toBe('2.00 / 5');
  });
});

describe('Smart Attendance Check-In Window Verification', () => {
  const baseSession: TrainingSession = {
    id: 'test_session_window',
    title: 'Test Session',
    date: '2026-10-18',
    startTime: '16:00',
    endTime: '18:00',
    location: 'MYNISS',
    sessionType: 'Off-Ice',
    status: 'Confirmed',
    leadCoachId: 'coach_cw',
    leadCoachName: 'Coach Cheng Wei',
    coachIds: ['coach_cw'],
    coachNames: ['Coach Cheng Wei'],
    participantSkaterIds: ['skater_1'],
    checkInWindowMinutes: 15,
    checkInCloseMinutesAfterStart: 120,
    attendanceState: 'draft',
    assessmentState: 'draft',
    createdAt: '2026-10-18T00:00:00Z',
    updatedAt: '2026-10-18T00:00:00Z'
  };

  it('rejects check-in at T-16 minutes (15:44)', () => {
    const timeT16 = new Date(2026, 9, 18, 15, 44, 0); // 15:44 (month 9 is Oct)
    const status = evaluateCheckInWindow(baseSession, timeT16);
    expect(status.canCheckIn).toBe(false);
    expect(status.reason).toContain('Check-in opens 15 minutes before');
  });

  it('allows check-in at T-15 minutes (15:45)', () => {
    const timeT15 = new Date(2026, 9, 18, 15, 45, 0); // 15:45
    const status = evaluateCheckInWindow(baseSession, timeT15);
    expect(status.canCheckIn).toBe(true);
    expect(status.isOpen).toBe(true);
  });

  it('allows check-in during the active session (16:30)', () => {
    const activeTime = new Date(2026, 9, 18, 16, 30, 0);
    const status = evaluateCheckInWindow(baseSession, activeTime);
    expect(status.canCheckIn).toBe(true);
  });

  it('rejects check-in for cancelled sessions regardless of time', () => {
    const cancelledSession: TrainingSession = { ...baseSession, status: 'Cancelled' };
    const activeTime = new Date(2026, 9, 18, 16, 30, 0);
    const status = evaluateCheckInWindow(cancelledSession, activeTime);
    expect(status.canCheckIn).toBe(false);
    expect(status.reason).toContain('cancelled');
  });

  it('rejects check-in past closing time (18:05)', () => {
    const pastTime = new Date(2026, 9, 18, 18, 5, 0);
    const status = evaluateCheckInWindow(baseSession, pastTime);
    expect(status.canCheckIn).toBe(false);
    expect(status.isPast).toBe(true);
  });
});

describe('Two-Tier Approval Workflow & Immutability', () => {
  const workflowSession: TrainingSession = {
    id: 'test_session_workflow',
    title: 'Workflow Test',
    date: '2026-10-18',
    startTime: '16:00',
    endTime: '18:00',
    location: 'MYNISS',
    sessionType: 'Off-Ice',
    status: 'Confirmed',
    leadCoachId: 'coach_cw',
    leadCoachName: 'Coach Cheng Wei',
    coachIds: ['coach_cw'],
    coachNames: ['Coach Cheng Wei'],
    participantSkaterIds: ['skater_1'],
    checkInWindowMinutes: 15,
    attendanceState: 'draft',
    assessmentState: 'draft',
    createdAt: '2026-10-18T00:00:00Z',
    updatedAt: '2026-10-18T00:00:00Z'
  };

  beforeEach(async () => {
    await saveSession(workflowSession);
  });

  it('Admin cannot publish directly from draft without Session Lead submission', async () => {
    await expect(
      publishWorkflow(workflowSession.id, 'attendance', 'admin_uid', 'Coach Cheng Wei')
    ).rejects.toThrow(/Must be submitted by Session Lead first/);
  });

  it('Session Lead submission transitions state to submitted', async () => {
    const submitted = await submitWorkflow(
      workflowSession.id,
      'attendance',
      'coach_lead',
      'Coach Shazfinas'
    );
    expect(submitted.attendanceState).toBe('submitted');
    expect(submitted.attendanceSubmittedBy).toBe('Coach Shazfinas');

    // Now Admin can publish
    const published = await publishWorkflow(
      workflowSession.id,
      'attendance',
      'admin_uid',
      'Coach Cheng Wei'
    );
    expect(published.attendanceState).toBe('published');
    expect(published.attendancePublishedBy).toBe('Coach Cheng Wei');
  });

  it('Return for revision requires non-empty reason', async () => {
    await expect(
      returnForRevision(workflowSession.id, 'attendance', 'coach_cw', 'Coach Cheng Wei', '   ')
    ).rejects.toThrow(/A clear reason must be provided/);
  });

  it('Self check-in sets status to checked_in_pending, never present or late', async () => {
    const activeTime = new Date(2026, 9, 18, 16, 0, 0);
    const res = await recordSelfCheckIn(
      workflowSession,
      'skater_1',
      'Gabriella Low',
      'athlete_uid',
      activeTime
    );
    expect(res.success).toBe(true);
    expect(res.record?.status).toBe('checked_in_pending');
  });
});
