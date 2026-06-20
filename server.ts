import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { generateQuizForDay, generateQuizFromMaterial } from "./src/quizGenerator.js";
import { DayQuiz, Student, CourseLockState, AIInterview, InterviewMessage } from "./src/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

const DB_FILE = path.join(process.cwd(), "db.json");

// Define basic database structure
interface AssessmentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  batch: string;
  courseSlug: string;
  score: number; // 0-100 percentage
  submittedAt: string;
}

interface TeacherOverride {
  id: string;
  studentId: string;
  courseSlug: string;
  resetAttempts: boolean;
  eligibilityBypass: boolean;
}

interface AppDatabase {
  batches: string[];
  students: Student[];
  locks: Record<string, CourseLockState>;
  submissions: any[];
  quizzes: Record<number, DayQuiz>;
  interviews?: AIInterview[];
  assessments?: AssessmentSubmission[];
  overrides?: TeacherOverride[];
}

const DEFAULT_DB: AppDatabase = {
  batches: [
    "Batch A (Data Science)",
    "Batch B (AI & ML)",
    "Batch C (Big Data)"
  ],
  students: [
    { id: "st-1", name: "Arjun Sharma", rollNumber: "DS2026-001", email: "arjun.sharma@college.edu", batch: "Batch A (Data Science)" },
    { id: "st-2", name: "Priya Patel", rollNumber: "DS2026-002", email: "priya.patel@college.edu", batch: "Batch A (Data Science)" },
    { id: "st-3", name: "Rohan Das", rollNumber: "DS2026-003", email: "rohan.das@college.edu", batch: "Batch A (Data Science)" }
  ],
  locks: {
    "Batch A (Data Science)": {
      batchName: "Batch A (Data Science)",
      unlockedCourses: ["python"],
      unlockedDays: [1, 2, 3],
      courseLockState: {
        python: false,
        numpy: true,
        pandas: true,
        ml: true,
        dl: true,
        nlp: true,
        genai: true,
        eda: true
      }
    }
  },
  submissions: [],
  quizzes: {},
  interviews: [],
  assessments: [],
  overrides: []
};

function readDB(): AppDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const data = JSON.parse(content);
      if (!data.interviews) {
        data.interviews = [];
      }
      if (!data.assessments) {
        data.assessments = [];
      }
      if (!data.overrides) {
        data.overrides = [];
      }
      return data;
    }
  } catch (err) {
    console.error("Error reading database file, using fallback:", err);
  }
  // Store default
  writeDB(DEFAULT_DB);
  return DEFAULT_DB;
}


