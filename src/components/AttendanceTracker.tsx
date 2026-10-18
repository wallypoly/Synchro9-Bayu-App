import React, { useState, useEffect } from 'react';
import { TrainingSession, Skater, AttendanceRecord, AttendanceStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getAttendanceForSession,
  verifySkaterAttendance,
  batchVerifyAttendance
} from '../services/attendanceService';
import {
  submitWorkflow,
  publishWorkflow,
  returnForRevision
} from '../services/sessionService';
import { formatTime12 } from '../utils/date';
import { exportAttendanceCSV } from '../services/exportService';
import {
  Search,
  Filter,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Send,
  Lock,
  RotateCcw,
  Download,
  CheckSquare,
  Square,
  FileText,
  Printer
} from 'lucide-react';

interface AttendanceTrackerProps {
  session: TrainingSession;
  skaters: Skater[];
  onSessionUpdated: (session: TrainingSession) => void;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  session,
  skaters,
  onSessionUpdated
}) => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [squadFilter, setSquadFilter] = useState<'all' | 'junior' | 'senior' | 'development'>('all');
  const [selectedSkaterIds, setSelectedSkaterIds] = useState<string[]>([]);
  const [reasonModal, setReasonModal] = useState<{
    open: boolean;
    skaterId: string;
    skaterName: string;
    status: AttendanceStatus;
    reason: string;
  }>({ open: false, skaterId: '', skaterName: '', status: 'late', reason: '' });

  const [revisionModal, setRevisionModal] = useState<{ open: boolean; reason: string }>({
    open: false,
    reason: ''
  });

  const isLeadCoach = profile?.uid === session.leadCoachId;
  const isAdmin = profile?.role === 'admin';
  const isCoach = profile?.role === 'coach' || isAdmin;
  const isLocked = session.attendanceState === 'submitted' || session.attendanceState === 'published';

  // Load attendance
  const loadRecords = async () => {
    setLoading(true);
    const sessionSkaters = skaters.filter((s) => session.participantSkaterIds.includes(s.id));
    const data = await getAttendanceForSession(session.id, sessionSkaters);
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRecords();
  }, [session.id]);

  // Filtered skaters
  const filteredRecords = records.filter((r) => {
    const skater = skaters.find((s) => s.id === r.skaterId);
    if (!skater) return false;
    const matchesSearch =
      skater.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (skater.nickname && skater.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSquad = squadFilter === 'all' || skater.squad === squadFilter;
    return matchesSearch && matchesSquad;
  });

  // Calculate stats
  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const excusedCount = records.filter((r) => r.status === 'excused').length;
  const pendingCount = records.filter((r) => r.status === 'checked_in_pending').length;
  const notMarkedCount = records.filter((r) => r.status === 'not_marked').length;

  const presentPercentage =
    totalCount > 0 ? ((presentCount + lateCount) / totalCount * 100).toFixed(1) : '0.0';

  const handleStatusChange = async (
    skaterId: string,
    skaterName: string,
    status: AttendanceStatus
  ) => {
    if (status === 'late' || status === 'excused') {
      setReasonModal({
        open: true,
        skaterId,
        skaterName,
        status,
        reason: ''
      });
      return;
    }

    const updated = await verifySkaterAttendance(
      session.id,
      skaterId,
      skaterName,
      status,
      profile?.uid || 'coach',
      profile?.displayName || 'Coach'
    );

    setRecords((prev) => prev.map((r) => (r.skaterId === skaterId ? updated : r)));
  };

  const handleConfirmReason = async () => {
    if (!reasonModal.reason.trim()) {
      alert('Please provide a reason.');
      return;
    }

    const updated = await verifySkaterAttendance(
      session.id,
      reasonModal.skaterId,
      reasonModal.skaterName,
      reasonModal.status,
      profile?.uid || 'coach',
      profile?.displayName || 'Coach',
      reasonModal.reason
    );

    setRecords((prev) => prev.map((r) => (r.skaterId === reasonModal.skaterId ? updated : r)));
    setReasonModal({ open: false, skaterId: '', skaterName: '', status: 'late', reason: '' });
  };

  const handleSelectAll = () => {
    if (selectedSkaterIds.length === filteredRecords.length) {
      setSelectedSkaterIds([]);
    } else {
      setSelectedSkaterIds(filteredRecords.map((r) => r.skaterId));
    }
  };

  const handleBatchVerify = async (status: AttendanceStatus) => {
    if (selectedSkaterIds.length === 0) return;
    const selectedSkaters = records
      .filter((r) => selectedSkaterIds.includes(r.skaterId))
      .map((r) => ({ id: r.skaterId, fullName: r.skaterName }));

    const updatedList = await batchVerifyAttendance(
      session.id,
      selectedSkaters,
      status,
      profile?.uid || 'coach',
      profile?.displayName || 'Coach'
    );

    const updatedMap = new Map(updatedList.map((u) => [u.skaterId, u]));
    setRecords((prev) => prev.map((r) => updatedMap.get(r.skaterId) || r));
    setSelectedSkaterIds([]);
  };

  const handleSubmitAttendance = async () => {
    if (!confirm('Submit attendance records to Coach Cheng Wei (Admin) for publishing?')) return;
    try {
      const updated = await submitWorkflow(
        session.id,
        'attendance',
        profile?.uid || session.leadCoachId,
        profile?.displayName || session.leadCoachName
      );
      onSessionUpdated(updated);
      alert('Attendance submitted successfully! Locked pending Admin review.');
    } catch (err: any) {
      alert(`Error submitting: ${err.message}`);
    }
  };

  const handlePublishAttendance = async () => {
    if (!confirm('Publish official attendance records for this session? Athletes and parents will be able to view.'))
      return;
    try {
      const updated = await publishWorkflow(
        session.id,
        'attendance',
        profile?.uid || 'admin',
        profile?.displayName || 'Coach Cheng Wei'
      );
      onSessionUpdated(updated);
      alert('Attendance published successfully!');
    } catch (err: any) {
      alert(`Error publishing: ${err.message}`);
    }
  };

  const handleReturnRevision = async () => {
    if (!revisionModal.reason.trim()) {
      alert('Please enter a revision reason.');
      return;
    }
    try {
      const updated = await returnForRevision(
        session.id,
        'attendance',
        profile?.uid || 'reviewer',
        profile?.displayName || 'Reviewer',
        revisionModal.reason
      );
      onSessionUpdated(updated);
      setRevisionModal({ open: false, reason: '' });
      alert('Attendance returned for revision.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Check className="w-3 h-3" />
            <span>Present</span>
          </span>
        );
      case 'checked_in_pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Checked In · Pending</span>
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-900 border border-orange-300">
            <AlertTriangle className="w-3 h-3" />
            <span>Late</span>
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3" />
            <span>Absent</span>
          </span>
        );
      case 'excused':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-300">
            <FileText className="w-3 h-3" />
            <span>Excused</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <HelpCircle className="w-3 h-3" />
            <span>Not Marked</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Workflow Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                {session.sessionType}
              </span>
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {session.status}
              </span>
              <span
                className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  session.attendanceState === 'published'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : session.attendanceState === 'submitted'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : session.attendanceState === 'revision_requested'
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Workflow: {session.attendanceState.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1.5">
              {session.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {session.date} ({formatTime12(session.startTime)} – {formatTime12(session.endTime)}) · {session.location} · Lead:{' '}
              <span className="font-bold text-slate-800">{session.leadCoachName}</span>
            </p>
            {session.revisionReason && (
              <p className="mt-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                ⚠️ Revision note: {session.revisionReason}
              </p>
            )}
          </div>

          {/* Workflow Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportAttendanceCSV(session, records)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <a
              href={`/print/attendance-sheet.html?sessionId=${session.id}&date=${encodeURIComponent(session.date)}&title=${encodeURIComponent(session.title)}&lead=${encodeURIComponent(session.leadCoachName)}&venue=${encodeURIComponent(session.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition"
              title="Print physical paper attendance roster for ice-side fallback"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet (A4)</span>
            </a>

            {/* Session Lead Submit */}
            {(isLeadCoach || isAdmin) && session.attendanceState === 'draft' && (
              <button
                onClick={handleSubmitAttendance}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-blue-700 hover:bg-blue-800 shadow-sm active:scale-95 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Publishing</span>
              </button>
            )}

            {/* Admin Final Publish */}
            {isAdmin && session.attendanceState === 'submitted' && (
              <button
                onClick={handlePublishAttendance}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-md active:scale-95 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Publish (Admin)</span>
              </button>
            )}

            {/* Return for Revision */}
            {(isLeadCoach || isAdmin) && session.attendanceState === 'submitted' && (
              <button
                onClick={() => setRevisionModal({ open: true, reason: '' })}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return for Revision</span>
              </button>
            )}
          </div>
        </div>

        {/* Attendance Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <p className="text-lg font-black text-blue-900 mt-0.5">
              {presentPercentage}%
            </p>
            <span className="text-[10px] text-slate-400">
              {presentCount + lateCount} / {totalCount} skaters
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Present</span>
            <p className="text-lg font-black text-emerald-800 mt-0.5">{presentCount}</p>
          </div>

          <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100">
            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Late</span>
            <p className="text-lg font-black text-orange-800 mt-0.5">{lateCount}</p>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pending Verify</span>
            <p className="text-lg font-black text-amber-900 mt-0.5">{pendingCount}</p>
          </div>

          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Absent / Excused</span>
            <p className="text-lg font-black text-rose-800 mt-0.5">
              {absentCount} <span className="text-xs font-normal text-slate-400">/ {excusedCount}</span>
            </p>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Not Marked</span>
            <p className="text-lg font-black text-slate-700 mt-0.5">{notMarkedCount}</p>
          </div>
        </div>
      </div>

      {/* Roster Controls: Search, Filters & Bulk Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search skater name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Squad Filter Tabs */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'junior', 'senior', 'development'] as const).map((sq) => (
              <button
                key={sq}
                onClick={() => setSquadFilter(sq)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase tracking-wider ${
                  squadFilter === sq
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Batch Action Toolbar */}
        {isCoach && !isLocked && selectedSkaterIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 animate-fade-in">
            <span className="text-xs font-bold text-blue-900">
              {selectedSkaterIds.length} skaters selected:
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBatchVerify('present')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95"
              >
                ✓ Mark Present
              </button>
              <button
                onClick={() => handleBatchVerify('absent')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95"
              >
                ✕ Mark Absent
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skater Attendance List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                {isCoach && !isLocked && (
                  <th className="py-3 px-4 w-10">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-700">
                      {selectedSkaterIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-700" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Skater</th>
                <th className="py-3.5 px-4">Squad</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Check-In / Reason</th>
                {isCoach && <th className="py-3.5 px-4 text-right">Rapid Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.map((r, idx) => {
                const skater = skaters.find((s) => s.id === r.skaterId);
                const isSelected = selectedSkaterIds.includes(r.skaterId);

                return (
                  <tr
                    key={r.skaterId}
                    className={`hover:bg-slate-50/80 transition ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {isCoach && !isLocked && (
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            setSelectedSkaterIds((prev) =>
                              prev.includes(r.skaterId)
                                ? prev.filter((id) => id !== r.skaterId)
                                : [...prev, r.skaterId]
                            );
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{r.skaterName}</p>
                      {skater?.nickname && (
                        <p className="text-[11px] text-slate-400">"{skater.nickname}"</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                        {skater?.squad || 'Squad'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {r.selfCheckedInAt && (
                        <p className="text-[11px] font-mono text-slate-500">
                          Self: {new Date(r.selfCheckedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {r.lateReason && (
                        <p className="text-[11px] text-orange-700 italic">Late: {r.lateReason}</p>
                      )}
                      {r.excusedReason && (
                        <p className="text-[11px] text-sky-700 italic">Excused: {r.excusedReason}</p>
                      )}
                    </td>
                    {isCoach && (
                      <td className="py-3.5 px-4 text-right">
                        {!isLocked ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleStatusChange(r.skaterId, r.skaterName, 'present')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                              title="Mark Present"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleStatusChange(r.skaterId, r.skaterName, 'late')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-800 hover:bg-orange-200 transition"
                              title="Mark Late"
                            >
                              Late
                            </button>
                            <button
                              onClick={() => handleStatusChange(r.skaterId, r.skaterName, 'absent')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 transition"
                              title="Mark Absent"
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleStatusChange(r.skaterId, r.skaterName, 'excused')}
                              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
                              title="Excused"
                            >
                              Excused
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Locked ({session.attendanceState})
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reason Dialog for Late / Excused */}
      {reasonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Record Reason for {reasonModal.status.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500">
              Skater: <span className="font-bold text-slate-800">{reasonModal.skaterName}</span>
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Traffic on Federal Highway, Exam conflict, Medical leave..."
              value={reasonModal.reason}
              onChange={(e) => setReasonModal((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <div className="flex items-center space-x-2 justify-end">
              <button
                onClick={() =>
                  setReasonModal({ open: false, skaterId: '', skaterName: '', status: 'late', reason: '' })
                }
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReason}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Reason Modal */}
      {revisionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-rose-900 uppercase tracking-wider">
              Return Attendance for Revision
            </h3>
            <p className="text-xs text-slate-500">
              Provide feedback for the Session Lead Coach on what needs adjustment.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Check skater #4 Damiya, she arrived at 4:15pm..."
              value={revisionModal.reason}
              onChange={(e) => setRevisionModal((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full p-3 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex items-center space-x-2 justify-end">
              <button
                onClick={() => setRevisionModal({ open: false, reason: '' })}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnRevision}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700"
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
