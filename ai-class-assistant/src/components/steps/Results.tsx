import React, { useState, useCallback, useEffect } from 'react';
import { AssignmentPlan, ClassData, Student, PairConstraint } from '../../types/student';
import { calcClassStats } from '../../utils/stats';
import { exportToExcel } from '../../utils/excelReader';
import StatsCard from '../ui/StatsCard';
import ClassColumn from '../ui/ClassColumn';

interface Props {
  plans: AssignmentPlan[];
  constraints: PairConstraint[];
  allStudents: Student[];
  onBack: () => void;
}

/** ペア制約の違反を計算する */
function calcViolations(classes: ClassData[], constraints: PairConstraint[]): PairConstraint[] {
  return constraints.filter(c => {
    const classOfA = classes.find(cls => cls.students.some(s => s.id === c.studentA))?.classNumber;
    const classOfB = classes.find(cls => cls.students.some(s => s.id === c.studentB))?.classNumber;
    if (classOfA === undefined || classOfB === undefined) return false;
    if (c.type === 'ng') {
      return classOfA === classOfB; // 同クラスは違反
    } else {
      return classOfA !== classOfB; // 別クラスは違反
    }
  });
}

/** ピアノ奏者が0人のクラス番号セットを返す */
function calcPianoWarnings(classes: ClassData[]): Set<number> {
  const warnings = new Set<number>();
  classes.forEach(cls => {
    const pianoCount = cls.students.filter(s => s.canPlayPiano).length;
    if (pianoCount === 0 && cls.students.length > 0) {
      warnings.add(cls.classNumber);
    }
  });
  return warnings;
}

