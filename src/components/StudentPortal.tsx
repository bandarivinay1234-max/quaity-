import React, { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Lock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  LogOut,
  Play,
  Check,
  Zap,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { Student, DayQuiz, SYLLABUS, getCourseForDay, getTopicTitleForDay, Submission } from "../types.js";
import AiInterviewRoom from "./AiInterviewRoom.js";
import { ASSESSMENT_PRESETS, SubjectAssessment } from "../assessmentsData.js";
import StudentAssessmentsView from "./StudentAssessmentsView.js";

interface StudentPortalProps {
  student: Student;
  onLogout: () => void;
}

export default function StudentPortal({ student, onLogout }: StudentPortalProps) {
  // Test loading parameters
  const [unlockedDays, setUnlockedDays] = useState<number[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"curriculum" | "assessments" | "interview">("curriculum");

  // Assessment States
  const [assessments, setAssessments] = useState<any[]>([]); // student's assessment scores
  const [overrides, setOverrides] = useState<any[]>([]); // student's overrides
  const [activeAssessmentSlug, setActiveAssessmentSlug] = useState<string | null>(null);
  const [assessmentStep, setAssessmentStep] = useState<"intro" | "mcq" | "coding" | "result">("intro");
  const [assessmentMCQAnswers, setAssessmentMCQAnswers] = useState<Record<number, number>>({});
  const [assessmentCodingAnswers, setAssessmentCodingAnswers] = useState<Record<number, string>>({});
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const [assessmentSubmitLoading, setAssessmentSubmitLoading] = useState<boolean>(false);
  const [currentAssessmentMCQIndex, setCurrentAssessmentMCQIndex] = useState<number>(0);

  // Active quiz state
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [quizData, setQuizData] = useState<DayQuiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Active test state managers
  const [currentMCQIndex, setCurrentMCQIndex] = useState<number>(0);
  const [selectedMCQAnswers, setSelectedMCQAnswers] = useState<Record<number, number>>({});
  const [codingAnswers, setCodingAnswers] = useState<Record<number, string>>({});
  const [isTestSubmitted, setIsTestSubmitted] = useState<boolean>(false);
  const [reviewSubmission, setReviewSubmission] = useState<Submission | null>(null);

  // Expanded explanations state for review
  const [showReviewExplanations, setShowReviewExplanations] = useState(false);

  // Stat computations
  const [totalPresentDays, setTotalPresentDays] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    fetchStudentContext();
  }, [student.id]);

  const fetchStudentContext = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        // Load locked settings for student's batch
        const batchLock = data.locks?.[student.batch] || {
          unlockedDays: [1, 2]
        };
        setUnlockedDays(batchLock.unlockedDays || []);

        // Filter submissions for this specific student id
        const studentSubmissions = (data.submissions || []).filter(
          (sub: any) => sub.studentId === student.id
        );
        setSubmissions(studentSubmissions);

        // Filter student assessment scores
        const studentAssessments = (data.assessments || []).filter(
          (asm: any) => asm.studentId === student.id
        );
        setAssessments(studentAssessments);

        // Filter student overrides
        const studentOverrides = (data.overrides || []).filter(
          (o: any) => o.studentId === student.id
        );
        setOverrides(studentOverrides);

        setTotalPresentDays(studentSubmissions.length);
        if (studentSubmissions.length > 0) {
          const sum = studentSubmissions.reduce((acc: number, cur: any) => acc + (cur.score || 0), 0);
          setAverageScore(Number((sum / studentSubmissions.length).toFixed(1)));
        } else {
          setAverageScore(0);
        }
      }
    } catch (e) {
      console.error("Failed to load student board profile:", e);
    } finally {
      setLoading(false);
    }
  };

  // Launch test for a specific Day
  const handleStartTest = async (dayNum: number) => {
    setLoadingQuiz(true);
    setCurrentMCQIndex(0);
    setSelectedMCQAnswers({});
    setCodingAnswers({});
    setIsTestSubmitted(false);
    setReviewSubmission(null);

    try {
      const res = await fetch(`/api/quiz/${dayNum}`);
      if (res.ok) {
        const quiz = await res.json();
        setQuizData(quiz);
        setActiveDay(dayNum);

        // Pre-populate coding starter templates
        const starters: Record<number, string> = {};
        quiz.coding.forEach((codeQ: any, index: number) => {
          starters[index] = codeQ.starterCode || "def solution_fn():\n    # Write python code below\n    pass";
        });
        setCodingAnswers(starters);
      }
    } catch (e) {
      alert("Error generating the daily training exam questions");
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Handle choice selection for MCQ
  const handleSelectMCQ = (questionIdx: number, optionIdx: number) => {
    setSelectedMCQAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }));
  };

  // Handle coding text typing
  const handleCodingType = (index: number, code: string) => {
    setCodingAnswers((prev) => ({
      ...prev,
      [index]: code,
    }));
  };

  // Check if coding solution fits simple keyword metrics for UI assistance
  const verifyCodingProgress = (index: number) => {
    if (!quizData) return [];
    const keywords = quizData.coding[index]?.expectedKeywords || [];
    const clientCode = codingAnswers[index] || "";

    return keywords.map((k) => ({
      keyword: k,
      matched: clientCode.includes(k),
    }));
  };

  // Perform Final Submission
  const handleSubmitTest = async () => {
    if (!quizData || !activeDay) return;

    // Check if all MCQs answered
    if (Object.keys(selectedMCQAnswers).length < 8) {
      if (!window.confirm("You have unanswered MCQs. Are you sure you want to submit?")) return;
    }

    // Determine MCQ Correct points (max 8)
    let mcqPoints = 0;
    quizData.mcqs.forEach((mcq, idx) => {
      if (selectedMCQAnswers[idx] === mcq.correctOption) {
        mcqPoints++;
      }
    });

    // We count matching coding snippets (each can be evaluated of presence of any keywords as standard self check)
    // The total test score can be just mcqPoints (out of 8) or out of 10. Let's make it mcqPoints + 2 for submitting coding.
    // Total max = 10 (8 matching multiple choices + 2 coding validations)
    const submittedCount = Object.keys(codingAnswers).length;
    const finalScore = mcqPoints + submittedCount;

    const payload = {
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      batch: student.batch,
      dayNumber: activeDay,
      courseSlug: quizData.courseSlug,
      score: finalScore,
      mcqScores: mcqPoints,
      codingSubmissions: quizData.coding.map((q, idx) => ({
        questionText: q.questionText,
        submittedCode: codingAnswers[idx] || ""
      }))
    };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setIsTestSubmitted(true);
        setReviewSubmission(data.submission);
        setShowReviewExplanations(true);
        // Refresh indices
        await fetchStudentContext();
      }
    } catch (e) {
      alert("Failed to deliver submission safely");
    }
  };

  const getDayStatus = (dayNum: number) => {
    const matchedSub = submissions.find((sub) => sub.dayNumber === dayNum);
    const isUnlocked = unlockedDays.includes(dayNum);

    if (matchedSub) {
      return { status: "completed" as const, score: matchedSub.score };
    }
    if (isUnlocked) {
      return { status: "unlocked" as const };
    }
    return { status: "locked" as const };
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* Dashboard Top bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-6 sticky top-0 z-20 print:hidden shrink-0 shadow-sm animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-lg font-display select-none">Σ</div>
          <div>
            <h1 className="text-sm font-extrabold leading-none font-display">
              DataScience Pro <span className="font-normal text-slate-400">| Student</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-1">
              Welcome, <span className="font-semibold text-slate-300">{student.name}</span> &bull; {student.batch}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline bg-slate-800 text-slate-300 border border-slate-700 text-xs px-3 py-1 rounded font-mono font-bold">
            UID: {student.rollNumber}
          </span>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium cursor-pointer transition"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Student Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
        {/* STUDENT INFO DASHBOARD & ROADMAP PATH */}
        {!activeDay && (
          <div className="mb-8 space-y-6 animate-fade-in">
            {/* PROFILE META CARD */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-950 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2.5 bg-indigo-500/20 text-indigo-300 rounded-full font-bold text-xs font-mono uppercase tracking-wide">
                    Master Student Profile Dashboard
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[10px] text-emerald-300 font-semibold font-mono">AUTHORIZED SECURE SESSION</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white font-display">
                  {student.name}
                </h2>
                <p className="text-xs text-slate-300 font-sans max-w-xl">
                  You are registered inside the academic master database. Your Phone Number has been linked securely to lock your credentials and protect your ongoing exam records.
                </p>
              </div>

              {/* GRID INFORMATION FIELDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto text-xs font-sans shrink-0">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Assigned Batch</span>
                  <span className="font-extrabold text-indigo-300 text-sm truncate block">{student.batch}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Student Roll ID</span>
                  <span className="font-bold text-white font-mono text-sm block">{student.rollNumber}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Linked Phone</span>
                  <span className="font-bold text-emerald-300 font-mono text-sm block">
                    {student.phoneNumber || "Free Roll Verification"}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">E-mail Address</span>
                  <span className="font-semibold text-indigo-200 text-xs truncate block">{student.email || "No Email Provided"}</span>
                </div>
              </div>
            </div>

            {/* INTERACTIVE WORKSPACE TABS */}
            <div className="flex gap-4 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("curriculum")}
                className={`pb-3 text-xs uppercase tracking-wider font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === "curriculum"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-650"
                }`}
              >
                <Calendar className="w-4 h-4 animate-pulse-slow" />
                Curriculum Days Matrix
              </button>
              <button
                onClick={() => setActiveTab("assessments")}
                className={`pb-3 text-xs uppercase tracking-wider font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === "assessments"
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-650"
                }`}
              >
                <Award className="w-4 h-4 text-emerald-605" />
                Subject Assessments
              </button>
              <button
                onClick={() => setActiveTab("interview")}
                className={`pb-3 text-xs uppercase tracking-wider font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === "interview"
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-650"
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-600 fill-indigo-100" />
                AI Technical Mock Recruiter (Gemini 3.5)
              </button>
            </div>

            {/* INTERACTIVE ONBOARDING PATH GUIDE */}
            {activeTab === "curriculum" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm font-sans uppercase tracking-wide">
                      Your Complete Student Portal Learning Path
                    </h4>
                    <p className="text-[10px] text-slate-400">Follow the path from registration to daily review sessions.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs relative">
                  {/* Step 1 */}
                  <div className="relative p-4 bg-slate-50/60 rounded-xl border border-slate-150">
                    <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-800 font-mono rounded-full font-bold px-2 py-0.5 text-[9px]">
                      Step A
                    </div>
                    <h5 className="font-bold text-slate-900 mb-1">New Batch Enrollment</h5>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      Instructors create separate batches (e.g. {student.batch}) and onboard student records using custom Roll IDs.
                    </p>
                    <div className="mt-3 text-[10px] font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 p-1.5 rounded w-fit">
                      <Check className="w-3.5 h-3.5" /> Enrolled in {student.batch}
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative p-4 bg-slate-50/60 rounded-xl border border-slate-150">
                    <div className="absolute top-3 right-3 bg-indigo-100 text-indigo-800 font-mono rounded-full font-bold px-2 py-0.5 text-[9px]">
                      Step B
                    </div>
                    <h5 className="font-bold text-slate-900 mb-1">Phone Match Verification</h5>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      For login, enter the matching Batch, Roll Number, and Phone Number. Prevents unauthorized students from opening exams.
                    </p>
                    <div className="mt-3 text-[10px] font-semibold text-indigo-600 flex items-center gap-1 bg-indigo-50 p-1.5 rounded w-fit">
                      <Check className="w-3.5 h-3.5" /> Identity Linked Match
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative p-4 bg-slate-50/60 rounded-xl border border-slate-150">
                    <div className="absolute top-3 right-3 bg-indigo-100 text-indigo-800 font-mono rounded-full font-bold px-2 py-0.5 text-[9px]">
                      Step C
                    </div>
                    <h5 className="font-bold text-slate-900 mb-1">Write Daily Exams</h5>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      Unlock daily lessons in sequential phases (Day 1 - 200). Write 8 MCQs and submit core descriptive Python codes.
                    </p>
                    <div className="mt-3 text-[10px] text-amber-600 font-bold bg-amber-50 rounded p-1.5 w-fit">
                      ☆ Overrides Applied Instantly
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative p-4 bg-amber-50/30 rounded-xl border border-amber-200">
                    <div className="absolute top-3 right-3 bg-amber-100 text-amber-800 font-mono rounded-full font-bold px-2 py-0.5 text-[9px]">
                      Step D
                    </div>
                    <h5 className="font-bold text-slate-900 mb-1">Review Correct Solutions</h5>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      Once submitted, correct MCQ choices, text explanations, and ideal model solution codes show up automatically below!
                    </p>
                    <div className="mt-3 text-[10px] text-indigo-700 font-bold bg-indigo-50 rounded p-1.5 w-fit">
                      ✔ Auto Explanation Key
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistics Board */}
        {!activeDay && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <CheckCircle2 className="w-6 h-6 animate-pulse-slow" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Streak Attendance</div>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {totalPresentDays} <span className="text-xs font-normal text-slate-400">/ 200 Days</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Tests attended and validated</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Average Daily Grade</div>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {averageScore} <span className="text-xs font-normal text-slate-400">/ 10 pts</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Based on MCQs + code submits</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Active Stage Topic</div>
                {unlockedDays.length > 0 ? (
                  <>
                    <div className="text-md font-bold text-slate-900 leading-tight">
                      {getCourseForDay(Math.max(...unlockedDays)).name}
                    </div>
                    <span className="text-[9px] font-mono text-indigo-600 font-medium">
                      Curriculum Max unlocked: Day #{Math.max(...unlockedDays)}
                    </span>
                  </>
                ) : (
                  <div className="text-sm text-slate-500">All Days currently locked</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. STATE: ACTIVATED DAILY TEST IN PROGRESS */}
        {activeDay && quizData ? (
          <div className="bg-white rounded-xl shadow-md border border-slate-250 p-6 space-y-6">
            {/* Exam Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-slate-100 gap-3">
              <div>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded inline-block mb-1">
                  Day {activeDay} Training Exam
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Topic: {quizData.topicTitle}
                </h3>
                <p className="text-xs text-slate-400">Subject Field: {getCourseForDay(activeDay).name}</p>
              </div>

              {!isTestSubmitted && (
                <button
                  onClick={() => {
                    if (window.confirm("Abandon current test session? Responses won't be saved.")) {
                      setActiveDay(null);
                      setQuizData(null);
                    }
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-4 rounded font-medium text-xs transition self-start sm:self-auto"
                >
                  Exit Session
                </button>
              )}
            </div>

            {/* MAIN TEST INTERFACES */}
            {!isTestSubmitted ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: MCQs Column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        MULTIPLE CHOICE EXAMS: {currentMCQIndex + 1} OF 8
                      </span>

                      {/* Pagination beads */}
                      <div className="flex gap-1">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentMCQIndex(i)}
                            className={`w-5.5 h-5.5 rounded-full text-[10px] font-bold transition flex items-center justify-center ${
                              currentMCQIndex === i
                                ? "bg-indigo-600 text-white"
                                : selectedMCQAnswers[i] !== undefined
                                ? "bg-indigo-150 text-indigo-700"
                                : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question panel */}
                    <div className="space-y-4">
                      <p className="font-bold text-slate-900 text-base leading-relaxed">
                        {quizData.mcqs[currentMCQIndex]?.questionText}
                      </p>

                      <div className="grid grid-cols-1 gap-2.5 pt-2">
                        {quizData.mcqs[currentMCQIndex]?.options.map((option, oIdx) => {
                          const isSelected = selectedMCQAnswers[currentMCQIndex] === oIdx;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectMCQ(currentMCQIndex, oIdx)}
                              className={`w-full text-left p-3.5 rounded-lg border text-sm transition font-medium flex items-center justify-between ${
                                isSelected
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                              }`}
                            >
                              <span>{option}</span>
                              <span
                                className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-xs ${
                                  isSelected ? "border-white" : "border-slate-300"
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nav controls */}
                    <div className="flex justify-between pt-6 mt-6 border-t border-slate-200">
                      <button
                        onClick={() => setCurrentMCQIndex((i) => Math.max(0, i - 1))}
                        disabled={currentMCQIndex === 0}
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-1.5 px-3.5 rounded text-xs font-semibold disabled:text-slate-300 transition"
                      >
                        Previous
                      </button>

                      <button
                        onClick={() => {
                          if (currentMCQIndex < 7) {
                            setCurrentMCQIndex((i) => i + 1);
                          }
                        }}
                        disabled={currentMCQIndex === 7}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-4 rounded text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-300 transition"
                      >
                        Save & Next
                      </button>
                    </div>
                  </div>

                  {/* Submission actions */}
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-indigo-700 text-center sm:text-left">
                      <p className="font-semibold">Review and Submit Exam</p>
                      <p className="text-[10px] text-indigo-500">Ensure Both multiple choice and written Python scripts are filled</p>
                    </div>
                    <button
                      onClick={handleSubmitTest}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-bold text-sm transition flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Submit Course Test
                    </button>
                  </div>
                </div>

                {/* Right side: Coding Tasks */}
                <div className="space-y-6">
                  <h4 className="font-bold text-slate-900 text-sm tracking-wider uppercase flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    2 Python Coding Questions
                  </h4>

                  {quizData.coding.map((codeQ, index) => {
                    const progressMetrics = verifyCodingProgress(index);
                    const completedKeywordsCount = progressMetrics.filter((m) => m.matched).length;

                    return (
                      <div key={index} className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 space-y-3">
                        <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-lg text-xs">
                          <span className="font-bold text-indigo-400">CHALLENGE {index + 1} OF 2</span>
                          <span className="font-mono text-slate-400">Score weight: +1pt</span>
                        </div>

                        <p className="text-xs text-slate-350 bg-slate-950 p-2.5 rounded border border-slate-800 leading-relaxed font-mono">
                          {codeQ.questionText}
                        </p>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400 font-mono">CODE WORKSPACE:</label>
                          <textarea
                            rows={8}
                            value={codingAnswers[index] || ""}
                            onChange={(e) => handleCodingType(index, e.target.value)}
                            className="w-full bg-slate-950 text-emerald-400 border border-slate-800 rounded font-mono p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs leading-relaxed"
                          />
                        </div>

                        {/* Keyword guides checking in real time */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>EXPECTED SYNTAX:</span>
                            <span>{completedKeywordsCount} / {codeQ.expectedKeywords.length} MATCHED</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {progressMetrics.map((m) => (
                              <span
                                key={m.keyword}
                                className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold transition ${
                                  m.matched
                                    ? "bg-emerald-900/40 text-emerald-400 border border-emerald-850"
                                    : "bg-slate-850 text-slate-400 border border-slate-800"
                                }`}
                              >
                                {m.keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* SUBMITTED SPLASH SCREEN */
              <div className="text-center py-12 max-w-2xl mx-auto space-y-6">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Training Test Submitted Successfully!</h3>
                  <p className="text-sm text-slate-500">
                    Your attendance is registered. Your computed points have been finalized.
                  </p>
                </div>

                {reviewSubmission && (
                  <div className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3.5">
                    <p className="font-mono text-xs text-slate-400">SUBMISSION ID: {reviewSubmission.id}</p>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-3.5 rounded-lg shadow-sm border border-indigo-100">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Your Grade</span>
                        <span className="text-2xl font-black text-indigo-600 font-mono">
                          {reviewSubmission.score} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                        </span>
                      </div>
                      <div className="bg-white p-3.5 rounded-lg shadow-sm border border-indigo-100">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider">MCQ Points</span>
                        <span className="text-2xl font-black text-slate-800 font-mono">
                          {reviewSubmission.mcqScores} <span className="text-xs text-slate-400 font-normal">/ 8</span>
                        </span>
                      </div>
                      <div className="bg-white p-3.5 rounded-lg shadow-sm border border-indigo-100">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Status Code</span>
                        <span className="text-sm font-bold text-emerald-600 block mt-1">PRESENT</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Explanations Accordion list */}
                {quizData.mcqs && (
                  <div className="border border-slate-250 rounded-xl bg-white overflow-hidden text-left">
                    <button
                      onClick={() => setShowReviewExplanations(!showReviewExplanations)}
                      className="w-full py-4 px-6 font-bold text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 flex justify-between items-center transition"
                    >
                      <span>Review MCQ Questions & Correct Explanations</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-500 transition-transform ${
                          showReviewExplanations ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showReviewExplanations && (
                      <div className="p-6 divide-y divide-slate-150 space-y-6">
                        {/* Section A: MCQ Answers */}
                        <div className="space-y-6">
                          <h4 className="font-bold text-slate-800 text-sm border-b pb-2">SECTION A: MULTIPLE CHOICE CORRECT RESPONSES</h4>
                          {quizData.mcqs.map((mcq, idx) => {
                            const userSelected = selectedMCQAnswers[idx];
                            const isCorrect = userSelected === mcq.correctOption;

                            return (
                              <div key={idx} className="pt-4 first:pt-0 space-y-2">
                                <p className="font-bold text-slate-900 text-sm">
                                  {idx + 1}. {mcq.questionText}
                                </p>

                                <div className="text-xs space-y-1">
                                  <div className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded flex items-center justify-between font-medium">
                                    <span>Correct Answer: {mcq.options[mcq.correctOption]}</span>
                                    <span className="font-mono text-[10px]">CORRECT</span>
                                  </div>

                                  {userSelected !== undefined && !isCorrect && (
                                    <div className="text-red-700 bg-red-50 px-3 py-1.5 rounded flex items-center justify-between font-medium">
                                      <span>Your Selection: {mcq.options[userSelected]}</span>
                                      <span className="font-mono text-[10px]">INCORRECT</span>
                                    </div>
                                  )}
                                </div>

                                <p className="text-xs text-slate-500 leading-relaxed pl-2 border-l-2 border-slate-300">
                                  <span className="font-semibold text-slate-700">Explainer:</span> {mcq.explanation}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Section B: Coding Solutions */}
                        {quizData.coding && quizData.coding.length > 0 && (
                          <div className="pt-6 space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm border-b pb-2">SECTION B: CODING EXAM SOLUTIONS</h4>
                            {quizData.coding.map((codingQ, cIdx) => {
                              const userCode = codingAnswers[cIdx] || "";
                              return (
                                <div key={cIdx} className="space-y-3 pt-4">
                                  <p className="font-bold text-slate-900 text-sm">
                                    Task {cIdx + 1}. {codingQ.questionText}
                                  </p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-550 block uppercase">Your Submitted Code:</span>
                                      <pre className="bg-slate-900 text-indigo-300 font-mono text-xs p-3.5 rounded-lg overflow-x-auto min-h-[100px]">
                                        {userCode.trim() || "# No code entered"}
                                      </pre>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-emerald-600 block uppercase">Ideal Model Solution Code:</span>
                                      <pre className="bg-slate-950 text-emerald-400 font-mono text-xs p-3.5 rounded-lg overflow-x-auto min-h-[100px]">
                                        {codingQ.solutionDescription.trim() || "# No ideal code schema provided"}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setActiveDay(null);
                      setQuizData(null);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-2 px-6 rounded-lg transition"
                  >
                    Back to Curriculum Dayboard
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "assessments" ? (
          <StudentAssessmentsView
            student={student}
            submissions={submissions}
            assessments={assessments}
            overrides={overrides}
            onProgressSubmit={() => fetchStudentContext()}
          />
        ) : activeTab === "interview" ? (
          <AiInterviewRoom
            student={student}
            submissions={submissions}
            assessments={assessments}
            overrides={overrides}
            onRefreshContext={() => fetchStudentContext()}
          />
        ) : (
          /* 2. STATE: LIST OF ALL 200 DAYS */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-indigo-50 pb-2 mb-2 flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-indigo-600" />
                200 Days Curriculum Track Matrix
              </h3>
              <p className="text-sm text-slate-500">
                Days are unlocked day-after-day by teacher Vinay. Complete the respective 10 training questions inside active stages to maintain your academic streaks.
              </p>
            </div>

            {/* Render chapters list with day grids */}
            <div className="space-y-6">
              {SYLLABUS.map((chapter) => {
                const totalDaysInCurriculum = chapter.endDay - chapter.startDay + 1;

                // Gather days under this chapter
                const chapterDays = Array.from(
                  { length: totalDaysInCurriculum },
                  (_, i) => chapter.startDay + i
                );

                return (
                  <div key={chapter.slug} className="bg-white rounded-xl shadow-sm border border-slate-205 p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          {chapter.name}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                          {chapter.description}
                        </p>
                      </div>

                      <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 rounded px-2.5 py-1.5 self-start sm:self-auto shrink-0">
                        Day {chapter.startDay} - {chapter.endDay}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {chapterDays.map((dayNum) => {
                        const cell = getDayStatus(dayNum);

                        if (cell.status === "completed") {
                          return (
                            <button
                              key={dayNum}
                              onClick={() => handleStartTest(dayNum)}
                              className="border rounded-xl p-3 bg-indigo-50 border-indigo-200 hover:bg-indigo-100/75 transition text-left relative"
                              title="Reviewed / Taken"
                            >
                              <div className="flex justify-between items-center text-[10px] mb-2">
                                <span className="font-bold text-indigo-700 font-mono">D{dayNum}</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                              </div>
                              <span className="block text-xs font-black text-indigo-900 font-mono leading-none">
                                {cell.score} <span className="text-[9px] text-indigo-500 font-normal">/10 pts</span>
                              </span>
                            </button>
                          );
                        }

                        if (cell.status === "unlocked") {
                          return (
                            <button
                              key={dayNum}
                              onClick={() => handleStartTest(dayNum)}
                              className="border rounded-xl p-3 bg-white border-indigo-300 shadow-sm hover:border-indigo-500 hover:shadow-md transition text-left group relative"
                            >
                              <div className="flex justify-between items-center text-[10px] mb-2">
                                <span className="font-bold text-slate-800 font-mono">D{dayNum}</span>
                                <Play className="w-3 h-3 text-indigo-600 fill-indigo-600 group-hover:scale-110 transition-transform" />
                              </div>
                              <span className="block text-[10px] text-slate-400 font-semibold group-hover:text-indigo-600 transition-colors uppercase font-mono">
                                START TEST
                              </span>
                            </button>
                          );
                        }

                        // Locked State
                        return (
                          <div
                            key={dayNum}
                            className="border border-slate-200 rounded-xl p-3 bg-slate-100 text-slate-400 cursor-not-allowed text-left relative"
                            title="Locked by classroom instructor"
                          >
                            <div className="flex justify-between items-center text-[10px] mb-2">
                              <span className="font-mono font-bold text-slate-400">D{dayNum}</span>
                              <Lock className="w-3 h-3 text-slate-350" />
                            </div>
                            <span className="block text-[10px] text-slate-400 font-mono uppercase">
                              LOCKED
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
