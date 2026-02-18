import React, { useState } from 'react';
import { ClassData } from '../../types/student';
import { CLASS_COLORS } from '../../data/presets';
import StudentCard from './StudentCard';

interface Props {
  classData: ClassData;
  draggingStudentId: string | null;
  onDragStart: (e: React.DragEvent, studentId: string, fromClass: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, toClass: number) => void;
}

const ClassColumn: React.FC<Props> = ({ classData, draggingStudentId, onDragStart, onDragEnd, onDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const classColor = CLASS_COLORS[(classData.classNumber - 1) % CLASS_COLORS.length];
  const maleCount = classData.students.filter(s => s.gender === 'male').length;
  const femaleCount = classData.students.length - maleCount;

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { setIsDragOver(false); onDrop(e, classData.classNumber); }}
      className={`flex flex-col min-h-64 rounded-xl border-2 transition-all
        ${isDragOver
          ? 'border-blue-400 bg-blue-50 shadow-lg'
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
