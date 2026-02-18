// ============================================================
// 正規化エンジン — 全入力形式を 0〜100 に変換
// ============================================================

import { Student, AcademicInputType, PhysicalInputType, SchoolType } from '../types/student';

/** 3段階評価（◎○△）を 0〜100 に変換 */
function normalizeScale3(value: number | string): number {
  const str = String(value).trim();
  if (str === '◎' || str === '3') return 100;
  if (str === '○' || str === '2') return 50;
  if (str === '△' || str === '1') return 0;
  const num = parseFloat(str);
  if (!isNaN(num)) {
    if (num >= 3) return 100;
    if (num >= 2) return 50;
    return 0;
  }
  return 50; // デフォルト
}

/** 5段階評価（1〜5）を 0〜100 に変換 */
function normalizeScale5(value: number | string): number {
  const num = parseFloat(String(value));
  if (isNaN(num)) return 50;
  return Math.max(0, Math.min(100, ((num - 1) / 4) * 100));
}

/** 100点満点を 0〜100 に変換 */
function normalizePoints100(value: number | string): number {
  const num = parseFloat(String(value));
  if (isNaN(num)) return 50;
  return Math.max(0, Math.min(100, num));
}

/** 500点満点（5教科合計）を 0〜100 に変換 */
function normalizePoints500(value: number | string): number {
  const num = parseFloat(String(value));
  if (isNaN(num)) return 50;
  return Math.max(0, Math.min(100, (num / 500) * 100));
}

/** 偏差値を 0〜100 に変換（偏差値25〜75 → 0〜100） */
function normalizeDeviation(value: number | string): number {
  const num = parseFloat(String(value));
  if (isNaN(num)) return 50;
  return Math.max(0, Math.min(100, ((num - 25) / 50) * 100));
}

/** カスタム満点値で正規化 */
function normalizeCustom(value: number | string, maxValue: number): number {
  const num = parseFloat(String(value));
  if (isNaN(num)) return 50;
  return Math.max(0, Math.min(100, (num / maxValue) * 100));
}

/** A〜E段階評価を 0〜100 に変換 */
function normalizeGradeAE(value: number | string): number {
  const str = String(value).trim().toUpperCase();
  const gradeMap: { [key: string]: number } = {
    'A': 100, 'B': 75, 'C': 50, 'D': 25, 'E': 0,
  };
  if (gradeMap[str] !== undefined) return gradeMap[str];
  return 50; // デフォルト
}

/** フラグ（○/空欄）を 0 or 100 に変換 */
function normalizeFlag(value: number | string | boolean | undefined): number {
  if (value === '○' || value === '◯' || value === 1 || value === true) return 100;
  return 0;
}

/**
 * 学力値を正規化する
 */
export function normalizeAcademic(
  value: number | string | undefined,
  type: AcademicInputType,
  maxValue?: number
): number {
  if (value === undefined || value === null || value === '') return 50;
  switch (type) {
    case 'scale_3':    return normalizeScale3(value);
    case 'scale_5':    return normalizeScale5(value);
    case 'points_100': return normalizePoints100(value);
    case 'points_500': return normalizePoints500(value);
    case 'deviation':  return normalizeDeviation(value);
    case 'custom':     return normalizeCustom(value, maxValue ?? 100);
    default:           return normalizeScale5(value);
  }
}

/**
 * 科目別スコアを合算して正規化する
 * 例：国語(3段階)=◎, 算数(3段階)=○ → 平均正規化スコア
 */
export function normalizeSubjects(
  subjects: { [key: string]: number | string },
  type: AcademicInputType,
  maxValue?: number
): number {
  const values = Object.values(subjects).filter(v => v !== undefined && v !== '');
  if (values.length === 0) return 50;
  const normalized = values.map(v => normalizeAcademic(v, type, maxValue));
  return normalized.reduce((a, b) => a + b, 0) / normalized.length;
}

/**
 * 運動能力値を正規化する
 */
export function normalizePhysical(
  value: number | string | undefined,
  type: PhysicalInputType,
  maxValue?: number
): number {
  if (value === undefined || value === null || value === '') return 50;
  switch (type) {
    case 'numeric':  return normalizeCustom(value, maxValue ?? 100);
    case 'grade_AE': return normalizeGradeAE(value);
    case 'scale_5':  return normalizeScale5(value);
    case 'flag':     return normalizeFlag(value);
    default:         return normalizeScale5(value);
  }
}

/**
 * 生徒の配慮合計ポイントを計算する
 * カテゴリ別の負担度レベルをポイントとして合算
 */
export function calcTotalCarePoints(student: Student): number {
  if (student.careCategories) {
    const vals = Object.values(student.careCategories) as number[];
    return vals.reduce((a, b) => a + b, 0);
  }
  if (student.careFlag) return 2; // 後方互換：○印のみ → レベル2相当
  return 0;
}

/**
 * 生徒リスト全体に正規化スコアを付与する
 */
export function normalizeStudents(
  students: Student[],
  academicType: AcademicInputType,
  physicalType: PhysicalInputType,
  academicMaxValue?: number,
  physicalMaxValue?: number
): Student[] {
  return students.map(student => {
    // 学力正規化
    let normalizedAcademic: number;
    if (student.academicSubjects && Object.keys(student.academicSubjects).length > 0) {
      normalizedAcademic = normalizeSubjects(student.academicSubjects, academicType, academicMaxValue);
    } else if (student.academicRaw !== undefined) {
      normalizedAcademic = normalizeAcademic(student.academicRaw, academicType, academicMaxValue);
    } else {
      normalizedAcademic = 50;
    }

    // 運動能力正規化
    const normalizedPhysical = normalizePhysical(student.physicalRaw, physicalType, physicalMaxValue);

    // 配慮ポイント計算
    const totalCarePoints = calcTotalCarePoints(student);

    return {
      ...student,
      normalizedAcademic,
      normalizedPhysical,
      totalCarePoints,
    };
  });
}

/**
 * 校種に応じてデフォルト正規化タイプを推定する
 */
export function inferAcademicType(
  schoolType: SchoolType,
  sampleValues: (number | string)[]
): AcademicInputType {
  if (sampleValues.length === 0) return 'scale_5';

  const strValues = sampleValues.map(v => String(v).trim());
  // ◎○△チェック
  if (strValues.some(v => ['◎', '○', '△'].includes(v))) return 'scale_3';
  // A〜E is not a valid AcademicInputType — fall back to scale_5
  if (strValues.some(v => ['A', 'B', 'C', 'D', 'E'].includes(v))) return 'scale_5';

  const nums = strValues.map(v => parseFloat(v)).filter(n => !isNaN(n));
  if (nums.length === 0) return 'scale_5';

  const maxVal = Math.max(...nums);
  if (maxVal > 100) return 'points_500';
  if (maxVal > 10) {
    if (schoolType === 'high' && maxVal <= 80) return 'deviation';
    return 'points_100';
  }
  if (maxVal <= 3) return 'scale_3';
  return 'scale_5';
}
