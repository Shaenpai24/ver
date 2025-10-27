import React, { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  serverTimestamp,
  writeBatch,
  Timestamp,
  query,
  getDocs,
} from "firebase/firestore";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Flag,
  Loader2,
  Shield,
  Users,
  Upload,
  Play,
  Award,
  FileJson,
  ArrowRightCircle,
} from "lucide-react";

// --- Styles ---
// We are using inline styles to bypass the broken Tailwind build.
const fonts = {
  // Use JetBrains Mono as requested
  body: '"JetBrains Mono", monospace',
};

const colors = {
  bg: "#1A1A1A", // Very dark charcoal
  card: "#242424", // Slightly lighter card background
  border: "#3A3A3A", // Subtle border
  text: "#E0E0E0", // Soft white text
  textMuted: "#888888", // Gray text
  accent: "#00E0E0", // Bright Cyan accent
  accentDark: "#00A0A0",
  green: "#00E090",
  red: "#FF5050",
  yellow: "#FFD000",
};

const styles = {
  // Main App Container
  app: {
    fontFamily: fonts.body,
    backgroundColor: colors.bg,
    color: colors.text,
    minHeight: "100vh",
    padding: "40px",
    boxSizing: "border-box",
  },
  // Centered Content Wrapper
  wrapper: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  // Admin Header
  adminHeader: {
    textAlign: "center",
    marginBottom: "40px",
  },
  adminTitle: {
    fontSize: "42px",
    fontWeight: 600,
    color: colors.accent,
    margin: 0,
  },
  adminSubtitle: {
    fontSize: "18px",
    color: colors.textMuted,
    marginTop: "8px",
  },
  // Layout for Cards
  adminCardLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "32px",
  },
  // Individual Card
  adminCard: {
    backgroundColor: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
  },
  adminCardHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "16px",
  },
  adminCardTitle: {
    fontSize: "24px",
    fontWeight: 600,
    color: colors.text,
    marginLeft: "12px",
  },
  adminCardText: {
    color: colors.textMuted,
    marginBottom: "20px",
    lineHeight: 1.6,
  },
  adminCardSpacer: {
    flexGrow: 1,
  },
  // JSON Pre block
  preBlock: {
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    padding: "16px",
    borderRadius: "4px",
    fontSize: "13px",
    color: colors.yellow,
    overflowX: "auto",
    marginBottom: "24px",
  },
  // Upload Placeholder
  uploadPlaceholder: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: colors.textMuted,
    margin: "24px 0",
  },
  // Status Table
  tableWrapper: {
    backgroundColor: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    marginTop: "32px",
    overflow: "hidden",
  },
  tableHeader: {
    padding: "20px 32px",
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    alignItems: "center",
  },
  tableTitle: {
    fontSize: "20px",
    fontWeight: 600,
    marginLeft: "12px",
  },
  tableContent: {
    padding: "32px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableTh: {
    padding: "12px 16px",
    borderBottom: `1px solid ${colors.border}`,
    textAlign: "left",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontSize: "12px",
  },
  tableTd: {
    padding: "16px",
    borderBottom: `1px solid ${colors.border}`,
  },
  tableRow: {
    transition: "background-color 0.2s",
  },
  // Login/Game View
  centeredForm: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
  },
  formBox: {
    width: "100%",
    maxWidth: "450px",
    backgroundColor: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    padding: "40px",
  },
  formBoxLarge: {
    width: "100%",
    maxWidth: "800px",
    backgroundColor: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    padding: "40px",
  },
  formTitle: {
    textAlign: "center",
    fontSize: "28px",
    fontWeight: 600,
    color: colors.text,
    marginBottom: "32px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    color: colors.textMuted,
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: "4px",
    fontSize: "16px",
    fontFamily: fonts.body,
    boxSizing: "border-box", // Important for padding
  },
  // Game View Specific
  gameHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "20px 32px",
    backgroundColor: colors.card,
    borderBottom: `1px solid ${colors.border}`,
  },
  gameHeaderTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: colors.accent,
  },
  gameHeaderStats: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  gameTimer: {
    display: "flex",
    alignItems: "center",
    fontSize: "18px",
    color: colors.yellow,
    fontWeight: 600,
  },
  gameProgressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: colors.border,
    borderRadius: "4px",
    marginBottom: "24px",
    overflow: "hidden",
  },
  gameProgressBarInner: {
    height: "100%",
    backgroundColor: colors.accent,
    transition: "width 0.3s ease",
  },
  gameQuestionBox: {
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: "4px",
    padding: "24px",
    marginBottom: "24px",
  },
  gameQuestionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: colors.accent,
    marginBottom: "8px",
  },
  gameQuestionPrompt: {
    color: colors.text,
    lineHeight: 1.7,
  },
  // Shared Components
  button: {
    width: "100%",
    textAlign: "center",
    padding: "14px 24px",
    backgroundColor: colors.accent,
    color: colors.bg,
    fontWeight: "bold",
    borderRadius: "4px",
    fontSize: "16px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: fonts.body,
  },
  buttonGreen: {
    backgroundColor: colors.green,
    color: colors.bg,
  },
  buttonRed: {
    backgroundColor: colors.red,
    color: "#FFFFFF",
  },
  buttonYellow: {
    backgroundColor: colors.yellow,
    color: colors.bg,
  },
  errorMessage: {
    color: colors.red,
    fontSize: "14px",
    marginTop: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  loadingScreen: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    color: colors.textMuted,
  },
  loadingText: {
    fontSize: "18px",
    marginTop: "16px",
  },
  // Status Tags
  statusTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "99px",
    fontSize: "12px",
    fontWeight: 600,
  },
  statusTagGreen: {
    backgroundColor: "rgba(0, 224, 144, 0.1)",
    color: colors.green,
  },
  statusTagCyan: {
    backgroundColor: "rgba(0, 224, 224, 0.1)",
    color: colors.accent,
  },
  statusTagGray: {
    backgroundColor: "rgba(136, 136, 136, 0.1)",
    color: colors.textMuted,
  },
};

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyC4zhbtZ5YlFYsodfxXMFED4ZgFoBWv4to",
  authDomain: "escape-1a6de.firebaseapp.com",
  projectId: "escape-1a6de",
  storageBucket: "escape-1a6de.firebasestorage.app",
  messagingSenderId: "747740048623",
  appId: "1:747740048623:web:9c30b79cdfed2757e67f1a",
  measurementId: "G-XJ6JFWC6F2",
};