function writeDB(data: AppDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

// 1. Teacher password verification
app.post("/api/auth/teacher", (req, res) => {
  const { password } = req.body;
  if (password === "vinay@2003") {
    res.json({ success: true, token: "teacher-valid-token-vinay-2003" });
  } else {
    res.status(401).json({ success: false, error: "Incorrect teacher password" });
  }
});

// 2. Fetch complete DB info
app.get("/api/db", (req, res) => {
  const db = readDB();
  res.json(db);
});

// 3. Batches management
app.post("/api/batches", (req, res) => {
  const { batchName } = req.body;
  if (!batchName || typeof batchName !== "string") {
    res.status(400).json({ error: "Invalid batch name" });
    return;
  }
  const db = readDB();
  const trimmed = batchName.trim();
  if (db.batches.includes(trimmed)) {
    res.status(400).json({ error: "Batch already exists" });
    return;
  }
  db.batches.push(trimmed);

  // Initialize locked course state for new batch
  db.locks[trimmed] = {
    batchName: trimmed,
    unlockedCourses: ["python"],
    unlockedDays: [1, 2],
    courseLockState: {
      python: false,
      numpy: true,
      pandas: true,
      ml: true,
      dl: true,
      nlp: true,
      genai: true,
      eda: true
    }
  };

  writeDB(db);
  res.json({ success: true, batches: db.batches, locks: db.locks });
});

// 4. Students list management
app.post("/api/students", (req, res) => {
  const { name, rollNumber, email, phoneNumber, batch } = req.body;
  if (!name || !rollNumber || !batch) {
    res.status(400).json({ error: "Missing required student attributes" });
    return;
  }
  const db = readDB();
  const newStudent: Student = {
    id: "st-" + Date.now().toString(36),
    name: name.trim(),
    rollNumber: rollNumber.trim().toUpperCase(),
    email: (email || "").trim(),
    phoneNumber: (phoneNumber || "").trim(),
    batch: batch.trim()
  };

  // Prevent duplicate roll numbers
  const exists = db.students.some(s => s.rollNumber.toLowerCase() === newStudent.rollNumber.toLowerCase());
  if (exists) {
    res.status(400).json({ error: `Roll Number ${newStudent.rollNumber} is already registered` });
    return;
  }

  db.students.push(newStudent);
  writeDB(db);
  res.json({ success: true, student: newStudent, students: db.students });
});

// Import bulk student data (Accepts CSV formats or newline text lists)
app.post("/api/students/import", (req, res) => {
  const { textData, batch } = req.body;
  if (!textData || !batch) {
    res.status(400).json({ error: "Missing textData or batch" });
    return;
  }

  const db = readDB();
  const lines = textData.split("\n");
  const imported: Student[] = [];
  let duplicateCount = 0;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Detect CSV or custom separator
    let name = "";
    let rollNumber = "";
    let email = "";
    let phoneNumber = "";

    if (line.includes(",") || line.includes("\t")) {
      const delimiter = line.includes("\t") ? "\t" : ",";
      const parts = line.split(delimiter);
      rollNumber = parts[0]?.trim() || "";
      name = parts[1]?.trim() || "";
      email = parts[2]?.trim() || "";
      phoneNumber = parts[3]?.trim() || "";
    } else {
      // Assuming a space separated or just roll number/name
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        rollNumber = parts[0].trim();
        name = parts.slice(1).join(" ").trim();
      } else {
        rollNumber = line;
        name = "Student " + rollNumber;
      }
    }

    if (!rollNumber || !name) continue;
    rollNumber = rollNumber.toUpperCase();

    // Check duplicate in db
    const exists = db.students.some(s => s.rollNumber.toUpperCase() === rollNumber.toUpperCase());
    if (exists) {
      duplicateCount++;
      continue;
    }

    const student: Student = {
      id: "st-" + Math.random().toString(36).substring(2, 9),
      name,
      rollNumber,
      email,
      phoneNumber,
      batch
    };
    imported.push(student);
    db.students.push(student);
  }

  writeDB(db);
  res.json({
    success: true,
    importedCount: imported.length,
    duplicateCount,
    students: db.students
  });
});

app.delete("/api/students/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.students = db.students.filter(s => s.id !== id);
  writeDB(db);
  res.json({ success: true, students: db.students });
});

// 5. Quiz questions fetching & dynamic caching
app.get("/api/quiz/:day", async (req, res) => {
  const day = parseInt(req.params.day, 10);
  const regenerate = req.query.regenerate === "true";
  
  if (isNaN(day) || day < 1 || day > 200) {
    res.status(400).json({ error: "Day must be between 1 and 200" });
    return;
  }

  const db = readDB();
  if (!regenerate && db.quizzes && db.quizzes[day]) {
    res.json(db.quizzes[day]);
    return;
  }

  // Make sure quizzes is defined
  if (!db.quizzes) db.quizzes = {};

  try {
    // Generate dynamically using Gemini or Fallback
    const quiz = await generateQuizForDay(day);
    db.quizzes[day] = quiz;
    writeDB(db);
    res.json(quiz);
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: "Failed to generate quiz questions" });
  }
});

// Submit/Cache custom questions from Teacher panel (override)
app.post("/api/quiz/:day/override", (req, res) => {
  const day = parseInt(req.params.day, 10);
  const quizData = req.body;
  if (isNaN(day) || day < 1 || day > 200) {
    res.status(400).json({ error: "Day must be between 1 and 200" });
    return;
  }
  const db = readDB();
  if (!db.quizzes) db.quizzes = {};
  db.quizzes[day] = quizData;
  writeDB(db);
  res.json({ success: true, quiz: quizData });
});

