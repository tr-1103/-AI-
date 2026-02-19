import React, { useState, useCallback } from 'react';
import {
  Student, SchoolType, AcademicInputType, PhysicalInputType,
  OptimizationWeights, PairConstraint, AssignmentPlan
} from '../types/student';
import { SCHOOL_PRESETS, DEFAULT_GA_CONFIG } from '../data/presets';
import { generateSampleStudents } from '../utils/sampleData';
import { normalizeStudents } from '../engine/normalizer';
import { optimizeClassAssignment } from '../engine/optimizer';
import Header from './Header';
import SchoolSelect from './steps/SchoolSelect';
import DataReview from './steps/DataReview';
import Conditions from './steps/Conditions';
import Results from './steps/Results';

type Step = 0 | 1 | 2 | 3;

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [schoolType, setSchoolType] = useState<SchoolType | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [academicInputType, setAcademicInputType] = useState<AcademicInputType>('scale_5');
  const [physicalInputType, setPhysicalInputType] = useState<PhysicalInputType>('scale_5');
  const [showUpload, setShowUpload] = useState(false);
  const [plans, setPlans] = useState<AssignmentPlan[]>([]);
  const [constraints, setConstraints] = useState<PairConstraint[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  // 進学時の再編成モード
  const [isTransition, setIsTransition] = useState(false);
  const [sourceSchoolType, setSourceSchoolType] = useState<SchoolType | null>(null);

  // ===== Step 0: 校種選択 =====
  const handleSchoolSelect = useCallback((
    type: SchoolType,
    useSample: boolean,
    options?: { isTransition: boolean; sourceSchoolType?: SchoolType }
  ) => {
    // 進学モードではデータ読み込み形式をソース校種に合わせる
    const srcType = options?.sourceSchoolType ?? type;
    const srcPreset = SCHOOL_PRESETS[srcType];

    setSchoolType(type);  // 最適化対象の校種（進学先）
    setIsTransition(options?.isTransition ?? false);
    setSourceSchoolType(options?.sourceSchoolType ?? null);
    setAcademicInputType(srcPreset.defaultAcademicInput);
    setPhysicalInputType(srcPreset.defaultPhysicalInput);
    setShowUpload(!useSample);

    if (useSample) {
      // サンプルデータはソース校種で生成
      const sampleStudents = generateSampleStudents(srcType);
      const normalized = normalizeStudents(sampleStudents, srcPreset.defaultAcademicInput, srcPreset.defaultPhysicalInput);
      setStudents(normalized);
    } else {
      setStudents([]);
    }

    setCurrentStep(1);
  }, []);

  // ===== Step 1: データ確認 =====
  const handleDataConfirm = useCallback((
    confirmedStudents: Student[],
    academicType: AcademicInputType,
    physicalType: PhysicalInputType
  ) => {
    setStudents(confirmedStudents);
    setAcademicInputType(academicType);
    setPhysicalInputType(physicalType);
    setCurrentStep(2);
  }, []);

  // ===== Step 2: 最適化開始 =====
  const handleOptimizationStart = useCallback(async (
    numClasses: number,
    weights: OptimizationWeights,
    newConstraints: PairConstraint[]
  ) => {
    if (!schoolType) return;
    setConstraints(newConstraints);
    setIsOptimizing(true);
    setOptimizationError(null);
    setOptimizationProgress(0);

    try {
      const config = {
        numClasses,
        schoolType,
        weights,
        constraints: newConstraints,
        ...DEFAULT_GA_CONFIG,
      };

      const generatedPlans = await optimizeClassAssignment(
        students,
        config,
        (progress) => setOptimizationProgress(Math.round(progress * 100))
      );

      setPlans(generatedPlans);
      setCurrentStep(3);
    } catch (err) {
      console.error('Optimization error:', err);
      setOptimizationError('最適化中にエラーが発生しました。再度お試しください。');
    } finally {
      setIsOptimizing(false);
    }
  }, [schoolType, students]);

  const preset = schoolType ? SCHOOL_PRESETS[schoolType] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentStep={currentStep} />

      <main>
        {/* 最適化中のオーバーレイ */}
        {isOptimizing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg className="animate-spin w-16 h-16 text-blue-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI最適化中...</h3>
              <p className="text-gray-500 text-sm mb-4">遺伝的アルゴリズムによりクラス編成を最適化しています</p>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${optimizationProgress}%` }}
                />
              </div>
              <p className="text-blue-600 font-bold">{optimizationProgress}%</p>
            </div>
          </div>
        )}

        {optimizationError && (
          <div className="max-w-2xl mx-auto mt-8 px-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              <p className="font-bold">エラー</p>
              <p className="text-sm mt-1">{optimizationError}</p>
              <button
                onClick={() => setOptimizationError(null)}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                再設定する
              </button>
            </div>
          </div>
        )}

        {/* Step 0: 校種選択 */}
        {currentStep === 0 && (
          <SchoolSelect onSelect={handleSchoolSelect} />
        )}

        {/* Step 1: データ確認 */}
        {currentStep === 1 && schoolType && (
          <DataReview
            students={students}
            schoolType={schoolType}
            academicInputType={academicInputType}
            physicalInputType={physicalInputType}
            onNext={handleDataConfirm}
            onBack={() => setCurrentStep(0)}
            showUpload={showUpload}
          />
        )}

        {/* Step 2: 条件設定 */}
        {currentStep === 2 && schoolType && preset && (
          <Conditions
            students={students}
            schoolType={schoolType}
            defaultWeights={preset.defaultWeights}
            defaultNumClasses={preset.defaultNumClasses}
            isTransition={isTransition}
            sourceSchoolType={sourceSchoolType}
            onStart={handleOptimizationStart}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {/* Step 3: 結果確認 */}
        {currentStep === 3 && plans.length > 0 && (
          <Results
            plans={plans}
            constraints={constraints}
            allStudents={students}
            onBack={() => setCurrentStep(2)}
          />
        )}
      </main>

      {/* フッター */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        AIクラス編成アシスタント v1.0 | 完全オフライン動作 | 文科省情報セキュリティガイドライン準拠
      </footer>
    </div>
  );
};

export default App;
