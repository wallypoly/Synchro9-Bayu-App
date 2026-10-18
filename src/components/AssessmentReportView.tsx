import React, { useState, useEffect } from 'react';
import { TrainingSession, Skater, SkaterSessionAssessment } from '../types';
import { useAuth } from '../context/AuthContext';
import { WORKING_ASSESSMENT_TEMPLATE } from '../constants/assessmentTemplate';
import { getAssessmentsForSession } from '../services/assessmentService';
import { calculateCategoryAverage, formatCategoryScore, formatCoverageBadge } from '../utils/scoring';
import { exportAssessmentCSV } from '../services/exportService';
import {
  Award,
  Sparkles,
  Target,
  Download,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Clock
} from 'lucide-react';

interface AssessmentReportViewProps {
  session: TrainingSession;
  skaters: Skater[];
}

export const AssessmentReportView: React.FC<AssessmentReportViewProps> = ({ session, skaters }) => {
  const { profile } = useAuth();
  const [assessments, setAssessments] = useState<Record<string, SkaterSessionAssessment>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSkaterId, setSelectedSkaterId] = useState<string>('');

  // Determine which skaters this user is allowed to view
  const visibleSkaters = skaters.filter((s) => {
    if (!profile) return false;
    if (profile.role === 'admin' || profile.role === 'coach') return true;
    if (profile.skaterIds && profile.skaterIds.includes(s.id)) return true;
    return false;
  });

  useEffect(() => {
    if (visibleSkaters.length > 0 && !selectedSkaterId) {
      setSelectedSkaterId(visibleSkaters[0].id);
    }
  }, [visibleSkaters]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getAssessmentsForSession(session.id);
      setAssessments(data);
      setLoading(false);
    };
    load();
  }, [session.id]);

  const currentSkater = visibleSkaters.find((s) => s.id === selectedSkaterId);
  const assessment = currentSkater ? assessments[currentSkater.id] : null;

  // Strict check: Athletes and parents can only see PUBLISHED assessments
  const isAthleteOrParent = profile?.role === 'athlete' || profile?.role === 'parent';
  const isPublished = session.assessmentState === 'published';

  if (isAthleteOrParent && !isPublished) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-slate-900">
          Assessment Report Pending Official Publication
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The 36-metric assessment evaluation for session{' '}
          <span className="font-bold text-slate-800">{session.title}</span> is currently in{' '}
          <span className="font-bold text-amber-700 uppercase">{session.assessmentState}</span> status. In
          accordance with team protocols, reports become accessible to athletes and families only once
          formally reviewed and published by Coach Cheng Wei.
        </p>
        <div className="text-[11px] text-slate-400 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          Session Date: {session.date} · Lead Coach: {session.leadCoachName}
        </div>
      </div>
    );
  }

  const activeIndicatorIds = session.activeSubIndicatorIds || [];

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                Official Report
              </span>
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                {session.assessmentState.toUpperCase()}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Context: {session.sessionType}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1.5">
              Athlete Development & Performance Report
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {session.title} · {session.date} · {session.location}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {visibleSkaters.length > 1 && (
              <select
                value={selectedSkaterId}
                onChange={(e) => setSelectedSkaterId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800"
              >
                {visibleSkaters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.squad.toUpperCase()})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => exportAssessmentCSV(session, assessments)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {currentSkater && (
        <div className="space-y-6">
          {/* Athlete Profile Summary Strip */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                Evaluating Athlete
              </span>
              <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                {currentSkater.fullName}
              </h3>
              <p className="text-xs text-blue-200">
                Squad: {currentSkater.squad.toUpperCase()} · Code of Conduct: Signed ✓
              </p>
            </div>
            <div className="text-right bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
              <span className="text-[10px] text-blue-200 uppercase tracking-wider block">
                Evaluating Coach
              </span>
              <span className="text-xs font-black text-white">
                {assessment?.coachName || session.leadCoachName}
              </span>
            </div>
          </div>

          {/* 8 Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORKING_ASSESSMENT_TEMPLATE.categories.map((cat) => {
              const avgData = calculateCategoryAverage(
                cat,
                activeIndicatorIds,
                assessment?.scores || {}
              );
              const coverage = formatCoverageBadge(avgData);

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{cat.name}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{cat.nameZh}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-50 text-blue-900 border border-blue-200">
                        {coverage.text}
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="text-2xl font-black font-mono text-blue-950">
                        {formatCategoryScore(avgData.average)}
                      </span>
                    </div>
                  </div>

                  {/* Sub-indicators mini list */}
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    {cat.subIndicators.map((ind) => {
                      const scoreObj = assessment?.scores?.[ind.id];
                      return (
                        <div key={ind.id} className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600 truncate mr-2">{ind.name}</span>
                          <span className="font-mono font-bold text-slate-900 flex-shrink-0">
                            {scoreObj?.isNotObserved
                              ? 'N/O'
                              : scoreObj?.score !== null && scoreObj?.score !== undefined
                              ? `${scoreObj.score.toFixed(1)}`
                              : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Qualitative Coaching Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center space-x-1.5 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black uppercase tracking-wider">Strengths (亮点与优势)</h4>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-wrap">
                {assessment?.strengths || 'No specific strengths recorded for this session.'}
              </p>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center space-x-1.5 text-blue-900">
                <Target className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black uppercase tracking-wider">Next Focus (近期重点)</h4>
              </div>
              <p className="text-xs text-blue-950 leading-relaxed whitespace-pre-wrap">
                {assessment?.nextFocus || 'Continue current technical rotation and alignment exercises.'}
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center space-x-1.5 text-emerald-900">
                <Award className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-wider">Next Training Goal (阶段目标)</h4>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed whitespace-pre-wrap">
                {assessment?.nextTrainingGoal || 'Achieve full squad synchronization without hesitation.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
