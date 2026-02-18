// ============================================================
// 校種別プリセット定義
// ============================================================

import {
  SchoolPreset,
  OptimizationWeights,
} from '../types/student';

const defaultWeightsBase: OptimizationWeights = {
  genderBalance: 10,
  academicBalance: 8,
  physicalBalance: 5,
  careBalance: 7,
  pianoDistribution: 6,
  leaderDistribution: 4,
  absenceDistribution: 6,
  formerClassMix: 5,
  specialSupportBalance: 7,
};

export const SCHOOL_PRESETS: { [key: string]: SchoolPreset } = {
  elementary: {
    schoolType: 'elementary',
    label: '小学校',
    description: '3段階または5段階の学力評価、運動能力フラグ、通学班対応',
    defaultAcademicInput: 'scale_3',
    defaultPhysicalInput: 'flag',
    defaultNumClasses: 4,
    defaultWeights: {
      ...defaultWeightsBase,
      pianoDistribution: 8,     // ピアノ伴奏が重要
      formerClassMix: 6,
      genderBalance: 10,
    },
    availableColumns: [
      '氏名', '性別', '現クラス', '学力', '国語', '算数', '理科', '社会',
      '運動', 'ピアノ', '特別支援', '不登校', 'リーダー', '要配慮',
      '生徒指導', '通学班', '備考',
    ],
    sampleSubjects: ['国語', '算数', '理科', '社会'],
  },

  middle: {
    schoolType: 'middle',
    label: '中学校',
    description: '5段階または100点満点の学力評価、5教科対応、部活考慮',
    defaultAcademicInput: 'scale_5',
    defaultPhysicalInput: 'scale_5',
    defaultNumClasses: 5,
    defaultWeights: {
      ...defaultWeightsBase,
      academicBalance: 10,    // 学力均等が重要
      careBalance: 8,
      specialSupportBalance: 8,
    },
    availableColumns: [
      '氏名', '性別', '現クラス', '学力', '国語', '数学', '英語', '理科', '社会',
      '運動', 'ピアノ', '特別支援', '不登校', 'リーダー', '要配慮',
      '生徒指導', '備考',
    ],
    sampleSubjects: ['国語', '数学', '英語', '理科', '社会'],
  },

  high: {
    schoolType: 'high',
    label: '高校',
    description: '偏差値または5教科合計、コース・選択科目対応',
    defaultAcademicInput: 'deviation',
    defaultPhysicalInput: 'grade_AE',
    defaultNumClasses: 6,
    defaultWeights: {
      ...defaultWeightsBase,
      academicBalance: 9,
      pianoDistribution: 3,  // 高校では重要度低
      formerClassMix: 4,
      genderBalance: 8,
    },
    availableColumns: [
      '氏名', '性別', '現クラス', '学力', '国語', '数学', '英語', '理科', '社会',
      '運動', 'ピアノ', '特別支援', '不登校', 'リーダー', '要配慮',
      '生徒指導', '選択科目', 'コース', '備考',
    ],
    sampleSubjects: ['国語', '数学', '英語', '理科', '社会'],
  },
};

/** カテゴリ別カラーパレット */
export const CARE_COLORS: { [key: string]: string } = {
  learning: '#2563eb',      // 学習支援（青）
  behavior: '#d97706',      // 生活指導（オレンジ）
  relationship: '#dc2626',  // 人間関係（赤）
  family: '#7c3aed',        // 家庭環境（紫）
  health: '#059669',        // 健康・心理（緑）
};

/** クラスカラーパレット */
export const CLASS_COLORS: string[] = [
  '#2563eb',  // 青
  '#059669',  // 緑
  '#d97706',  // オレンジ
  '#dc2626',  // 赤
  '#7c3aed',  // 紫
  '#db2777',  // ピンク
  '#0891b2',  // シアン
  '#65a30d',  // ライムグリーン
];

/** カテゴリ日本語ラベル */
export const CARE_CATEGORY_LABELS: { [key: string]: string } = {
  learning: '学習支援',
  behavior: '生活指導',
  relationship: '人間関係',
  family: '家庭環境',
  health: '健康・心理',
};

/** 配慮カテゴリの説明 */
export const CARE_CATEGORY_DESCRIPTIONS: { [key: string]: string } = {
  learning: '特別支援在籍、通級指導、学習障害(LD)、日本語支援',
  behavior: '素行不良、問題行動傾向、別室登校',
  relationship: 'いじめ被害/加害経験、対人トラブルリスク、孤立傾向',
  family: '保護者対応困難、ネグレクト・虐待疑い、経済的配慮',
  health: '不登校傾向、メンタルケア必要、持病・アレルギー',
};

/** デフォルトGA設定 */
export const DEFAULT_GA_CONFIG = {
  populationSize: 60,
  generations: 350,
  eliteCount: 14,
  mutationRate: 0.05,
  numPlans: 5,
};