const Results: React.FC<Props> = ({ plans, constraints, allStudents, onBack }) => {
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'stats' | 'drag'>('stats');
  const [draggingStudentId, setDraggingStudentId] = useState<string | null>(null);
  const [draggingFromClass, setDraggingFromClass] = useState<number | null>(null);
  const [localPlans, setLocalPlans] = useState<AssignmentPlan[]>(plans);
  // ドラッグ後のリアルタイムエラー状態
  const [pianoWarnings, setPianoWarnings] = useState<Set<number>>(new Set());
  const [dragViolations, setDragViolations] = useState<PairConstraint[]>([]);

  const currentPlan = localPlans[selectedPlanIdx];
  const violated = currentPlan?.violatedConstraints ?? [];

  // 編成案切り替え時にエラーを再計算
  useEffect(() => {
    if (!currentPlan) return;
    setPianoWarnings(calcPianoWarnings(currentPlan.classes));
    setDragViolations(calcViolations(currentPlan.classes, constraints));
  }, [selectedPlanIdx, currentPlan, constraints]);

  const handleDragStart = useCallback((e: React.DragEvent, studentId: string, fromClass: number) => {
    setDraggingStudentId(studentId);
    setDraggingFromClass(fromClass);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', studentId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingStudentId(null);
    setDraggingFromClass(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toClass: number) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('text/plain') || draggingStudentId;
    if (!studentId || draggingFromClass === toClass) return;

    setLocalPlans(prevPlans => {
      const newPlans = [...prevPlans];
      const plan = { ...newPlans[selectedPlanIdx] };
      const newClasses = plan.classes.map(cls => ({ ...cls, students: [...cls.students] }));

      // 生徒を元クラスから除去
      const fromClassObj = newClasses.find(c => c.classNumber === draggingFromClass);
      if (!fromClassObj) return prevPlans;
      const studentIdx = fromClassObj.students.findIndex(s => s.id === studentId);
      if (studentIdx === -1) return prevPlans;
      const [movedStudent] = fromClassObj.students.splice(studentIdx, 1);

      // 生徒を新クラスに追加
      const toClassObj = newClasses.find(c => c.classNumber === toClass);
      if (!toClassObj) return prevPlans;
      toClassObj.students.push(movedStudent);

      // 統計を再計算
      plan.classes = newClasses;
      plan.stats = newClasses.map(cls => calcClassStats(cls));
      newPlans[selectedPlanIdx] = plan;

      // ドラッグ後のエラーをリアルタイムで更新
      const newPianoWarnings = calcPianoWarnings(newClasses);
      const newViolations = calcViolations(newClasses, constraints);
      setPianoWarnings(newPianoWarnings);
      setDragViolations(newViolations);

      return newPlans;
    });
  }, [draggingStudentId, draggingFromClass, selectedPlanIdx, constraints]);

  const handleExport = () => {
    const planName = `クラス編成案${selectedPlanIdx + 1}`;
    exportToExcel(planName, currentPlan.classes);
  };

  if (!currentPlan) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-gray-500">編成案が見つかりませんでした。</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">戻る</button>
      </div>
    );
  }

  // 表示用：ドラッグ編集中は dragViolations を使用、統計ビューは初期の violated を使用
  const displayViolated = viewMode === 'drag' ? dragViolations : violated;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">結果確認</h2>
          <p className="text-gray-500 text-sm">AI最適化により{localPlans.length}案を生成しました。タブで比較し、ドラッグ&ドロップで微調整できます。</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            ← 戻る
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Excelで出力
          </button>
        </div>
      </div>

      {/* 案選択タブ */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {localPlans.map((plan, idx) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlanIdx(idx)}
            className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium
              ${selectedPlanIdx === idx
                ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
          >
            <span>案 {idx + 1}</span>
            <span className={`text-xs font-normal mt-0.5 ${selectedPlanIdx === idx ? 'text-blue-100' : 'text-gray-400'}`}>
              スコア: {plan.score.toFixed(0)}
            </span>
            {plan.violatedConstraints.length > 0 && (
              <span className="mt-0.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                ⚠{plan.violatedConstraints.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 違反警告 */}
      {displayViolated.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-bold text-red-700 text-sm mb-2">⚠ ペア制約の違反 {displayViolated.length}件</p>
          <div className="flex flex-wrap gap-2">
            {displayViolated.map(c => {
              const nameA = allStudents.find(s => s.id === c.studentA)?.name ?? c.studentA;
              const nameB = allStudents.find(s => s.id === c.studentB)?.name ?? c.studentB;
              return (
                <span key={c.id} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">
                  {c.type === 'ng' ? 'NG（同クラス禁止）' : 'OK（同クラス指定）'}: {nameA} ↔ {nameB}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ピアノ警告（ドラッグ編集時） */}
      {viewMode === 'drag' && pianoWarnings.size > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-bold text-red-700 text-sm mb-2">
            🎹 <span className="text-red-600">ピアノ</span> 奏者がいないクラスがあります
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from(pianoWarnings).sort((a, b) => a - b).map(classNum => (
              <span key={classNum} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium">
                {classNum}組：ピアノ 0名
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 表示モード切替 */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setViewMode('stats')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${viewMode === 'stats' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          統計ビュー
        </button>
        <button
          onClick={() => setViewMode('drag')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${viewMode === 'drag' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          ドラッグ&ドロップ編集
        </button>
      </div>

      {/* 統計ビュー */}
      {viewMode === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentPlan.stats.map(stats => (
            <StatsCard key={stats.classNumber} stats={stats} />
          ))}
        </div>
      )}

      {/* ドラッグ&ドロップ編集ビュー */}
      {viewMode === 'drag' && (
        <div>
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
            生徒カードをドラッグして別のクラス列にドロップすると移動できます。
            ピアノ奏者が0人になると<span className="text-red-600 font-bold">赤いエラー</span>が表示されます。
          </div>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.min(currentPlan.classes.length, 4)}, minmax(0, 1fr))` }}
          >
            {currentPlan.classes.map(cls => (
              <ClassColumn
                key={cls.classNumber}
                classData={cls}
                draggingStudentId={draggingStudentId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                hasPianoWarning={pianoWarnings.has(cls.classNumber)}
                violations={dragViolations}
                allStudents={allStudents}
              />
            ))}
          </div>
          {/* リアルタイム統計サマリー */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentPlan.classes.map((cls, idx) => {
              const stats = currentPlan.stats[idx];
              const hasWarning = pianoWarnings.has(cls.classNumber);
              return (
                <div key={cls.classNumber} className={`border rounded-lg px-3 py-2 text-sm ${hasWarning ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                  <p className="font-bold text-gray-700 mb-1">{cls.classNumber}組</p>
                  <p className="text-gray-500 text-xs">
                    {stats?.total ?? 0}名 | 学力{stats?.avgAcademic ?? 0} | 配慮{stats?.totalCarePoints ?? 0}pt
                  </p>
                  {hasWarning && (
                    <p className="text-red-600 text-xs font-bold mt-0.5">🎹 ピアノ 0名</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
