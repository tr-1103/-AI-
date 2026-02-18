import React, { useState, useCallback } from 'react';
import { AssignmentPlan, Student, PairConstraint } from '../../types/student';
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

const Results: React.FC<Props> = ({ plans, constraints, allStudents, onBack }) => {
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'stats' | 'drag'>('stats');
  const [draggingStudentId, setDraggingStudentId] = useState<string | null>(null);
  const [draggingFromClass, setDraggingFromClass] = useState<number | null>(null);
  const [localPlans, setLocalPlans] = useState<AssignmentPlan[]>(plans);

  const currentPlan = localPlans[selectedPlanIdx];
  const violated = currentPlan?.violatedConstraints ?? [];

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
      return newPlans;
    });
  }, [draggingStudentId, draggingFromClass, selectedPlanIdx]);

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
      {violated.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-bold text-red-700 text-sm mb-2">⚠ ペア制約の違反 {violated.length}件</p>
          <div className="flex flex-wrap gap-2">
            {violated.map(c => {
              const nameA = allStudents.find(s => s.id === c.studentA)?.name ?? c.studentA;
              const nameB = allStudents.find(s => s.id === c.studentB)?.name ?? c.studentB;
              return (
                <span key={c.id} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">
                  {c.type === 'ng' ? 'NG' : 'OK'}: {nameA} ↔ {nameB}
                </span>
              );
            })}
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
            統計はリアルタイムで更新されます。
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
              />
            ))}
          </div>
          {/* リアルタイム統計サマリー */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentPlan.classes.map((cls, idx) => {
              const stats = currentPlan.stats[idx];
              return (
                <div key={cls.classNumber} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <p className="font-bold text-gray-700 mb-1">{cls.classNumber}組</p>
                  <p className="text-gray-500 text-xs">
                    {stats?.total ?? 0}名 | 学力{stats?.avgAcademic ?? 0} | 配慮{stats?.totalCarePoints ?? 0}pt
                  </p>
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