// Dynamic generation of 10 questions from user course material document
app.post("/api/quiz/generate-from-material", async (req, res) => {
  const { materialText, dayNumber, courseSlug, topicTitle } = req.body;
  const day = parseInt(dayNumber, 10);

  if (!materialText || !materialText.trim()) {
    res.status(400).json({ error: "Course content material text is required to generate questions." });
    return;
  }
  if (isNaN(day) || day < 1 || day > 200) {
    res.status(400).json({ error: "Selected Day must be between 1 and 200 and represent an active day to override." });
    return;
  }

  try {
    const slug = courseSlug || "python";
    const topic = topicTitle || `Course Material Chapter - Day ${day}`;

    // Call dynamic Gemini generator
    const customQuiz = await generateQuizFromMaterial(materialText, day, slug, topic);
    
    // Auto persist into database for immediate availability
    const db = readDB();
    if (!db.quizzes) db.quizzes = {};
    db.quizzes[day] = customQuiz;
    writeDB(db);

    res.json({ success: true, quiz: customQuiz });
  } catch (error: any) {
    console.error("Failed generating material quiz:", error);
    res.status(500).json({ error: error.message || "Failed to parse or generate quiz from supplied teaching content." });
  }
});

// 6. Submissions/Attendance actions
app.post("/api/submissions", (req, res) => {
  const { studentId, studentName, rollNumber, batch, dayNumber, courseSlug, score, mcqScores, codingSubmissions } = req.body;

  if (!studentId || isNaN(dayNumber)) {
    res.status(400).json({ error: "Missing required submission parameters" });
    return;
  }

  const db = readDB();
  const submission = {
    id: "sub-" + Date.now().toString(36),
    studentId,
    studentName,
    rollNumber,
    batch,
    dayNumber,
    courseSlug,
    score: Number(score),
    mcqScores: Number(mcqScores),
    codingSubmissions: codingSubmissions || [],
    submittedAt: new Date().toISOString()
  };

  // Prevent multiple submits for same day/student
  db.submissions = db.submissions.filter(sub => !(sub.studentId === studentId && sub.dayNumber === dayNumber));
  db.submissions.push(submission);
  writeDB(db);

  res.json({ success: true, submission });
});

// 7. Lock/Unlock status updates
app.post("/api/lock-status", (req, res) => {
  const { batchName, unlockedCourses, unlockedDays, courseLockState } = req.body;
  if (!batchName) {
    res.status(400).json({ error: "Batch name is required" });
    return;
  }

  const db = readDB();
  db.locks[batchName] = {
    batchName,
    unlockedCourses: unlockedCourses || [],
    unlockedDays: unlockedDays || [],
    courseLockState: courseLockState || {}
  };

  writeDB(db);
  res.json({ success: true, locks: db.locks });
});

// 7a. Submit a subject assessment score
app.post("/api/assessments/submit", (req, res) => {
  const { studentId, studentName, rollNumber, batch, courseSlug, score } = req.body;
  if (!studentId || !courseSlug || score === undefined) {
    res.status(400).json({ error: "Missing required parameters to submit assessment." });
    return;
  }

  const db = readDB();
  if (!db.assessments) db.assessments = [];

  const submission: AssessmentSubmission = {
    id: "asm-" + Date.now().toString(36),
    studentId,
    studentName,
    rollNumber,
    batch,
    courseSlug,
    score: Number(score),
    submittedAt: new Date().toISOString()
  };

  // Keep highest score
  const index = db.assessments.findIndex(a => a.studentId === studentId && a.courseSlug === courseSlug);
  if (index !== -1) {
    if (Number(score) > db.assessments[index].score) {
      db.assessments[index].score = Number(score);
      db.assessments[index].submittedAt = submission.submittedAt;
    }
  } else {
    db.assessments.push(submission);
  }

  writeDB(db);
  res.json({ success: true, assessments: db.assessments });
});

