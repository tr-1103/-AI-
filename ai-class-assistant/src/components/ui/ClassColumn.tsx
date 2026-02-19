import React, { useState } from 'react';
import { ClassData, PairConstraint } from '../../types/student';
import { CLASS_COLORS } from '../../data/presets';
import StudentCard from './StudentCard';

interface Props {
  classData: ClassData;
  draggingStudentId: string | null;
  onDragStart: (e: React.DragEvent, studentId: string, fromClass: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, toClass: number) => void;
  hasPianoWarning?: boolean;
  violations?: PairConstraint[];
  allStudents?: { id: string; name: string }[];
}

const ClassColumn: React.FC<Props> = ({
  classData,
  draggingStudentId,
  onDragStart,
  onDragEnd,
  onDrop,
  hasPianoWarning = false,
  violations = [],
  allStudents = [],
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const classColor = CLASS_COLORS[(classData.classNumber - 1) % CLASS_COLORS.length];
  const maleCount = classData.students.filter(s => s.gender === 'male').length;
  const femaleCount = classData.students.length - maleCount;

  const pianoCount = classData.students.filter(s => s.canPlayPiano).length;

  // 自クラスに関係する違反
  const classStudentIds = new Set(classData.students.map(s => s.id));
  const classViolations = violations.filter(
    c => classStudentIds.has(c.studentA) || classStudentIds.has(c.studentB)
  );

  const getName = (id: string) =>
    allStudents.find(s => s.id === id)?.name ?? id;

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { setIsDragOver(false); onDrop(e, classData.classNumber); }}
      className={`flex flex-col min-h-64 rounded-xl border-2 transition-all
        ${isDragOver
          ? 'border-blue-400 bg-blue-50 shadow-lg'
          : hasPianoWarning || classViolations.length > 0
          ? 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-gray-50'
        }`}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-xl text-white"
        style={{ backgroundColor: classColor }}
      >
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base">{classData.classNumber}組</span>
        </div>
        <div className="flex items-center gap-2 text-sm opacity-90">
          <span>♂{maleCount}</span>
          <span>♀{femaleCount}</span>
          <span className="font-bold">{classData.students.length}名</span>
        </div>
      </div>

      {/* エラーバナー */}
      {(hasPianoWarning || classViolations.length > 0) && (
        <div className="px-2 pt-2 flex flex-col gap-1">
          {hasPianoWarning && (
            <div className="flex items-center gap-1.5 bg-red-100 border border-red-300 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="font-bold text-red-600">🎹 ピアノ</span>
              <span className="text-red-600">{pianoCount}名 — ピアノ奏者がいません</span>
            </div>
          )}
          {classViolations.map(c => {
            const nameA = getName(c.studentA);
            const nameB = getName(c.studentB);
            const inSameClass =
              classStudentIds.has(c.studentA) && classStudentIds.has(c.studentB);
            return (
              <div
                key={c.id}
                className="flex items-center gap-1.5 bg-red-100 border border-red-300 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <span className={`font-bold px-1 py-0.5 rounded text-xs ${c.type === 'ng' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                  {c.type === 'ng' ? 'NG' : 'OK'}
                </span>
                <span className="text-red-700">
                  {nameA} ↔ {nameB}
                  {c.type === 'ng' && inSameClass ? '（同クラス禁止）' : '（別クラス指定）'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ドロップヒント */}
      {isDragOver && (
        <div className="flex items-center justify-center py-3 text-blue-400 text-sm border-b-2 border-dashed border-blue-200">
          ここにドロップ
        </div>
      )}

      {/* 生徒カード一覧 */}
      <div className="flex flex-col gap-1.5 p-2 flex-1 overflow-y-auto">
        {classData.students.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            classColor={classColor}
            isDragging={draggingStudentId === student.id}
            onDragStart={(e, id) => onDragStart(e, id, classData.classNumber)}
            onDragEnd={onDragEnd}
            compact
          />
        ))}
        {classData.students.length === 0 && !isDragOver && (
          <div className="flex-1 flex items-center justify-center text-gray-300 text-sm py-8">
            生徒がいません
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassColumn;
