// ============================================================
// 遺伝的アルゴリズム — クラス編成最適化エンジン
// ============================================================

import { Student, ClassData, AssignmentPlan, OptimizationConfig } from '../types/student';
import { scoreAssignment, getViolatedConstraints } from './scorer';
import { calcClassStats } from '../utils/stats';

type Chromosome = number[]; // 各生徒がどのクラスに属するか（インデックス）

/** 染色体からClassData配列を生成する */
function chromosomeToClasses(
  chromosome: Chromosome,
  students: Student[],
  numClasses: number
): ClassData[] {
  const classes: ClassData[] = Array.from({ length: numClasses }, (_, i) => ({
    classNumber: i + 1,
    students: [],
  }));
  for (let i = 0; i < students.length; i++) {
    const classIdx = chromosome[i];
    classes[classIdx].students.push(students[i]);
  }
  return classes;
}

/** ランダムな染色体を生成（男女比を考慮したバランス初期化） */
function createRandomChromosome(students: Student[], numClasses: number): Chromosome {
  const males = students.map((s, i) => ({ s, i })).filter(x => x.s.gender === 'male');
  const females = students.map((s, i) => ({ s, i })).filter(x => x.s.gender === 'female');

  const chromosome = new Array(students.length).fill(0);

  // 男子を均等に分配
  const shuffledMales = [...males].sort(() => Math.random() - 0.5);
  shuffledMales.forEach((m, idx) => {
    chromosome[m.i] = idx % numClasses;
  });

  // 女子を均等に分配
  const shuffledFemales = [...females].sort(() => Math.random() - 0.5);
  shuffledFemales.forEach((f, idx) => {
    chromosome[f.i] = idx % numClasses;
  });

  return chromosome;
}

/** 交叉（一様交叉） */
function crossover(parent1: Chromosome, parent2: Chromosome): Chromosome {
  const child = new Array(parent1.length);
  for (let i = 0; i < parent1.length; i++) {
    child[i] = Math.random() < 0.5 ? parent1[i] : parent2[i];
  }
  return child;
}

/** 突然変異（2名のランダム入れ替え） */
function mutate(chromosome: Chromosome, numClasses: number): Chromosome {
  const mutated = [...chromosome];
  const idx1 = Math.floor(Math.random() * mutated.length);
  let idx2 = Math.floor(Math.random() * mutated.length);
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * mutated.length);
  }
  const temp = mutated[idx1];
  mutated[idx1] = mutated[idx2];
  mutated[idx2] = temp;
  return mutated;
}

/**
 * Max設定時：クラス総人数を均等化（誤差1人以内）
 * 過剰クラスから不足クラスへ生徒を移動する
 */