// 7b. Submit a teacher eligibility or attempts reset override
app.post("/api/overrides/submit", (req, res) => {
  const { studentId, courseSlug, resetAttempts, eligibilityBypass } = req.body;
  if (!studentId || !courseSlug) {
    res.status(400).json({ error: "Missing required student ID or course slug." });
    return;
  }

  const db = readDB();
  if (!db.overrides) db.overrides = [];

  // Remove existing override to replace it
  db.overrides = db.overrides.filter(o => !(o.studentId === studentId && o.courseSlug === courseSlug));

  // Add override
  db.overrides.push({
    id: "ovr-" + Date.now().toString(36),
    studentId,
    courseSlug,
    resetAttempts: !!resetAttempts,
    eligibilityBypass: !!eligibilityBypass
  });

  // If resetAttempts is true, we can also delete past interviews for that student & subject to reflect instantly!
  if (resetAttempts) {
    if (db.interviews) {
      db.interviews = db.interviews.filter(item => !(item.studentId === studentId && item.subject.toLowerCase() === courseSlug.toLowerCase()));
    }
  }

  writeDB(db);
  res.json({ success: true, overrides: db.overrides });
});

// Lazy-initialize Gemini API client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
    try {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      return aiClient;
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI client:", e);
    }
  }
  return null;
}

