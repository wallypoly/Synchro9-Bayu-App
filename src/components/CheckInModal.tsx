import React, { useState } from 'react';
import { TrainingSession, Skater } from '../types';
import { useAuth } from '../context/AuthContext';
import { evaluateCheckInWindow, formatTime12 } from '../utils/date';
import { recordSelfCheckIn } from '../services/attendanceService';
import {
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';

interface CheckInModalProps {
  session: TrainingSession;
  skaters: Skater[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  session,
  skaters,
  onClose,
  onSuccess
}) => {
  const { profile } = useAuth();
  
  // Available skaters for this user
  const eligibleSkaters = skaters.filter((s) => {
    if (!profile) return false;
    if (profile.role === 'admin' || profile.role === 'coach') return true;
    if (profile.skaterIds && profile.skaterIds.includes(s.id)) return true;
    return false;
  });

  const [selectedSkaterId, setSelectedSkaterId] = useState<string>(
    eligibleSkaters[0]?.id || ''
  );
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const windowStatus = evaluateCheckInWindow(session);

  const handleCheckIn = async () => {
    if (!selectedSkaterId) return;
    const skater = skaters.find((s) => s.id === selectedSkaterId);
    if (!skater) return;

    setLoading(true);
    setResultMsg(null);

    const res = await recordSelfCheckIn(
      session,
      skater.id,
      skater.fullName,
      profile?.uid || 'anonymous'
    );

    setLoading(false);
    if (res.success) {
      setResultMsg({ type: 'success', text: res.message });
      onSuccess();
    } else {
      setResultMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-blue-800 text-[10px] font-bold uppercase tracking-wider text-blue-200 border border-blue-700">
                {session.sessionType}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-400 text-[10px] font-black uppercase tracking-wider text-amber-950">
                {session.status}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight mt-2 text-white">
              Self Check-In · Smart Attendance
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              {session.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session Time & Location Details */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-medium">Session Date & Time:</span>
              <span className="font-bold text-slate-900">
                {session.date} ({formatTime12(session.startTime)} – {formatTime12(session.endTime)})
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-medium">Location:</span>
              <span className="font-bold text-slate-900">{session.location}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-medium">Session Lead Coach:</span>
              <span className="font-bold text-blue-900">{session.leadCoachName}</span>
            </div>
          </div>

          {/* Window Verification Notice */}
          {!windowStatus.canCheckIn ? (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Check-In Unavailable</p>
                <p className="mt-0.5 text-amber-800">{windowStatus.reason}</p>
                {windowStatus.minutesUntilOpen && (
                  <p className="mt-1 font-semibold text-amber-900">
                    Window starts at T-15 minutes ({formatTime12(session.startTime)} - 15m).
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-emerald-900">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Check-In Window Active</p>
                <p className="mt-0.5 text-emerald-800">
                  You are within the verified window. Submit below to confirm your arrival.
                </p>
              </div>
            </div>
          )}

          {/* Skater Selection for Parent/Athlete */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {profile?.role === 'parent' ? 'Select Skater to Check In:' : 'Skater:'}
            </label>
            {eligibleSkaters.length > 0 ? (
              <select
                value={selectedSkaterId}
                onChange={(e) => setSelectedSkaterId(e.target.value)}
                disabled={!windowStatus.canCheckIn || loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
              >
                {eligibleSkaters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.squad.toUpperCase()})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                No verified bound skaters found for your account. Please ask Coach Cheng Wei to approve and bind your skater profile.
              </div>
            )}
          </div>

          {/* Feedback Messages */}
          {resultMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {resultMsg.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-700" />
              )}
              <span>{resultMsg.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Close
            </button>
            <button
              onClick={handleCheckIn}
              disabled={!windowStatus.canCheckIn || !selectedSkaterId || loading}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 transition-transform disabled:bg-slate-300 disabled:text-slate-500 shadow-md"
            >
              {loading ? 'Confirming...' : 'Confirm Check-In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