// --- App and DB Initialization ---
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Admin Configuration ---
const ADMIN_USER_ID = "spJYN3rzcGRkroXjmTJ4nFZu3AF3";

// --- Helper Functions for Firestore Paths ---
const getConfigDocRef = () =>
  doc(db, "artifacts", appId, "public", "data", "game_config", "settings");
const getPublicTeamsCollectionRef = () =>
  collection(db, "artifacts", appId, "public", "data", "teams");
const getPublicTeamDocRef = (userId) =>
  doc(db, "artifacts", appId, "public", "data", "teams", userId);
const getPublicQuestionsCollectionRef = () =>
  collection(db, "artifacts", appId, "public", "data", "questions");
const getPublicQuestionDocRef = (questionId) =>
  doc(db, "artifacts", appId, "public", "data", "questions", questionId);
const getPrivateAnswersCollectionRef = () =>
  collection(db, "artifacts", appId, "private", "data", "answers");
const getUserDocRef = (userId) => doc(db, "artifacts", appId, "users", userId);

// --- Helper Functions ---
const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours.toString()}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// --- Player Rank Component ---
function PlayerRank({ userId }) {
  const [rank, setRank] = useState(null);
  const [totalTeams, setTotalTeams] = useState(0);

  useEffect(() => {
    const teamsRef = getPublicTeamsCollectionRef();
    const unsubscribe = onSnapshot(
      teamsRef,
      (snapshot) => {
        const teamsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // ... (sorting logic is unchanged) ...
        teamsList.sort((a, b) => {
          if (a.endTime && !b.endTime) return -1;
          if (!a.endTime && b.endTime) return 1;
          if (a.endTime && b.endTime) {
            const durationA =
              a.endTime instanceof Timestamp && a.startTime instanceof Timestamp
                ? a.endTime.toDate().getTime() - a.startTime.toDate().getTime()
                : Infinity;
            const durationB =
              b.endTime instanceof Timestamp && b.startTime instanceof Timestamp
                ? b.endTime.toDate().getTime() - b.startTime.toDate().getTime()
                : Infinity;
            return durationA - durationB;
          }
          const partsA = Object.keys(a.partsSolved || {}).length;
          const partsB = Object.keys(b.partsSolved || {}).length;
          if (partsB !== partsA) {
            return partsB - partsA;
          }
          const startA =
            a.startTime instanceof Timestamp
              ? a.startTime.toDate().getTime()
              : Infinity;
          const startB =
            b.startTime instanceof Timestamp
              ? b.startTime.toDate().getTime()
              : Infinity;
          return startA - startB;
        });

        const teamIndex = teamsList.findIndex((team) => team.id === userId);
        setRank(teamIndex !== -1 ? teamIndex + 1 : null);
        setTotalTeams(teamsList.length);
      },
      (error) => {
        console.error("Error getting team ranks:", error);
      },
    );
    return () => unsubscribe();
  }, [userId]);

  if (rank === null || totalTeams === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: "14px",
        color: colors.textMuted,
        fontWeight: 600,
      }}
    >
      <Award
        style={{
          width: "16px",
          height: "16px",
          marginRight: "6px",
          color: colors.yellow,
        }}
      />
      Rank: {rank} / {totalTeams}
    </div>
  );
}

