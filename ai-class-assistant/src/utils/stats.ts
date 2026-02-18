// ============================================================
// クラス統計計算ユーティリティ
// ============================================================

import { ClassData, ClassStats, CareCategory } from '../types/student';

/** 1クラスの統計を計算する */
export function calcClassStats(cls: ClassData): ClassStats {
  const students = cls.students;
  const total = students.length;

  if (total === 0) {
    return {
      classNumber: cls.classNumber,
      total: 0,
      maleCount: 0,
      femaleCount: 0,
      maleRatio: 0,
      avgAcademic: 0,
      avgPhysical: 0,
      pianoCount: 0,
      leaderCount: 0,
      specialSupportCount: 0,
      absenceTendencyCount: 0,
      totalCarePoints: 0,
      categoryBreakdown: {},
      formerClasses: {},
    };
  }

  const maleCount = students.filter(s => s.gender === 'male').length;
  const femaleCount = total - maleCount;
  const maleRatio = maleCount / total;
  const avgAcademic = students.reduce((a, s) => a + (s.normalizedAcademic ?? 50), 0) / total;
  const avgPhysical = students.reduce((a, s) => a + (s.normalizedPhysical ?? 50), 0) / total;
  const pianoCount = students.filter(s => s.canPlayPiano).length;
  const leaderCount = students.filter(s => s.isLeader).length;
  const specialSupportCount = students.filter(s => s.hasSpecialSupport).length;
  const absenceTendencyCount = students.filter(s => s.hasTendencyAbsence).length;
  const totalCarePoints = students.reduce((a, s) => a + (s.totalCarePoints ?? 0), 0);

  // カテゴリ別配慮内訳
  const categories: CareCategory[] = ['learning', 'behavior', 'relationship', 'family', 'health'];
  const categoryBreakdown: ClassStats['categoryBreakdown'] = {};
  for (const cat of categories) {
    let count = 0;
    let severe = 0;
    for (const s of students) {
      const level = s.careCategories?.[cat];
      if (level) {
        count++;
        if (level >= 3) severe++;
      }
    }
    if (count > 0) {
      categoryBreakdown[cat] = { count, severe };
    }
  }

  // 旧クラス出身者の分布
  const formerClasses: { [classNum: number]: number } = {};
  for (const s of students) {
    formerClasses[s.currentClass] = (formerClasses[s.currentClass] ?? 0) + 1;
  }

  return {
    classNumber: cls.classNumber,
    total,
    maleCount,
    femaleCount,
    maleRatio,
    avgAcademic: Math.round(avgAcademic * 10) / 10,
    avgPhysical: Math.round(avgPhysical * 10) / 10,
    pianoCount,
    leaderCount,
    specialSupportCount,
    absenceTendencyCount,
    totalCarePoints,
    categoryBreakdown,
    formerClasses,
  };
}

/** 全クラスの統計の標準偏差を計算する（バランス評価用） */
export function calcBalanceScore(statsArray: ClassStats[]): {
  genderStdDev: number;
  academicStdDev: number;
  physicalStdDev: number;
  careStdDev: number;
} {
  if (statsArray.length === 0) return { genderStdDev: 0, academicStdDev: 0, physicalStdDev: 0, careStdDev: 0 };

  const stdDev = (values: number[]) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  return {
    genderStdDev: stdDev(statsArray.map(s => s.maleRatio)),
    academicStdDev: stdDev(statsArray.map(s => s.avgAcademic)),
    physicalStdDev: stdDev(statsArray.map(s => s.avgPhysical)),
    careStdDev: stdDev(statsArray.map(s => s.totalCarePoints)),
  };
}

/** スコアを 0〜100 に正規化して表示用に変換する */
export function formatScore(score: number): string {
  return score.toFixed(1);
}

/** パーセンテージフォーマット */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
