# Synchro9 Athlete Portal · Bayu Blades

> **Official Live Production URL**: [https://synchro9-portal-bayu.web.app](https://synchro9-portal-bayu.web.app)  
> **Repository**: [https://github.com/wallypoly/Synchro9-Bayu-App](https://github.com/wallypoly/Synchro9-Bayu-App)  
> **Team**: Malaysia National Synchro9 Team (Bayu Blades)  
> **Admin & Publisher**: Coach Cheng Wei (Wallance)  
> **Hosting & Backend**: Firebase Spark (Free Tier) · Cloud Firestore (`asia-southeast1`) · Firebase Authentication · PWA  

---

## 📱 Quick Access & PWA Installation

1. Open **[https://synchro9-portal-bayu.web.app](https://synchro9-portal-bayu.web.app)** on mobile browser (Safari on iOS or Chrome on Android).
2. **Add to Home Screen (添加到主屏幕)**:
   - **iOS Safari**: Tap the **Share** button (Square with up arrow) $\rightarrow$ Scroll down $\rightarrow$ Tap **Add to Home Screen (添加到主屏幕)**.
   - **Android Chrome**: Tap the three dots menu in the top-right $\rightarrow$ Tap **Add to Home screen** / **Install app**.
3. The app will launch in standalone full-screen mode with the official Bayu Blades blue/gold icon and offline static shell caching.

---

## 🎯 System Architecture & Workflows

### 1. Smart Attendance Workflow
- **Self Check-In**:
  - Automatically activates **T-15 minutes** before scheduled session start time (`Asia/Kuala_Lumpur` timezone).
  - T-16 minutes and earlier: Rejected with countdown.
  - Cancelled sessions: Rejected.
  - Idempotent: Multiple taps will not create duplicate records.
  - Status upon check-in: `Checked In · Pending Coach Verification`.
- **Coach Rapid Marking**:
  - Default status is `Not Marked` (not defaulted to Present; unobserved is not automatically Absent).
  - Statuses: `Present`, `Late` (with reason capture), `Absent`, `Excused` (with reason capture).
  - Search by name, filter by squad (`Junior`, `Senior`, `Development`), bulk selection and 1-click batch confirmation.
- **Two-Tier Publishing**:
  1. **Draft**: Coaches enter attendance.
  2. **Submit for Publishing**: Session Lead Coach locks the version and submits.
  3. **Publish**: Only **Coach Cheng Wei (Admin)** has database authority to publish. Athletes and parents can only view published records.
  4. **Return for Revision**: Reviewers can return records with required revision notes.

### 2. Assessment System (8 Categories · 36 Sub-Indicators)
- **Scoring Scale**: 0.0 to 5.0 in 0.5 increments.
- **N/O (Not Observed)**: Preserved distinctly; does not equal zero and does not penalize arithmetic mean.
- **Blank (Unscored)**: Preserved distinctly; displays unfilled indicator count.
- **0.0 Score**: Only included when coach explicitly selects 0.0.
- **Arithmetic Mean**:
  $$\text{Category Average} = \frac{\sum \text{Scored Items}}{\text{Count of Scored Items}}$$
  If no items are scored, displays `No score` (never 0).
- **Context Isolation**: Observations tagged as `Off-Ice`, `On-Ice`, or `Combined`. Trends and progress curves are never cross-pollinated across different physical contexts.
- **Qualitative Notes**: `Strengths`, `Next Focus`, `Next Training Goal`.

### 3. Role & Permission Hierarchy
- **Admin / Publisher (Coach Cheng Wei)**: Full user management, account approval, role assignment, parent-child linking, session configuration, template approvals, final publishing.
- **Coach**: Mark attendance and draft assessments for authorized training sessions.
- **Session Lead Coach**: Per-session lead responsible for review and formal submission.
- **Athlete**: Read-only access to own check-in status, published attendance, and assessments.
- **Parent / Guardian**: Read-only access to verified bound children's records (supports 1 parent bound to multiple skaters).

---

## 🛠 Local Development & Testing

### 1. Prerequisites
- Node.js >= 18
- Firebase CLI (`npm i -g firebase-tools` or `npx firebase-tools`)

### 2. Setup
```bash
git clone https://github.com/wallypoly/Synchro9-Bayu-App.git
cd Synchro9-Bayu-App
npm install
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Test Suite
```bash
npm test
```
Runs 13 automated unit tests verifying arithmetic mean calculation, T-15 check-in window boundaries, cancelled session rejection, and two-tier publishing state machine.

### 5. Build for Production
```bash
npm run build
```

---

## 📊 CSV Export Functions
- **Attendance CSV**: Download session attendance matrix with timestamps, verified status, coach names, and absence reasons.
- **Assessment CSV**: Download 36-metric evaluation sheet with 8 categories, individual scores, qualitative notes, and evaluating coach details.
- Accessible directly in the **Export CSV** tab.

---

## 📋 Open Business Alignments (待确认事项)
1. **Official Scoring Anchors**: 0.0 scale definition submitted for Coach Cheng Wei approval.
2. **Attendance Policy Baseline**: Attendance percentage denominator is currently defined as total assigned session squad count pending official ISAM selection criteria.
3. **FTM / DF Metric**: Tagged as `FTM / DF (Pending ISAM verification)` in the 36-indicator template.
