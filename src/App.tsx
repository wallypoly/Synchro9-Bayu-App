import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { TrainingSession, Skater } from './types';
import { getSessions } from './services/sessionService';
import { INITIAL_SKATERS } from './services/mockDataService';
import { Navbar } from './components/Navbar';
import { AttendanceTracker } from './components/AttendanceTracker';
import { AssessmentEditor } from './components/AssessmentEditor';
import { AssessmentReportView } from './components/AssessmentReportView';
import { SessionManager } from './components/SessionManager';
import { AdminUserManagement } from './components/AdminUserManagement';
import { ExportDataModal } from './components/ExportDataModal';
import { CheckInModal } from './components/CheckInModal';
import {
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  Award,
  Layers,
  ChevronDown
} from 'lucide-react';

export const App: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [skaters, setSkaters] = useState<Skater[]>(INITIAL_SKATERS);
  const [currentTab, setCurrentTab] = useState<'attendance' | 'assessment' | 'sessions' | 'members' | 'export'>('attendance');
  const [checkInModalOpen, setCheckInModalOpen] = useState<boolean>(false);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    const data = await getSessions();
    setSessions(data);
    if (data.length > 0 && !selectedSessionId) {
      setSelectedSessionId(data[0].id);
    }
    setLoadingSessions(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const isAthleteOrParent = profile?.role === 'athlete' || profile?.role === 'parent';

  if (authLoading || loadingSessions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Synchro9 Athlete Portal...
          </p>
        </div>
      </div>
    );
  }

  // Account pending approval notice
  if (profile && profile.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} onOpenCheckIn={() => setCheckInModalOpen(true)} />
        <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Account Pending Coach Cheng Wei Approval
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Welcome to Synchro9 Athlete Portal. In accordance with Malaysian National Synchro9 protocols,
            registration does not grant immediate data access. Your account has been registered and is
            awaiting verification and child binding by Coach Cheng Wei.
          </p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-500 text-left space-y-1">
            <p><strong>Name:</strong> {profile.displayName}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Role Requested:</strong> {profile.role.toUpperCase()}</p>
            <p><strong>Status:</strong> PENDING APPROVAL</p>
          </div>
          <p className="text-xs text-slate-400">
            Tip: You can use the top-right persona selector to switch to Coach Cheng Wei, Lead, or Parent for full feature verification.
          </p>
        </main>
        <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200">
          Synchro9 Athlete Portal · Bayu Blades
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenCheckIn={() => setCheckInModalOpen(true)}
        />

        {/* Global Active Session Pill Bar */}
        {sessions.length > 0 && activeSession && (
          <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Session:
                </span>
                <select
                  value={activeSession.id}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="text-xs font-black text-slate-900 bg-slate-100 hover:bg-slate-200 border-none rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} · {s.title} ({s.sessionType}) — {s.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeSession.date}</span>
                </span>
                <span>·</span>
                <span className="font-semibold text-blue-900">
                  Lead: {activeSession.leadCoachName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentTab === 'attendance' && activeSession && (
            <AttendanceTracker
              session={activeSession}
              skaters={skaters}
              onSessionUpdated={(updated) => {
                setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
              }}
            />
          )}

          {currentTab === 'assessment' && activeSession && (
            isAthleteOrParent ? (
              <AssessmentReportView session={activeSession} skaters={skaters} />
            ) : (
              <AssessmentEditor
                session={activeSession}
                skaters={skaters}
                onSessionUpdated={(updated) => {
                  setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                }}
              />
            )
          )}

          {currentTab === 'sessions' && (
            <SessionManager
              sessions={sessions}
              skaters={skaters}
              onSessionSelect={(sess) => {
                setSelectedSessionId(sess.id);
                setCurrentTab('attendance');
              }}
              onSessionsChange={fetchSessions}
            />
          )}

          {currentTab === 'members' && (
            <AdminUserManagement skaters={skaters} onSkatersChange={setSkaters} />
          )}

          {currentTab === 'export' && (
            <ExportDataModal sessions={sessions} skaters={skaters} />
          )}
        </main>
      </div>

      {/* Self Check-in Modal */}
      {checkInModalOpen && activeSession && (
        <CheckInModal
          session={activeSession}
          skaters={skaters}
          onClose={() => setCheckInModalOpen(false)}
          onSuccess={() => {
            fetchSessions();
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-600">
            Synchro9 Athlete Portal · Bayu Blades Malaysia National Synchro9 Team
          </p>
          <p className="text-[11px] text-slate-400">
            Admin & Publisher: Coach Cheng Wei · Working Assessment Template v1.0 (36 Metrics)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
