import { AttendanceRecord, SkaterSessionAssessment, TrainingSession } from '../types';
import { WORKING_ASSESSMENT_TEMPLATE } from '../constants/assessmentTemplate';

/**
 * Exports Attendance records for a session to CSV and triggers download in browser
 */
export function exportAttendanceCSV(session: TrainingSession, records: AttendanceRecord[]): void {
  const headers = [
    'Session Title',
    'Date',
    'Time',
    'Location',
    'Session Type',
    'Skater ID',
    'Skater Name',
    'Status',
    'Self Check-In Time',
    'Verified By',
    'Verified At',
    'Late Reason',
    'Excused Reason',
    'Correction Reason'
  ];

  const rows = records.map((r) => [
    `"${session.title.replace(/"/g, '""')}"`,
    session.date,
    `${session.startTime} - ${session.endTime}`,
    `"${session.location.replace(/"/g, '""')}"`,
    session.sessionType,
    r.skaterId,
    `"${r.skaterName.replace(/"/g, '""')}"`,
    r.status,
    r.selfCheckedInAt || '',
    `"${(r.verifiedByName || '').replace(/"/g, '""')}"`,
    r.verifiedAt || '',
    `"${(r.lateReason || '').replace(/"/g, '""')}"`,
    `"${(r.excusedReason || '').replace(/"/g, '""')}"`,
    `"${(r.correctionReason || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  downloadBlob(csvContent, `Attendance_${session.date}_${session.id}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exports Assessments for a session to CSV
 */
export function exportAssessmentCSV(
  session: TrainingSession,
  assessments: Record<string, SkaterSessionAssessment>
): void {
  const subIndicators = WORKING_ASSESSMENT_TEMPLATE.categories.flatMap(c => c.subIndicators);
  
  const headers = [
    'Session Date',
    'Session Title',
    'Context',
    'Skater ID',
    'Skater Name',
    ...subIndicators.map(i => `"${i.name} (${i.nameZh})"`),
    'Strengths',
    'Next Focus',
    'Next Training Goal',
    'Evaluating Coach'
  ];

  const rows = Object.values(assessments).map(a => {
    const scoreCols = subIndicators.map(i => {
      const scoreObj = a.scores?.[i.id];
      if (!scoreObj) return 'Unscored';
      if (scoreObj.isNotObserved) return 'N/O';
      if (scoreObj.score === null || scoreObj.score === undefined) return 'Unscored';
      return scoreObj.score.toString();
    });

    return [
      session.date,
      `"${session.title.replace(/"/g, '""')}"`,
      session.sessionType,
      a.skaterId,
      `"${a.skaterName.replace(/"/g, '""')}"`,
      ...scoreCols,
      `"${(a.strengths || '').replace(/"/g, '""')}"`,
      `"${(a.nextFocus || '').replace(/"/g, '""')}"`,
      `"${(a.nextTrainingGoal || '').replace(/"/g, '""')}"`,
      `"${(a.coachName || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  downloadBlob(csvContent, `Assessment_${session.date}_${session.id}.csv`, 'text/csv;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType }); // Include UTF-8 BOM for Excel compatibility
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