// 8. AI Interview Routes
app.post("/api/interview/chat", async (req, res) => {
  const { subject, difficulty, messages, customMaterial } = req.body;
  if (!subject || !difficulty) {
    res.status(400).json({ error: "Missing required parameters: subject or difficulty." });
    return;
  }

  const ai = getAi();
  if (!ai) {
    res.status(503).json({ error: "Gemini API key is not configured in the Portal setup. Please ask the administrator to supply process.env.GEMINI_API_KEY." });
    return;
  }

  const userMsgsCount = (messages || []).filter((m: any) => m.role === "user").length;

  if (userMsgsCount >= 5) {
    res.json({
      role: "assistant",
      content: "Thank you for completing all 5 questions in the interview! Your session has been received and scored logs are being processed. Please finalize your interview by clicking on 'Complete & Retrieve Report'.",
      isComplete: true
    });
    return;
  }

  // Get nice subject label from course list if possible
  let systemInstruction = `You are a professional, expert Data Science Technical Recruiter at "Quality Thought Academy".
Your task is to conduct an interactive, step-by-step oral technical interview with a student on the subject of "${subject}" at "${difficulty}" difficulty.

Follow these strict rules:
1. Speak in a helpful, professional, polite, and encouraging tone. Keep your responses short and clear.
2. Ask exactly ONE technical question at a time. Never ask multiple questions in a single response.
3. If the student answers a question, briefly acknowledge if their response was correct or offer a tiny transition, and immediately ask the next question.
4. Always state the question number in your greeting (e.g., "Here is Question X of 5").
5. The interview consists of exactly 5 questions.
6. Once the user has answered the 5th question, thank them professionally and tell them that the interview session is complete and to click the 'Complete and Get Report' button to generate their final score and report.`;

  if (customMaterial && customMaterial.trim()) {
    systemInstruction += `

The interview MUST be based directly on the following uploaded study material/syllabus reference document (e.g. PDF text extracts, CSV structures, Excel formulas sheet or notes paste):
--- BEGIN STUDY MATERIAL ---
${customMaterial}
--- END STUDY MATERIAL ---

Ensure you formulate your technical questions specifically around the methods, formulas, functions, data structures, or concepts covered in this study material.`;
  }

  try {
    const formattedContents = (messages || []).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    if (formattedContents.length === 0) {
      formattedContents.push({
        role: "user",
        parts: [{ text: `Hello! I am ready to begin my interview for ${subject} at ${difficulty} difficulty. Please introduce yourself and ask me the very first technical question (Question 1 of 5).` }]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = response.text || "Could you please repeat your thoughts?";
    res.json({
      role: "assistant",
      content: reply,
      isComplete: false
    });
  } catch (err: any) {
    console.error("[Gemini API] Interview chat error:", err);
    res.status(500).json({ error: `AI chat invocation failed: ${err.message}` });
  }
});

app.post("/api/interview/evaluate", async (req, res) => {
  const { studentId, studentName, rollNumber, batch, subject, difficulty, messages, customMaterial } = req.body;
  if (!studentId || !subject || !difficulty || !messages) {
    res.status(400).json({ error: "Missing required parameters to perform final evaluation." });
    return;
  }

  const ai = getAi();
  if (!ai) {
    res.status(503).json({ error: "Gemini API key is not configured inside the environment secrets." });
    return;
  }

  const transcript = (messages || []).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

  let prompt = `Review this complete tech interview transcript for the subject "${subject}" at "${difficulty}" level.
Student Identity: ${studentName} (Roll Number: ${rollNumber}) in ${batch}.`;

  if (customMaterial && customMaterial.trim()) {
    prompt += `

The interview was specifically tailored based on this study/data material document:
--- BEGIN STUDY MATERIAL ---
${customMaterial}
--- END STUDY MATERIAL ---`;
  }

  prompt += `

Evaluate the student's technical accuracy, practical coding skills, and logical reasoning based exclusively on their replies in this conversation transcript.

Transcript:
"""
${transcript}
"""`;

  const systemInstruction = `You are a high-level academic technical committee advisor evaluation system.
You inspect transcripts of student interviews and output constructive scores and details.
You MUST respond with a JSON object containing the technical score, summary, strengths, improvements, and a beautiful detailed report in clean markdown format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: "Final core score from 0 to 100 based on accuracy and technical competency."
            },
            summary: {
              type: Type.STRING,
              description: "General summary of the performance (2-3 sentences)."
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of top 2-3 specific developer strengths detected."
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of top 2-3 technical gaps that need improvement."
            },
            detailedEvaluation: {
              type: Type.STRING,
              description: "In-depth markdown content detailing correctness, conceptual clarity, syntax, and custom suggestions for improvement."
            }
          },
          required: ["score", "summary", "strengths", "improvements", "detailedEvaluation"]
        }
      }
    });

    const parsedReport = JSON.parse(response.text || "{}");

    const db = readDB();
    if (!db.interviews) {
      db.interviews = [];
    }

    const newInterview: AIInterview = {
      id: "int-" + Date.now().toString(36),
      studentId,
      studentName,
      rollNumber,
      batch,
      subject,
      difficulty,
      messages: messages || [],
      report: parsedReport,
      createdAt: new Date().toISOString()
    };

    db.interviews.push(newInterview);
    writeDB(db);

    res.json({ success: true, interview: newInterview });
  } catch (err: any) {
    console.error("[Gemini API] Evaluation error:", err);
    res.status(500).json({ error: `AI Evaluation synthesis failed: ${err.message}` });
  }
});

// Fetch all saved interviews
app.get("/api/interviews", (req, res) => {
  const db = readDB();
  res.json(db.interviews || []);
});

// Fetch interviews for a single student
app.get("/api/interviews/student/:studentId", (req, res) => {
  const { studentId } = req.params;
  const db = readDB();
  const list = (db.interviews || []).filter(item => item.studentId === studentId);
  res.json(list);
});

// Student login matching batch + rollNumber + phoneNumber
app.post("/api/student/login", (req, res) => {
  const { rollNumber, phoneNumber, batch } = req.body;
  if (!rollNumber || !batch || !phoneNumber) {
    res.status(400).json({ error: "Missing identity credentials. Batch, Roll Number, and Phone Number are required." });
    return;
  }

  const db = readDB();
  const student = db.students.find(
    s => s.batch === batch && s.rollNumber.toUpperCase() === rollNumber.trim().toUpperCase()
  );

  if (student) {
    const sPhone = student.phoneNumber ? student.phoneNumber.trim().replace(/\D/g, "") : "";
    const qPhone = phoneNumber.trim().replace(/\D/g, "");
    
    // If student record has no phone number, auto-save the entered one to secure it dynamically
    if (!sPhone) {
      student.phoneNumber = phoneNumber.trim();
      writeDB(db);
      res.json({ success: true, student });
    } else if (sPhone === qPhone) {
      res.json({ success: true, student });
    } else {
      res.status(401).json({ success: false, error: "Authentication failed. The Phone Number does not match the registered record." });
    }
  } else {
    res.status(404).json({ success: false, error: "Student not found in this batch" });
  }
});

// Integration of Vite server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express Backend] Service online at http://localhost:${PORT}`);
  });
}

startServer();