function repairClassSizes(chromosome: Chromosome, students: Student[], numClasses: number): Chromosome {
  const repaired = [...chromosome];
  const idealMin = Math.floor(students.length / numClasses);
  const idealMax = Math.ceil(students.length / numClasses);

  // 各クラスの生徒インデックス一覧を構築
  const classIdx: number[][] = Array.from({ length: numClasses }, () => []);
  for (let i = 0; i < repaired.length; i++) classIdx[repaired[i]].push(i);

  // 過剰クラス → 不足クラスへ移動（最大200回試行）
  for (let iter = 0; iter < 200; iter++) {
    let moved = false;
    for (let from = 0; from < numClasses; from++) {
      while (classIdx[from].length > idealMax) {
        const to = classIdx.findIndex((c, i) => i !== from && c.length < idealMin);
        if (to === -1) break;
        const si = classIdx[from].pop()!;
        classIdx[to].push(si);
        repaired[si] = to;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return repaired;
}

/**
 * Max設定時：男女数を均等化（誤差1人以内）
 * クラス総人数を変えずに男女をスワップする
 */
function repairGenderBalance(chromosome: Chromosome, students: Student[], numClasses: number): Chromosome {
  const repaired = [...chromosome];
  const maleTotal = students.filter(s => s.gender === 'male').length;
  const femaleTotal = students.length - maleTotal;
  const idealMaleMin = Math.floor(maleTotal / numClasses);
  const idealMaleMax = Math.ceil(maleTotal / numClasses);
  const idealFemaleMin = Math.floor(femaleTotal / numClasses);
  const idealFemaleMax = Math.ceil(femaleTotal / numClasses);

  // 各クラスの男女インデックス一覧を構築
  const classMales: number[][] = Array.from({ length: numClasses }, () => []);
  const classFemales: number[][] = Array.from({ length: numClasses }, () => []);
  for (let i = 0; i < repaired.length; i++) {
    if (students[i].gender === 'male') classMales[repaired[i]].push(i);
    else classFemales[repaired[i]].push(i);
  }

  // 男子過剰クラス ↔ 男子不足クラスで男女をスワップ（総人数維持）
  for (let iter = 0; iter < 300; iter++) {
    let swapped = false;
    for (let from = 0; from < numClasses; from++) {
      if (classMales[from].length > idealMaleMax && classFemales[from].length < idealFemaleMax) {
        // fromは男子多・女子少 → 男子不足のクラスを探す
        const to = classMales.findIndex((m, i) => i !== from && m.length < idealMaleMin && classFemales[i].length > idealFemaleMin);
        if (to === -1) continue;
        // fromの男子1人 → to へ、toの女子1人 → from へ（スワップ）
        const maleIdx = classMales[from].pop()!;
        const femaleIdx = classFemales[to].pop()!;
        repaired[maleIdx] = to;
        repaired[femaleIdx] = from;
        classMales[to].push(maleIdx);
        classFemales[from].push(femaleIdx);
        swapped = true;
      }
    }
    if (!swapped) break;
  }

  // 女子過剰クラス ↔ 女子不足クラスで男女をスワップ（念のため逆方向も処理）
  for (let iter = 0; iter < 300; iter++) {
    let swapped = false;
    for (let from = 0; from < numClasses; from++) {
      if (classFemales[from].length > idealFemaleMax && classMales[from].length < idealMaleMax) {
        const to = classFemales.findIndex((f, i) => i !== from && f.length < idealFemaleMin && classMales[i].length > idealMaleMin);
        if (to === -1) continue;
        const femaleIdx = classFemales[from].pop()!;
        const maleIdx = classMales[to].pop()!;
        repaired[femaleIdx] = to;
        repaired[maleIdx] = from;
        classFemales[to].push(femaleIdx);
        classMales[from].push(maleIdx);
        swapped = true;
      }
    }
    if (!swapped) break;
  }

  return repaired;
}

/**
 * 遺伝的アルゴリズムでクラス編成を最適化する
 * @param students 正規化済み生徒リスト
 * @param config 最適化設定
 * @param onProgress 進捗コールバック (0〜1)
 * @returns 上位N案のAssignmentPlan配列
 */
export async function optimizeClassAssignment(
  students: Student[],
  config: OptimizationConfig,
  onProgress?: (progress: number) => void
): Promise<AssignmentPlan[]> {
  const {
    numClasses,
    weights,
    constraints,
    populationSize,
    generations,
    eliteCount,
    numPlans,
  } = config;

  // 初期集団の生成
  let population: Chromosome[] = Array.from({ length: populationSize }, () =>
    createRandomChromosome(students, numClasses)
  );

  // スコア計算
  const evalFitness = (chrom: Chromosome): number => {
    const classes = chromosomeToClasses(chrom, students, numClasses);
    return scoreAssignment(classes, students, weights, constraints);
  };

  let scores = population.map(evalFitness);

  // トーナメント選択関数（ループ外で定義してno-loop-funcを回避）
  const makeTournamentPick = (pop: Chromosome[], sc: number[]) => () => {
    const tournSize = 5;
    let best = Math.floor(Math.random() * pop.length);
    for (let t = 1; t < tournSize; t++) {
      const challenger = Math.floor(Math.random() * pop.length);
      if (sc[challenger] > sc[best]) best = challenger;
    }
    return pop[best];
  };

  // 上位N個体を保存するためのリスト（多様性確保）
  const elitePlans: { chromosome: Chromosome; score: number }[] = [];

  for (let gen = 0; gen < generations; gen++) {
    // 進捗コールバック（非同期スケジューリングで UI がブロックしないよう）
    if (gen % 10 === 0) {
      onProgress?.(gen / generations);
      // UIスレッドに制御を返す
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // エリート選択
    const ranked = scores
      .map((score, idx) => ({ score, idx }))
      .sort((a, b) => b.score - a.score);

    // 上位個体をエリートプールに追加
    for (let k = 0; k < Math.min(3, eliteCount); k++) {
      const elite = ranked[k];
      elitePlans.push({ chromosome: population[elite.idx], score: elite.score });
    }

    const elites = ranked.slice(0, eliteCount).map(r => population[r.idx]);

    // 次世代生成
    const nextPop: Chromosome[] = [...elites];

    const pickParent = makeTournamentPick(population, scores);
    while (nextPop.length < populationSize) {
      const parent1 = pickParent();
      const parent2 = pickParent();
      let child = crossover(parent1, parent2);

      // 突然変異（確率的）
      if (Math.random() < (config.mutationRate ?? 0.05) * 10) {
        child = mutate(child, numClasses);
      }

      nextPop.push(child);
    }

    population = nextPop.slice(0, populationSize);
    scores = population.map(evalFitness);
  }

  onProgress?.(1);

  // エリートプールから多様性のある上位N案を抽出
  // スコア降順でソート
  const uniquePlans = elitePlans
    .sort((a, b) => b.score - a.score)
    .slice(0, numPlans * 10); // 候補を多めに持つ

  // 多様性チェック：各案が十分に異なる編成かを確認
  const selectedPlans: { chromosome: Chromosome; score: number }[] = [];
  for (const plan of uniquePlans) {
    if (selectedPlans.length >= numPlans) break;
    if (selectedPlans.length === 0) {
      selectedPlans.push(plan);
      continue;
    }
    // 既選択案との差分チェック（少なくとも10%の生徒が違うクラスであること）
    const isDiverse = selectedPlans.every(selected => {
      let diffCount = 0;
      for (let i = 0; i < plan.chromosome.length; i++) {
        if (plan.chromosome[i] !== selected.chromosome[i]) diffCount++;
      }
      return diffCount / plan.chromosome.length > 0.1;
    });
    if (isDiverse) {
      selectedPlans.push(plan);
    }
  }

  // 不足分を補完
  const finalPop = population
    .map((c, i) => ({ chromosome: c, score: scores[i] }))
    .sort((a, b) => b.score - a.score);

  for (const plan of finalPop) {
    if (selectedPlans.length >= numPlans) break;
    selectedPlans.push(plan);
  }

  // AssignmentPlanに変換
  const now = new Date();
  return selectedPlans.slice(0, numPlans).map((p, planIdx) => {
    // Max設定時：GA後に人数・男女数をハード制約で強制均等化
    let chromosome = p.chromosome;
    if (weights.classSizeBalance >= 15) {
      chromosome = repairClassSizes(chromosome, students, numClasses);
    }
    if (weights.genderBalance >= 15) {
      chromosome = repairGenderBalance(chromosome, students, numClasses);
    }
    const classes = chromosomeToClasses(chromosome, students, numClasses);
    const stats = classes.map(cls => calcClassStats(cls));
    const violated = getViolatedConstraints(classes, constraints);
    return {
      id: `plan_${planIdx + 1}`,
      score: p.score,
      classes,
      stats,
      violatedConstraints: violated,
      generatedAt: now,
    };
  });
}
