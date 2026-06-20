import React, { useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Lock,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { Student, Submission, SYLLABUS } from "../types.js";
import { ASSESSMENT_PRESETS, SubjectAssessment } from "../assessmentsData.js";

interface StudentAssessmentsViewProps {
  student: Student;
  submissions: Submission[];
  assessments: any[];
  overrides: any[];
  onProgressSubmit: () => void;
}

export default function StudentAssessmentsView({
  student,
  submissions,
  assessments,
  overrides,
  onProgressSubmit
}: StudentAssessmentsViewProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [step, setStep] = useState<"list" | "quiz">("list");

  // In-progress test states
  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
  const [selectedMCQ, setSelectedMCQ] = useState<Record<number, number>>({});
  const [codingAnswers, setCodingAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Results display state
  const [finishedQuizResult, setFinishedQuizResult] = useState<{
    score: number;
    passed: boolean;
    mcqScore: number;
    codingScore: number;
  } | null>(null);

  // Simple checks helper
  const getSubjectCompletionStatus = (slug: string) => {
    // Check how many days the student has submitted in this subject
    const chapter = SYLLABUS.find(s => s.slug === slug);
    if (!chapter) return { completed: false, count: 0 };
    
    const subjectSubmissions = submissions.filter(sub => sub.courseSlug === slug);
    // Student completed topic if they have at least 1 submission for demonstration purposes
    return {
      completed: subjectSubmissions.length > 0,
      count: subjectSubmissions.length
    };
  };

  const getAssessmentRecord = (slug: string) => {
    return assessments.find(asm => asm.courseSlug === slug);
  };

  const getSubjectOverride = (slug: string) => {
    return overrides.find(o => o.courseSlug === slug);
  };

  const startAssessment = (slug: string) => {
    const preset = ASSESSMENT_PRESETS[slug];
    if (!preset) return;

    setActiveSlug(slug);
    setCurrentMCQIndex(0);
    setSelectedMCQ({});
    
    // Set up coding questions with starter templates
    const starters: Record<number, string> = {};
    preset.coding.forEach((q, idx) => {
      starters[idx] = q.starterCode || "def solution():\n    pass";
    });
    setCodingAnswers(starters);
    setFinishedQuizResult(null);
    setErrorMessage(null);
    setStep("quiz");
  };

  const currentPreset = activeSlug ? ASSESSMENT_PRESETS[activeSlug] : null;

  const handleSubmitAssessment = async () => {
    if (!currentPreset || !activeSlug) return;

    // Check completeness
    if (Object.keys(selectedMCQ).length < currentPreset.mcqs.length) {
      if (!window.confirm("You have unanswered multiple-choice questions. Do you want to submit anyway?")) {
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Calculate score
    // 5 MCQs = 50% max (10% each)
    let mcqPoints = 0;
    currentPreset.mcqs.forEach((mcq, idx) => {
      if (selectedMCQ[idx] === mcq.correctOption) {
        mcqPoints += 10;
      }
    });

    // 2 Coding questions = 50% max (25% each)
    let codingPoints = 0;
    currentPreset.coding.forEach((codeQ, idx) => {
      const ans = codingAnswers[idx] || "";
      if (ans.trim().length > 15) {
        // basic keyword verification
        const matchedKeywords = codeQ.expectedKeywords.filter(k => ans.includes(k));
        const matchRatio = matchedKeywords.length / codeQ.expectedKeywords.length;
        if (matchRatio >= 0.75) {
          codingPoints += 25;
        } else if (matchRatio >= 0.25) {
          codingPoints += 15;
        } else {
          codingPoints += 8; // small credit for attempting
        }
      }
    });

    const finalScore = mcqPoints + codingPoints;
    const passed = finalScore >= 60;

    try {
      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          batch: student.batch,
          courseSlug: activeSlug,
          score: finalScore
        })
      });

      if (res.ok) {
        setFinishedQuizResult({
          score: finalScore,
          passed,
          mcqScore: mcqPoints,
          codingScore: codingPoints
        });
        setStep("quiz");
        onProgressSubmit(); // refresh context
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to submit assessment to server.");
      }
    } catch (e) {
      setErrorMessage("Network connection failure during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "quiz" && currentPreset) {
    // Active Assessment running
    const mcqLen = currentPreset.mcqs.length;
    
    if (finishedQuizResult) {
      // Show summary of result
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md max-w-2xl mx-auto space-y-6 animate-fade-in animate-scale-up">
          <div className="text-center space-y-3">
            <div className="inline-flex p-4 rounded-full bg-indigo-50 text-indigo-600 mb-2">
              <Award className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Assessment Submitted Successfully
            </h3>
            <p className="text-sm text-slate-500">
              {currentPreset.courseName} Technical Evaluation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-y border-slate-100 font-mono text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Total Score</span>
              <span className={`text-2xl font-black ${finishedQuizResult.passed ? "text-emerald-600" : "text-amber-600"}`}>
                {finishedQuizResult.score}%
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">MCQ Section</span>
              <span className="text-2xl font-black text-slate-800">
                {finishedQuizResult.mcqScore} / 50
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Descriptive Code</span>
              <span className="text-2xl font-black text-slate-800">
                {finishedQuizResult.codingScore} / 50
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border flex gap-3 items-center text-xs leading-relaxed max-w-xl mx-auto bg-slate-50 border-slate-200">
            {finishedQuizResult.passed ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h5 className="font-bold text-slate-900">ELIGIBILITY UNLOCKED (Passed with {finishedQuizResult.score}%)</h5>
                  <p className="text-slate-500">Congratulations! You have surpassed the minimum required score of 60%. Your account is now fully eligible for the live AI Mock Interview of <strong>{currentPreset.courseName}</strong>.</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h5 className="font-bold text-slate-900">ELIGIBILITY TIMED-OUT (Scored {finishedQuizResult.score}%)</h5>
                  <p className="text-slate-500">You did not reach the minimum threshold of 60% on this attempt. Please review your material under the daily curriculum days and click Retake when ready, or ask instructor Vinay for assistance.</p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                setStep("list");
                setActiveSlug(null);
                setFinishedQuizResult(null);
              }}
              className="bg-slate-950 hover:bg-slate-850 text-white font-bold py-2 px-6 rounded-lg transition text-xs"
            >
              Return to Subject Assessments List
            </button>
          </div>
        </div>
      );
    }

    // Render questions taking phase
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto overflow-hidden animate-fade-in">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white flex justify-between items-center">
          <div>
            <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider block w-fit mb-1">
              SUBJECT COMPREHENSIVE EXAM
            </span>
            <h4 className="text-lg font-black tracking-tight">{currentPreset.courseName} Assessment</h4>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Abandon current assessment? Changes will not be saved.")) {
                setStep("list");
                setActiveSlug(null);
              }
            }}
            className="text-white/70 hover:text-white font-bold text-xs bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded transition"
          >
            Cancel Exam
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* MCQ SECTION (5 questions) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h5 className="text-xs font-black uppercase tracking-wide text-indigo-900 font-mono">
                Part A: Core Concept Multiple Choices (5 Questions &bull; 50%)
              </h5>
              <div className="flex gap-1">
                {currentPreset.mcqs.map((_, mIdx) => (
                  <button
                    key={mIdx}
                    onClick={() => setCurrentMCQIndex(mIdx)}
                    className={`w-6 h-6 rounded-full font-mono text-[10px] font-bold border transition ${
                      currentMCQIndex === mIdx
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : selectedMCQ[mIdx] !== undefined
                        ? "bg-slate-100 border-slate-200 text-slate-800"
                        : "bg-white border-slate-150 text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    {mIdx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Render single MCQ question */}
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 space-y-4">
              <span className="font-bold text-slate-400 text-[10px] uppercase font-mono">Question {currentMCQIndex + 1} of 5</span>
              <p className="font-bold text-slate-950 text-sm leading-relaxed">
                {currentPreset.mcqs[currentMCQIndex].questionText}
              </p>

              <div className="grid grid-cols-1 gap-2.5 text-xs font-sans">
                {currentPreset.mcqs[currentMCQIndex].options.map((opt, oIdx) => {
                  const isSelected = selectedMCQ[currentMCQIndex] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => setSelectedMCQ(prev => ({ ...prev, [currentMCQIndex]: oIdx }))}
                      className={`w-full text-left p-3.5 rounded-lg border transition flex items-center gap-3 font-medium ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-400 text-indigo-950 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-350"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 font-bold text-[9px] ${
                        isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && "✓"}
                      </div>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation within MCQs */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  disabled={currentMCQIndex === 0}
                  onClick={() => setCurrentMCQIndex(prev => prev - 1)}
                  className="px-3 py-1.5 rounded bg-white border text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous MCQ
                </button>

                <button
                  type="button"
                  disabled={currentMCQIndex === mcqLen - 1}
                  onClick={() => setCurrentMCQIndex(prev => prev + 1)}
                  className="px-3 py-1.5 rounded bg-white border text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next MCQ <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* CODING SECTION (2 questions) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h5 className="text-xs font-black uppercase tracking-wide text-indigo-900 font-mono">
              Part B: Advanced Descriptive Coding Tasks (2 Questions &bull; 50%)
            </h5>

            <div className="space-y-6">
              {currentPreset.coding.map((q, idx) => (
                <div key={idx} className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-xs font-sans">
                    <span className="font-bold text-slate-900">Coding challenge #{idx + 1} of 2</span>
                    <span className="font-medium font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                      25 Points
                    </span>
                  </div>

                  <p className="font-bold text-slate-950 text-sm leading-relaxed">
                    {q.questionText}
                  </p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-800 block uppercase font-mono">
                      Write Clean Python Code:
                    </span>
                    <textarea
                      rows={4}
                      className="w-full bg-slate-900 text-indigo-300 font-mono text-xs p-3.5 rounded-lg border-none focus:ring-1 focus:ring-indigo-400 outline-none"
                      value={codingAnswers[idx] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCodingAnswers(prev => ({ ...prev, [idx]: val }));
                      }}
                      placeholder="def solution_fn():..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-4 border-t flex justify-end">
            <button
              onClick={handleSubmitAssessment}
              disabled={isSubmitting}
              className={`font-bold text-sm text-white px-8 py-3 rounded-lg shadow-md transition flex items-center gap-2 ${
                isSubmitting
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-indigo-650 hover:bg-indigo-700 cursor-pointer"
              }`}
            >
              {isSubmitting ? "Evaluating Submissions..." : "Submit Completed Assessment"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Syllabus list with locked/unlocked assessments
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Subject Assessments Board
          </h3>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Students must pass each subject's Comprehensive Assessment with **minimum 60%** to unlock the AI Interview. Complete daily curriculum quizzes to activate the assessment.
          </p>
        </div>
        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs shrink-0 font-medium">
          Passing Threshold: <span className="font-extrabold text-indigo-700">60 / 100 PTS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SYLLABUS.map((course) => {
          const checkStatus = getSubjectCompletionStatus(course.slug);
          const scoreRecord = getAssessmentRecord(course.slug);
          const overrideStatus = getSubjectOverride(course.slug);

          // We check if the course assessment is available in ASSESSMENTS_PRESETS
          const hasPreset = !!ASSESSMENT_PRESETS[course.slug];
          
          // Let's unlock if checkStatus.completed is true (student has at least 1 submission in this course)
          const isUnlocked = checkStatus.completed;

          // Compute final status labels
          let isEligible = false;
          let statusText = "Locked Exam";
          let statusColor = "text-slate-400 border-slate-200 bg-slate-50";

          if (scoreRecord) {
            isEligible = scoreRecord.score >= 60;
            statusText = `Attempted: ${scoreRecord.score}% (${isEligible ? "PASSED" : "FAILED"})`;
            statusColor = isEligible
              ? "text-emerald-700 border-emerald-200 bg-emerald-50"
              : "text-amber-700 border-amber-200 bg-amber-50";
          } else if (isUnlocked) {
            statusText = "Ready to Take Exam";
            statusColor = "text-indigo-700 border-indigo-200 bg-indigo-50 animate-pulse-slow";
          }

          // Override grants direct eligibility
          const hasBypass = overrideStatus?.eligibilityBypass;
          if (hasBypass) {
            isEligible = true;
          }

          return (
            <div
              key={course.slug}
              className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between gap-5 transition-all ${
                isUnlocked ? "border-slate-250 hover:shadow-md" : "border-slate-150 bg-slate-50/55"
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      {course.name} Assessment
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Days {course.startDay} - {course.endDay} &bull; {checkStatus.count} Completed Quizzes
                    </span>
                  </div>

                  <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded border ${statusColor} shrink-0 uppercase`}>
                    {statusText}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-sans">{course.description}</p>

                {/* Eligibility Indicators */}
                <div className="flex flex-wrap gap-2 text-[10px] items-center">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider block mr-1 font-mono">STATUS:</span>
                  
                  {isEligible ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[9px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ELIGIBLE FOR AI INTERVIEW
                    </span>
                  ) : scoreRecord ? (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[9px]">
                      <XCircle className="w-3.5 h-3.5" /> SCORE UNDER 60%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full text-[9px]">
                      <Lock className="w-3 h-3" /> NO SCORE RECORDED
                    </span>
                  )}

                  {hasBypass && (
                    <span className="inline-flex items-center gap-0.5 bg-purple-100 text-purple-800 font-mono font-semibold px-2 py-0.5 rounded-full text-[9px]" title="Instructor bypassed constraints">
                      ★ BYPASS ENABLED
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-transparent shrink-0">
                {isUnlocked ? (
                  <>
                    <button
                      onClick={() => startAssessment(course.slug)}
                      disabled={!hasPreset}
                      className={`text-xs font-bold py-2 px-5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                        scoreRecord
                          ? "bg-white text-indigo-700 border-indigo-250 hover:bg-slate-50"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm"
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current shrink-0" />
                      <span>{scoreRecord ? "Retake Assessment" : "Start Assessment"}</span>
                    </button>
                    {!hasPreset && (
                      <span className="text-[10px] text-amber-600 italic font-medium">Under construction</span>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-sans">
                    <Lock className="w-3.5 h-3.5 text-slate-350" />
                    <span>Locked: Complete daily quizzes inside this chapter to activate.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
