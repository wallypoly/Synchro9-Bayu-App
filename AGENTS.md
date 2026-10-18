# AGENTS.md — Synchro9 Athlete Portal Engineering Protocols

## 1. Project Overview & Boundaries
- **System**: Synchro9 Athlete Portal (Smart Attendance & 36-Metric Assessment System)
- **Primary Team**: Bayu Blades (Malaysia National Synchro9 Team)
- **Admin & Publisher**: Coach Cheng Wei (Wallance)
- **Tech Stack**: React 18, TypeScript, Vite, Firebase Auth, Cloud Firestore (Native, Spark Free Tier), Firebase Hosting, Mobile-first PWA.
- **Repository**: `https://github.com/wallypoly/Synchro9-Bayu-App`
- **Hosting Target**: `https://synchro9-portal-bayu.web.app` (Firebase Spark Free Tier, no Blaze upgrade).

## 2. Security & Access Control
- **Database Rules First**: Security is enforced at Firestore Security Rules layer. Frontend route guards or button hiding are convenience only, not security boundaries.
- **Role Hierarchy**:
  - `admin` (Coach Cheng Wei): Full management, approval of pending accounts, user roles, skater linking, session configuration, template management, final publishing.
  - `coach`: Mark attendance for assigned sessions, draft assessments.
  - `lead`: Per-session Session Lead Coach. Can review and `Submit for Publishing` to lock version.
  - `athlete`: Read-only access to own published attendance, assessments, and feedback.
  - `parent`: Read-only access to verified bound children's published attendance and assessments; authorized check-in during active window for bound children.
- **Audit Logging**: All state transitions (`Draft` -> `Submitted by Session Lead` -> `Published` / `Return for Revision`) write atomic audit records with timestamp, operator UID, and reasons.
- **No First-Come Admin**: Admin role is initialized securely via trusted local administrative script or designated bootstrap mechanism, never by self-registration.

## 3. Smart Attendance Business Rules
- Sessions: `Confirmed`, `Proposed`, `Cancelled`, `Completed`. Timezone: `Asia/Kuala_Lumpur`.
- Self Check-in:
  - Allowed from T-15 minutes prior to session start up to configured close time (default session end).
  - Cancelled sessions reject check-in.
  - Initial check-in status: `Checked In · Pending Coach Verification`.
  - Check-in does NOT automatically mark as `Present` or `Late`. Coach must review.
  - Idempotent: repeated clicks do not generate duplicate records.
- Attendance Statuses: `Not Marked` (default), `Checked In (Pending)`, `Present`, `Late`, `Absent`, `Excused`.
- Two-Tier Approval:
  - Lead Coach submits: `Submit for Publishing` (locks version).
  - Only Coach Cheng Wei can `Publish`.
  - Direct draft publishing is prohibited by database rules.

## 4. Assessment Framework (8 Categories, 36 Sub-Indicators)
1. **Skating Skills**: Edge Quality, Flow & Glide, Steps & Turns, Power & Speed, Multi-directional Control.
2. **Posture & Body Control**: Body Alignment, Knee & Ankle Action, Core Stability, Upper Body Carriage & Isolation.
3. **Balance & Flexibility**: One-foot Balance, Dynamic Stability, Functional Mobility, Extension & Line Control.
4. **Timing & Musicality**: Beat & Rhythm Accuracy, Start & Stop Timing, Musical Phrasing, Tempo Adaptation, Dynamics & Expressiveness.
5. **Teamwork & Synchronization**: Spacing Control, Movement Uniformity, Matching Speed, Holds & Connections, Team Awareness & Recovery.
6. **Formation & Transitions**: Formation Precision, Travel & Tracking, Transition Timing, Ice Coverage, FTM / DF Readiness.
7. **Strength & Endurance**: Push & Acceleration Power, Functional Strength, Repetitive Endurance, Quality Under Fatigue.
8. **Discipline & Coachability**: Punctuality & Preparation, Listening & Comprehension, Correction Application, Safety & Accountability.

- **Scoring Scale**: 0.0 to 5.0 in 0.5 increments.
- **Special Values**:
  - `N/O` (Not Observed) != 0.
  - Blank != N/O != 0.
  - `0` only counts when explicitly selected.
- **Average Calculation**: Arithmetic mean of observed sub-indicators with a score (`0` is included; `N/O` and blank excluded). If none scored, display "No score".
- **Context Isolation**: Observations tagged as `Off-Ice`, `On-Ice`, or `Combined`. Trends and progress curves are never merged across different contexts.
