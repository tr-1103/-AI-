// ============================================================
// スコアリング関数 — 遺伝的アルゴリズム用多目的評価
// ============================================================

import { Student, ClassData, PairConstraint, OptimizationWeights, CareCategory } from '../types/student';

interface ClassMetrics {
  maleRatio: number;
  avgAcademic: number;
  avgPhysical: number;
  pianoCount: number;
  leaderCount: number;
  specialSupportCount: number;
  absenceCount: number;
  totalCarePoints: number;
  careByCategory: { [key in CareCategory]?: { count: number; severeCount: number } };
  formerClasses: Set<number>;
}

/** クラスのメトリクスを計算する */
function calcClassMetrics(cls: ClassData): ClassMetrics {
  const students = cls.students;
  const total = students.length;
  if (total === 0) {
    return {
      maleRatio: 0.5,
      avgAcademic: 50,
      avgPhysical: 50,
      pianoCount: 0,
      leaderCount: 0,
      specialSupportCount: 0,
      absenceCount: 0,
      totalCarePoints: 0,
      careByCategory: {},
      formerClasses: new Set(),
    };
  }

  const maleCount = students.filter(s => s.gender === 'male').length;
  const maleRatio = maleCount / total;
  const avgAcademic = students.reduce((a, s) => a + (s.normalizedAcademic ?? 50), 0) / total;
  const avgPhysical = students.reduce((a, s) => a + (s.normalizedPhysical ?? 50), 0) / total;
  const pianoCount = students.filter(s => s.canPlayPiano).length;
  const leaderCount = students.filter(s => s.isLeader).length;
  const specialSupportCount = students.filter(s => s.hasSpecialSupport).length;
  const absenceCount = students.filter(s => s.hasTendencyAbsence).length;
  const totalCarePoints = students.reduce((a, s) => a + (s.totalCarePoints ?? 0), 0);

  // カテゴリ別集計
  const careByCategory: { [key in CareCategory]?: { count: number; severeCount: number } } = {};
  const categories: CareCategory[] = ['learning', 'behavior', 'relationship', 'family', 'health'];
  for (const cat of categories) {
    let count = 0;
    let severeCount = 0;
    for (const s of students) {
      const level = s.careCategories?.[cat];
      if (level) {
        count++;
        if (level >= 3) severeCount++;
      }
    }
    if (count > 0) {
      careByCategory[cat] = { count, severeCount };
    }
  }

  const formerClasses = new Set(students.map(s => s.currentClass));

  return {
    maleRatio,
    avgAcademic,
    avgPhysical,
    pianoCount,
    leaderCount,
    specialSupportCount,
    absenceCount,
    totalCarePoints,
    careByCategory,
    formerClasses,
  };
}

/**
 * 編成案のスコアを計算する
 * 高スコアほど良い編成
 */
