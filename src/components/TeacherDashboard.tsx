import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  Users,
  Search,
  Plus,
  Trash2,
  Printer,
  Send,
  Database,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  Sparkles,
  ChevronRight,
  FileCode,
  AlertCircle,
  RotateCcw,
  Save,
  Upload
} from "lucide-react";
import { Student, Batch, CourseLockState, SYLLABUS, getCourseForDay, getTopicTitleForDay, DayQuiz } from "../types.js";

interface TeacherDashboardProps {
  onLogout: () => void;
}

export default function TeacherDashboard({ onLogout }: TeacherDashboardProps) {
  // Database States
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [locks, setLocks] = useState<Record<string, CourseLockState>>({});
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<Record<number, DayQuiz>>({});

  // Active Management States
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"attendance" | "students" | "locks" | "quizzes" | "interviews">("attendance");
  const [loading, setLoading] = useState(true);

  // Assessments and Overrides State
  const [assessments, setAssessments] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [selectedStudentForAccess, setSelectedStudentForAccess] = useState<Student | null>(null);
  const [accessSubmittingSubject, setAccessSubmittingSubject] = useState<string | null>(null);

  // Filter attendance day
  const [monitorDay, setMonitorDay] = useState<number>(1);

  // New Student Input State
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentRoll, setNewStudentRoll] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");

  // Bulk Import State
  const [bulkText, setBulkText] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState<string | null>(null);

  // New Batch Input State
  const [newBatchName, setNewBatchName] = useState("");
  const [showAddBatch, setShowAddBatch] = useState(false);

  // Custom Quiz Overrider
  const [selectedDayToOverride, setSelectedDayToOverride] = useState<number>(1);
  const [overrideQuizData, setOverrideQuizData] = useState<any>(null);

  // AI Material to Quiz generator state
  const [materialText, setMaterialText] = useState("");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [materialError, setMaterialError] = useState("");
  const [generateSuccess, setGenerateSuccess] = useState(false);

  // Notification Alerts simulation state
  const [alertStatus, setAlertStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchDB();
  }, []);

  const fetchDB = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setBatches(data.batches || []);
        setLocks(data.locks || {});
        setSubmissions(data.submissions || []);
        setQuizzes(data.quizzes || {});
        setAssessments(data.assessments || []);
        setOverrides(data.overrides || []);

        if (data.batches && data.batches.length > 0 && !selectedBatch) {
          setSelectedBatch(data.batches[0]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch applet database:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherOverrideSubmit = async (courseSlug: string, eligibilityBypass: boolean, resetAttempts: boolean) => {
    if (!selectedStudentForAccess) return;
    setAccessSubmittingSubject(courseSlug);
    try {
      const res = await fetch("/api/overrides/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentForAccess.id,
          courseSlug,
          eligibilityBypass,
          resetAttempts
        })
      });

      if (res.ok) {
        // Refresh local dashboard database state
        await fetchDB();
      } else {
        alert("Failed to submit teacher override rules.");
      }
    } catch (e) {
      console.error("Error submitting professor instructions:", e);
    } finally {
      setAccessSubmittingSubject(null);
    }
  };

  const [quizLoading, setQuizLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchQuizToOverride = async (day: number, forceRegen = false) => {
    setQuizLoading(true);
    setSaveSuccess(false);
    try {
      const url = `/api/quiz/${day}${forceRegen ? "?regenerate=true" : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOverrideQuizData(data);
      } else {
        console.error("Failed to fetch quiz details for Day", day);
      }
    } catch (e) {
      console.error("Error fetching quiz data:", e);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleUpdateTopicTitle = (title: string) => {
    setOverrideQuizData(prev => prev ? { ...prev, topicTitle: title } : null);
  };

  const handleUpdateMCQ = (index: number, key: string, value: any) => {
    setOverrideQuizData(prev => {
      if (!prev) return null;
      const updatedMcqs = [...prev.mcqs];
      updatedMcqs[index] = { ...updatedMcqs[index], [key]: value };
      return { ...prev, mcqs: updatedMcqs };
    });
  };

  const handleUpdateMCQOption = (questionIndex: number, optionIndex: number, value: string) => {
    setOverrideQuizData(prev => {
      if (!prev) return null;
      const updatedMcqs = [...prev.mcqs];
      const updatedOptions = [...updatedMcqs[questionIndex].options];
      updatedOptions[optionIndex] = value;
      updatedMcqs[questionIndex] = { ...updatedMcqs[questionIndex], options: updatedOptions };
      return { ...prev, mcqs: updatedMcqs };
    });
  };

  const handleUpdateCoding = (index: number, key: string, value: any) => {
    setOverrideQuizData(prev => {
      if (!prev) return null;
      const updatedCoding = [...prev.coding];
      updatedCoding[index] = { ...updatedCoding[index], [key]: value };
      return { ...prev, coding: updatedCoding };
    });
  };

  const handleSaveQuizOverride = async () => {
    if (!overrideQuizData) return;
    setQuizLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/quiz/${selectedDayToOverride}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideQuizData)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4400);
      } else {
        alert("Failed to save custom questions");
      }
    } catch (e) {
      console.error("Error saving override changes", e);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleGenerateQuizFromMaterial = async () => {
    if (!materialText.trim()) {
      setMaterialError("Please paste some course material or pick a file first.");
      return;
    }
    setIsGeneratingQuiz(true);
    setMaterialError("");
    setGenerateSuccess(false);

    try {
      const res = await fetch("/api/quiz/generate-from-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialText,
          dayNumber: selectedDayToOverride,
          courseSlug: overrideQuizData?.courseSlug || "python",
          topicTitle: overrideQuizData?.topicTitle || `Custom Material - Day ${selectedDayToOverride}`
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.quiz) {
          setOverrideQuizData(result.quiz);
          setGenerateSuccess(true);
          setMaterialText("");
          setTimeout(() => setGenerateSuccess(false), 5000);
        } else {
          setMaterialError("Invalid format returned from Gemini.");
        }
      } else {
        const errData = await res.json();
        setMaterialError(errData.error || "Failed to generate quiz. Check your content material and try again.");
      }
    } catch (e: any) {
      console.error("Quiz generation request helper error:", e);
      setMaterialError("A network or configuration error occurred. Please configure your GEMINI_API_KEY.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  useEffect(() => {
    if (activeTab === "quizzes") {
      fetchQuizToOverride(selectedDayToOverride);
    }
  }, [selectedDayToOverride, activeTab]);

  // Add individual student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentRoll || !selectedBatch) return;

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStudentName,
          rollNumber: newStudentRoll,
          email: newStudentEmail,
          phoneNumber: newStudentPhone,
          batch: selectedBatch
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setNewStudentName("");
        setNewStudentRoll("");
        setNewStudentEmail("");
        setNewStudentPhone("");
        setAlertStatus("Successfully added student " + newStudentName);
        setTimeout(() => setAlertStatus(null), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add student");
      }
    } catch (e) {
      alert("Error adding student record");
    }
  };

  // Bulk import students
  const handleBulkImport = async () => {
    if (!bulkText || !selectedBatch) return;

    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textData: bulkText,
          batch: selectedBatch
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setBulkText("");
        setShowBulkImport(false);
        setBulkImportResult(`Imported: ${data.importedCount} students. Duplicates skipped: ${data.duplicateCount}`);
        fetchDB();
        setTimeout(() => setBulkImportResult(null), 5000);
      } else {
        alert("Fail to perform bulk import batch");
      }
    } catch (err) {
      alert("Bulk import failed to connect");
    }
  };

  // Delete student
  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student record?")) return;

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (e) {
      alert("Failed to delete student");
    }
  };

  // Create batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchName: newBatchName })
      });

      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches);
        setLocks(data.locks);
        setSelectedBatch(newBatchName.trim());
        setNewBatchName("");
        setShowAddBatch(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create batch");
      }
    } catch (e) {
      alert("Error creating selection batch");
    }
  };

  // Toggle dynamic Course lock state
  const handleToggleCourseLock = async (courseSlug: string, isCurrentlyLocked: boolean) => {
    if (!selectedBatch) return;

    const currentLock = locks[selectedBatch] || {
      batchName: selectedBatch,
      unlockedCourses: ["python"],
      unlockedDays: [1, 2],
      courseLockState: {}
    };

    const nextLockState = { ...currentLock.courseLockState, [courseSlug]: !isCurrentlyLocked };

    // Also update unlockedCourses list
    let nextUnlockedCourses = [...(currentLock.unlockedCourses || [])];
    if (isCurrentlyLocked) {
      // Unlocking it
      if (!nextUnlockedCourses.includes(courseSlug)) nextUnlockedCourses.push(courseSlug);
    } else {
      // Locking it
      nextUnlockedCourses = nextUnlockedCourses.filter(c => c !== courseSlug);
    }

    try {
      const res = await fetch("/api/lock-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName: selectedBatch,
          unlockedCourses: nextUnlockedCourses,
          unlockedDays: currentLock.unlockedDays,
          courseLockState: nextLockState
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLocks(data.locks);
      }
    } catch (e) {
      alert("Failed to sync structural lock status to database");
    }
  };

  // Toggle individual Day lock state
  const handleToggleDayLock = async (dayNum: number) => {
    if (!selectedBatch) return;

    const currentLock = locks[selectedBatch] || {
      batchName: selectedBatch,
      unlockedCourses: ["python"],
      unlockedDays: [1, 2],
      courseLockState: {}
    };

    let nextDays = [...(currentLock.unlockedDays || [])];
    if (nextDays.includes(dayNum)) {
      nextDays = nextDays.filter(d => d !== dayNum);
    } else {
      nextDays.push(dayNum);
    }

    try {
      const res = await fetch("/api/lock-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName: selectedBatch,
          unlockedCourses: currentLock.unlockedCourses,
          unlockedDays: nextDays,
          courseLockState: currentLock.courseLockState
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLocks(data.locks);
      }
    } catch (e) {
      alert("Failed to update Day Lock configuration status");
    }
  };

  // Select all days of a course to unlock
  const handleUnlockWholeCourse = async (slug: string, startDay: number, endDay: number) => {
    if (!selectedBatch) return;

    const currentLock = locks[selectedBatch] || {
      batchName: selectedBatch,
      unlockedCourses: [],
      unlockedDays: [],
      courseLockState: {}
    };

    const nextDaysSet = new Set(currentLock.unlockedDays || []);
    for (let d = startDay; d <= endDay; d++) {
      nextDaysSet.add(d);
    }

    const nextLockState = {
      ...currentLock.courseLockState,
      [slug]: false // false means unlocked
    };

    let nextUnlockedCourses = [...(currentLock.unlockedCourses || [])];
    if (!nextUnlockedCourses.includes(slug)) {
      nextUnlockedCourses.push(slug);
    }

    try {
      const res = await fetch("/api/lock-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName: selectedBatch,
          unlockedCourses: nextUnlockedCourses,
          unlockedDays: Array.from(nextDaysSet),
          courseLockState: nextLockState
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLocks(data.locks);
      }
    } catch (e) {
      alert("Error unlocking entire sequence");
    }
  };

  // Clear or lock all days of a course
  const handleLockWholeCourse = async (slug: string, startDay: number, endDay: number) => {
    if (!selectedBatch) return;

    const currentLock = locks[selectedBatch] || {
      batchName: selectedBatch,
      unlockedCourses: [],
      unlockedDays: [],
      courseLockState: {}
    };

    let nextDays = (currentLock.unlockedDays || []).filter(d => d < startDay || d > endDay);

    const nextLockState = {
      ...currentLock.courseLockState,
      [slug]: true // true means locked
    };

    const nextUnlockedCourses = (currentLock.unlockedCourses || []).filter(c => c !== slug);

    try {
      const res = await fetch("/api/lock-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName: selectedBatch,
          unlockedCourses: nextUnlockedCourses,
          unlockedDays: nextDays,
          courseLockState: nextLockState
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLocks(data.locks);
      }
    } catch (e) {
      alert("Error locking series");
    }
  };

  // Filter out students belonging to active batch
  const filteredStudents = students.filter(s => s.batch === selectedBatch);

  // Compute attendance list for monitorDay
  const getAttendanceDataForDay = () => {
    const course = getCourseForDay(monitorDay);
    const daySubmissions = submissions.filter(
      sub => sub.dayNumber === monitorDay && sub.batch === selectedBatch
    );

    return filteredStudents.map(student => {
      const submission = daySubmissions.find(sub => sub.studentId === student.id);
      return {
        student,
        hasSubmitted: !!submission,
        submission,
        status: submission ? "present" as const : "absent" as const
      };
    });
  };

  const attendanceDataList = getAttendanceDataForDay();
  const presentStudents = attendanceDataList.filter(a => a.hasSubmitted);
  const absentStudents = attendanceDataList.filter(a => !a.hasSubmitted);

  // Simulated Alert Broadcast Actions
  const handleTriggerAlert = (studentName: string) => {
    setAlertStatus(`Sms and Email alert sent successfully to ${studentName}! "Dear student, you have not attended today's Day ${monitorDay} exam on ${getCourseForDay(monitorDay).name}. Please attend it immediately."`);
    setTimeout(() => setAlertStatus(null), 5000);
  };

  const handleAlertAllAbsentees = () => {
    if (absentStudents.length === 0) return;
    setAlertStatus(`Broadcasting automated SMS/Email alerts to all ${absentStudents.length} absent students in ${selectedBatch} about Day ${monitorDay} Exam!`);
    setTimeout(() => setAlertStatus(null), 6000);
  };

  // Print function
  const handlePrintAttendanceSheet = () => {
    window.print();
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Header Panel */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-6 sticky top-0 z-10 print:hidden shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-lg font-display select-none">Σ</div>
          <div>
            <h1 className="text-sm font-extrabold leading-none tracking-tight font-display">
              DataScience Pro <span className="font-normal text-slate-400">| Console</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-1">Instructor: Prof. Vinay</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Batch Control dropdown */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1 rounded-md">
            <span className="text-[10px] font-bold font-sans tracking-wide uppercase text-slate-400">BATCH:</span>
            <select
              className="bg-transparent text-xs font-semibold text-white border-none focus:ring-0 cursor-pointer outline-none"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="" disabled className="bg-slate-900">Select Batch</option>
              {batches.map((b) => (
                <option key={b} value={b} className="bg-slate-900">{b}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddBatch(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded transition shadow-sm"
          >
            + New Batch
          </button>

          <button
            onClick={onLogout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded flex items-center gap-1.5 text-xs font-medium transition border border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
        {/* Alerts Banner */}
        {alertStatus && (
          <div className="mb-6 p-4 bg-indigo-950 text-indigo-100 border border-indigo-800 rounded-lg flex items-start gap-3 transition-opacity animate-fade-in print:hidden">
            <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
            <div className="text-sm font-medium leading-relaxed">{alertStatus}</div>
          </div>
        )}

        {/* INTERACTIVE CLASSROOM ONBOARDING PATH */}
        <div className="mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 p-6 print:hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5" />
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-indigo-200 font-sans">
              Dynamic Classroom Setup & Login Path Guide
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 hover:border-slate-700 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full font-mono">
                    STEP 1
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active path Ready
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-100 mb-1">Create a New Batch</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate separate class tracks (e.g. Python Basics, Data Pro). Click "+ New Batch" in the top header to initialize a batch workspace.
                </p>
              </div>
              <button
                onClick={() => setShowAddBatch(true)}
                className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white py-1.5 rounded text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-750"
              >
                <Plus className="w-3.5 h-3.5" /> + Create Batch Now
              </button>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 hover:border-slate-700 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full font-mono">
                    STEP 2
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-100 mb-1">Add or Import Student roster</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Optionally paste CSV listing with <code className="bg-slate-850 text-indigo-300 px-1 py-0.5 rounded">RollNumber, Name, Email, Phone</code>. We auto-link entered Phone Number for secured logins.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("students")}
                className="mt-4 w-full bg-indigo-950 hover:bg-indigo-900 text-indigo-200 hover:text-white py-1.5 rounded text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-indigo-900"
              >
                <Database className="w-3.5 h-3.5" /> Go to Student Database Tab
              </button>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 hover:border-slate-700 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full font-mono">
                    STEP 3
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-100 mb-1">Direct Student Login matching Phone</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct students to log in by selecting their batch and entering their registered Roll Number and Phone Number.
                </p>
              </div>
              <div className="mt-4 p-2 bg-slate-950 rounded text-[10px] font-mono text-indigo-300 border border-slate-850 leading-normal">
                Credentials match: <br />
                - Unique Roll/UID Code <br />
                - Entered Phone No validation
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs bar */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 print:hidden">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "attendance"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Attendance & Tracker
          </button>
          <button
            onClick={() => setActiveTab("locks")}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "locks"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Lock className="w-4 h-4" />
            Unlocking & Course Locks
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "students"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Database className="w-4 h-4" />
            Student Database ({filteredStudents.length})
          </button>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "quizzes"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Syllabus & Day Quizzes
          </button>
          <button
            onClick={() => setActiveTab("interviews")}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "interviews"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            AI Interviews Room Tracker
          </button>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
            <span className="text-slate-500 font-medium">Fetching register database details...</span>
          </div>
        ) : !selectedBatch ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center max-w-md mx-auto my-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">No Batch Created Yet</h3>
            <p className="text-sm text-slate-500 mb-6">Create your first class batch to unlock courses, paste students lists and track daily tests.</p>
            <button
              onClick={() => setShowAddBatch(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition"
            >
              Create Class Batch
            </button>
          </div>
        ) : (
          <>
            {/* TAB 1: ATTENDANCE MONITOR */}
            {activeTab === "attendance" && (
              <div className="space-y-6">
                {/* Control card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-lg font-bold text-slate-900">Live Daily Attendances Board</h3>
                    <p className="text-sm text-slate-500">
                      Day <span className="font-bold text-slate-900 font-mono">#{monitorDay}</span>: <span className="font-semibold text-indigo-600">{getTopicTitleForDay(monitorDay)}</span> ({getCourseForDay(monitorDay).name})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Day Slider Selector */}
                    <div className="flex items-center gap-2 flex-grow md:flex-none">
                      <span className="text-sm font-medium text-slate-600 shrink-0">Select Curriculum Day:</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={monitorDay}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (val >= 1 && val <= 200) setMonitorDay(val);
                        }}
                        className="w-20 bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center text-sm font-bold focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <button
                        onClick={handlePrintAttendanceSheet}
                        className="flex-1 sm:flex-none bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded px-4 py-1.5 text-sm font-medium transition flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print Sheet
                      </button>
                      <button
                        onClick={handleAlertAllAbsentees}
                        disabled={absentStudents.length === 0}
                        className="flex-grow sm:flex-none bg-red-650 hover:bg-red-750 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded px-4 py-1.5 text-sm font-medium transition flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Alert Absentees ({absentStudents.length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Printable Section Wrapper */}
                <div id="attendance-print-area" className="space-y-6">
                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-500">Present Today</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {presentStudents.length} / {filteredStudents.length}
                        </div>
                        <div className="text-xs text-slate-400">
                          {filteredStudents.length > 0
                            ? Math.round((presentStudents.length / filteredStudents.length) * 100)
                            : 0}
                          % active attendance
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
                      <div className="p-3 bg-red-50 text-red-600 rounded-lg animate-pulse-slow">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-500">Absent Today</div>
                        <div className="text-2xl font-bold text-slate-900">{absentStudents.length}</div>
                        <div className="text-xs text-red-500 font-medium">Pending Exam Submissions</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-500">Average MCQ Score</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {presentStudents.length > 0
                            ? (presentStudents.reduce((acc, curr) => acc + (curr.submission?.mcqScores || 0), 0) / presentStudents.length).toFixed(1)
                            : "0.0"}{" "}
                          / 8
                        </div>
                        <div className="text-xs text-slate-400">Excluding coding questions</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-500">Active Stage</div>
                        <div className="text-md font-bold text-slate-900 leading-tight">
                          {getCourseForDay(monitorDay).name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          Days {getCourseForDay(monitorDay).startDay} - {getCourseForDay(monitorDay).endDay}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Log Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900">Attending Student Schedules Log</h4>
                        <p className="text-xs text-slate-500 font-mono">BATCH: {selectedBatch} | DAY: #{monitorDay}</p>
                      </div>
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {presentStudents.length} Present &bull; {absentStudents.length} Absent
                      </span>
                    </div>

                    {attendanceDataList.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        No student registered under this match bucket.
                        <p className="text-xs text-slate-400 mt-1">Visit the "Student Database" tab to add students manually or import list.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 text-xs font-semibold font-mono uppercase tracking-wider">
                              <th className="py-3 px-6">Roll Number</th>
                              <th className="py-3 px-6">Name</th>
                              <th className="py-3 px-6">Attendance Status</th>
                              <th className="py-3 px-6">Score (MCQ)</th>
                              <th className="py-3 px-6">Submitted At</th>
                              <th className="py-3 px-6 text-right print:hidden">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {attendanceDataList.map(({ student, hasSubmitted, submission, status }) => (
                              <tr key={student.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-4 px-6 font-mono font-bold text-slate-900">{student.rollNumber}</td>
                                <td className="py-4 px-6 font-medium text-slate-700">{student.name}</td>
                                <td className="py-4 px-6">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                      status === "present"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        status === "present" ? "bg-emerald-500" : "bg-red-500"
                                      }`}
                                    ></span>
                                    {status === "present" ? "Submitted / Present" : "Unsubmitted / Absent"}
                                  </span>
                                </td>
                                <td className="py-4 px-6 font-mono font-bold text-slate-900">
                                  {hasSubmitted ? (
                                    <span className="text-indigo-600 font-bold">
                                      {submission.score} <span className="text-xs text-slate-400 font-normal">pts</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                                  {hasSubmitted ? new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                                </td>
                                <td className="py-4 px-6 text-right print:hidden">
                                  {hasSubmitted ? (
                                    <div className="flex justify-end gap-2">
                                      {submission.codingSubmissions && submission.codingSubmissions.length > 0 && (
                                        <button
                                          onClick={() => {
                                            alert(
                                              `--- Coding Submissions for ${student.name} ---\n\n` +
                                              submission.codingSubmissions.map((cs: any, idx: number) => (
                                                `[Challenge ${idx+1}] ${cs.questionText}\n` +
                                                `--- Submitted Code ---\n${cs.submittedCode}\n` +
                                                `-----------------------------------------\n`
                                              )).join("\n")
                                            );
                                          }}
                                          title="Review written python scripts"
                                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2.5 rounded transition flex items-center gap-1.5"
                                        >
                                          <FileCode className="w-3.5 h-3.5 text-slate-500" />
                                          Code Submissions
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() => handleTriggerAlert(student.name)}
                                        className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-1 px-2.5 rounded transition flex items-center gap-1"
                                      >
                                        <Send className="w-3 h-3" />
                                        Send Reminder
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COURSE LOCKS & UNLOCKS */}
            {activeTab === "locks" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Syllabus Course Locking Controls</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Unlock or lock specific training chapters and individual day numbers. Students login to
                    see currently active days matching their batch guidelines.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {SYLLABUS.map((chapter) => {
                      const batchLock = locks[selectedBatch] || {
                        batchName: selectedBatch,
                        unlockedCourses: ["python"],
                        unlockedDays: [1, 2],
                        courseLockState: {}
                      };

                      const isLocked = batchLock.courseLockState[chapter.slug] ?? true;

                      return (
                        <div
                          key={chapter.slug}
                          className={`border rounded-xl p-5 relative transition select-none ${
                            !isLocked
                              ? "bg-indigo-50/50 border-indigo-200 text-slate-900"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                              {chapter.slug}
                            </span>

                            <button
                              onClick={() => handleToggleCourseLock(chapter.slug, isLocked)}
                              className={`p-1.5 rounded-lg transition ${
                                !isLocked
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  : "bg-slate-300 hover:bg-slate-400 text-slate-700"
                              }`}
                              title={isLocked ? "Unlock Course" : "Lock Course"}
                            >
                              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          </div>

                          <h4 className="font-bold text-slate-900 mb-1">{chapter.name}</h4>
                          <span className="text-xs text-indigo-600 font-semibold font-mono">
                            Days {chapter.startDay} - {chapter.endDay} ({chapter.endDay - chapter.startDay + 1} days)
                          </span>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed h-8">
                            {chapter.description}
                          </p>

                          {/* Fast Action Row */}
                          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200/50">
                            <button
                              onClick={() => handleUnlockWholeCourse(chapter.slug, chapter.startDay, chapter.endDay)}
                              className="bg-indigo-100 hover:bg-indigo-150 text-indigo-700 text-[11px] font-semibold py-1 px-2.5 rounded-md transition"
                            >
                              Unlock All Days
                            </button>
                            <button
                              onClick={() => handleLockWholeCourse(chapter.slug, chapter.startDay, chapter.endDay)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold py-1 px-2.5 rounded-md transition"
                            >
                              Lock All Days
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Day-by-Day Selection Slate */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-bold text-slate-900 mb-2">Individual Day Unlock Selector</h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Directly toggle individual Day numbers. Click any count square to unlock or lock it for students logged inside {selectedBatch}.
                    </p>

                    <div className="space-y-6">
                      {SYLLABUS.map((chapter) => {
                        const batchLock = locks[selectedBatch] || {
                          batchName: selectedBatch,
                          unlockedCourses: ["python"],
                          unlockedDays: [1, 2],
                          courseLockState: {}
                        };

                        const isCourseGlobalLocked = batchLock.courseLockState[chapter.slug] ?? true;

                        return (
                          <div key={chapter.slug} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-75 * bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                                {chapter.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Days {chapter.startDay} to {chapter.endDay}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {Array.from(
                                { length: chapter.endDay - chapter.startDay + 1 },
                                (_, i) => chapter.startDay + i
                              ).map((dayNum) => {
                                const isUnlocked = batchLock.unlockedDays.includes(dayNum);
                                return (
                                  <button
                                    key={dayNum}
                                    onClick={() => handleToggleDayLock(dayNum)}
                                    className={`w-10 h-10 border rounded-lg text-xs font-bold font-mono transition flex flex-col justify-center items-center ${
                                      isUnlocked
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "bg-white hover:bg-slate-100 border-slate-200 text-slate-500"
                                    }`}
                                  >
                                    <span>D{dayNum}</span>
                                    <span className="text-[7px] font-normal leading-none">
                                      {isUnlocked ? "OPEN" : "LOCK"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STUDENT DATABASE */}
            {activeTab === "students" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add student layout */}
                <div className="space-y-6">
                  {/* Single Student Form */}
                  <form onSubmit={handleAddStudent} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      Add Single Student Record
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Student Name</label>
                      <input
                        type="text"
                        required
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Roll Number / UID (Unique)</label>
                      <input
                        type="text"
                        required
                        value={newStudentRoll}
                        onChange={(e) => setNewStudentRoll(e.target.value)}
                        placeholder="DS2026-101"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Email ID (Optional)</label>
                      <input
                        type="email"
                        value={newStudentEmail}
                        onChange={(e) => setNewStudentEmail(e.target.value)}
                        placeholder="john.doe@college.edu"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Phone / Mobile (Secure Match Login)</label>
                      <input
                        type="text"
                        value={newStudentPhone}
                        onChange={(e) => setNewStudentPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-semibold text-sm transition"
                      >
                        Register Student
                      </button>
                    </div>
                  </form>

                  {/* Bulk import tool */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-600" />
                        Bulk CSV/Text Import
                      </h4>
                    </div>

                    {bulkImportResult && (
                      <div className="mb-4 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded p-3 leading-relaxed">
                        {bulkImportResult}
                      </div>
                    )}

                    <div className="space-y-4">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Paste text list containing students info below. We process both comma (,) and Tab separated values. Format option:
                        <br />
                        <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-600 inline-block mt-1">
                          RollNumber, Name, Email, PhoneNumber
                        </code>
                      </p>

                      <textarea
                        rows={6}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="DS2026-010, Ramesh Kumar, ramesh@college.edu, 9876543210&#10;DS2026-011, Sita Verma, sita@college.edu, 9123456780&#10;DS2026-012, Rohan Joshi, rohan@example.com, 9345645612"
                        className="w-full bg-slate-50 border border-slate-200 rounded font-mono text-xs p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                      />

                      <button
                        type="button"
                        onClick={handleBulkImport}
                        disabled={!bulkText.trim()}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-sm py-2 rounded transition"
                      >
                        Parse & Bulk Import Records
                      </button>
                    </div>
                  </div>
                </div>

                {/* Students list */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4 gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900">Registered Students in Batch</h4>
                      <p className="text-xs text-slate-500 font-mono">LIST FOR: {selectedBatch}</p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {filteredStudents.length} Students Total
                    </span>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-sm">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      No students registered for this batch yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-250 text-slate-400 text-xs font-bold uppercase font-mono tracking-wider">
                            <th className="py-3 px-4">Roll Number</th>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Phone Number</th>
                            <th className="py-3 px-4">Gateway Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredStudents.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{st.rollNumber}</td>
                              <td className="py-3.5 px-4 font-medium text-slate-700">{st.name}</td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{st.email || "N/A"}</td>
                              <td className="py-3.5 px-4 text-slate-600 font-mono text-xs font-semibold">{st.phoneNumber || "Not Bound / Enter on Login"}</td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1 font-mono">
                                  {assessments.filter(a => a.studentId === st.id).length} Assessments
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedStudentForAccess(st)}
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                    <span>Manage Access</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStudent(st.id)}
                                    className="text-red-650 hover:bg-red-50 p-1.5 rounded transition inline-flex items-center cursor-pointer"
                                    title="Delete record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: SYLLABUS & QUIZZES EDITOR */}
            {activeTab === "quizzes" && (
              <div className="space-y-6">
                <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-lg font-bold">Comprehensive 200-Day Course Syllabus & Quizzes</h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        View, alter, and add custom exam sheets for daily testing. Overrides apply instantly for student portal exams.
                      </p>
                    </div>
                    {saveSuccess && (
                      <div className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-4 py-2 rounded text-xs flex items-center gap-2 animate-bounce">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Persistent override synced to database successfully!
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* LEFT RAIL: 200-DAYS ACCORDION LOOKUP */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-[720px] flex flex-col">
                    <h4 className="font-bold text-slate-950 text-sm mb-3 border-b border-slate-100 pb-2">
                      Syllabus Phases (200 Days)
                    </h4>
                    <div className="overflow-y-auto flex-1 space-y-3 pr-1 text-xs text-slate-705">
                      {[
                        { name: "Python Programming", slug: "python", range: [1, 30] },
                        { name: "NumPy Essentials", slug: "numpy", range: [31, 45] },
                        { name: "Pandas Data Wrangling", slug: "pandas", range: [46, 75] },
                        { name: "Machine Learning (ML)", slug: "ml", range: [76, 105] },
                        { name: "Deep Learning (DL)", slug: "dl", range: [106, 135] },
                        { name: "Natural Language Processing (NLP)", slug: "nlp", range: [136, 165] },
                        { name: "Generative AI Labs", slug: "genai", range: [166, 195] },
                        { name: "EDA & Visualization", slug: "eda", range: [196, 200] },
                      ].map((phase, idx) => (
                        <div key={idx} className="border border-slate-100 rounded p-2.5 bg-slate-50">
                          <div className="font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                            <span>{phase.name}</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded">
                              Days {phase.range[0]}-{phase.range[1]}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {Array.from({ length: phase.range[1] - phase.range[0] + 1 }).map((_, dIdx) => {
                              const dayNum = phase.range[0] + dIdx;
                              const isSelected = selectedDayToOverride === dayNum;
                              return (
                                <button
                                  key={dayNum}
                                  type="button"
                                  onClick={() => setSelectedDayToOverride(dayNum)}
                                  className={`p-1 text-center font-mono rounded font-medium transition text-xs ${
                                    isSelected
                                      ? "bg-indigo-600 text-white shadow-sm font-bold"
                                      : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  D{dayNum}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT PANEL: QUESTION OVERRIDE EDITOR FORM */}
                  <div className="lg:col-span-3 space-y-6">
                    {quizLoading ? (
                      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4 font-bold text-indigo-600"></div>
                        <p className="text-sm font-medium text-slate-500">Syncing and parsing worksheet data...</p>
                      </div>
                    ) : !overrideQuizData ? (
                      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-sm font-medium text-slate-500">Please select a syllabus day to begin custom editing.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                        {/* Day Header details */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                          <div className="space-y-1">
                            <span className="bg-indigo-600 text-white font-mono font-semibold text-[10px] uppercase px-2 py-0.5 rounded-full">
                              Active Subject Phase: {overrideQuizData.courseSlug}
                            </span>
                            <h4 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                              Configure Quiz Sheet - Day {overrideQuizData.dayNumber}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fetchQuizToOverride(selectedDayToOverride, true)}
                              className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5"
                              title="Reset custom questions to default high-quality preset or dynamic Gemini draft"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                              Reset to Default
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveQuizOverride}
                              className="px-4 py-1.5 bg-indigo-600 rounded text-xs font-semibold hover:bg-indigo-700 text-white transition flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save Changes to Database
                            </button>
                          </div>
                        </div>

                        {/* Interactive Title & Topics Form */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Exam/Day Topic Area Description
                          </label>
                          <input
                            type="text"
                            value={overrideQuizData.topicTitle}
                            onChange={(e) => handleUpdateTopicTitle(e.target.value)}
                            placeholder="e.g. Python Sequences, Variable scopes"
                            className="w-full bg-white border border-slate-200 rounded px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        {/* DYNAMIC AI QUIZ GENERATION BOOTSTRAPPER */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-150 rounded-xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                              <div>
                                <h5 className="font-extrabold text-indigo-950 text-sm">
                                  Generate 10 Questions from Course Material
                                </h5>
                                <p className="text-[11px] text-indigo-700/80 font-medium">
                                  Select file/notes (e.g. study notes, codes, syllabus documentation) or paste content directly below. Gemini will synthesize exactly 8 MCQs &amp; 2 Coding exercises (10 tasks total).
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* File Upload Box */}
                            <div className="border border-indigo-200 bg-white hover:bg-slate-50 transition rounded-xl p-3 flex flex-col justify-center items-center text-center space-y-2 relative border-dashed">
                              <Upload className="w-6 h-6 text-indigo-500" />
                              <div className="text-xs">
                                <span className="font-bold text-indigo-700 block">Select Course Material File</span>
                                <span className="text-[10px] text-zinc-500">Pick any study notes script or text document (.txt, .py, .md)</span>
                              </div>
                              <input
                                type="file"
                                accept=".txt,.md,.py,.json,.csv,.js,.html,text/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    setMaterialText(evt.target?.result as string);
                                    if (overrideQuizData && !overrideQuizData.topicTitle) {
                                      const cleanedName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                                      handleUpdateTopicTitle(cleanedName.substring(0, 50));
                                    }
                                  };
                                  reader.readAsText(file);
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                            </div>

                            {/* Direct Text input */}
                            <div className="space-y-1">
                              <label className="block text-[11px] font-bold text-indigo-950 uppercase font-mono">
                                Or Paste Materials / Curriculum Content
                              </label>
                              <textarea
                                value={materialText}
                                onChange={(e) => setMaterialText(e.target.value)}
                                placeholder="Paste study guide paragraphs, coding sample blocks, documentation items, or bullet points..."
                                rows={4}
                                className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed placeholder:text-slate-400"
                              />
                            </div>
                          </div>

                          {materialText && (
                            <div className="text-[10px] bg-indigo-100/50 text-indigo-900 px-3 py-1.5 rounded flex items-center justify-between font-mono font-medium">
                              <span>Ready payload: <strong>{materialText.length}</strong> characters loaded</span>
                              <button 
                                onClick={() => setMaterialText("")} 
                                className="text-rose-600 hover:text-rose-800 font-bold"
                              >
                                Clear Content
                              </button>
                            </div>
                          )}

                          {materialError && (
                            <div className="text-xs bg-red-50 text-rose-600 border border-red-200 px-3.5 py-2 rounded-lg font-medium">
                              ❌ {materialError}
                            </div>
                          )}

                          {generateSuccess && (
                            <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-lg font-medium">
                              🎉 Generated 10 high-quality questions successfully! Preview the MCQ and Coding grids below, and click 'Save Changes to Database' to push live.
                            </div>
                          )}

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleGenerateQuizFromMaterial}
                              disabled={isGeneratingQuiz || !materialText.trim()}
                              className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                                isGeneratingQuiz
                                  ? "bg-slate-200 text-slate-400 cursor-not-allowed font-medium"
                                  : !materialText.trim()
                                  ? "bg-indigo-200 text-indigo-400 cursor-not-allowed font-medium"
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100"
                              }`}
                            >
                              {isGeneratingQuiz ? (
                                <>
                                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-slate-500"></div>
                                  Generating 10 Custom Exam Questions...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                                  Synthesize Custom AI Test
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* SECTION A: MCQS */}
                        <div className="space-y-4">
                          <div className="border-b border-slate-100 pb-2">
                            <h5 className="font-bold text-indigo-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                              <span>SECTION A (8 x Multiple Choice Questions)</span>
                            </h5>
                          </div>

                          <div className="space-y-4">
                            {overrideQuizData.mcqs.map((mcq: any, index: number) => (
                              <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white hover:border-slate-300 transition">
                                <span className="text-xs font-bold text-indigo-600">Question #{index + 1} of 8</span>
                                <textarea
                                  value={mcq.questionText}
                                  onChange={(e) => handleUpdateMCQ(index, "questionText", e.target.value)}
                                  placeholder="Define MCQ Question description line..."
                                  rows={2}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {mcq.options.map((option: string, optionIdx: number) => (
                                    <div key={optionIdx} className="flex items-center gap-2">
                                      <span className="font-bold text-[11px] text-slate-500 w-4 font-mono">
                                        {String.fromCharCode(65 + optionIdx)}.
                                      </span>
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleUpdateMCQOption(index, optionIdx, e.target.value)}
                                        placeholder={`Option ${String.fromCharCode(65 + optionIdx)}`}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100 mt-2">
                                  <div className="flex items-center gap-2">
                                    <label className="text-[11px] text-slate-500 font-bold whitespace-nowrap">
                                      CORRECT CHOICE:
                                    </label>
                                    <select
                                      value={mcq.correctOption}
                                      onChange={(e) => handleUpdateMCQ(index, "correctOption", parseInt(e.target.value, 10))}
                                      className="bg-indigo-50 border border-indigo-200 rounded px-2 py-1 text-xs font-bold text-indigo-700 focus:outline-none"
                                    >
                                      <option value={0}>A</option>
                                      <option value={1}>B</option>
                                      <option value={2}>C</option>
                                      <option value={3}>D</option>
                                    </select>
                                  </div>

                                  <div>
                                    <input
                                      type="text"
                                      value={mcq.explanation || ""}
                                      onChange={(e) => handleUpdateMCQ(index, "explanation", e.target.value)}
                                      placeholder="Explanatory logic context details..."
                                      className="w-full bg-slate-50 border border-slate-100 rounded px-2.5 py-1 text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SECTION B: CODING */}
                        <div className="space-y-4">
                          <div className="border-b border-slate-100 pb-2">
                            <h5 className="font-bold text-indigo-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                              <span>SECTION B (2 x Coding Submissions)</span>
                            </h5>
                          </div>

                          <div className="space-y-4">
                            {overrideQuizData.coding.map((codingQ: any, index: number) => (
                              <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white hover:border-slate-300 transition">
                                <span className="text-xs font-bold text-indigo-600">Coding Question #{index + 1} of 2</span>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Challenge Task Description
                                  </label>
                                  <textarea
                                    value={codingQ.questionText}
                                    onChange={(e) => handleUpdateCoding(index, "questionText", e.target.value)}
                                    placeholder="Define what student code should build, variables name, and return constraints..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                      Starter Code Template (Python)
                                    </label>
                                    <textarea
                                      value={codingQ.starterCode}
                                      onChange={(e) => handleUpdateCoding(index, "starterCode", e.target.value)}
                                      placeholder="def challenge():\n    pass"
                                      rows={5}
                                      className="w-full bg-slate-900 text-indigo-300 font-mono border border-slate-800 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                      Ideal Code Implementation
                                    </label>
                                    <textarea
                                      value={codingQ.solutionDescription}
                                      onChange={(e) => handleUpdateCoding(index, "solutionDescription", e.target.value)}
                                      placeholder="Sample baseline correct logic code solution..."
                                      rows={5}
                                      className="w-full bg-slate-900 text-emerald-300 font-mono border border-slate-800 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Expected Code Parsing Keywords (Comma separated, validation tags)
                                  </label>
                                  <input
                                    type="text"
                                    value={Array.isArray(codingQ.expectedKeywords) ? codingQ.expectedKeywords.join(", ") : codingQ.expectedKeywords || ""}
                                    onChange={(e) =>
                                      handleUpdateCoding(
                                        index,
                                        "expectedKeywords",
                                        e.target.value.split(",").map((k) => k.trim()).filter(Boolean)
                                      )
                                    }
                                    placeholder="def, return, for, if, .append"
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Page Bottom Saved actions */}
                        <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                          <button
                            type="button"
                            onClick={handleSaveQuizOverride}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded transition"
                          >
                            Apply & Save Override Questions
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "interviews" && (
              <TeacherInterviewsView selectedBatch={selectedBatch} />
            )}
          </>
        )}
      </div>

      {/* MODAL: ADD NEW BATCH */}
      {showAddBatch && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 animate-zoom-in">
            <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Create Class Batch
            </h3>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Batch Name or Label</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="e.g. Batch D (Evening)"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatch(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs py-2 px-3.5 rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 px-3.5 rounded transition"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE ACCESS & OVERRIDES LIMITS */}
      {selectedStudentForAccess && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 animate-zoom-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Gateway Access & Retake Controls
                </h3>
                <p className="text-xs text-slate-550 mt-1 font-sans">
                  student: <strong className="text-slate-900">{selectedStudentForAccess.name}</strong> • Roll Number: <strong className="text-slate-900">{selectedStudentForAccess.rollNumber}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForAccess(null)}
                className="text-slate-400 hover:text-slate-650 font-bold font-mono text-sm leading-none bg-slate-100 p-1.5 rounded-full cursor-pointer transition"
              >
                ✖
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-normal mb-4 font-sans">
              Set manual overrides for the placement eligibility gates (score ≥ 60%) or reset student interview retake counts back to 0 (clearing past sessions to grant fresh chances).
            </p>

            <div className="overflow-x-auto border border-slate-150 rounded-xl mb-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-4">Tech Subject</th>
                    <th className="py-2.5 px-4 text-center">Assessment Score</th>
                    <th className="py-2.5 px-4 text-center">Req. Passed?</th>
                    <th className="py-2.5 px-4 text-center">Access Override</th>
                    <th className="py-2.5 px-4 text-right">Attempts Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SYLLABUS.map((course) => {
                    const score = assessments.find(
                      (a) => a.studentId === selectedStudentForAccess.id && a.courseSlug === course.slug
                    )?.score;
                    const passed = score !== undefined && score >= 60;

                    const override = overrides.find(
                      (o) => o.studentId === selectedStudentForAccess.id && o.courseSlug === course.slug
                    );
                    const activeBypass = override?.eligibilityBypass === true;

                    return (
                      <tr key={course.slug} className="hover:bg-slate-50/40 transition">
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-800 font-sans block leading-tight">
                            {course.name}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-mono">
                            {course.slug.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold font-semibold">
                          {score !== undefined ? (
                            <span className={passed ? "text-emerald-700 bg-emerald-50 px-2 py-1 rounded" : "text-rose-650 bg-rose-50 px-2 py-1 rounded"}>
                              {score}%
                            </span>
                          ) : (
                            <span className="text-slate-400">No score</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {passed || activeBypass ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-sans uppercase">
                              Passed / Ready
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-sans uppercase">
                              Blocked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            disabled={accessSubmittingSubject !== null}
                            onClick={() =>
                              handleTeacherOverrideSubmit(course.slug, !activeBypass, override?.resetAttempts ?? false)
                            }
                            className={`px-3 py-1 rounded text-[10px] font-extrabold tracking-wide uppercase font-sans border transition cursor-pointer ${
                              activeBypass
                                ? "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {activeBypass ? "★ Bypassed" : "Enable Bypass"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={accessSubmittingSubject !== null}
                            onClick={async () => {
                              if (confirm(`Are you sure you want to grant a retake reset for ${course.name}? This will clear previous interview sessions so they have 3 fresh attempts.`)) {
                                await handleTeacherOverrideSubmit(course.slug, activeBypass, true);
                              }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-[10px] font-extrabold font-sans uppercase tracking-wide transition cursor-pointer"
                          >
                            Reset Attempts (0/3 used)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStudentForAccess(null)}
                className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-2 px-6 rounded-lg transition cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherInterviewsView({ selectedBatch }: { selectedBatch: string }) {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<any | null>(null);

  useEffect(() => {
    fetchInterviews();
  }, [selectedBatch]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/interviews");
      if (res.ok) {
        const data = await res.json();
        setInterviews(data);
      }
    } catch (e) {
      console.error("Failed to fetch teacher interviews list:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = interviews.filter((item) => item.batch === selectedBatch);

  // Simple Markdown styling renderer
  function renderMarkdown(text: string) {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return <h4 key={idx} className="text-xs font-bold text-indigo-900 mt-3 mb-1 uppercase font-mono">{trimmed.replace(/^###\s*/, "")}</h4>;
      }
      if (trimmed.startsWith("##")) {
        return <h3 key={idx} className="text-sm font-black text-slate-800 mt-4 mb-1.5 uppercase font-display border-b border-slate-100 pb-1">{trimmed.replace(/^##\s*/, "")}</h3>;
      }
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        return <li key={idx} className="text-xs text-slate-650 ml-4 list-disc mb-1 font-sans">{trimmed.replace(/^(\*|-)\s*/, "")}</li>;
      }
      if (trimmed === "") return <div key={idx} className="h-1.5"></div>;
      return <p key={idx} className="text-xs text-slate-600 mb-1 leading-relaxed font-sans">{trimmed}</p>;
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-205 p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h4 className="font-extrabold text-slate-900">AI Student Mock Interviews</h4>
          <p className="text-xs text-slate-500">Live Gemini evaluation performance cards for {selectedBatch}.</p>
        </div>
        <button
          onClick={fetchInterviews}
          className="text-xs bg-slate-100 hover:bg-slate-250 text-slate-700 py-1.5 px-3 rounded font-semibold transition"
        >
          Refresh Tracker
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interviews List Table/Roster */}
        <div className="lg:col-span-1 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 p-4 space-y-3">
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wide font-mono">Exam Submissions</h5>

          {loading ? (
            <div className="text-xs italic text-slate-400 py-6 text-center">Loading live records...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 italic">
              No students in {selectedBatch} have completed AI Interviews yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedInterview(item)}
                  className={`w-full text-left p-3 rounded-lg border transition text-xs flex flex-col gap-1 ${
                    selectedInterview?.id === item.id
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                      : "border-slate-150 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-bold text-slate-900 truncate max-w-[70%]">{item.studentName}</span>
                    <span className="font-mono text-indigo-700 font-extrabold shrink-0 bg-indigo-100/50 px-1.5 py-0.5 rounded text-[10px]">
                      {item.report?.score || "N/A"} pts
                    </span>
                  </div>

                  <div className="flex justify-between items-center w-full text-[9px] text-slate-400 font-medium">
                    <span className="font-mono font-bold uppercase">{item.subject} &bull; {item.difficulty}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Assessment Scorecard Panel */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl p-5 bg-white space-y-4 min-h-[400px]">
          {selectedInterview ? (
            <div className="space-y-4">
              {/* Header metrics */}
              <div className="border-b pb-3 flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900">{selectedInterview.studentName}'s Scorecard</h4>
                  <p className="text-[10px] text-slate-400 font-mono text-xs">
                    Roll: {selectedInterview.rollNumber} &bull; Batch: {selectedInterview.batch}
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-150 rounded-lg py-1 px-3 text-center shrink-0 min-w-[72px]">
                  <span className="text-[8px] text-slate-400 block font-mono font-bold">GRADE</span>
                  <span className="text-lg font-black text-indigo-700 font-mono leading-none">
                    {selectedInterview.report?.score || "N/A"}/100
                  </span>
                </div>
              </div>

              {/* Subject topic labels split */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border">
                  <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Exam Subject</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedInterview.subject}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border">
                  <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Tested Difficulty</span>
                  <span className="font-bold text-slate-800">{selectedInterview.difficulty} Level</span>
                </div>
              </div>

              {/* Summary text */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl text-xs text-indigo-950 italic leading-relaxed">
                <strong>Executive Placement Review:</strong> &ldquo;{selectedInterview.report?.summary}&rdquo;
              </div>

              {/* Strengths & Weaknesses checklists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg space-y-1.5">
                  <span className="text-[10px] font-extrabold text-emerald-900 block uppercase font-mono">Student Strengths:</span>
                  <ul className="list-disc pl-4 space-y-1 text-emerald-800 text-[11px] font-medium">
                    {(selectedInterview.report?.strengths || []).map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-lg space-y-1.5">
                  <span className="text-[10px] font-extrabold text-amber-900 block uppercase font-mono">Improvements Needed:</span>
                  <ul className="list-disc pl-4 space-y-1 text-amber-800 text-[11px] font-medium">
                    {(selectedInterview.report?.improvements || []).map((i: string, idx: number) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Detailed full assessment document log */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/30">
                <span className="text-[10px] font-extrabold text-slate-500 block uppercase border-b pb-1 mb-2 font-mono">Transcript Evaluation:</span>
                <div className="prose max-w-none">
                  {renderMarkdown(selectedInterview.report?.detailedEvaluation || "")}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 py-16 space-y-2">
              <Sparkles className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-bold font-sans">No Student Selected</p>
              <p className="text-[10px] text-slate-400 max-w-xs">Click any student record on the left roster to view their fully generated AI technical placement evaluation report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
