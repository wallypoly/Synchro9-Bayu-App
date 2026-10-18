import React, { useState } from 'react';
import { TrainingSession, Skater, SessionType, SessionStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveSession } from '../services/sessionService';
import { WORKING_ASSESSMENT_TEMPLATE } from '../constants/assessmentTemplate';
import { formatTime12 } from '../utils/date';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  CheckCircle,
  Users,
  Shield,
  Layers,
  Edit2,
  Check
} from 'lucide-react';

interface SessionManagerProps {
  sessions: TrainingSession[];
  skaters: Skater[];
  onSessionSelect: (session: TrainingSession) => void;
  onSessionsChange: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  sessions,
  skaters,
  onSessionSelect,
  onSessionsChange
}) => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const isCoach = profile?.role === 'coach' || isAdmin;

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-10-18');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('18:00');
  const [location, setLocation] = useState('MYNISS National Ice Skating Stadium');
  const [sessionType, setSessionType] = useState<SessionType>('Off-Ice');
  const [status, setStatus] = useState<SessionStatus>('Confirmed');
  const [leadCoachName, setLeadCoachName] = useState('Coach Cheng Wei');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [selectedSkaterIds, setSelectedSkaterIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingSession(null);
    setTitle('Synchro9 Off-Ice Conditioning & Technique');
    setDate('2026-10-25');
    setStartTime('16:00');
    setEndTime('18:00');
    setLocation('MYNISS National Ice Skating Stadium');
    setSessionType('Off-Ice');
    setStatus('Confirmed');
    setLeadCoachName('Coach Cheng Wei');
    setSelectedIndicators(WORKING_ASSESSMENT_TEMPLATE.categories.flatMap(c => c.subIndicators.map(i => i.id)).slice(0, 12));
    setSelectedSkaterIds(skaters.slice(0, 26).map(s => s.id));
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (sess: TrainingSession) => {
    setEditingSession(sess);
    setTitle(sess.title);
    setDate(sess.date);
    setStartTime(sess.startTime);
    setEndTime(sess.endTime);
    setLocation(sess.location);
    setSessionType(sess.sessionType);
    setStatus(sess.status);
    setLeadCoachName(sess.leadCoachName);
    setSelectedIndicators(sess.activeSubIndicatorIds || []);
    setSelectedSkaterIds(sess.participantSkaterIds || []);
    setNotes(sess.notes || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: TrainingSession = {
      id: editingSession ? editingSession.id : `session_${date.replace(/-/g, '')}_${Date.now().toString(36)}`,
      title,
      date,
      startTime,
      endTime,
      location,
      sessionType,
      status,
      leadCoachId: profile?.uid || 'coach_cw',
      leadCoachName,
      coachIds: ['coach_cw', 'coach_shaz'],
      coachNames: ['Coach Cheng Wei', 'Coach Shazfinas'],
      participantSkaterIds: selectedSkaterIds,
      activeSubIndicatorIds: selectedIndicators,
      checkInWindowMinutes: 15,
      checkInCloseMinutesAfterStart: 120,
      notes,
      attendanceState: editingSession ? editingSession.attendanceState : 'draft',
      assessmentState: editingSession ? editingSession.assessmentState : 'draft',
      createdAt: editingSession ? editingSession.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveSession(newSession);
    setModalOpen(false);
    onSessionsChange();
  };

  const filteredSessions = sessions.filter(s => filterStatus === 'all' || s.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Sessions Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Training Sessions Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed, Proposed, and Completed sessions for Bayu Blades Synchro9 Team
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isCoach && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-blue-700 hover:bg-blue-800 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {(['all', 'Confirmed', 'Proposed', 'Completed', 'Cancelled'] as const).map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase tracking-wider ${
              filterStatus === st
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSessions.map(sess => (
          <div
            key={sess.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 transition space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-900">
                    {sess.sessionType}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      sess.status === 'Confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sess.status === 'Proposed'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {sess.status}
                  </span>
                </div>

                {isCoach && (
                  <button
                    onClick={() => openEditModal(sess)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Edit session"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h3 className="text-base font-black text-slate-900 leading-snug">
                {sess.title}
              </h3>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {sess.date} ({formatTime12(sess.startTime)} – {formatTime12(sess.endTime)})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sess.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {sess.participantSkaterIds.length} Skaters Assigned · Lead: {sess.leadCoachName}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                <span>Attendance: {sess.attendanceState}</span>
                <span>·</span>
                <span>Assessment: {sess.assessmentState}</span>
              </div>

              <button
                onClick={() => onSessionSelect(sess)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs active:scale-95"
              >
                Open Session
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Create/Edit Session */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 my-8 space-y-4">
            <h3 className="text-base font-black text-slate-900">
              {editingSession ? 'Edit Training Session' : 'Create New Training Session'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Start (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">End (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Session Type</label>
                  <select
                    value={sessionType}
                    onChange={e => setSessionType(e.target.value as SessionType)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-semibold bg-white"
                  >
                    <option value="Off-Ice">Off-Ice</option>
                    <option value="On-Ice">On-Ice</option>
                    <option value="Combined">Combined</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as SessionStatus)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-semibold bg-white"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Proposed">Proposed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Session Lead Coach</label>
                <input
                  type="text"
                  required
                  value={leadCoachName}
                  onChange={e => setLeadCoachName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-blue-700 hover:bg-blue-800 font-bold"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
