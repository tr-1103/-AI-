import React, { useState } from 'react';
import { Student, SchoolType, OptimizationWeights, PairConstraint, PairConstraintType, PairConstraintPriority } from '../../types/student';
import { DEFAULT_GA_CONFIG } from '../../data/presets';

interface Props {
  students: Student[];
  schoolType: SchoolType;
  defaultWeights: OptimizationWeights;
  defaultNumClasses: number;
  isTransition?: boolean;
  sourceSchoolType?: SchoolType | null;
  onStart: (numClasses: number, weights: OptimizationWeights, constraints: PairConstraint[]) => void;
  onBack: () => void;
}

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  description?: string;
}

const WeightSlider: React.FC<WeightSliderProps> = ({ label, value, onChange, description }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <span className="text-sm font-bold text-blue-600">{value}</span>
    </div>
    {description && <p className="text-xs text-gray-400">{description}</p>}
    <input
      type="range"
      min={0}
      max={15}
      value={value}
      onChange={e => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
    <div className="flex justify-between text-xs text-gray-400">
      <span>重視しない(0)</span>
      <span>重視する(15)</span>
    </div>
  </div>
);

const SCHOOL_LABELS: { [key in SchoolType]: string } = {
  elementary: '小学校',
  middle: '中学校',
  high: '高校',
};

const Conditions: React.FC<Props> = ({ students, schoolType, defaultWeights, defaultNumClasses, isTransition, sourceSchoolType, onStart, onBack }) => {
  const [numClasses, setNumClasses] = useState(defaultNumClasses);
  const [weights, setWeights] = useState<OptimizationWeights>(defaultWeights);
  const [constraints, setConstraints] = useState<PairConstraint[]>([]);
  const [newPairType, setNewPairType] = useState<PairConstraintType>('ng');
  const [newPairPriority, setNewPairPriority] = useState<PairConstraintPriority>('required');
  const [newPairStudentA, setNewPairStudentA] = useState('');
  const [newPairStudentB, setNewPairStudentB] = useState('');

  const setWeight = (key: keyof OptimizationWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const addConstraint = () => {
    if (!newPairStudentA || !newPairStudentB) return;
    if (newPairStudentA === newPairStudentB) return;

    const constraint: PairConstraint = {
      id: `c_${Date.now()}`,
      type: newPairType,
      studentA: newPairStudentA,
      studentB: newPairStudentB,
      priority: newPairPriority,
    };
    setConstraints(prev => [...prev, constraint]);
    setNewPairStudentA('');
    setNewPairStudentB('');
  };

  const removeConstraint = (id: string) => {
    setConstraints(prev => prev.filter(c => c.id !== id));
  };

  const getStudentName = (id: string) => {
    return students.find(s => s.id === id)?.name ?? id;
  };

  const estimatedPerClass = Math.ceil(students.length / numClasses);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">条件設定</h2>
          <p className="text-gray-500">クラス数や最適化の優先度を設定してください</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          ← 戻る
        </button>
      </div>

      {/* 進学時の再編成バナー */}
      {isTransition && sourceSchoolType && (
        <div className="mb-6 bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3">
          <span className="text-orange-500 text-2xl mt-0.5">🎓</span>
          <div className="flex-1">
            <p className="font-bold text-orange-800 text-sm mb-1">
              進学時の再編成モード：{SCHOOL_LABELS[sourceSchoolType]} → {SCHOOL_LABELS[schoolType]}
            </p>
            <p className="text-orange-700 text-xs leading-relaxed">
              {SCHOOL_LABELS[sourceSchoolType]}のデータをもとに、{SCHOOL_LABELS[schoolType]}の編成に最適化します。
              クラス数のデフォルトは{SCHOOL_LABELS[schoolType]}の標準（{defaultNumClasses}クラス）に設定されています。
              実際の編成数（例：8クラスなど）に変更してから最適化してください。
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左カラム：基本設定 + ペア設定 */}
        <div className="flex flex-col gap-6">
          {/* クラス数設定 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4">クラス数設定</h3>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">新クラス数:</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNumClasses(Math.max(2, numClasses - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 font-bold text-gray-700"
                >−</button>
                <span className="text-2xl font-bold text-blue-600 w-8 text-center">{numClasses}</span>
                <button
                  onClick={() => setNumClasses(Math.min(10, numClasses + 1))}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 font-bold text-gray-700"
                >+</button>
              </div>
              <span className="text-sm text-gray-500">クラス</span>
            </div>
            <div className="mt-3 bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700">
              1クラスあたり約 <span className="font-bold">{estimatedPerClass}名</span>
              （全{students.length}名）
            </div>
          </div>

          {/* NGペア・OKペア設定 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4">ペア制約の設定</h3>
            <p className="text-xs text-gray-500 mb-4">
              同クラスにしたくない（NG）またはしたい（OK）生徒ペアを登録してください。
            </p>

            <div className="flex flex-col gap-3 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">種類</label>
                  <select
                    value={newPairType}
                    onChange={e => setNewPairType(e.target.value as PairConstraintType)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="ng">NGペア（同クラスにしない）</option>
                    <option value="ok">OKペア（同クラスにしたい）</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">優先度</label>
                  <select
                    value={newPairPriority}
                    onChange={e => setNewPairPriority(e.target.value as PairConstraintPriority)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="required">必須</option>
                    <option value="preferred">できれば</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">生徒A</label>
                <select
                  value={newPairStudentA}
                  onChange={e => setNewPairStudentA(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="">-- 生徒を選択 --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}（{s.currentClass}組）</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">生徒B</label>
                <select
                  value={newPairStudentB}
                  onChange={e => setNewPairStudentB(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="">-- 生徒を選択 --</option>
                  {students.filter(s => s.id !== newPairStudentA).map(s => (
                    <option key={s.id} value={s.id}>{s.name}（{s.currentClass}組）</option>
                  ))}
                </select>
              </div>
              <button
                onClick={addConstraint}
                disabled={!newPairStudentA || !newPairStudentB}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                ペアを追加
              </button>
            </div>

            {/* 登録済みペア */}
            {constraints.length > 0 && (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {constraints.map(c => (
                  <div key={c.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm border
                    ${c.type === 'ng' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${c.type === 'ng' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                        {c.type === 'ng' ? 'NG' : 'OK'}
                      </span>
                      <span className="truncate">{getStudentName(c.studentA)}</span>
                      <span className="text-gray-400">↔</span>
                      <span className="truncate">{getStudentName(c.studentB)}</span>
                      <span className={`text-xs px-1 py-0.5 rounded ${c.priority === 'required' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {c.priority === 'required' ? '必須' : 'できれば'}
                      </span>
                    </div>
                    <button onClick={() => removeConstraint(c.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右カラム：最適化重み設定 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4">最適化の優先度</h3>
          <p className="text-xs text-gray-500 mb-6">
            各条件の重要度をスライダーで調整してください。
            値が大きいほど、その条件を優先して最適化します。
          </p>
          <div className="flex flex-col gap-5">
            <WeightSlider
              label="クラス人数の均等化"
              value={weights.classSizeBalance}
              onChange={v => setWeight('classSizeBalance', v)}
              description="各クラスの総人数をできるだけ揃える（進学時に特に有効）"
            />
            <WeightSlider
              label="男女比の均等化"
              value={weights.genderBalance}
              onChange={v => setWeight('genderBalance', v)}
              description="各クラスの男女比を均等にする"
            />
            <WeightSlider
              label="学力の均等化"
              value={weights.academicBalance}
              onChange={v => setWeight('academicBalance', v)}
              description="各クラスの学力平均を揃える"
            />
            <WeightSlider
              label="運動能力の均等化"
              value={weights.physicalBalance}
              onChange={v => setWeight('physicalBalance', v)}
              description="各クラスの運動能力平均を揃える"
            />
            <WeightSlider
              label="ピアノ伴奏の分散"
              value={weights.pianoDistribution}
              onChange={v => setWeight('pianoDistribution', v)}
              description="各クラスにピアノ伴奏できる生徒を配置"
            />
            <WeightSlider
              label="リーダーの分散"
              value={weights.leaderDistribution}
              onChange={v => setWeight('leaderDistribution', v)}
              description="各クラスにリーダー気質の生徒を配置"
            />
            <WeightSlider
              label="配慮ポイントの均等化"
              value={weights.careBalance}
              onChange={v => setWeight('careBalance', v)}
              description="配慮が必要な生徒を各クラスに均等配置"
            />
            <WeightSlider
              label="特別支援の均等化"
              value={weights.specialSupportBalance}
              onChange={v => setWeight('specialSupportBalance', v)}
              description="特別支援が必要な生徒を均等配置"
            />
            <WeightSlider
              label="不登校傾向の分散"
              value={weights.absenceDistribution}
              onChange={v => setWeight('absenceDistribution', v)}
              description="不登校傾向の生徒を分散配置"
            />
            <WeightSlider
              label="旧クラスの分散"
              value={weights.formerClassMix}
              onChange={v => setWeight('formerClassMix', v)}
              description="旧クラスの生徒が偏らないよう配慮"
            />
          </div>
        </div>
      </div>

      {/* AI最適化開始ボタン */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">AI最適化を開始</h3>
            <p className="text-blue-100 text-sm">
              遺伝的アルゴリズムにより上位5案を自動生成します
            </p>
            <div className="flex gap-4 mt-2 text-xs text-blue-200">
              <span>個体数: {DEFAULT_GA_CONFIG.populationSize}</span>
              <span>世代数: {DEFAULT_GA_CONFIG.generations}</span>
              <span>生成案数: {DEFAULT_GA_CONFIG.numPlans}</span>
            </div>
          </div>
          <button
            onClick={() => onStart(numClasses, weights, constraints)}
            className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg text-lg"
          >
            最適化スタート →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Conditions;
