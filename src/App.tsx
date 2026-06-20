import React, { useState, useEffect } from "react";
import {
  Users,
  Database,
  Lock,
  ArrowRight,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  Award
} from "lucide-react";
import TeacherDashboard from "./components/TeacherDashboard.jsx";
import StudentPortal from "./components/StudentPortal.jsx";
import { Student } from "./types.js";

type UserRole = "landing" | "student_login" | "teacher_login" | "student_active" | "teacher_active";

export default function App() {
  const [role, setRole] = useState<UserRole>("landing");

  // Load state from DB to display dropdown options
  const [batches, setBatches] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Authentication states
  const [selectedBatch, setSelectedBatch] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [teacherPass, setTeacherPass] = useState("");

  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Status alerts
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    fetchBootData();
  }, []);

  const fetchBootData = async () => {
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
        setStudents(data.students || []);

        if (data.batches && data.batches.length > 0) {
          setSelectedBatch(data.batches[0]);
        }
      }
    } catch (e) {
      console.error("Boot initial setup failed:", e);
    }
  };

  // Student portal login processor
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!selectedBatch || !studentRoll.trim() || !studentPhone.trim()) {
      setAuthError("Please select a batch, enter your registered Roll number, and enter your Phone Number.");
      return;
    }

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNumber: studentRoll.trim(),
          phoneNumber: studentPhone.trim(),
          batch: selectedBatch
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.student) {
          setActiveStudent(data.student);
          setRole("student_active");
          setStudentRoll("");
          setStudentPhone("");
        }
      } else {
        const err = await res.json();
        setAuthError(err.error || "Roll Number or Phone Number does not match registered details for this batch.");
      }
    } catch (e) {
      setAuthError("Failed to authenticate to server databases.");
    }
  };

  // Teacher password processor
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      const res = await fetch("/api/auth/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: teacherPass })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRole("teacher_active");
          setTeacherPass("");
        }
      } else {
        setAuthError("Incorrect Teacher Pin Code. Please try again.");
      }
    } catch (e) {
      setAuthError("Failed to connect to teacher authentication API.");
    }
  };

  const handleSignOut = () => {
    setActiveStudent(null);
    setRole("landing");
    setAuthError(null);
    fetchBootData(); // refresh
  };

  // Render Student Panel
  if (role === "student_active" && activeStudent) {
    return <StudentPortal student={activeStudent} onLogout={handleSignOut} />;
  }

  // Render Teacher Panel
  if (role === "teacher_active") {
    return <TeacherDashboard onLogout={handleSignOut} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between text-slate-800 font-sans">
      {/* Landing top branding bar */}
      <nav className="h-16 bg-slate-900 border-b border-slate-800 text-white flex justify-between items-center px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-lg font-display select-none">QT</div>
          <div>
            <span className="font-extrabold font-display text-sm text-white tracking-tight leading-none block">Data Science Daily Test Portal</span>
            <span className="text-[10px] text-indigo-400 font-mono leading-none font-semibold">Quality Thought Academy</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-mono hidden sm:inline-block">Status: Live Training Slate</div>
      </nav>

      {/* Main Container Workspace */}
      <main className="flex-grow flex items-center justify-center py-10 px-4">
        {/* 1. SELECTION LANDING HERO SCREEN */}        {role === "landing" && (
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left intro text info */}
            <div className="space-y-6 text-center md:text-left">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded inline-block">
                Academic Portal Setup
              </span>
              <h1 className="text-3xl md:text-4.5xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">
                Data Science Daily <span className="text-indigo-600">Test Portal</span>
              </h1>
              <p className="text-xs text-indigo-700 font-bold tracking-wider uppercase font-mono mt-1">
                Quality Thought
              </p>
              <p className="text-sm text-slate-550 leading-relaxed max-w-md">
                A massive 200 Days intensive daily test tracking platform for colleges and bootcamps. Covers complete Python, NumPy, Pandas, Scikit-Learn Models, Deep Learning, NLP transformers, LangChain, and Exploratory visualization.
              </p>

              <div className="space-y-3.5 pt-2 hidden md:block">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">✓</span>
                  Customizable Student Batches Unlocking controls
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">✓</span>
                  10 daily questions (8 MCQs + 2 physical coding blocks)
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">✓</span>
                  Attendance analytics sheets and bulk students importer
                </div>
              </div>
            </div>

            {/* Right option box */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-5">
              <h3 className="text-lg font-bold text-slate-900 text-center pb-3 border-b border-slate-100 font-display">
                Sign in to matching portal
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setRole("student_login")}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm transition group cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      I am a Student
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1.5 transition" />
                  </div>
                  <p className="text-xs text-slate-500">Log in with roll number and batch to take unlocked tests.</p>
                </button>

                <button
                  onClick={() => setRole("teacher_login")}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm transition group cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <Lock className="w-5 h-5 text-indigo-650" />
                      Classroom Instructor login
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1.5 transition" />
                  </div>
                  <p className="text-xs text-slate-500">Unlock syllabus days, register students and view daily attendance tracks.</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. STATE: STUDENT PORTAL LOGIN SCREEN */}
        {role === "student_login" && (
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-250 p-6 space-y-5 animate-zoom-in">
            <div className="text-center">
              <div className="inline-flex p-3 bg-indigo-50 text-indigo-650 rounded-full mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Student Portal Login</h2>
              <p className="text-xs text-slate-400 mt-1">Please match your batch, ID (roll number) and phone number below</p>
            </div>

            {authError && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs leading-relaxed font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Registered Batch</label>
                {batches.length === 0 ? (
                  <select disabled className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-2 text-sm text-slate-400">
                    <option>No active batches synced</option>
                  </select>
                ) : (
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                  >
                    {batches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Unique Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DS2026-001"
                  value={studentRoll}
                  onChange={(e) => setStudentRoll(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 text-sm uppercase font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Registered Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700"
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  Enforces login identity check. If logging in for the first time, this links automatically.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRole("landing")}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded text-sm transition"
                >
                  Enter Classroom
                </button>
              </div>
            </form>

            <div className="text-center pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 leading-normal block">
                No Roll Number yet? Ask the instructor Vinay to import you or paste student records inside his teacher panel.
              </span>
            </div>
          </div>
        )}

        {/* 3. STATE: TEACHER PORTAL LOGIN SCREEN */}
        {role === "teacher_login" && (
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-250 p-6 space-y-5 animate-zoom-in">
            <div className="text-center">
              <div className="inline-flex p-3 bg-slate-900 text-white rounded-full mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Instructor Control Login</h2>
              <p className="text-xs text-slate-400 mt-1">Provide password PIN code to manage locks and daily attendance logs</p>
            </div>

            {authError && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs leading-relaxed font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Teacher Code Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter Pin"
                  value={teacherPass}
                  onChange={(e) => setTeacherPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono tracking-widest text-center"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRole("landing")}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded text-sm transition"
                >
                  Authenticate
                </button>
              </div>
            </form>

            <div className="bg-indigo-50 text-indigo-800 p-3.5 rounded-lg border border-indigo-100 text-[10px] leading-relaxed">
              <span className="font-bold block">Secure Access Active:</span>
              Please authenticate with the classroom PIN issued by the administration.
            </div>
          </div>
        )}
      </main>

      {/* Landing footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-center text-xs text-slate-400 font-sans print:hidden">
        Data Science Master Daily Exam System &bull; Class Course lock, Unlocking, Student portal. Persistent inside database configurations.
      </footer>
    </div>
  );
}
