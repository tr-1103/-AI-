// ============================================================
// 型定義 - AIクラス編成アシスタント
// ============================================================

/** 校種 */
export type SchoolType = 'elementary' | 'middle' | 'high';

/** 学力入力形式 */
export type AcademicInputType =
  | 'scale_3'      // 3段階（◎○△）
  | 'scale_5'      // 5段階（1〜5）
  | 'points_100'   // 100点満点
  | 'points_500'   // 5教科合計（500点満点）
  | 'deviation'    // 偏差値
  | 'custom';      // その他（満点値指定）

/** 運動能力入力形式 */
export type PhysicalInputType =
  | 'numeric'   // 数値（体力テスト点数等）
  | 'grade_AE'  // 段階評価（A〜E）
  | 'scale_5'   // 5段階（1〜5）
  | 'flag';     // フラグ（○印のみ）

/** 配慮カテゴリ */
export type CareCategory =
  | 'learning'       // 学習支援
  | 'behavior'       // 生活指導
  | 'relationship'   // 人間関係
  | 'family'         // 家庭環境
  | 'health';        // 健康・心理

/** 配慮負担度レベル (1=軽度, 2=中度, 3=重度) */
export type CareLevel = 1 | 2 | 3;

/** カテゴリ別配慮データ */
export interface CareCategoryData {
  learning?: CareLevel;
  behavior?: CareLevel;
  relationship?: CareLevel;
  family?: CareLevel;
  health?: CareLevel;
}

/** ペア制約の種類 */
export type PairConstraintType = 'ng' | 'ok';

/** ペア制約の優先度 */
export type PairConstraintPriority = 'required' | 'preferred';

/** ペア制約 */
export interface PairConstraint {
  id: string;
  type: PairConstraintType;
  studentA: string; // 生徒ID
  studentB: string; // 生徒ID
  priority: PairConstraintPriority;
  reason?: string;
}

/** 生徒データ */
export interface Student {
  id: string;
  name: string;
  gender: 'male' | 'female';
  currentClass: number;

  // 学力データ（生入力値）
  academicRaw?: number | string;
  academicSubjects?: { [subject: string]: number | string };

  // 運動能力データ（生入力値）
  physicalRaw?: number | string;

  // 特技・役割フラグ
  canPlayPiano?: boolean;
  isLeader?: boolean;
  hasSpecialSupport?: boolean;
  hasTendencyAbsence?: boolean;

  // 配慮データ
  careFlag?: boolean;         // 後方互換：○印のみの場合
  careCategories?: CareCategoryData;

  // その他
  selectedSubject?: string;   // 選択科目（高校）
  course?: string;            // コース/科（高校）
  commutingGroup?: string;    // 通学班/地区（小学校）
  note?: string;

  // 正規化済みスコア（エンジン内部で計算）
  normalizedAcademic?: number;   // 0〜100
  normalizedPhysical?: number;   // 0〜100
  totalCarePoints?: number;       // 配慮合計ポイント
}

/** クラス編成案の1クラスデータ */
export interface ClassData {
  classNumber: number;
  students: Student[];
}

/** クラス統計 */
export interface ClassStats {
  classNumber: number;
  total: number;
  maleCount: number;
  femaleCount: number;
  maleRatio: number;
  avgAcademic: number;
  avgPhysical: number;
  pianoCount: number;
  leaderCount: number;
  specialSupportCount: number;
  absenceTendencyCount: number;
  totalCarePoints: number;
  categoryBreakdown: { [key in CareCategory]?: { count: number; severe: number } };
  formerClasses: { [classNum: number]: number };
}

/** 編成案（1つの解） */
export interface AssignmentPlan {
  id: string;
  score: number;
  classes: ClassData[];
  stats: ClassStats[];
  violatedConstraints: PairConstraint[];
  generatedAt: Date;
}

/** 最適化の重みパラメータ */
export interface OptimizationWeights {
  genderBalance: number;       // 男女比
  academicBalance: number;     // 学力均等
  physicalBalance: number;     // 運動能力均等
  careBalance: number;         // 配慮ポイント均等
  pianoDistribution: number;   // ピアノ伴奏分散
  leaderDistribution: number;  // リーダー分散
  absenceDistribution: number; // 不登校分散
  formerClassMix: number;      // 旧クラス分散
  specialSupportBalance: number; // 特別支援均等
}

/** 最適化設定 */
export interface OptimizationConfig {
  numClasses: number;
  schoolType: SchoolType;
  weights: OptimizationWeights;
  constraints: PairConstraint[];

  // GAパラメータ
  populationSize: number;
  generations: number;
  eliteCount: number;
  mutationRate: number;
  numPlans: number;  // 生成する案数
}

/** 校種別プリセット */
export interface SchoolPreset {
  schoolType: SchoolType;
  label: string;
  description: string;
  defaultAcademicInput: AcademicInputType;
  defaultPhysicalInput: PhysicalInputType;
  defaultNumClasses: number;
  defaultWeights: OptimizationWeights;
  availableColumns: string[];
  sampleSubjects: string[];
}

/** Excel読込設定 */
export interface ExcelImportConfig {
  academicInputType: AcademicInputType;
  academicMaxValue?: number;
  physicalInputType: PhysicalInputType;
  schoolType: SchoolType;
}

/** アプリの全体状態 */
export interface AppState {
  currentStep: 0 | 1 | 2 | 3;
  schoolType: SchoolType | null;
  students: Student[];
  importConfig: ExcelImportConfig | null;
  constraints: PairConstraint[];
  optimizationConfig: OptimizationConfig | null;
  plans: AssignmentPlan[];
  selectedPlanIndex: number;
  isOptimizing: boolean;
  optimizationProgress: number;
}
