import { AssessmentTemplate } from '../types';

export const WORKING_ASSESSMENT_TEMPLATE: AssessmentTemplate = {
  version: 'v1.0-working',
  name: 'Bayu Blades Synchro9 36-Metric Assessment Framework',
  approvalStatus: 'draft_working',
  source: 'Working template adapted from Coach Shazfinas 1-5 Scale Framework (Pending Coach Cheng Wei approval)',
  totalSubIndicators: 36,
  categories: [
    {
      id: 'skating_skills',
      name: 'Skating Skills',
      nameZh: '滑行技巧',
      subIndicators: [
        { id: 'ss_edge_quality', name: 'Edge Quality', nameZh: '用刃质量', description: 'Deep, clean edges with minimal scraping' },
        { id: 'ss_flow_glide', name: 'Flow & Glide', nameZh: '滑行流畅度', description: 'Continuous forward and backward propulsion' },
        { id: 'ss_steps_turns', name: 'Steps & Turns', nameZh: '步法与转步', description: 'Twizzles, brackets, rockers, counters precision' },
        { id: 'ss_power_speed', name: 'Power & Speed', nameZh: '力量与速度', description: 'Acceleration and power generation from blade push' },
        { id: 'ss_multi_direction', name: 'Multi-directional Control', nameZh: '多方向控制', description: 'Effortless switching between directions and lobes' }
      ]
    },
    {
      id: 'posture_body_control',
      name: 'Posture & Body Control',
      nameZh: '姿态与身体控制',
      subIndicators: [
        { id: 'pbc_alignment', name: 'Body Alignment', nameZh: '身体对齐', description: 'Head, spine, pelvis and blade vertical alignment' },
        { id: 'pbc_knee_ankle', name: 'Knee & Ankle Action', nameZh: '膝踝配合', description: 'Elastic spring and deep compression' },
        { id: 'pbc_core_stability', name: 'Core Stability', nameZh: '核心稳定', description: 'Torso firmness during motion and pressure' },
        { id: 'pbc_upper_body', name: 'Upper Body Carriage & Isolation', nameZh: '上半身独立控制', description: 'Still shoulders and expressive arms independent of lower body' }
      ]
    },
    {
      id: 'balance_flexibility',
      name: 'Balance & Flexibility',
      nameZh: '平衡与柔韧性',
      subIndicators: [
        { id: 'bf_one_foot', name: 'One-foot Balance', nameZh: '单脚平衡', description: 'Centering over single skating blade without wobble' },
        { id: 'bf_dynamic_stability', name: 'Dynamic Stability', nameZh: '动态稳定', description: 'Balance maintained through complex transitions' },
        { id: 'bf_functional_mobility', name: 'Functional Mobility', nameZh: '功能性活动度', description: 'Range of motion in hips, shoulders and spine' },
        { id: 'bf_extension_line', name: 'Extension & Line Control', nameZh: '延伸控制', description: 'Pointed toes, clean limb lines and positions' }
      ]
    },
    {
      id: 'timing_musicality',
      name: 'Timing & Musicality',
      nameZh: '节奏与乐感',
      subIndicators: [
        { id: 'tm_beat_accuracy', name: 'Beat & Rhythm Accuracy', nameZh: '节拍准确度', description: 'On-beat blade strikes and accents' },
        { id: 'tm_start_stop', name: 'Start & Stop Timing', nameZh: '起止时机', description: 'Sharp, unanimous initiations and cut-offs' },
        { id: 'tm_phrasing', name: 'Musical Phrasing', nameZh: '音乐乐句', description: 'Sensing musical phrasing and structure' },
        { id: 'tm_tempo_adaptation', name: 'Tempo Adaptation', nameZh: '速度变化适应', description: 'Smooth handling of accelerando and ritardando' },
        { id: 'tm_dynamics_expression', name: 'Dynamics & Expressiveness', nameZh: '力度变化与表现力', description: 'Contrast between soft lyrical and crisp staccato' }
      ]
    },
    {
      id: 'teamwork_synchronization',
      name: 'Teamwork & Synchronization',
      nameZh: '团队配合与同步',
      subIndicators: [
        { id: 'ts_spacing', name: 'Spacing Control', nameZh: '间距控制', description: 'Uniform distance between adjacent skaters' },
        { id: 'ts_movement_uniformity', name: 'Movement Uniformity', nameZh: '动作一致性', description: 'Identical angles, limb heights and turn speed' },
        { id: 'ts_matching_speed', name: 'Matching Speed', nameZh: '速度配合', description: 'Synchronized glide speed across all skaters' },
        { id: 'ts_holds_connections', name: 'Holds & Connections', nameZh: '握持与连接', description: 'Shoulder, hand-to-hand, and wrist grip firmness' },
        { id: 'ts_awareness_recovery', name: 'Team Awareness & Recovery', nameZh: '团队意识与失误恢复', description: 'Peripheral vision and rapid adjustment if spacing shifts' }
      ]
    },
    {
      id: 'formation_transitions',
      name: 'Formation & Transitions',
      nameZh: '队形与转换',
      subIndicators: [
        { id: 'ft_formation_precision', name: 'Formation Precision', nameZh: '队形准确度', description: 'Straight lines, round circles, crisp blocks' },
        { id: 'ft_travel_tracking', name: 'Travel & Tracking', nameZh: '移动路线', description: 'Maintaining team geometry across designated ice paths' },
        { id: 'ft_transition_timing', name: 'Transition Timing', nameZh: '转换时机', description: 'Seamless shifts from one formation to another' },
        { id: 'ft_ice_coverage', name: 'Ice Coverage', nameZh: '冰面覆盖', description: 'Full utilize of rink space and arena corners' },
        { id: 'ft_ftm_df_readiness', name: 'FTM / DF Readiness', nameZh: 'FTM／DF 准备度', description: 'Readiness for Free Skating Moves & Difficult Formations (Pending ISAM verification)', tag: 'FTM / DF' }
      ]
    },
    {
      id: 'strength_endurance',
      name: 'Strength & Endurance',
      nameZh: '力量与耐力',
      subIndicators: [
        { id: 'se_push_power', name: 'Push & Acceleration Power', nameZh: '蹬冰力量', description: 'Deep push power on ice and explosive drive' },
        { id: 'se_functional_strength', name: 'Functional Strength', nameZh: '功能性力量', description: 'Supportive strength for holds, pivots and lifts' },
        { id: 'se_repetitive_endurance', name: 'Repetitive Endurance', nameZh: '重复运动能力', description: 'Cardiovascular and muscular stamina over runs' },
        { id: 'se_quality_under_fatigue', name: 'Quality Under Fatigue', nameZh: '疲劳下的动作质量', description: 'Form and posture preserved through the final minutes' }
      ]
    },
    {
      id: 'discipline_coachability',
      name: 'Discipline & Coachability',
      nameZh: '训练纪律与学习态度',
      subIndicators: [
        { id: 'dc_punctuality', name: 'Punctuality & Preparation', nameZh: '训练准备', description: 'Laced up, warmed up and attentive before scheduled ice' },
        { id: 'dc_comprehension', name: 'Listening & Comprehension', nameZh: '理解指令', description: 'Focused attention during briefings and board demos' },
        { id: 'dc_correction', name: 'Correction Application', nameZh: '应用纠正', description: 'Immediate attempt to apply coaches technical feedback' },
        { id: 'dc_safety', name: 'Safety & Accountability', nameZh: '安全与团队责任', description: 'Blade safety, respectful conduct and locker room care' }
      ]
    }
  ]
};

// Shaz Original Scale Reference definitions
export const RATING_SCALE_DEFINITIONS = [
  { score: 5.0, label: 'Excellent', labelZh: '卓越', desc: 'High degree of control, accuracy and confidence. Consistent performance without assistance.' },
  { score: 4.0, label: 'Good', labelZh: '良好', desc: 'Performs well with minor errors. Demonstrates good control and consistency.' },
  { score: 3.0, label: 'Satisfactory', labelZh: '达标', desc: 'Meets basic expectations but lacks consistency. Requires occasional cues.' },
  { score: 2.0, label: 'Developing', labelZh: '发展中', desc: 'Shows partial understanding. Struggles with consistency, requires frequent cues and support.' },
  { score: 1.0, label: 'Needs Improvement', labelZh: '待提升', desc: 'Difficulty executing. Requires significant assistance and guidance.' },
  { score: 0.0, label: 'Zero / Non-performance', labelZh: '零分/未执行', desc: 'Attempted but complete failure to perform, or refusal to participate. (Only recorded upon explicit coach selection; requires Admin approval for formal benchmark)' }
];