export function scoreAssignment(
  classes: ClassData[],
  allStudents: Student[],
  weights: OptimizationWeights,
  constraints: PairConstraint[]
): number {
  const BASE_SCORE = 10000;
  let penalty = 0;

  const numClasses = classes.length;
  const totalStudents = allStudents.length;

  // 全体統計
  const globalMaleRatio = allStudents.filter(s => s.gender === 'male').length / totalStudents;
  const globalAvgAcademic = allStudents.reduce((a, s) => a + (s.normalizedAcademic ?? 50), 0) / totalStudents;
  const globalAvgPhysical = allStudents.reduce((a, s) => a + (s.normalizedPhysical ?? 50), 0) / totalStudents;
  const globalAvgCare = allStudents.reduce((a, s) => a + (s.totalCarePoints ?? 0), 0) / totalStudents;
  const globalSpecial = allStudents.filter(s => s.hasSpecialSupport).length / numClasses;
  const globalLeader = allStudents.filter(s => s.isLeader).length / numClasses;
  const globalAbsence = allStudents.filter(s => s.hasTendencyAbsence).length / numClasses;

  // クラスメトリクス計算
  const metrics = classes.map(cls => calcClassMetrics(cls));

  for (const m of metrics) {
    // --- 男女比均等 ---
    penalty += Math.abs(m.maleRatio - globalMaleRatio) * weights.genderBalance * 20;

    // --- 学力均等 ---
    penalty += Math.abs(m.avgAcademic - globalAvgAcademic) * weights.academicBalance * 0.5;

    // --- 運動能力均等 ---
    penalty += Math.abs(m.avgPhysical - globalAvgPhysical) * weights.physicalBalance * 0.5;

    // --- 特別支援均等 ---
    penalty += Math.abs(m.specialSupportCount - globalSpecial) * weights.specialSupportBalance * 15;

    // --- リーダー均等 ---
    penalty += Math.abs(m.leaderCount - globalLeader) * weights.leaderDistribution * 10;

    // --- 不登校均等 ---
    penalty += Math.abs(m.absenceCount - globalAbsence) * weights.absenceDistribution * 15;

    // --- 配慮ポイント均等 ---
    penalty += Math.abs(m.totalCarePoints / Math.max(classes[0].students.length, 1) - globalAvgCare) * weights.careBalance * 10;
  }

  // 旧クラス分散（全クラス横断で計算）
  const formerClassCountsPerClass: Map<number, number>[] = classes.map(cls => {
    const m = new Map<number, number>();
    for (const s of cls.students) {
      m.set(s.currentClass, (m.get(s.currentClass) ?? 0) + 1);
    }
    return m;
  });
  const allFormerClasses = Array.from(new Set(allStudents.map(s => s.currentClass)));
  for (const fc of allFormerClasses) {
    const counts = formerClassCountsPerClass.map(m => m.get(fc) ?? 0);
    const avgCount = counts.reduce((a, b) => a + b, 0) / numClasses;
    const variance = counts.reduce((a, c) => a + Math.pow(c - avgCount, 2), 0) / numClasses;
    penalty += variance * weights.formerClassMix * 2;
  }

  // --- ピアノ伴奏分散 ---
  const pianoPerClass = metrics.map(m => m.pianoCount);
  const zeroPianoClasses = pianoPerClass.filter(c => c === 0).length;
  penalty += zeroPianoClasses * weights.pianoDistribution * 50;
  const pianoVariance = pianoPerClass.reduce((a, c) => {
    const avg = pianoPerClass.reduce((x, y) => x + y, 0) / numClasses;
    return a + Math.pow(c - avg, 2);
  }, 0) / numClasses;
  penalty += pianoVariance * weights.pianoDistribution * 5;

  // --- 重度配慮者の集中防止 ---
  const categories: CareCategory[] = ['learning', 'behavior', 'relationship', 'family', 'health'];
  for (const cat of categories) {
    for (const m of metrics) {
      const severeCount = m.careByCategory[cat]?.severeCount ?? 0;
      if (severeCount >= 2) {
        penalty += (severeCount - 1) * weights.careBalance * 80;
      }
    }
  }

  // --- ペア制約の評価 ---
  // 生徒IDからクラスへのマップ
  const studentClassMap = new Map<string, number>();
  for (const cls of classes) {
    for (const s of cls.students) {
      studentClassMap.set(s.id, cls.classNumber);
    }
  }

  for (const constraint of constraints) {
    const classA = studentClassMap.get(constraint.studentA);
    const classB = studentClassMap.get(constraint.studentB);
    if (classA === undefined || classB === undefined) continue;

    const sameClass = classA === classB;

    if (constraint.type === 'ng') {
      if (sameClass) {
        // NGペアが同クラス → 大幅ペナルティ
        penalty += constraint.priority === 'required' ? 500 : 100;
      }
    } else if (constraint.type === 'ok') {
      if (!sameClass) {
        // OKペアが別クラス → ペナルティ
        penalty += constraint.priority === 'required' ? 120 : 40;
      }
    }
  }

  return Math.max(0, BASE_SCORE - penalty);
}

/** 制約違反しているペアを取得する */
export function getViolatedConstraints(
  classes: ClassData[],
  constraints: PairConstraint[]
): PairConstraint[] {
  const studentClassMap = new Map<string, number>();
  for (const cls of classes) {
    for (const s of cls.students) {
      studentClassMap.set(s.id, cls.classNumber);
    }
  }

  return constraints.filter(constraint => {
    const classA = studentClassMap.get(constraint.studentA);
    const classB = studentClassMap.get(constraint.studentB);
    if (classA === undefined || classB === undefined) return false;
    const sameClass = classA === classB;
    if (constraint.type === 'ng' && sameClass) return true;
    if (constraint.type === 'ok' && !sameClass) return true;
    return false;
  });
}
