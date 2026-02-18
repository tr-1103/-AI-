// ============================================================
// サンプルデータ生成（3校種対応）
// ============================================================

import { Student, SchoolType, CareCategoryData } from '../types/student';

/** 疑似乱数生成器（seed付き） */
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    return (this.seed >>> 0) / 0xffffffff;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  bool(prob: number = 0.5): boolean {
    return this.next() < prob;
  }
}

const LAST_NAMES = [
  '田中', '鈴木', '佐藤', '高橋', '渡辺', '伊藤', '山本', '中村',
  '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上',
  '木村', '林', '斎藤', '清水', '山崎', '阿部', '森', '池田',
  '橋本', '山下', '石川', '中島', '前田', '藤原',
];

const FIRST_NAMES_MALE = [
  '蓮', '陽翔', '湊', '蒼', '陸', '樹', '悠斗', '大翔', '翔', '一輝',
  '颯太', '優斗', '健太', '拓海', '海斗', '遥人', '航', '竜也', '和也', '直樹',
];

const FIRST_NAMES_FEMALE = [
  '葵', '陽菜', '凛', '結衣', '桜', '美咲', '愛', '心春', '七海', '詩',
  '杏', '柚希', 'さくら', '彩花', '優奈', '花音', '莉子', '麻衣', '明日香', '千夏',
];

function generateId(index: number): string {
  return `S${String(index + 1).padStart(4, '0')}`;
}

/** 小学校サンプルデータ生成 */
function generateElementarySamples(rng: SeededRandom, count: number): Student[] {
  const students: Student[] = [];
  for (let i = 0; i < count; i++) {
    const gender = rng.bool(0.5) ? 'male' : 'female';
    const lastName = rng.pick(LAST_NAMES);
    const firstName = gender === 'male' ? rng.pick(FIRST_NAMES_MALE) : rng.pick(FIRST_NAMES_FEMALE);
    const currentClass = rng.nextInt(1, 4);

    // 配慮カテゴリ（15%の確率で何らかの配慮が必要）
    let careCategories: CareCategoryData | undefined;
    let careFlag = false;
    if (rng.bool(0.15)) {
      careFlag = true;
      careCategories = {};
      const categories = ['learning', 'behavior', 'relationship', 'family', 'health'] as const;
      const numCategories = rng.nextInt(1, 2);
      for (let c = 0; c < numCategories; c++) {
        const cat = rng.pick(categories);
        const level = rng.bool(0.5) ? 1 : rng.bool(0.7) ? 2 : 3;
        careCategories[cat] = level as 1 | 2 | 3;
      }
    }

    students.push({
      id: generateId(i),
      name: `${lastName}${firstName}`,
      gender,
      currentClass,
      // 学力：3段階（◎○△）
      academicRaw: rng.pick(['◎', '○', '△']),
      academicSubjects: {
        '国語': rng.nextInt(1, 3),
        '算数': rng.nextInt(1, 3),
        '理科': rng.nextInt(1, 3),
        '社会': rng.nextInt(1, 3),
      },
      // 運動：フラグ
      physicalRaw: rng.bool(0.3) ? '○' : undefined,
      canPlayPiano: rng.bool(0.15),
      isLeader: rng.bool(0.12),
      hasSpecialSupport: rng.bool(0.05),
      hasTendencyAbsence: rng.bool(0.05),
      careFlag,
      careCategories,
      commutingGroup: `${rng.nextInt(1, 8)}班`,
    });
  }
  return students;
}

