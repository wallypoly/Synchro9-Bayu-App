import React, { useState } from 'react';
import { TrainingSession, Skater } from '../types';
import { getAttendanceForSession } from '../services/attendanceService';
import { getAssessmentsForSession } from '../services/assessmentService';
import { exportAttendanceCSV, exportAssessmentCSV } from '../services/exportService';
import { Download, FileSpreadsheet, CheckCircle, Clock } from 'lucide-react';

interface ExportDataModalProps {
  sessions: TrainingSession[];
  skaters: Skater[];
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({ sessions, skaters }) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [exporting, setExporting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const currentSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const handleExportAttendance = async () => {
    if (!currentSession) return;
    setExporting(true);
    setStatusMsg('Generating Attendance CSV...');
    try {
      const records = await getAttendanceForSession(currentSession.id, skaters);
      exportAttendanceCSV(currentSession, records);
      setStatusMsg('Attendance CSV exported successfully!');
    } catch (err: any) {
      setStatusMsg(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAssessment = async () => {
    if (!currentSession) return;
    setExporting(true);
    setStatusMsg('Generating Assessment 36-Metric CSV...');
    try {
      const assessments = await getAssessmentsForSession(currentSession.id);
      exportAssessmentCSV(currentSession, assessments);
      setStatusMsg('Assessment CSV exported successfully!');
    } catch (err: any) {
      setStatusMsg(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center space-x-2 text-blue-900">
          <FileSpreadsheet className="w-5 h-5 text-blue-700" />
          <h2 className="text-lg font-black tracking-tight">Export Team Records (CSV)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Export standardized attendance logs and 36-metric assessment records directly to CSV files for Excel, Google Sheets, or ISAM record-keeping.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Select Training Session to Export:
        </label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="w-full p-3 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.date} — {s.title} ({s.sessionType}) · Status: {s.status}
            </option>
          ))}
        </select>
      </div>

      {currentSession && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Session Location:</span>
            <span className="font-bold text-slate-900">{currentSession.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Attendance State:</span>
            <span className="font-bold uppercase text-blue-900">{currentSession.attendanceState}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Assessment State:</span>
            <span className="font-bold uppercase text-blue-900">{currentSession.assessmentState}</span>
          </div>
        </div>
      )}

      {/* CSV Digital Exports */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Digital Records (CSV / Excel):
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportAttendance}
            disabled={exporting}
            className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 transition flex items-center justify-between text-left group"
          >
            <div>
              <span className="text-xs font-black text-blue-950 block">Attendance Log CSV</span>
              <span className="text-[11px] text-blue-700">Check-in, verified status & reasons</span>
            </div>
            <Download className="w-4 h-4 text-blue-800 group-hover:translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={handleExportAssessment}
            disabled={exporting}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 transition flex items-center justify-between text-left group"
          >
            <div>
              <span className="text-xs font-black text-emerald-950 block">36-Metric Assessment CSV</span>
              <span className="text-[11px] text-emerald-700">8 Categories, scores & notes</span>
            </div>
            <Download className="w-4 h-4 text-emerald-800 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Physical Paper Backup Sheets (A4 Printable) */}
      <div className="pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
            🖨️ Physical Paper Backup Sheets (A4 Printable):
          </h3>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            Ice-Side Fallback
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Print physical clipboard worksheets in case of rink Wi-Fi outage, dead device batteries, or official paper signing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`/print/attendance-sheet.html?sessionId=${currentSession?.id || ''}&date=${encodeURIComponent(currentSession?.date || '')}&title=${encodeURIComponent(currentSession?.title || '')}&lead=${encodeURIComponent(currentSession?.leadCoachName || '')}&venue=${encodeURIComponent(currentSession?.location || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100 transition flex flex-col justify-between text-left group"
          >
            <div>
              <span className="text-xs font-black text-amber-950 block">Attendance Roster</span>
              <span className="text-[10px] text-amber-800 mt-1 block">40 Skaters A4 Portrait</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-amber-900">
              <span>Open & Print</span>
              <span>↗</span>
            </div>
          </a>

          <a
            href={`/print/assessment-sheet.html?date=${encodeURIComponent(currentSession?.date || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-blue-300 bg-blue-50/70 hover:bg-blue-100 transition flex flex-col justify-between text-left group"
          >
            <div>
              <span className="text-xs font-black text-blue-950 block">36-Metric Rubric</span>
              <span className="text-[10px] text-blue-800 mt-1 block">8 Categories 2-Page A4</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-blue-900">
              <span>Open & Print</span>
              <span>↗</span>
            </div>
          </a>

          <a
            href="/print/squad-matrix.html"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-purple-300 bg-purple-50/70 hover:bg-purple-100 transition flex flex-col justify-between text-left group"
          >
            <div>
              <span className="text-xs font-black text-purple-950 block">Squad Rapid Matrix</span>
              <span className="text-[10px] text-purple-800 mt-1 block">Landscape Station Grid</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-purple-900">
              <span>Open & Print</span>
              <span>↗</span>
            </div>
          </a>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-semibold border border-blue-200 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-blue-700" />
          <span>{statusMsg}</span>
        </div>
      )}
    </div>
  );
};
