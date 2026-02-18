import React from 'react';
import { Student } from '../../types/student';
import { CARE_COLORS, CARE_CATEGORY_LABELS } from '../../data/presets';
import { CareCategory } from '../../types/student';

interface Props {
  student: Student;
  classColor?: string;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, studentId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  compact?: boolean;
}

const StudentCard: React.FC<Props> = ({
  student,
  classColor = '#2563eb',
  isDragging = false,
  onDragStart,
  onDragEnd,
  compact = false,
}) => {
  const careCategories = Object.entries(student.careCategories ?? {}) as [CareCategory, number][];
  const totalPoints = student.totalCarePoints ?? 0;

  if (compact) {
    return (
      <div
        draggable
        onDragStart={e => onDragStart?.(e, student.id)}
        onDragEnd={onDragEnd}
        className={`flex items-center gap-1.5 px-2 py-1 bg-white border rounded-lg cursor-grab text-xs select-none transition-all
          ${isDragging ? 'opacity-40 border-dashed' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: student.gender === 'male' ? '#3b82f6' : '#ec4899' }}
        />
        <span className="font-medium text-gray-800 truncate">{student.name}</span>
        {student.canPlayPiano && <span className="text-purple-500 text-xs" title="ピアノ">♪</span>}
        {student.isLeader && <span className="text-yellow-500 text-xs" title="リーダー">★</span>}
        {totalPoints > 0 && (
          <span className="text-red-500 text-xs font-bold" title={`配慮${totalPoints}pt`}>!</span>
        )}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={e => onDragStart?.(e, student.id)}
      onDragEnd={onDragEnd}
      className={`bg-white border rounded-lg p-2.5 cursor-grab select-none transition-all
        ${isDragging ? 'opacity-40 shadow-none border-dashed' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: student.gender === 'male' ? '#3b82f6' : '#ec4899' }}
        />
        <span className="font-medium text-gray-900 text-sm flex-1 truncate">{student.name}</span>
        <span className="text-gray-400 text-xs">{student.currentClass}組</span>
      </div>

      {/* スコアバー */}
      <div className="grid grid-cols-2 gap-1 mb-1.5">
        <div>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-gray-400 text-xs">学力</span>
            <span className="text-gray-600 text-xs">{(student.normalizedAcademic ?? 50).toFixed(0)}</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${student.normalizedAcademic ?? 50}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-gray-400 text-xs">運動</span>
            <span className="text-gray-600 text-xs">{(student.normalizedPhysical ?? 50).toFixed(0)}</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: `${student.normalizedPhysical ?? 50}%` }} />
          </div>
        </div>
      </div>

      {/* フラグ・配慮 */}
      <div className="flex flex-wrap gap-1">
        {student.canPlayPiano && (
          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-xs font-medium">♪ピアノ</span>
        )}
        {student.isLeader && (
          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded text-xs font-medium">★リーダー</span>
        )}
        {student.hasSpecialSupport && (
          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-xs font-medium">特支</span>
        )}
        {student.hasTendencyAbsence && (
          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs font-medium">不登校</span>
        )}
        {careCategories.map(([cat, level]) => (
          <span
            key={cat}
            className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: CARE_COLORS[cat] }}
            title={`${CARE_CATEGORY_LABELS[cat]} Lv.${level}`}
          >
            {CARE_CATEGORY_LABELS[cat].slice(0, 2)} Lv{level}
          </span>
        ))}
      </div>
    </div>
  );
};

export default StudentCard;