// --- Waiting Room Component ---
function WaitingRoom({ teamName }) {
  return (
    <div style={styles.centeredForm}>
      <div style={styles.formBox}>
        <div style={{ textAlign: "center", position: "relative" }}>
          <Loader2
            style={{
              animation: "spin 1s linear infinite",
              color: colors.accent,
              height: "64px",
              width: "64px",
              marginBottom: "24px",
              margin: "0 auto",
            }}
          />
          <h1
            style={{
              ...styles.formTitle,
              color: colors.accent,
              marginBottom: "12px",
              marginTop: "24px",
            }}
          >
            System Initializing
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: colors.text,
              marginBottom: "8px",
            }}
          >
            Welcome, {teamName}!
          </p>
          <p style={{ fontSize: "16px", color: colors.textMuted }}>
            Please wait for the admin to start the game.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Game View Component ---
function GameView({ user, teamData, gameConfig }) {
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentQuestionId = teamData.currentQuestion;
  const solvedCount = Object.keys(teamData.partsSolved || {}).length;
  const totalQuestions = gameConfig.totalQuestions || 0;

  // 1. Fetch question data (logic unchanged)
  useEffect(() => {
    if (!currentQuestionId) {
      setQuestionData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const getQuestion = async () => {
      try {
        const questionRef = getPublicQuestionDocRef(currentQuestionId);
        const docSnap = await getDoc(questionRef);
        if (docSnap.exists()) {
          setQuestionData(docSnap.data());
        } else {
          setError(`Error: Question "${currentQuestionId}" not found.`);
        }
      } catch (err) {
        setError("Error loading question.");
        console.error("Error loading question:", err);
      }
      setLoading(false);
    };
    getQuestion();
  }, [currentQuestionId]);

  // 2. Handle answer submission (logic unchanged)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !questionData) return;
    setSubmitting(true);
    setError("");
    try {
      const answerRef = doc(
        getPrivateAnswersCollectionRef(),
        currentQuestionId,
      );
      const answerDoc = await getDoc(answerRef);
      if (!answerDoc.exists()) {
        throw new Error("Answer key not found for this question.");
      }
      const correctAnswer = answerDoc.data().correctAnswer;
      const isCorrect =
        answer.trim().toLowerCase() === correctAnswer.toLowerCase();
      if (isCorrect) {
        const nextQuestionId = questionData.nextQuestionId || null;
        const userDocRef = getUserDocRef(user.uid);
        const updatePayload = {
          currentQuestion: nextQuestionId,
          [`partsSolved.${currentQuestionId}`]: serverTimestamp(),
          score: (teamData.score || 0) + 1,
        };
        if (nextQuestionId === null || nextQuestionId === "") {
          updatePayload.endTime = serverTimestamp();
        }
        const publicTeamRef = getPublicTeamDocRef(user.uid);
        const batch = writeBatch(db);
        batch.update(userDocRef, updatePayload);
        batch.update(publicTeamRef, updatePayload);
        await batch.commit();
        setAnswer("");
      } else {
        setError("Incorrect answer. Try again.");
      }
    } catch (err) {
      console.error("Error validating answer:", err);
      setError("Error validating answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Timer (logic unchanged)
  const startTime = teamData.startTime?.toDate();
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!startTime || teamData.endTime) {
      if (teamData.endTime && startTime) {
        setTime(teamData.endTime.toDate().getTime() - startTime.getTime());
      }
      return () => {};
    }
    const timerInterval = setInterval(() => {
      setTime(new Date().getTime() - startTime.getTime());
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [startTime, teamData.endTime]);

  // --- Render Logic ---
  if (loading) {
    return <LoadingScreen message="Loading question..." />;
  }

  // Finished
  if (currentQuestionId === null || teamData.endTime) {
    const finalTimeMs = time;
    return (
      <div style={styles.centeredForm}>
        <div style={styles.formBox}>
          <div style={{ textAlign: "center" }}>
            <CheckCircle
              style={{
                color: colors.green,
                height: "80px",
                width: "80px",
                marginBottom: "24px",
              }}
            />
            <h1
              style={{
                ...styles.formTitle,
                color: colors.green,
                marginBottom: "12px",
              }}
            >
              Challenge Complete!
            </h1>
            <p
              style={{
                fontSize: "18px",
                color: colors.text,
                marginBottom: "24px",
              }}
            >
              Congratulations, {teamData.name}!
            </p>
            <div
              style={{
                backgroundColor: colors.bg,
                padding: "20px",
                borderRadius: "4px",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  ...styles.label,
                  color: colors.textMuted,
                  fontSize: "14px",
                }}
              >
                Final Time:
              </p>
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: 600,
                  color: colors.yellow,
                  margin: "4px 0 0 0",
                }}
              >
                {formatTime(finalTimeMs)}
              </p>
              <p
                style={{
                  ...styles.label,
                  color: colors.textMuted,
                  fontSize: "14px",
                  marginTop: "16px",
                }}
              >
                Final Score:
              </p>
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: 600,
                  color: colors.accent,
                  margin: "4px 0 0 0",
                }}
              >
                {solvedCount} / {totalQuestions}
              </p>
            </div>
            <PlayerRank userId={user.uid} />
          </div>
        </div>
      </div>
    );
  }

  // Active Game
  const progressPercent = totalQuestions
    ? ((solvedCount + 1) / totalQuestions) * 100
    : 0;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <header style={styles.gameHeader}>
        <h1 style={styles.gameHeaderTitle}>{teamData.name}</h1>
        <div style={styles.gameHeaderStats}>
          <PlayerRank userId={user.uid} />
          <div style={styles.gameTimer}>
            <Clock
              style={{ width: "20px", height: "20px", marginRight: "8px" }}
            />
            {startTime ? formatTime(time) : "00:00"}
          </div>
        </div>
      </header>
      <main style={styles.centeredForm}>
        <div style={styles.formBoxLarge}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "12px",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: colors.text,
                margin: 0,
              }}
            >
              Question {solvedCount + 1}
            </h2>
            <div
              style={{
                fontSize: "14px",
                color: colors.textMuted,
                fontWeight: 600,
              }}
            >
              <span>
                {solvedCount + 1} / {totalQuestions || "?"}
              </span>
              <span style={{ margin: "0 12px" }}>|</span>
              <span>
                Score: {solvedCount} / {totalQuestions || "?"}
              </span>
            </div>
          </div>
          <div style={styles.gameProgressBar}>
            <div
              style={{
                ...styles.gameProgressBarInner,
                width: `${progressPercent}%`,
              }}
            ></div>
          </div>
          <div style={styles.gameQuestionBox}>
            <h3 style={styles.gameQuestionTitle}>
              {questionData?.title || "Loading title..."}
            </h3>
            {questionData?.prompt ? (
              <div
                style={styles.gameQuestionPrompt}
                dangerouslySetInnerHTML={{ __html: questionData.prompt }}
              />
            ) : (
              <p style={styles.gameQuestionPrompt}>Loading question text...</p>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="answer" style={styles.label}>
              Your Answer
            </label>
            <input
              id="answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={styles.input}
              placeholder="Type your answer here..."
              required
            />
            {error && (
              <p style={styles.errorMessage}>
                <AlertTriangle style={{ width: "16px", height: "16px" }} />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || !questionData}
              style={{
                ...styles.button,
                marginTop: "24px",
                opacity: submitting || !questionData ? 0.5 : 1,
                cursor: submitting || !questionData ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? (
                <Loader2 style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                "Submit Answer"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

// --- Admin Dashboard Component ---
function AdminDashboard() {
  const [allTeams, setAllTeams] = useState([]);
  const [gameConfig, setGameConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Listeners (logic unchanged)
  useEffect(() => {
    setLoading(true);
    const configRef = getConfigDocRef();
    const unsubscribeConfig = onSnapshot(
      configRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setGameConfig(docSnap.data());
        } else {
          setDoc(configRef, { status: "WAITING" }).catch((err) =>
            console.error("Admin: Error creating default config:", err),
          );
          setGameConfig({ status: "WAITING" });
        }
      },
      (err) => {
        console.error("Admin: Error listening to config:", err);
        setGameConfig({ status: "ERROR" });
      },
    );
    const publicTeamsRef = getPublicTeamsCollectionRef();
    const unsubscribeTeams = onSnapshot(
      publicTeamsRef,
      (snapshot) => {
        const teamsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // ... (sorting logic unchanged) ...
        const teamsWithTime = teamsList.map((team) => {
          let time = "00:00:00";
          const startTimeMs =
            team.startTime instanceof Timestamp
              ? team.startTime.toDate().getTime()
              : null;
          const endTimeMs =
            team.endTime instanceof Timestamp
              ? team.endTime.toDate().getTime()
              : null;
          if (startTimeMs && !endTimeMs) {
            time = formatTime(new Date().getTime() - startTimeMs);
          } else if (startTimeMs && endTimeMs) {
            time = `FINISHED: ${formatTime(endTimeMs - startTimeMs)}`;
          }
          return { ...team, displayTime: time };
        });
        teamsWithTime.sort((a, b) => {
          if (a.endTime && !b.endTime) return -1;
          if (!a.endTime && b.endTime) return 1;
          if (a.endTime && b.endTime) {
            const durationA =
              a.endTime.toDate().getTime() - a.startTime.toDate().getTime();
            const durationB =
              b.endTime.toDate().getTime() - b.startTime.toDate().getTime();
            return durationA - durationB;
          }
          const partsA = Object.keys(a.partsSolved || {}).length;
          const partsB = Object.keys(b.partsSolved || {}).length;
          if (partsB !== partsA) {
            return partsB - partsA;
          }
          const startA = a.startTime
            ? a.startTime.toDate().getTime()
            : Infinity;
          const startB = b.startTime
            ? b.startTime.toDate().getTime()
            : Infinity;
          return startA - startB;
        });
        setAllTeams(teamsWithTime);
        setLoading(false);
      },
      (err) => {
        console.error("Admin: Error listening to teams:", err);
        setLoading(false);
      },
    );
    return () => {
      unsubscribeConfig();
      unsubscribeTeams();
    };
  }, []);

  // --- Admin Actions (logic unchanged) ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const questionsData = JSON.parse(e.target.result);
        const questionsArray = Array.isArray(questionsData)
          ? questionsData
          : questionsData.questions;
        if (!questionsArray || !Array.isArray(questionsArray)) {
          throw new Error(
            "Invalid JSON format. Must be an array or an object with a 'questions' key.",
          );
        }
        const batch = writeBatch(db);
        let validQuestionCount = 0;
        const questionsCollectionRef = getPublicQuestionsCollectionRef();
        const answersCollectionRef = getPrivateAnswersCollectionRef();
        questionsArray.forEach((q) => {
          if (!q.id || q.correctAnswer === undefined) {
            console.warn(
              "Admin: Skipping question without ID or correctAnswer:",
              q,
            );
            return;
          }
          const answerRef = doc(answersCollectionRef, q.id);
          batch.set(answerRef, { correctAnswer: q.correctAnswer });
          const { correctAnswer, ...publicQuestionData } = q;
          const qRef = doc(questionsCollectionRef, q.id);
          batch.set(qRef, publicQuestionData);
          validQuestionCount++;
        });
        const configRef = getConfigDocRef();
        batch.update(configRef, { totalQuestions: validQuestionCount });
        await batch.commit();
        alert(`Uploaded ${validQuestionCount} questions and set total count.`);
      } catch (err) {
        console.error("Admin: Error uploading questions:", err);
        alert(`Upload Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };
  const handleStartGame = async () => {
    if (!confirm("Start game for ALL teams?")) return;
    try {
      const configRef = getConfigDocRef();
      await setDoc(configRef, { status: "STARTED" }, { merge: true });
      const batch = writeBatch(db);
      const currentTime = serverTimestamp();
      const currentTeamsSnapshot = await getDocs(getPublicTeamsCollectionRef());
      let updatedTeamsCount = 0;
      currentTeamsSnapshot.docs.forEach((d) => {
        const team = d.data();
        if (!team.startTime) {
          const privateUserDocRef = getUserDocRef(d.id);
          const publicTeamRef = getPublicTeamDocRef(d.id);
          batch.update(privateUserDocRef, { startTime: currentTime });
          batch.update(publicTeamRef, { startTime: currentTime });
          updatedTeamsCount++;
        }
      });
      await batch.commit();
      alert(`Game Started! Start time set for ${updatedTeamsCount} teams.`);
    } catch (err) {
      console.error("Admin: Error starting game:", err);
      alert("Error starting game.");
    }
  };
  const handleEndGame = async () => {
    if (!confirm("End game for ALL teams?")) return;
    try {
      const configRef = getConfigDocRef();
      await setDoc(configRef, { status: "FINISHED" }, { merge: true });
      alert("Game ended successfully!");
    } catch (err) {
      console.error("Admin: Error ending game:", err);
      alert("Error ending game.");
    }
  };
  const handleRestartGame = async () => {
    if (
      !confirm(
        "Restart game? This will reset ALL team data and clear the leaderboard.",
      )
    )
      return;
    try {
      const configRef = getConfigDocRef();
      await setDoc(configRef, { status: "WAITING" }, { merge: true });
      const batch = writeBatch(db);
      const currentTeamsSnapshot = await getDocs(getPublicTeamsCollectionRef());
      currentTeamsSnapshot.docs.forEach((doc) => {
        const teamId = doc.id;
        const privateUserDocRef = getUserDocRef(teamId);
        const publicTeamRef = getPublicTeamDocRef(teamId);
        batch.delete(privateUserDocRef);
        batch.delete(publicTeamRef);
      });
      await batch.commit();
      alert("Game restarted! All team data has been cleared.");
    } catch (err) {
      console.error("Admin: Error restarting game:", err);
      alert(
        `Error restarting game: ${err.message}. \n\nNOTE: This is almost always a Firestore Rules issue. Make sure your admin UID (${ADMIN_USER_ID}) has 'delete' permissions.`,
      );
    }
  };

  // --- NEW Admin Render (Sexy UI) ---
  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.adminHeader}>
        <h1 style={styles.adminTitle}>Escape Room Control</h1>
        <p style={styles.adminSubtitle}>Manage your quiz experience</p>
      </div>

      {/* 2-Column Layout */}
      <div style={styles.adminCardLayout}>
        {/* Column 1: Upload Questions */}
        <div style={styles.adminCard}>
          <div style={styles.adminCardHeader}>
            <FileJson
              style={{ color: colors.accent, width: "28px", height: "28px" }}
            />
            <h2 style={styles.adminCardTitle}>Upload Questions</h2>
          </div>
          <p style={styles.adminCardText}>
            Upload a JSON file to set the questions for the game.
          </p>
          <pre style={styles.preBlock}>
            {`{\n  "questions": [\n    {\n      "id": "1a",\n      "title": "Question 1",\n      "prompt": "What is 2+2?",\n      "correctAnswer": "4",\n      "nextQuestionId": "1b"\n    }\n  ]\n}`}
          </pre>
          <div style={styles.adminCardSpacer}></div>
          <label
            style={{
              ...styles.button,
              ...styles.buttonGreen,
              cursor: "pointer",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#00C070")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = colors.green)
            }
          >
            <Upload style={{ width: "20px", height: "20px" }} />
            Upload Questions (.json)
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Column 2: Start Game */}
        <div style={styles.adminCard}>
          <div style={styles.adminCardHeader}>
            <ArrowRightCircle
              style={{ color: colors.accent, width: "28px", height: "28px" }}
            />
            <h2 style={styles.adminCardTitle}>Game Control</h2>
          </div>
          <p style={styles.adminCardText}>
            Start, end, or restart the game for all players.
          </p>

          {!loading &&
          (!gameConfig ||
            !gameConfig.totalQuestions ||
            gameConfig.totalQuestions === 0) ? (
            <div style={styles.uploadPlaceholder}>
              <Upload
                style={{ width: "64px", height: "64px", marginBottom: "16px" }}
              />
              <p style={{ fontSize: "16px" }}>Upload questions to begin</p>
            </div>
          ) : (
            <div style={{ ...styles.uploadPlaceholder, textAlign: "left" }}>
              <p style={{ fontSize: "16px", color: colors.green }}>
                {gameConfig?.totalQuestions} questions loaded. Ready to start.
              </p>
            </div>
          )}

          <div style={styles.adminCardSpacer}></div>

          {/* Admin Action Buttons */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <button
              onClick={handleStartGame}
              disabled={
                loading ||
                !gameConfig ||
                !gameConfig.totalQuestions ||
                gameConfig.status === "STARTED" ||
                gameConfig.status === "FINISHED"
              }
              style={{
                ...styles.button,
                opacity:
                  loading ||
                  !gameConfig ||
                  !gameConfig.totalQuestions ||
                  gameConfig.status === "STARTED" ||
                  gameConfig.status === "FINISHED"
                    ? 0.5
                    : 1,
                cursor:
                  loading ||
                  !gameConfig ||
                  !gameConfig.totalQuestions ||
                  gameConfig.status === "STARTED" ||
                  gameConfig.status === "FINISHED"
                    ? "not-allowed"
                    : "pointer",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = colors.accentDark)
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = colors.accent)
              }
            >
              <Play style={{ width: "20px", height: "20px" }} />
              {gameConfig?.status === "STARTED"
                ? "Game in Progress"
                : gameConfig?.status === "FINISHED"
                  ? "Game Finished"
                  : "Start Game"}
            </button>

            {gameConfig?.status === "STARTED" && (
              <button
                onClick={handleEndGame}
                style={{ ...styles.button, ...styles.buttonRed }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#E04040")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = colors.red)
                }
              >
                <Flag style={{ width: "20px", height: "20px" }} />
                End Game
              </button>
            )}

            {gameConfig?.status === "FINISHED" && (
              <button
                onClick={handleRestartGame}
                style={{ ...styles.button, ...styles.buttonYellow }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#E0B800")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = colors.yellow)
                }
              >
                <Play style={{ width: "20px", height: "20px" }} />
                Restart Game
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Team Status Table */}
      <div style={styles.tableWrapper}>
        <div style={styles.tableHeader}>
          <Users
            style={{ color: colors.accent, width: "24px", height: "24px" }}
          />
          <h2 style={styles.tableTitle}>
            Team Status ({allTeams.length} teams)
          </h2>
        </div>
        {loading && gameConfig?.status !== "ERROR" ? (
          <div
            style={{
              ...styles.tableContent,
              textAlign: "center",
              color: colors.textMuted,
            }}
          >
            <Loader2
              style={{
                animation: "spin 1s linear infinite",
                marginRight: "8px",
              }}
            />
            Loading team data...
          </div>
        ) : allTeams.length === 0 ? (
          <div
            style={{
              ...styles.tableContent,
              textAlign: "center",
              color: colors.textMuted,
            }}
          >
            No teams have registered yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableTh}>Team Name</th>
                  <th style={styles.tableTh}>Current Question</th>
                  <th style={styles.tableTh}>Timer</th>
                </tr>
              </thead>
              <tbody>
                {allTeams.map((team) => (
                  <tr
                    key={team.id || team.userId}
                    style={styles.tableRow}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.03)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td
                      style={{
                        ...styles.tableTd,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {team.name || "N/A"}
                      </span>
                    </td>
                    <td
                      style={{
                        ...styles.tableTd,
                        borderBottomColor: colors.border,
                      }}
                    >
                      {team.endTime ? (
                        <span
                          style={{
                            ...styles.statusTag,
                            ...styles.statusTagGreen,
                          }}
                        >
                          <Flag style={{ width: "14px", height: "14px" }} />
                          Finished
                        </span>
                      ) : team.currentQuestion ? (
                        <span
                          style={{
                            ...styles.statusTag,
                            ...styles.statusTagCyan,
                          }}
                        >
                          {team.currentQuestion}
                        </span>
                      ) : (
                        <span
                          style={{
                            ...styles.statusTag,
                            ...styles.statusTagGray,
                          }}
                        >
                          Waiting
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        ...styles.tableTd,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <span style={{ color: colors.yellow, fontWeight: 600 }}>
                        {team.startTime ? team.displayTime : "Not Started"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Utility Components ---
function LoadingScreen({ message }) {
  return (
    <div style={styles.loadingScreen}>
      <Loader2
        style={{
          animation: "spin 1s linear infinite",
          color: colors.accent,
          height: "48px",
          width: "48px",
        }}
      />
      <p style={styles.loadingText}>{message}</p>
    </div>
  );
}

// --- LoginScreen ---
function LoginScreen({ user }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle registration logic (unchanged)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setLoading(true);
    const initialTeamData = {
      name: name.trim(),
      userId: user.uid,
      currentQuestion: "1a",
      startTime: null,
      endTime: null,
      partsSolved: {},
      score: 0,
    };
    try {
      const batch = writeBatch(db);
      const privateUserDocRef = getUserDocRef(user.uid);
      batch.set(privateUserDocRef, initialTeamData);
      const publicTeamRef = getPublicTeamDocRef(user.uid);
      batch.set(publicTeamRef, initialTeamData);
      await batch.commit();
    } catch (error) {
      console.error("Error registering team:", error);
      alert("Error registering team.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.centeredForm}>
      <div style={styles.formBox}>
        <h1 style={styles.formTitle}>Circuit Access</h1>
        <form
          onSubmit={handleRegister}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          <div>
            <label htmlFor="teamName" style={styles.label}>
              Team Designation
            </label>
            <input
              id="teamName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="Enter your team name..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = colors.accentDark)
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = colors.accent)
            }
          >
            {loading ? (
              <Loader2 style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              "Initialize Circuit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- FINAL APP (Main export) ---
export default function App() {
  const [user, setUser] = useState(null);
  const [teamData, setTeamData] = useState(undefined);
  const [gameConfig, setGameConfig] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingError, setLoadingError] = useState(null);

  // Auth Listener (logic unchanged)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const adminCheck = currentUser.uid === ADMIN_USER_ID;
        setIsAdmin(adminCheck);
      } else {
        try {
          if (auth.currentUser) {
          } else if (
            typeof __initial_auth_token !== "undefined" &&
            __initial_auth_token
          ) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("App: Error during initial sign-in attempt:", error);
          setLoadingError("Auth failed.");
        }
      }
      setAuthChecked(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // Data Listeners (logic unchanged)
  useEffect(() => {
    if (!authChecked) return () => {};
    const configRef = getConfigDocRef();
    const unsubscribeConfig = onSnapshot(
      configRef,
      (docSnap) => {
        setGameConfig(
          docSnap.exists() ? docSnap.data() : { status: "WAITING" },
        );
      },
      (error) => {
        console.error("App: Error listening to game config:", error);
        setGameConfig({ status: "ERROR" });
        setLoadingError("Error loading game config.");
      },
    );
    let unsubscribeTeam = () => {};
    if (!isAdmin && user) {
      const userDocRef = getUserDocRef(user.uid);
      unsubscribeTeam = onSnapshot(
        userDocRef,
        (docSnap) => {
          setTeamData(docSnap.exists() ? docSnap.data() : null);
        },
        (error) => {
          console.error(`App: Team Data Error:`, error);
          setTeamData("ERROR");
          setLoadingError("Error loading team data.");
        },
      );
    } else {
      setTeamData(null);
    }
    return () => {
      unsubscribeConfig();
      unsubscribeTeam();
    };
  }, [authChecked, user, isAdmin]);

  // Routing (logic unchanged)
  const isLoading =
    !authChecked ||
    gameConfig === null ||
    (user && !isAdmin && teamData === undefined);
  let currentView;
  if (isLoading) {
    currentView = <LoadingScreen message="Initializing..." />;
  } else if (loadingError) {
    currentView = <LoadingScreen message={loadingError} />;
  } else if (gameConfig?.status === "ERROR") {
    currentView = <LoadingScreen message="Error loading game config." />;
  } else if (teamData === "ERROR") {
    currentView = <LoadingScreen message="Error loading team data." />;
  } else if (user) {
    if (isAdmin) {
      currentView = <AdminDashboard />;
    } else if (teamData === null) {
      currentView = <LoginScreen user={user} />;
    } else if (typeof teamData === "object" && teamData !== null) {
      if (!gameConfig || gameConfig.status === "WAITING") {
        currentView = <WaitingRoom teamName={teamData.name} />;
      } else if (
        gameConfig.status === "STARTED" ||
        gameConfig.status === "FINISHED"
      ) {
        currentView = (
          <GameView user={user} teamData={teamData} gameConfig={gameConfig} />
        );
      } else {
        currentView = <LoadingScreen message="Unexpected game state..." />;
      }
    } else {
      currentView = <LoadingScreen message="Loading team data..." />;
    }
  } else {
    currentView = <LoadingScreen message="Authenticating..." />;
  }

  // Apply base dark theme
  return <div style={styles.app}>{currentView}</div>;
}