/** 中学校サンプルデータ生成 */
function generateMiddleSamples(rng: SeededRandom, count: number): Student[] {
  const students: Student[] = [];
  for (let i = 0; i < count; i++) {
    const gender = rng.bool(0.5) ? 'male' : 'female';
    const lastName = rng.pick(LAST_NAMES);
    const firstName = gender === 'male' ? rng.pick(FIRST_NAMES_MALE) : rng.pick(FIRST_NAMES_FEMALE);
    const currentClass = rng.nextInt(1, 5);

    let careCategories: CareCategoryData | undefined;
    let careFlag = false;
    if (rng.bool(0.12)) {
      careFlag = true;
      careCategories = {};
      const categories = ['learning', 'behavior', 'relationship', 'family', 'health'] as const;
      const cat = rng.pick(categories);
      const level = rng.bool(0.5) ? 1 : rng.bool(0.7) ? 2 : 3;
      careCategories[cat] = level as 1 | 2 | 3;
    }

    students.push({
      id: generateId(i),
      name: `${lastName}${firstName}`,
      gender,
      currentClass,
      // 学力：5段階
      academicRaw: rng.nextInt(1, 5),
      academicSubjects: {
        '国語': rng.nextInt(1, 5),
        '数学': rng.nextInt(1, 5),
        '英語': rng.nextInt(1, 5),
        '理科': rng.nextInt(1, 5),
        '社会': rng.nextInt(1, 5),
      },
      // 運動：5段階
      physicalRaw: rng.nextInt(1, 5),
      canPlayPiano: rng.bool(0.08),
      isLeader: rng.bool(0.10),
      hasSpecialSupport: rng.bool(0.04),
      hasTendencyAbsence: rng.bool(0.06),
      careFlag,
      careCategories,
    });
  }
  return students;
}

/** 高校サンプルデータ生成 */
function generateHighSamples(rng: SeededRandom, count: number): Student[] {
  const students: Student[] = [];
  const courses = ['普通科', '理数科', '英語科'];
  const subjects = ['音楽', '美術', '書道', '体育', '情報'];

  for (let i = 0; i < count; i++) {
    const gender = rng.bool(0.5) ? 'male' : 'female';
    const lastName = rng.pick(LAST_NAMES);
    const firstName = gender === 'male' ? rng.pick(FIRST_NAMES_MALE) : rng.pick(FIRST_NAMES_FEMALE);
    const currentClass = rng.nextInt(1, 6);

    let careCategories: CareCategoryData | undefined;
    let careFlag = false;
    if (rng.bool(0.10)) {
      careFlag = true;
      careCategories = {};
      const categories = ['learning', 'behavior', 'relationship', 'family', 'health'] as const;
      const cat = rng.pick(categories);
      const level = rng.bool(0.5) ? 1 : rng.bool(0.7) ? 2 : 3;
      careCategories[cat] = level as 1 | 2 | 3;
    }

    // 偏差値（35〜70の範囲）
    const deviation = Math.min(70, Math.max(35, Math.round(50 + (rng.next() - 0.5) * 30)));

    students.push({
      id: generateId(i),
      name: `${lastName}${firstName}`,
      gender,
      currentClass,
      academicRaw: deviation,
      physicalRaw: rng.pick(['A', 'B', 'C', 'D', 'E']),
      canPlayPiano: rng.bool(0.06),
      isLeader: rng.bool(0.08),
      hasSpecialSupport: rng.bool(0.03),
      hasTendencyAbsence: rng.bool(0.04),
      careFlag,
      careCategories,
      course: rng.pick(courses),
      selectedSubject: rng.pick(subjects),
    });
  }
  return students;
}

/**
 * 指定された校種のサンプルデータを生成する
 * @param schoolType 校種
 * @param count 生徒数（デフォルト: 108）
 * @param seed 乱数シード（デフォルト: 42）
 */
export function generateSampleStudents(
  schoolType: SchoolType,
  count: number = 108,
  seed: number = 42
): Student[] {
  const rng = new SeededRandom(seed);
  switch (schoolType) {
    case 'elementary':
      return generateElementarySamples(rng, count);
    case 'middle':
      return generateMiddleSamples(rng, count);
    case 'high':
      return generateHighSamples(rng, count);
    default:
      return generateMiddleSamples(rng, count);
  }
}
