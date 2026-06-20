import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  MessageSquare,
  Award,
  ChevronRight,
  TrendingUp,
  Brain,
  History,
  HelpCircle,
  Play,
  RotateCcw,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Lightbulb,
  CornerDownRight,
  ShieldCheck,
  UserCheck,
  Upload,
  FileCode,
  Clock,
  Video,
  Mic,
  Fingerprint,
  Check,
  Lock,
  Unlock,
  Wifi,
  User,
  Volume2,
  Activity,
  Code2
} from "lucide-react";
import { Student, AIInterview, SYLLABUS, CourseSyllabus, InterviewMessage, Submission } from "../types.js";

interface AiInterviewRoomProps {
  student: Student;
  submissions?: Submission[];
  assessments?: any[];
  overrides?: any[];
  onRefreshContext?: () => void;
}

export default function AiInterviewRoom({
  student,
  submissions = [],
  assessments = [],
  overrides = [],
  onRefreshContext
}: AiInterviewRoomProps) {
  const [pastInterviews, setPastInterviews] = useState<AIInterview[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);

  // Selector Form states
  const [selectedSubject, setSelectedSubject] = useState<string>("python");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Junior");

  // Operational Hour restriction states (7:00 AM - 10:00 PM)
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bypassTiming, setBypassTiming] = useState(false);

  // Python completion checking (unlocks Premium Visual Interview)
  const hasCompletedPython = submissions.some(sub => sub.courseSlug === "python");
  const [isVisualRoom, setIsVisualRoom] = useState(false);
  const [forceUnlockVisual, setForceUnlockVisual] = useState(false); // Demo master bypass

  // Visual Room Interactive Animation triggers
  const webcamCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const voiceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [proctorLogs, setProctorLogs] = useState<string[]>([]);

  // Custom material and subject override states
  const [useCustomMaterial, setUseCustomMaterial] = useState<boolean>(false);
  const [customInterviewMaterial, setCustomInterviewMaterial] = useState<string>("");
  const [customSubjectName, setCustomSubjectName] = useState<string>("Excel & CSV Data Diagnostics");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [materialError, setMaterialError] = useState<string>("");

  // Running session state
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [currentSession, setCurrentSession] = useState<InterviewMessage[]>([]);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sessionFinished, setSessionFinished] = useState(false);

  // Evaluation trigger states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeReport, setActiveReport] = useState<AIInterview | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Live Operating Hours Clock Timer
  useEffect(() => {
    const clock = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // 2. Beautiful Computer Vision Webcam Frame & Sound Amplitude Wave loops
  useEffect(() => {
    if (!isInterviewing || !isVisualRoom) return;

    let animIdWebcam: number;
    let animIdVoice: number;
    let frame = 0;

    // Initialize proctor logs with timestamps
    const initialLogs = [
      `[${new Date().toLocaleTimeString()}] Establishing encrypted student workspace link...`,
      `[${new Date().toLocaleTimeString()}] Biometric proctor secure calibration online.`,
      `[${new Date().toLocaleTimeString()}] Video feed frame buffer scanning activated.`
    ];
    setProctorLogs(initialLogs);

    // Audio Amplitude Sinusoid Generator
    const drawVoice = () => {
      const canvas = voiceCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      frame++;

      // Subtle network grid lines
      ctx.strokeStyle = "rgba(79, 70, 229, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }

      // Live layered bezier math waves
      ctx.lineWidth = 2;
      const numWaves = 3;
      const colors = ["rgba(79, 70, 229, 0.8)", "rgba(168, 85, 247, 0.5)", "rgba(99, 102, 241, 0.3)"];
      
      for (let wIdx = 0; wIdx < numWaves; wIdx++) {
        ctx.beginPath();
        ctx.strokeStyle = colors[wIdx];
        
        let freq = 0.015 + (wIdx * 0.005);
        let amp = 15 + (wIdx * 10);
        let speed = 0.04 + (wIdx * 0.02);

        // Increase wave peak size if AI model is preparing or user is actively typing
        if (isLoadingMessage || inputText.length > 0) {
          amp *= 1.8;
          freq *= 1.2;
        }

        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * freq + frame * speed) * amp;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animIdVoice = requestAnimationFrame(drawVoice);
    };

    // Vector Graphics Face Simulation
    const drawWebcam = () => {
      const canvas = webcamCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Draw background space
      ctx.fillStyle = "#0c111d";
      ctx.fillRect(0, 0, w, h);

      // Moving scanning horizontal beam
      const laserY = (frame * 1.5) % h;
      ctx.strokeStyle = "rgba(99, 102, 241, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, laserY);
      ctx.lineTo(w, laserY);
      ctx.stroke();

      // Matrix network points
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Outer tech bracket corners
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 3;
      const spacingValue = 24;
      // Top-Left corner
      ctx.beginPath(); ctx.moveTo(spacingValue, spacingValue + 16); ctx.lineTo(spacingValue, spacingValue); ctx.lineTo(spacingValue + 16, spacingValue); ctx.stroke();
      // Top-Right corner
      ctx.beginPath(); ctx.moveTo(w - spacingValue - 16, spacingValue); ctx.lineTo(w - spacingValue, spacingValue); ctx.lineTo(w - spacingValue, spacingValue + 16); ctx.stroke();
      // Bottom-Left corner
      ctx.beginPath(); ctx.moveTo(spacingValue, h - spacingValue - 16); ctx.lineTo(spacingValue, h - spacingValue); ctx.lineTo(spacingValue + 16, h - spacingValue); ctx.stroke();
      // Bottom-Right corner
      ctx.beginPath(); ctx.moveTo(w - spacingValue - 16, h - spacingValue); ctx.lineTo(w - spacingValue, h - spacingValue); ctx.lineTo(w - spacingValue, h - spacingValue - 16); ctx.stroke();

      const centerX = w / 2;
      const centerY = h / 2 - 8;
      const radiusX = 54;
      const radiusY = 72;

      // Draw green human profile scanner bounding loop
      ctx.strokeStyle = "rgba(34, 197, 94, 0.6)"; 
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw horizontal dynamic scan laser line inside human oval
      const scanArcY = centerY + Math.sin(frame * 0.04) * radiusY;
      ctx.strokeStyle = "rgba(34, 197, 94, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const ellipseWidthSpan = radiusX * Math.sqrt(Math.max(0, 1 - Math.pow((scanArcY - centerY) / radiusY, 2)));
      ctx.moveTo(centerX - ellipseWidthSpan, scanArcY);
      ctx.lineTo(centerX + ellipseWidthSpan, scanArcY);
      ctx.stroke();

      // Bypassed text panel
      ctx.fillStyle = "rgba(34, 197, 94, 0.15)";
      ctx.fillRect(centerX - radiusX - 8, centerY - radiusY - 14, (radiusX + 8) * 2, 10);
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`CANDIDATE SCAN: ONLINE [LOCK 99.4%]`, centerX - radiusX + 2, centerY - radiusY - 6);

      // Eye node indicators (Blinking loop)
      const blinkTrig = (frame % 160) < 6;
      if (!blinkTrig) {
        ctx.fillStyle = "#22c55e";
        ctx.beginPath(); ctx.arc(centerX - 18, centerY - 14, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(centerX + 18, centerY - 14, 3, 0, Math.PI * 2); ctx.fill();
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(centerX - 18, centerY - 14, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(centerX + 18, centerY - 14, 7, 0, Math.PI * 2); ctx.stroke();
      }

      // Mouth indicator
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY + 26, 10, 0, Math.PI, false);
      ctx.stroke();

      // Info footers
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`DEVICE: CAM_01`, 12, h - 12);
      ctx.fillText(`FEED: 60 FPS`, w - 80, h - 12);

      animIdWebcam = requestAnimationFrame(drawWebcam);
    };

    drawVoice();
    drawWebcam();

    // Trigger intermittent micro-security logs
    const loggingTrigger = setInterval(() => {
      const securMessages = [
        "Eye gaze alignment matched center layout bounds.",
        "Acoustic feedback stabilized: clear of auxiliary audio signals.",
        "Candidate head position matched baseline scan successfully.",
        "Proctor safety key validated (status 200).",
        "No anomalous secondary device frequencies matching frame rate."
      ];
      const randomMsg = securMessages[Math.floor(Math.random() * securMessages.length)];
      setProctorLogs(p => [
        `[${new Date().toLocaleTimeString()}] ${randomMsg}`,
        ...p.slice(0, 10)
      ]);
    }, 5000);

    return () => {
      cancelAnimationFrame(animIdWebcam);
      cancelAnimationFrame(animIdVoice);
      clearInterval(loggingTrigger);
    };
  }, [isInterviewing, isVisualRoom, isLoadingMessage]);

  useEffect(() => {
    fetchPastSessions();
  }, [student.id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentSession, isLoadingMessage]);

  const fetchPastSessions = async () => {
    setLoadingPast(true);
    try {
      const res = await fetch(`/api/interviews/student/${student.id}`);
      if (res.ok) {
        const data = await res.json();
        setPastInterviews(data);
      }
    } catch (err) {
      console.error("Failed to load past interview sessions:", err);
    } finally {
      setLoadingPast(false);
    }
  };

  // Dynamic Score & Eligibility computations for selectedSubject
  const matchingAssessment = assessments.find(asm => asm.courseSlug === selectedSubject);
  const scoreVal = matchingAssessment ? matchingAssessment.score : null;
  const matchingOverride = overrides.find(o => o.courseSlug === selectedSubject);
  const currentSubjectAttempts = pastInterviews.filter(item => item.subject.toLowerCase() === selectedSubject.toLowerCase()).length;
  const maxAttemptsExhausted = currentSubjectAttempts >= 3;
  const isEligible = (scoreVal !== null && scoreVal >= 60) || matchingOverride?.eligibilityBypass === true;

  const handleStartInterview = async () => {
    // Enforce 60% eligibility check
    if (!isEligible) {
      setMaterialError(`Blocked: You must score at least 60% on the Comprehensive Assessment for ${selectedSubject.toUpperCase()} before unlocking the placement interview (or request an eligibility bypass from instructor Vinay).`);
      return;
    }

    // Enforce 3 chances limits
    if (maxAttemptsExhausted) {
      setMaterialError(`Blocked: You have already exhausted all 3 interview chances for this subject. Please contact instructor Vinay to reset your attempts.`);
      return;
    }

    const currentHour = currentTime.getHours();
    const isWithinHours = currentHour >= 7 && currentHour < 22;
    if (!isWithinHours && !bypassTiming) {
      setMaterialError("Blocked: Mock Recruiter Rooms are only accessible between 07:00 AM and 10:00 PM to match live evaluation availability. Click 'Bypass Hours' below to override.");
      return;
    }

    if (useCustomMaterial && !customInterviewMaterial.trim()) {
      setMaterialError("Please paste some course material or pick a file first before entering the room.");
      return;
    }
    setMaterialError("");
    setIsInterviewing(true);
    setIsLoadingMessage(true);
    setSessionFinished(false);
    setCurrentSession([]);
    setActiveReport(null);

    const activeSubject = useCustomMaterial ? customSubjectName : selectedSubject;
    const activeMaterial = useCustomMaterial ? customInterviewMaterial : "";

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeSubject,
          difficulty: selectedDifficulty,
          messages: [],
          customMaterial: activeMaterial
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSession([data]); // First prompt from AI
      } else {
        const err = await res.json();
        alert(err.error || "Failed to establish interview session.");
        setIsInterviewing(false);
      }
    } catch (e) {
      alert("API connection failed. Please ensure the dev backend is running.");
      setIsInterviewing(false);
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoadingMessage) return;
    const userText = inputText.trim();
    setInputText("");

    // Append user message local representation
    const updated = [...currentSession, { role: "user" as const, content: userText }];
    setCurrentSession(updated);
    setIsLoadingMessage(true);

    const activeSubject = useCustomMaterial ? customSubjectName : selectedSubject;
    const activeMaterial = useCustomMaterial ? customInterviewMaterial : "";

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeSubject,
          difficulty: selectedDifficulty,
          messages: updated,
          customMaterial: activeMaterial
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSession(prev => [...prev, data]);
        if (data.isComplete) {
          setSessionFinished(true);
        }
      } else {
        alert("Failed to process conversation with AI recruiter.");
      }
    } catch (e) {
      alert("Network transmission error occurred.");
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleEvaluateSession = async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    const activeSubject = useCustomMaterial ? customSubjectName : selectedSubject;
    const activeMaterial = useCustomMaterial ? customInterviewMaterial : "";

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          batch: student.batch,
          subject: activeSubject,
          difficulty: selectedDifficulty,
          messages: currentSession,
          customMaterial: activeMaterial
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveReport(data.interview);
        setIsInterviewing(false);
        fetchPastSessions(); // Reload list
        onRefreshContext?.(); // Sync parent context
      } else {
        alert("Failed to synthesize the evaluation scorecard.");
      }
    } catch (e) {
      alert("Error occurred on final evaluation trigger.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Helper to resolve stylized syllabus icons
  const getSubjectName = (slug: string) => {
    const course = SYLLABUS.find(s => s.slug === slug);
    return course ? course.name : slug.toUpperCase();
  };

  // Safe manual markdown parser
  function renderMarkdown(text: string) {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-xs font-extrabold text-indigo-900 mt-4 mb-1.5 uppercase font-mono tracking-wide">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-sm font-black text-slate-900 mt-5 mb-2 border-b border-indigo-100 pb-1 uppercase font-display tracking-tight">
            {trimmed.replace(/^##\s*/, "")}
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={idx} className="text-base font-black text-indigo-700 mt-6 mb-3 border-b-2 border-indigo-200 pb-1 font-display">
            {trimmed.replace(/^#\s*/, "")}
          </h2>
        );
      }
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        return (
          <li key={idx} className="text-xs text-slate-650 ml-4 list-disc list-outside leading-relaxed mb-1 font-sans">
            {trimmed.replace(/^(\*|-)\s*/, "")}
          </li>
        );
      }
      if (/^\d+\./.test(trimmed)) {
        return (
          <li key={idx} className="text-xs text-slate-650 ml-4 list-decimal list-outside leading-relaxed mb-1 font-sans">
            {trimmed.replace(/^\d+\.\s*/, "")}
          </li>
        );
      }
      if (trimmed === "") {
        return <div key={idx} className="h-2"></div>;
      }
      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed font-sans mb-1.5">
          {trimmed}
        </p>
      );
    });
  }

  // 3. Render active recruiter interview chat container with customizable proctored mode adjustments
  const renderActiveChat = (isFullWidthVisual: boolean) => {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col ${isFullWidthVisual ? "h-[540px]" : "h-[520px]"}`}>
        {/* Active Room Title Header */}
        <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isFullWidthVisual ? "bg-indigo-500 text-white animate-pulse" : "bg-indigo-505/20 text-indigo-400"}`}>
              {isFullWidthVisual ? "REC" : "AI"}
            </div>
            <div>
              <h3 className="text-xs font-extrabold font-display uppercase tracking-wide leading-none flex items-center gap-1.5">
                Technical Board Examiner {isFullWidthVisual && <span className="text-[10px] bg-red-600/80 px-1.5 py-0.5 rounded text-white font-mono animate-pulse">● PROCTOR ACTIVE</span>}
              </h3>
              <p className="text-[10px] text-indigo-300 mt-1 font-semibold">
                Subject: <span className="text-white">{getSubjectName(selectedSubject)}</span> &bull; {selectedDifficulty}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress bar counter */}
            <span className="text-[10px] bg-slate-800 px-2.5 py-1 text-slate-300 rounded-full font-mono font-bold">
              Answers: {userResponsesCount} / 5
            </span>

            <button
              onClick={() => {
                if (window.confirm("Abort current interview room? You will lose this session's progress.")) {
                  setIsInterviewing(false);
                  setCurrentSession([]);
                  setSessionFinished(false);
                }
              }}
              className="text-slate-400 hover:text-white transition"
              title="Leave Room"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages Frame */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          <div className="bg-indigo-50/75 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-900 leading-relaxed max-w-2xl">
            <p className="font-bold flex items-center gap-1.5 mb-1 text-indigo-950 font-sans">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              {isFullWidthVisual ? "Interactive Placement Proctoring Mode Active:" : "Board Interview Session Guidelines:"}
            </p>
            <ul className="list-disc pl-4 space-y-0.5 mt-1 font-sans text-[11px] text-indigo-850">
              <li>Type descriptive structural answers to show your concept depth.</li>
              {isFullWidthVisual ? (
                <li className="text-indigo-950 font-extrabold">Warning: Biometric monitoring is connected. Keep focus on this workspace.</li>
              ) : (
                <li>If asked for a coding snippet, write clear Python/Pandas syntaxes.</li>
              )}
              <li>Gemini counts 5 prompt segments, then unlocks the detailed report.</li>
            </ul>
          </div>

          {currentSession.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Character Avatar */}
              <div
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                  msg.role === "user"
                    ? "bg-slate-200 text-slate-850"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {msg.role === "user" ? student.name[0] : "AI"}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white rounded-tr-none"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                }`}
              >
                <p className="whitespace-pre-line font-sans">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoadingMessage && (
            <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white shrink-0 flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div className="p-3 bg-white border border-slate-150 rounded-2xl rounded-tl-none shadow-xs text-xs text-slate-400 italic">
                AI Technical Examiner is evaluating your response and formulating the next task...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input / Action layout */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          {sessionFinished ? (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-900 font-sans uppercase">
                    Five-Question Interview Session Concluded!
                  </h4>
                  <p className="text-[10px] text-amber-800 leading-tight">
                    Gemini has logged all transcript steps. Synthesize your final academic grade card now.
                  </p>
                </div>
              </div>

              <button
                onClick={handleEvaluateSession}
                disabled={isEvaluating}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-400 w-full md:w-auto text-white font-bold text-xs px-5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              >
                {isEvaluating ? (
                  <>Analyzing Transcript...</>
                ) : (
                  <>
                    <Award className="w-4 h-4 fill-white text-amber-600" />
                    Complete & Retrieve Report
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your detailed interview response here... (Press Enter to transmit answers to proctor)"
                className="flex-1 bg-slate-50 border border-slate-205 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[44px] max-h-[120px] resize-none leading-relaxed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoadingMessage}
                className="bg-indigo-600 hover:bg-indigo-550 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl w-11 h-11 flex items-center justify-center transition shrink-0 cursor-pointer self-end"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Count user responses in current active room
  const userResponsesCount = currentSession.filter(m => m.role === "user").length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider font-mono">
              Quality Thought AI Placement Recruiter
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">
            Interactive AI Mock Technical Interviews
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Practice section-wise tech interviews styled after real placement reviews. Face 5 consecutive questions from Gemini AI to evaluate your concepts, syntax accuracy, and logical code design.
          </p>
        </div>

        {!isInterviewing && !activeReport && (
          <button
            onClick={() => {
              setSelectedSubject("python");
              setSelectedDifficulty("Junior");
              handleStartInterview();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-550/20 shadow-md text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Launch Quick Interview
          </button>
        )}
      </div>      {isInterviewing && isVisualRoom ? (
        /* SPECIAL DUAL PANEL FOR PREMIUM PROCTORED MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* CHAT SESSION (60%) */}
          <div className="lg:col-span-7">
            {renderActiveChat(true)}
          </div>
          
          {/* VISUAL MONITORING HUD (40%) */}
          <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between h-[540px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <div>
                    <h4 className="text-[11px] font-black text-white uppercase font-sans tracking-widest leading-none">
                      Proctoring Panel Diagnostics
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-1">Continuous AI validation feed & telemetry.</p>
                  </div>
                </div>
                <span className="text-[9px] bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded border border-red-550/20 flex items-center gap-1 uppercase font-mono shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> REC SECURE
                </span>
              </div>

              {/* WEBCAM SIMULATOR */}
              <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-850 relative">
                <div className="absolute top-2.5 left-2.5 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono tracking-widest text-slate-300 uppercase flex items-center gap-1 font-bold">
                  Camera Feed
                </div>
                <canvas ref={webcamCanvasRef} width={340} height={170} className="w-full h-[170px] block bg-slate-950" />
                <div className="bg-slate-900/90 border-t border-slate-850 p-2 flex items-center justify-between text-[8px] font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>BIOMETRICS SECURED</span>
                  </div>
                  <span className="text-emerald-400 font-bold">[Face Matched: 99.4%]</span>
                </div>
              </div>
            </div>

            {/* AUDIO SOUND WAVE */}
            <div className="bg-slate-900 rounded-xl border border-slate-850 p-3.5 space-y-1.5 relative overflow-hidden">
              <div className="flex justify-between items-center text-[8px] font-mono">
                <span className="text-slate-405 font-bold uppercase flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-indigo-400 animate-bounce" /> Sound Level Stream
                </span>
                <span className="text-emerald-400 font-bold">[ONLINE]</span>
              </div>
              <canvas ref={voiceCanvasRef} width={340} height={35} className="w-full h-[35px] block opacity-90" />
            </div>

            {/* LIVE PROCTOR SECURITY LOG */}
            <div className="bg-black/95 p-3 rounded-xl border border-slate-850 font-mono text-[9px] space-y-1 shrink-0">
              <div className="text-slate-500 font-bold text-[8px] uppercase tracking-wider border-b border-slate-900 pb-1 mb-1.5 flex justify-between">
                <span>Intelligent Watchdog Streams</span>
                <span className="text-indigo-400">Ver 1.2</span>
              </div>
              <div className="space-y-1 font-mono max-h-[80px] overflow-y-auto pr-1">
                {proctorLogs.slice(0, 4).map((log, lIdx) => (
                  <div key={lIdx} className="leading-normal font-mono text-[9.5px] text-slate-400 truncate">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD VIEW PORTALS */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: ACTIVE INTERVIEW ROOM OR ACTIVE REPORT PREVIEW */}
          <div className="lg:col-span-2 space-y-6">
            {isInterviewing ? (
              renderActiveChat(false)
            ) : activeReport ? (
            /* DETAILED REPORT PREVIEW BOARD */
            <div className="bg-white rounded-2xl border border-slate-205 overflow-hidden shadow-sm space-y-6">
              {/* Detailed Report Active Title Header */}
              <div className="bg-slate-900 px-5 py-4 border-b border-indigo-950 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <div>
                    <h3 className="text-xs font-extrabold font-display uppercase tracking-wider leading-none">
                      Placement Grade Card & detailed Report
                    </h3>
                    <p className="text-[10px] text-slate-300 mt-1 font-mono">
                      Subject: {getSubjectName(activeReport.subject)} &bull; {activeReport.difficulty} Difficulty Level
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveReport(null)}
                  className="bg-slate-800 hover:bg-slate-705 text-xs text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition"
                >
                  Close Evaluation
                </button>
              </div>

              {/* REPORT OVERVIEW DATA BLOCKS */}
              <div className="px-6 space-y-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Score circle */}
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl text-center flex flex-col justify-center items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Aptitude Score
                    </span>
                    <span className="text-4xl font-extrabold text-indigo-700 leading-tight font-mono mt-1">
                      {activeReport.report?.score || "N/A"}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                      out of 100 points
                    </span>
                  </div>

                  {/* Highlights Summary text box */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl md:col-span-3">
                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block font-mono">
                      Executive Summary & Performance Notes
                    </span>
                    <p className="text-xs font-medium text-slate-700 mt-1.5 leading-relaxed italic">
                      &ldquo;{activeReport.report?.summary}&rdquo;
                    </p>
                  </div>
                </div>

                {/* STRENGTHS AND WEAKNESS BRICKS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <UserCheck className="w-4.5 h-4.5 text-emerald-600" />
                      <h4 className="text-xs font-extrabold text-emerald-900 uppercase font-sans tracking-wide">
                        Evaluated Core Strengths
                      </h4>
                    </div>
                    <ul className="space-y-1.5 pl-1 text-[11px] text-emerald-800 leading-relaxed font-medium">
                      {(activeReport.report?.strengths || []).map((str, sIdx) => (
                        <li key={sIdx} className="flex gap-2 items-start">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lightbulb className="w-4.5 h-4.5 text-amber-600" />
                      <h4 className="text-xs font-extrabold text-amber-905 uppercase font-sans tracking-wide">
                        Core Code Gaps / Key Improvements
                      </h4>
                    </div>
                    <ul className="space-y-1.5 pl-1 text-[11px] text-amber-800 leading-relaxed font-medium">
                      {(activeReport.report?.improvements || []).map((imp, wIdx) => (
                        <li key={wIdx} className="flex gap-2 items-start">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* DETAILED EVALUATION MARKDOWN SECTION */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-2">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase font-sans">
                      Section-by-Section Assessment Transcript
                    </h4>
                  </div>

                  <div className="prose max-w-none">
                    {renderMarkdown(activeReport.report?.detailedEvaluation || "")}
                  </div>
                </div>

                {/* SHOW DIALOG TRANSCRIPT CONVERSATION LOGS */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/60 overflow-hidden">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase font-sans mb-3 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-slate-600" /> Full Chat Room Dialog History
                  </h4>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                    {activeReport.messages.map((m, mIdx) => (
                      <div key={mIdx} className="text-xs space-y-0.5 font-sans leading-relaxed">
                        <span className={`font-mono text-[9px] uppercase tracking-wider ${
                          m.role === 'user' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                        }`}>
                          {m.role === 'user' ? student.name : 'AI RECRUITER'}
                        </span>
                        <div className={`p-2 rounded-lg text-slate-700 ${
                          m.role === 'user' ? 'bg-indigo-50/50' : 'bg-white border rounded'
                        }`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* DEFAULT FORM SETUP SCREEN */
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                    New Mock Recruiter Room Setup
                  </h3>
                  <p className="text-[10px] text-slate-400">Configure parameters before establishing AI session connection.</p>
                </div>
              </div>

              {/* OPERATING HOURS SYSTEM BANNER */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                (currentTime.getHours() >= 7 && currentTime.getHours() < 22) || bypassTiming
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                  : "bg-rose-50/70 border-rose-200 text-rose-950"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                    (currentTime.getHours() >= 7 && currentTime.getHours() < 22) || bypassTiming ? "bg-emerald-100 text-emerald-700 animate-pulse" : "bg-rose-100 text-rose-700"
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold uppercase font-sans tracking-wide">
                        Recruiter Room Hours (07:00 AM - 10:00 PM)
                      </span>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        (currentTime.getHours() >= 7 && currentTime.getHours() < 22) ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-850"
                      }`}>
                        {(currentTime.getHours() >= 7 && currentTime.getHours() < 22) ? "🟢 Open" : "🔴 Outside Hours"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Placement recruiters conduct live AI evaluation sessions from morning 7 AM to night 10 PM.
                      <span className="font-mono text-slate-800 block mt-0.5 font-bold">
                        Live Clock Time: {currentTime.toLocaleTimeString()} ({((currentTime.getHours() >= 7 && currentTime.getHours() < 22) || bypassTiming) ? "Available" : "On Standby"})
                      </span>
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setBypassTiming(!bypassTiming)}
                  className="text-[9px] font-mono font-bold bg-white text-zinc-700 hover:text-indigo-600 border px-2.5 py-1.5 rounded-xl shadow-xs self-stretch md:self-auto transition flex items-center justify-center gap-1 shrink-0"
                >
                  {bypassTiming ? "🔒 STRICT WINDOW ON" : "🔓 BYPASS WINDOW (TESTING)"}
                </button>
              </div>

              {/* DUAL MODE SELECTOR TAB BAR */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomMaterial(false);
                    setMaterialError("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    !useCustomMaterial
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🏫 Standard Syllabus Tracks
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomMaterial(true);
                    setMaterialError("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    useCustomMaterial
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📁 Custom Material (PDF / Excel / CSV / Docs)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* COLUMN 1: SUBJECT / SYLLABUS SELECTOR OR CUSTOM FILE UPLOADER */}
                {!useCustomMaterial ? (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      Syllabus Section / Core Subject
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SYLLABUS.map((subj) => {
                        const isSel = selectedSubject === subj.slug;
                        return (
                          <button
                            key={subj.slug}
                            type="button"
                            onClick={() => setSelectedSubject(subj.slug)}
                            className={`text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                              isSel
                                ? "border-indigo-600 bg-indigo-50/90 text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-500"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50/80"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1 text-xs truncate">
                              <span className={`p-1 rounded-md shrink-0 flex items-center justify-center ${isSel ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                                {subj.slug === "python" && <Code2 className="w-3.5 h-3.5" />}
                                {subj.slug === "numpy" && <Activity className="w-3.5 h-3.5" />}
                                {subj.slug === "pandas" && <FileCode className="w-3.5 h-3.5" />}
                                {subj.slug === "ml" && <Brain className="w-3.5 h-3.5" />}
                                {subj.slug === "dl" && <Brain className="w-3.5 h-3.5" />}
                                {subj.slug === "nlp" && <MessageSquare className="w-3.5 h-3.5" />}
                                {subj.slug === "genai" && <Sparkles className="w-3.5 h-3.5" />}
                                {subj.slug === "eda" && <TrendingUp className="w-3.5 h-3.5" />}
                              </span>
                              <span className="font-extrabold truncate leading-none">{subj.name}</span>
                            </div>
                            <span className="text-[9px] font-mono block mt-1 uppercase text-slate-400 font-semibold truncate leading-none">
                              Day {subj.startDay} - {subj.endDay}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Subject Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-950 font-mono">
                        Target Tech Subject / Topic Title
                      </label>
                      <input
                        type="text"
                        value={customSubjectName}
                        onChange={(e) => setCustomSubjectName(e.target.value)}
                        placeholder="e.g. Advanced Excel Formulas & Macros, Sales CSV"
                        className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                      />
                    </div>

                    {/* File Drop / Select Container */}
                    <div className="border border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60 transition rounded-xl p-4 flex flex-col justify-center items-center text-center space-y-2 relative border-dashed">
                      <Upload className="w-7 h-7 text-indigo-500 animate-bounce" />
                      <div className="text-xs">
                        <span className="font-bold text-indigo-700 block">Select Placement Reference Document</span>
                        <span className="text-[10px] text-zinc-500">Pick raw study guide notes or text sheets (.txt, .csv, .py, .md)</span>
                      </div>
                      <input
                        type="file"
                        accept=".txt,.md,.py,.csv,.tsv,.json,.js,.html,text/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadedFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setCustomInterviewMaterial(evt.target?.result as string);
                            // Auto populate subject label if it matches defaults
                            const cleanedName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                            setCustomSubjectName(cleanedName.substring(0, 50).toUpperCase());
                          };
                          reader.readAsText(file);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {uploadedFileName && (
                        <span className="text-[9px] text-indigo-800 font-mono font-bold bg-indigo-100 px-2 py-0.5 rounded">
                          ✓ {uploadedFileName}
                        </span>
                      )}
                    </div>

                    {/* Manual copy paste textarea */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-slate-450 font-mono">
                        <label>Or Paste Syllabus / PDF Extract / CSV Data</label>
                        {customInterviewMaterial && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomInterviewMaterial("");
                              setUploadedFileName("");
                            }}
                            className="text-rose-650 hover:text-rose-800 font-bold lowercase font-mono"
                          >
                            [clear]
                          </button>
                        )}
                      </div>
                      <textarea
                        value={customInterviewMaterial}
                        onChange={(e) => setCustomInterviewMaterial(e.target.value)}
                        placeholder="Paste PDF notes text paragraphs, Excel sheet formulas, CSV data tables, cheat sheets, or core concepts details..."
                        rows={5}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-505 focus:outline-none leading-relaxed placeholder:text-slate-400"
                      />
                    </div>

                    {customInterviewMaterial && (
                      <div className="text-[10px] bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded border border-emerald-150 font-mono font-semibold flex items-center justify-between">
                        <span>Payload status: <strong>{customInterviewMaterial.length}</strong> characters uploaded</span>
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                )}

                {/* COLUMN 2: DIFFICULTY SELECTOR & WARNS */}
                <div className="space-y-4">
                  {/* ACADEMIC ELIGIBILITY STATUS CARD */}
                  {!useCustomMaterial && (
                    <div className="bg-slate-50 border border-slate-205 p-4 rounded-xl space-y-3 shadow-xs">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-450">
                          Interview Gateway Status
                        </span>
                        <span className={`text-[9px] font-mono font-black py-0.5 px-2.5 rounded-full ${
                          isEligible ? "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20" : "bg-rose-500/10 text-rose-850 border border-rose-500/20"
                        }`}>
                          {isEligible ? "🔓 ELIGIBLE" : "🔒 BLOCKED"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-150">
                          <span className="text-[9px] text-slate-400 block font-mono font-semibold uppercase leading-none mb-1">Assessment Score</span>
                          <span className={`font-black ${isEligible ? "text-slate-900" : "text-amber-600"}`}>
                            {scoreVal !== null ? `${scoreVal}%` : "0% (No Record)"}
                          </span>
                          <span className="text-[8px] text-slate-400 block">(Minimum 60% required)</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-150">
                          <span className="text-[9px] text-slate-400 block font-mono font-semibold uppercase leading-none mb-1">Chances Remaining</span>
                          <span className={`font-black ${maxAttemptsExhausted ? "text-rose-600" : "text-indigo-650"}`}>
                            {3 - currentSubjectAttempts} of 3 left
                          </span>
                          <span className="text-[8px] text-slate-400 block">({currentSubjectAttempts}/3 attempts used)</span>
                        </div>
                      </div>

                      {!isEligible && (
                        <p className="text-[10.5px] text-rose-700 leading-normal font-sans font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-100/50">
                          ⚠️ <strong>Action Required:</strong> You must attempt and score at least 60% on the Comprehensive Assessment under the <strong>Subject Assessments</strong> tab to proceed, or ask instructor Vinay for an access bypass.
                        </p>
                      )}

                      {maxAttemptsExhausted && (
                        <p className="text-[10.5px] text-rose-700 leading-normal font-sans font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-100/50">
                          ⚠️ <strong>Max attempts reached:</strong> You have exhausted all 3 interview chances. Contact Professor Vinay to grant a reset of your attempts.
                        </p>
                      )}

                      {matchingOverride?.eligibilityBypass && (
                        <div className="text-[10px] text-purple-850 font-bold bg-purple-100/60 p-2 rounded border border-purple-200/50 flex items-center gap-1 font-mono">
                          ★ ACTIVE OVERRIDE: INSTRUCTOR ELIGIBILITY BYPASS GRANTED
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      Placement Target Complexity Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Junior", "Mid-Level", "Senior"].map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setSelectedDifficulty(diff)}
                          className={`py-3.5 rounded-xl border text-xs font-bold font-sans transition flex flex-col items-center justify-center cursor-pointer gap-0.5 ${
                            selectedDifficulty === diff
                              ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{diff}</span>
                          <span className={`${
                            selectedDifficulty === diff ? "text-indigo-200" : "text-slate-400"
                          } text-[8px] uppercase tracking-widest font-mono font-normal`}>
                            {diff === "Junior" ? "Associate" : diff === "Mid-Level" ? "Engineer" : "Principal"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PREMIUM PROCTORING SECTION */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                        <div>
                          <h4 className="text-[10px] font-black uppercase font-sans tracking-wider text-slate-200 leading-none">
                            Premium Face Proctoring Mode
                          </h4>
                          <p className="text-[9px] text-indigo-200 mt-1 leading-tight">
                            Live face match & environment watchdog audio diagnostics.
                          </p>
                        </div>
                      </div>
                      
                      <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded tracking-wide ${
                        (hasCompletedPython || forceUnlockVisual)
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}>
                        {(hasCompletedPython || forceUnlockVisual) ? "🔓 UNLOCKED" : "🔒 CONSTRAINED"}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10.5px]">
                          <p className="font-bold text-slate-100 font-sans leading-none">
                            Enable Video Biometrics & Audio Waves?
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                            Unlocks once Python is completed (to prevent tab-switching).
                          </p>
                        </div>
                        
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={isVisualRoom}
                            onChange={(e) => {
                              if (!hasCompletedPython && !forceUnlockVisual) {
                                alert("Please complete at least one Python quiz on your dayboard first or click the Master Demo Bypass!");
                                return;
                              }
                              setIsVisualRoom(e.target.checked);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                        </label>
                      </div>

                      {!hasCompletedPython && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t border-slate-850 pt-2 text-[9px] text-indigo-200">
                          <span className="font-medium font-sans text-amber-500">
                            ⚠️ Python course incompleteness block.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextState = !forceUnlockVisual;
                              setForceUnlockVisual(nextState);
                              if (nextState) setIsVisualRoom(true);
                            }}
                            className="text-[8px] font-mono font-bold text-indigo-400 hover:text-white underline text-left cursor-pointer uppercase font-semibold leading-none"
                          >
                            {forceUnlockVisual ? "[re-lock block]" : "[⚡ bypass lock for demo]"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 leading-relaxed space-y-1 shrink-0">
                    <p className="font-bold flex items-center gap-1 text-amber-950 uppercase font-sans">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Interview Session Instructions:
                    </p>
                    <p className="text-[11px] text-amber-800 font-sans leading-tight">
                      {useCustomMaterial
                        ? "Gemini will customize all five interactive questions around your provided document formulas and datasets. Score progress will write to Class Records."
                        : "You can exit the room halfway or re-take subjects as many times as needed. Your scores write to the Batch performance dashboard."}
                    </p>
                  </div>

                  {materialError && (
                    <div className="text-xs bg-red-50 text-rose-600 border border-red-200 p-3 rounded-lg font-medium">
                      ❌ {materialError}
                    </div>
                  )}

                  <button
                    onClick={handleStartInterview}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-3"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Enter AI Board Exam Room
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PAST HISTORICAL AI INTERVIEWS GRID */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-205 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-1">
              <History className="w-4 h-4 text-slate-600" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                Your Exam Room History
              </h3>
            </div>

            {loadingPast ? (
              <div className="text-xs text-slate-400 italic text-center py-6">
                Loading student transcript records...
              </div>
            ) : pastInterviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs leading-none font-medium">No saved mock interviews yet.</p>
                <p className="text-[10px] text-slate-400 leading-tight">Pick a subject on the left to start practice session.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {pastInterviews.map((item) => {
                  const dateLabel = new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveReport(item);
                        setIsInterviewing(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 text-xs cursor-pointer ${
                        activeReport?.id === item.id
                          ? "border-indigo-600 bg-indigo-50/40"
                          : "border-slate-150 bg-slate-50/40 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1 font-sans truncate pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 text-xs truncate">
                            {getSubjectName(item.subject)}
                          </span>
                          <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-wider shrink-0">
                            {item.difficulty}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium font-mono">{dateLabel}</p>
                      </div>

                      <div className="text-right flex items-center gap-1 shrink-0">
                        <div className="bg-white px-2.5 py-1.5 border border-indigo-150 rounded-lg text-center min-w-[44px]">
                          <span className="text-[8px] text-slate-400 block font-mono font-bold leading-none uppercase mb-0.5">SCORE</span>
                          <span className="text-xs font-extrabold text-indigo-600 font-mono">
                            {item.report?.score || "N/A"}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);
}
