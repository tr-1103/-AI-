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
    const classes = chromosomeToClasses(p.chromosome, students, numClasses);
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
