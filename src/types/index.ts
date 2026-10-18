export type UserRole = 'admin' | 'coach' | 'athlete' | 'parent';

export type AccountStatus = 'pending' | 'approved' | 'disabled';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: AccountStatus;
  skaterIds?: string[]; // linked skaters if parent or athlete
  phone?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Skater {
  id: string;
  fullName: string;
  nickname?: string;
  teamNumber?: number;
  squad: 'junior' | 'senior' | 'development';
  registered: boolean;
  signedCodeOfConduct: boolean;
  status: 'active' | 'inactive';
  parentEmails?: string[];
  notes?: string;
}

export type SessionType = 'Off-Ice' | 'On-Ice' | 'Combined';

export type SessionStatus = 'Confirmed' | 'Proposed' | 'Cancelled' | 'Completed';

export type WorkflowState = 'draft' | 'submitted' | 'published' | 'revision_requested';

export interface TrainingSession {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  location: string;
  sessionType: SessionType;
  status: SessionStatus;
  leadCoachId: string;
  leadCoachName: string;
  coachIds: string[];
  coachNames: string[];
  participantSkaterIds: string[];
  activeSubIndicatorIds?: string[]; // Indicators selected to evaluate in this session
  checkInWindowMinutes: number; // default 15
  checkInCloseMinutesAfterStart?: number; // default session length
  notes?: string;
  attendanceState: WorkflowState;
  assessmentState: WorkflowState;
  attendanceSubmittedAt?: string;
  attendanceSubmittedBy?: string;
  attendancePublishedAt?: string;
  attendancePublishedBy?: string;
  assessmentSubmittedAt?: string;
  assessmentSubmittedBy?: string;
  assessmentPublishedAt?: string;
  assessmentPublishedBy?: string;
  revisionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus =
  | 'not_marked'
  | 'checked_in_pending'
  | 'present'
  | 'late'
  | 'absent'
  | 'excused';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  skaterId: string;
  skaterName: string;
  status: AttendanceStatus;
  selfCheckedInAt?: string;
  selfCheckedInBy?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  lateReason?: string;
  excusedReason?: string;
  correctionReason?: string;
  lastModifiedBy?: string;
  updatedAt: string;
}

export interface SubIndicator {
  id: string;
  name: string;
  nameZh: string;
  description?: string;
  tag?: string; // e.g. "FTM / DF"
}

export interface AssessmentCategory {
  id: string;
  name: string;
  nameZh: string;
  subIndicators: SubIndicator[];
}

export interface AssessmentTemplate {
  version: string;
  name: string;
  approvalStatus: 'draft_working' | 'approved_by_admin';
  source: string;
  categories: AssessmentCategory[];
  totalSubIndicators: number;
}

export interface SubIndicatorScore {
  score: number | null; // 0.0 to 5.0 (0.5 steps), or null
  isNotObserved: boolean; // N/O indicator
  context: SessionType;
  notes?: string;
}

export interface SkaterSessionAssessment {
  id: string;
  sessionId: string;
  skaterId: string;
  skaterName: string;
  templateVersion: string;
  scores: Record<string, SubIndicatorScore>; // subIndicatorId -> SubIndicatorScore
  strengths?: string;
  nextFocus?: string;
  nextTrainingGoal?: string;
  coachId: string;
  coachName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAverageScore {
  categoryId: string;
  categoryName: string;
  average: number | null; // null if no scored items (displays "No score")
  scoredCount: number; // items with score 0-5
  totalSelectedCount: number; // total applicable in this session
  uncompletedCount: number; // blanks
  notObservedCount: number; // N/O items
}

export interface AuditLog {
  id: string;
  sessionId?: string;
  action: string;
  performedBy: string;
  performedByName: string;
  role: string;
  details: Record<string, any>;
  timestamp: string;
}
