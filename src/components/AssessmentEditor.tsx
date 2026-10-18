import React, { useState, useEffect } from 'react';
import {
  TrainingSession,
  Skater,
  SkaterSessionAssessment,
  SessionType
} from '../types';
import { useAuth } from '../context/AuthContext';
import { WORKING_ASSESSMENT_TEMPLATE } from '../constants/assessmentTemplate';
import {
  getAssessmentsForSession,
  saveSkaterAssessment
} from '../services/assessmentService';
import {
  submitWorkflow,
  publishWorkflow,
  returnForRevision
} from '../services/sessionService';
import {
  calculateCategoryAverage,
  formatCategoryScore,
  formatCoverageBadge
} from '../utils/scoring';
import { exportAssessmentCSV } from '../services/exportService';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Lock,
  RotateCcw,
  Download,
  Info,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles,
  Target,
  ArrowRight
} from 'lucide-react';

interface AssessmentEditorProps {
  session: TrainingSession;
  skaters: Skater[];
  onSessionUpdated: (session: TrainingSession) => void;
}

export const AssessmentEditor: React.FC<AssessmentEditorProps> = ({
  session,
  skaters,
  onSessionUpdated
}) => {
  const { profile } = useAuth();
  const [assessments, setAssessments] = useState<Record<string, SkaterSessionAssessment>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [currentSkaterIndex, setCurrentSkaterIndex] = useState<number>(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('skating_skills');
  const [evaluationMode, setEvaluationMode] = useState<'skater' | 'batch_indicator'>('skater');
  const [selectedBatchIndicatorId, setSelectedBatchIndicatorId] = useState<string>('bf_functional_mobility');
  const [activeContext, setActiveContext] = useState<SessionType>(session.sessionType);

  const [revisionModal, setRevisionModal] = useState<{ open: boolean; reason: string }>({
    open: false,
    reason: ''
  });

  const isLeadCoach = profile?.uid === session.leadCoachId;
  const isAdmin = profile?.role === 'admin';
  const isCoach = profile?.role === 'coach' || isAdmin;
  const isLocked = session.assessmentState === 'submitted' || session.assessmentState === 'published';

  const sessionSkaters = skaters.filter((s) => session.participantSkaterIds.includes(s.id));
  const currentSkater = sessionSkaters[currentSkaterIndex] || sessionSkaters[0];

  const activeIndicatorIds = session.activeSubIndicatorIds || [];

  // Load assessments
  const loadAssessments = async () => {
    setLoading(true);
    const data = await getAssessmentsForSession(session.id);
    setAssessments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAssessments();
  }, [session.id]);

  // Current skater's assessment data
  const currentSkaterAssessment: SkaterSessionAssessment = (currentSkater &&
    assessments[currentSkater.id]) || {
    id: `${session.id}_${currentSkater?.id}`,
    sessionId: session.id,
    skaterId: currentSkater?.id || '',
    skaterName: currentSkater?.fullName || '',
    templateVersion: WORKING_ASSESSMENT_TEMPLATE.version,
    scores: {},
    strengths: '',
    nextFocus: '',
    nextTrainingGoal: '',
    coachId: profile?.uid || 'coach',
    coachName: profile?.displayName || 'Coach',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Score step values
  const SCORE_STEPS = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

  const handleScoreSelect = (
    skaterId: string,
    skaterName: string,
    subIndicatorId: string,
    scoreValue: number | null,
    isNotObserved: boolean
  ) => {
    if (isLocked) return;

    const existing = assessments[skaterId] || {
      id: `${session.id}_${skaterId}`,
      sessionId: session.id,
      skaterId,
      skaterName,
      templateVersion: WORKING_ASSESSMENT_TEMPLATE.version,
      scores: {},
      coachId: profile?.uid || 'coach',
      coachName: profile?.displayName || 'Coach',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newScores = {
      ...existing.scores,
      [subIndicatorId]: {
        score: scoreValue,
        isNotObserved,
        context: activeContext
      }
    };

    const updated: SkaterSessionAssessment = {
      ...existing,
      scores: newScores,
      coachId: profile?.uid || 'coach',
      coachName: profile?.displayName || 'Coach',
      updatedAt: new Date().toISOString()
    };

    setAssessments((prev) => ({
      ...prev,
      [skaterId]: updated
    }));

    // Auto save
    saveSkaterAssessment(updated);
  };

  const handleNotesChange = (field: 'strengths' | 'nextFocus' | 'nextTrainingGoal', val: string) => {
    if (!currentSkater || isLocked) return;

    const updated: SkaterSessionAssessment = {
      ...currentSkaterAssessment,
      [field]: val,
      updatedAt: new Date().toISOString()
    };

    setAssessments((prev) => ({
      ...prev,
      [currentSkater.id]: updated
    }));

    saveSkaterAssessment(updated);
  };

  const handleSaveAndNext = () => {
    if (currentSkaterIndex < sessionSkaters.length - 1) {
      setCurrentSkaterIndex((prev) => prev + 1);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!confirm('Submit 36-metric assessment evaluation to Coach Cheng Wei (Admin) for publishing?')) return;
    try {
      const updated = await submitWorkflow(
        session.id,
        'assessment',
        profile?.uid || session.leadCoachId,
        profile?.displayName || session.leadCoachName
      );
      onSessionUpdated(updated);
      alert('Assessment submitted successfully! Locked pending Admin publishing.');
    } catch (err: any) {
      alert(`Error submitting: ${err.message}`);
    }
  };

  const handlePublishAssessment = async () => {
    if (!confirm('Publish assessment reports to athletes and parents? This will become visible on skater portals.'))
      return;
    try {
      const updated = await publishWorkflow(
        session.id,
        'assessment',
        profile?.uid || 'admin',
        profile?.displayName || 'Coach Cheng Wei'
      );
      onSessionUpdated(updated);
      alert('Assessment reports published successfully!');
    } catch (err: any) {
      alert(`Error publishing: ${err.message}`);
    }
  };

  const handleReturnRevision = async () => {
    if (!revisionModal.reason.trim()) {
      alert('Please specify why this evaluation is returned for revision.');
      return;
    }
    try {
      const updated = await returnForRevision(
        session.id,
        'assessment',
        profile?.uid || 'reviewer',
        profile?.displayName || 'Reviewer',
        revisionModal.reason
      );
      onSessionUpdated(updated);
      setRevisionModal({ open: false, reason: '' });
      alert('Assessment returned for revision.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const currentCategory =
    WORKING_ASSESSMENT_TEMPLATE.categories.find((c) => c.id === selectedCategoryId) ||
    WORKING_ASSESSMENT_TEMPLATE.categories[0];

  const currentCategoryAverage = calculateCategoryAverage(
    currentCategory,
    activeIndicatorIds,
    currentSkaterAssessment.scores
  );

  const coverageBadge = formatCoverageBadge(currentCategoryAverage);

  return (
    <div className="space-y-6">
      {/* Top Banner & Assessment Workflow Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                {WORKING_ASSESSMENT_TEMPLATE.name}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Version: {WORKING_ASSESSMENT_TEMPLATE.version}
              </span>
              <span
                className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  session.assessmentState === 'published'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : session.assessmentState === 'submitted'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : session.assessmentState === 'revision_requested'
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Assessment: {session.assessmentState.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1.5">
              8 Categories · 36 Sub-Indicators Workbench
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Working template adapted from Coach Shazfinas 1–5 Scale Framework · Scale: 0.0 – 5.0 in 0.5 steps
            </p>
            {session.revisionReason && (
              <p className="mt-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                ⚠️ Assessment revision note: {session.revisionReason}
              </p>
            )}
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportAssessmentCSV(session, assessments)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Session Lead Submit */}
            {(isLeadCoach || isAdmin) && session.assessmentState === 'draft' && (
              <button
                onClick={handleSubmitAssessment}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-blue-700 hover:bg-blue-800 shadow-sm active:scale-95 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Publishing</span>
              </button>
            )}

            {/* Admin Final Publish */}
            {isAdmin && session.assessmentState === 'submitted' && (
              <button
                onClick={handlePublishAssessment}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-md active:scale-95 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Publish (Admin)</span>
              </button>
            )}

            {/* Return for Revision */}
            {(isLeadCoach || isAdmin) && session.assessmentState === 'submitted' && (
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

        {/* Observation Context Selector & Evaluation Mode */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Observation Context:
            </span>
            {(['Off-Ice', 'On-Ice', 'Combined'] as SessionType[]).map((ctx) => (
              <button
                key={ctx}
                onClick={() => setActiveContext(ctx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                  activeContext === ctx
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ctx}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mode:</span>
            <button
              onClick={() => setEvaluationMode('skater')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                evaluationMode === 'skater'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Skater-by-Skater
            </button>
            <button
              onClick={() => setEvaluationMode('batch_indicator')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                evaluationMode === 'batch_indicator'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Batch Indicator Rating
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Skater by Skater */}
      {evaluationMode === 'skater' && currentSkater && (
        <div className="space-y-6">
          {/* Skater Carousel Selector Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                disabled={currentSkaterIndex === 0}
                onClick={() => setCurrentSkaterIndex((prev) => Math.max(0, prev - 1))}
                className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-slate-900">
                    {currentSkater.fullName}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {currentSkater.squad}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Athlete {currentSkaterIndex + 1} of {sessionSkaters.length}
                </p>
              </div>

              <button
                disabled={currentSkaterIndex >= sessionSkaters.length - 1}
                onClick={() => setCurrentSkaterIndex((prev) => Math.min(sessionSkaters.length - 1, prev + 1))}
                className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Skater Dropdown & Quick Next */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={currentSkater.id}
                onChange={(e) => {
                  const idx = sessionSkaters.findIndex((s) => s.id === e.target.value);
                  if (idx !== -1) setCurrentSkaterIndex(idx);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800"
              >
                {sessionSkaters.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {idx + 1}. {s.fullName} ({s.squad.toUpperCase()})
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveAndNext}
                disabled={currentSkaterIndex >= sessionSkaters.length - 1}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs active:scale-95 disabled:opacity-30"
              >
                <span>Next Skater</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 overflow-x-auto">
            <div className="flex space-x-1 sm:space-x-2 min-w-max">
              {WORKING_ASSESSMENT_TEMPLATE.categories.map((cat) => {
                const avgData = calculateCategoryAverage(
                  cat,
                  activeIndicatorIds,
                  currentSkaterAssessment.scores
                );
                const isSelected = selectedCategoryId === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-2.5 rounded-xl text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                    }`}
                  >
                    <span className="text-xs font-black tracking-tight">{cat.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {cat.nameZh}
                    </span>
                    <div className="mt-1 flex items-center space-x-1.5">
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          isSelected ? 'text-amber-300' : 'text-blue-900'
                        }`}
                      >
                        {formatCategoryScore(avgData.average)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Category Sub-Indicators Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {currentCategory.name} · {currentCategory.nameZh}
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluating {currentSkater.fullName} in context:{' '}
                  <span className="font-bold text-blue-900">{activeContext}</span>
                </p>
              </div>

              {/* Category Live Average Display */}
              <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Category Mean
                  </span>
                  <span className="text-base font-black text-blue-950 font-mono">
                    {formatCategoryScore(currentCategoryAverage.average)}
                  </span>
                </div>
                <div className="border-l border-blue-200 pl-3 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      coverageBadge.isComplete
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {coverageBadge.text}
                  </span>
                  {coverageBadge.hasUncompleted && (
                    <span className="block text-[10px] text-amber-700 font-medium">
                      {currentCategoryAverage.uncompletedCount} unfilled
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* List of Sub-Indicators for this Category */}
            <div className="space-y-4">
              {currentCategory.subIndicators.map((ind) => {
                const scoreObj = currentSkaterAssessment.scores?.[ind.id];
                const currentScore = scoreObj?.score;
                const isNotObserved = scoreObj?.isNotObserved || false;

                return (
                  <div
                    key={ind.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{ind.name}</span>
                          <span className="text-xs text-slate-500 font-medium">({ind.nameZh})</span>
                          {ind.tag && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                              {ind.tag} (Pending ISAM verification)
                            </span>
                          )}
                        </div>
                        {ind.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{ind.description}</p>
                        )}
                      </div>

                      {/* Display current badge */}
                      <div className="text-right">
                        {isNotObserved ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-700">
                            N/O (Not Observed)
                          </span>
                        ) : currentScore !== null && currentScore !== undefined ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-900 text-white font-mono">
                            {currentScore.toFixed(1)} / 5.0
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-100">
                            Unscored
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score Buttons: 0.0 to 5.0 in 0.5 increments + N/O */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {SCORE_STEPS.map((scoreVal) => {
                        const isSelected = !isNotObserved && currentScore === scoreVal;
                        return (
                          <button
                            key={scoreVal}
                            disabled={isLocked}
                            onClick={() =>
                              handleScoreSelect(currentSkater.id, currentSkater.fullName, ind.id, scoreVal, false)
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition active:scale-95 disabled:pointer-events-none ${
                              isSelected
                                ? 'bg-blue-900 text-white ring-2 ring-blue-600 shadow-sm'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {scoreVal.toFixed(1)}
                          </button>
                        );
                      })}

                      {/* N/O Button */}
                      <button
                        disabled={isLocked}
                        onClick={() =>
                          handleScoreSelect(currentSkater.id, currentSkater.fullName, ind.id, null, true)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 disabled:pointer-events-none ${
                          isNotObserved
                            ? 'bg-slate-800 text-white ring-2 ring-slate-600 shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        N/O
                      </button>

                      {/* Clear Button */}
                      {currentScore !== null || isNotObserved ? (
                        <button
                          disabled={isLocked}
                          onClick={() =>
                            handleScoreSelect(currentSkater.id, currentSkater.fullName, ind.id, null, false)
                          }
                          className="px-2 py-1 text-[11px] text-slate-400 hover:text-rose-600"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Qualitative Notes: Strengths, Next Focus, Next Training Goal */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Strengths (亮点与特长)</span>
                </label>
                <textarea
                  rows={3}
                  disabled={isLocked}
                  placeholder="e.g. Excellent knee bend and blade flow on clockwise circles..."
                  value={currentSkaterAssessment.strengths || ''}
                  onChange={(e) => handleNotesChange('strengths', e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>Next Focus (近期侧重点)</span>
                </label>
                <textarea
                  rows={3}
                  disabled={isLocked}
                  placeholder="e.g. Core firmness on Station 3 rotation; shoulder isolation..."
                  value={currentSkaterAssessment.nextFocus || ''}
                  onChange={(e) => handleNotesChange('nextFocus', e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Next Training Goal (阶段目标)</span>
                </label>
                <textarea
                  rows={3}
                  disabled={isLocked}
                  placeholder="e.g. Maintain 9-person line spacing at full tempo by Nov 1st..."
                  value={currentSkaterAssessment.nextTrainingGoal || ''}
                  onChange={(e) => handleNotesChange('nextTrainingGoal', e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Batch Indicator Rapid Rating */}
      {evaluationMode === 'batch_indicator' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Rapid Group Rating by Single Indicator
              </h3>
              <p className="text-xs text-slate-500">
                Rate entire squad on one metric in seconds (e.g. at Station 3 Flexibility & Mobility)
              </p>
            </div>

            <div className="w-full sm:w-72">
              <select
                value={selectedBatchIndicatorId}
                onChange={(e) => setSelectedBatchIndicatorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800"
              >
                {WORKING_ASSESSMENT_TEMPLATE.categories.map((cat) => (
                  <optgroup key={cat.id} label={`${cat.name} (${cat.nameZh})`}>
                    {cat.subIndicators.map((ind) => (
                      <option key={ind.id} value={ind.id}>
                        {ind.name} · {ind.nameZh}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Rapid Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Athlete</th>
                  <th className="py-2.5 px-3">Squad</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3 text-right">Quick Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sessionSkaters.map((s, idx) => {
                  const skaterAss = assessments[s.id];
                  const scoreObj = skaterAss?.scores?.[selectedBatchIndicatorId];
                  const currentScore = scoreObj?.score;
                  const isNotObserved = scoreObj?.isNotObserved;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.fullName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                          {s.squad}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isNotObserved ? (
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-bold">
                            N/O
                          </span>
                        ) : currentScore !== null && currentScore !== undefined ? (
                          <span className="px-2 py-0.5 rounded bg-blue-900 text-white font-mono text-[11px] font-bold">
                            {currentScore.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">Unscored</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center space-x-1">
                          {[1.0, 2.0, 3.0, 3.5, 4.0, 4.5, 5.0].map((val) => (
                            <button
                              key={val}
                              disabled={isLocked}
                              onClick={() =>
                                handleScoreSelect(s.id, s.fullName, selectedBatchIndicatorId, val, false)
                              }
                              className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                                !isNotObserved && currentScore === val
                                  ? 'bg-blue-900 text-white'
                                  : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                          <button
                            disabled={isLocked}
                            onClick={() =>
                              handleScoreSelect(s.id, s.fullName, selectedBatchIndicatorId, null, true)
                            }
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              isNotObserved
                                ? 'bg-slate-800 text-white'
                                : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            N/O
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {revisionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-rose-900 uppercase tracking-wider">
              Return Assessment for Revision
            </h3>
            <p className="text-xs text-slate-500">
              State the reason why this evaluation cannot be published yet.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Please check FTM/DF tag scores, Station 3 requires another look..."
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
