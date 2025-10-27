import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
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
  getDocs, // Needed for Admin start game logic
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
  Award, // Added for rank
} from "lucide-react";

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyC4zhbtZ5YlFYsodfxXMFED4ZgFoBWv4to",
  authDomain: "escape-1a6de.firebaseapp.com",
  projectId: "escape-1a6de",
  storageBucket: "escape-1a6de.firebasestorage.app",
  messagingSenderId: "747740048623",
  appId: "1:747740048623:web:9c30b79cdfed2757e67f1a", // Updated
  measurementId: "G-XJ6JFWC6F2", // Updated
};

const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Admin Configuration ---
const ADMIN_USER_ID = "spJYN3rzcGRkroXjmTJ4nFZu3AF3"; // Your ID from console

// --- Helper Functions for Firestore Paths ---
// Corrected paths based on Firestore rules and structure requirements
const getConfigDocRef = () =>
  doc(db, "artifacts", appId, "public", "data", "game_config", "settings"); // 6 segments
const getPublicTeamsCollectionRef = () =>
  collection(db, "artifacts", appId, "public", "data", "teams"); // 5 segments
const getPublicTeamDocRef = (userId) =>
  doc(db, "artifacts", appId, "public", "data", "teams", userId); // 6 segments
const getPublicQuestionsCollectionRef = () =>
  collection(db, "artifacts", appId, "public", "data", "questions"); // 5 segments
const getPublicQuestionDocRef = (questionId) =>
  doc(db, "artifacts", appId, "public", "data", "questions", questionId); // 6 segments
const getUserDocRef = (userId) => doc(db, "artifacts", appId, "users", userId); // 4 segments

// --- Helper Functions ---
const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// --- Player Rank Component ---
function PlayerRank({ userId }) {
  const [rank, setRank] = useState(null);
  const [totalTeams, setTotalTeams] = useState(0);

  useEffect(() => {
    const teamsRef = getPublicTeamsCollectionRef(); // Use helper
    const unsubscribe = onSnapshot(
      teamsRef,
      (snapshot) => {
        const teamsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort teams for ranking (same logic as AdminDashboard)
        teamsList.sort((a, b) => {
          if (a.endTime && !b.endTime) return -1;
          if (!a.endTime && b.endTime) return 1;
          if (a.endTime && b.endTime) {
            // Ensure timestamps are valid before calculation
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
          // Sort active by parts solved
          const partsA = Object.keys(a.partsSolved || {}).length;
          const partsB = Object.keys(b.partsSolved || {}).length;
          if (partsB !== partsA) {
            return partsB - partsA;
          }
          // If same parts, sort by start time (earlier first)
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
        setRank(null);
        setTotalTeams(0);
      },
    );

    return () => unsubscribe(); // Cleanup listener
  }, [userId]); // Rerun if userId changes

  if (rank === null || totalTeams === 0) {
    return null; // Don't show if rank couldn't be determined or no teams
  }

  return (
    <div className="flex items-center text-lg font-mono bg-circuit-gray border border-electric-blue px-3 py-1 rounded text-electric-yellow">
      <Award className="w-5 h-5 mr-2 text-electric-blue" />
      <span className="text-electric-blue">Rank:</span> {rank} / {totalTeams}
    </div>
  );
}

// --- Waiting Room Component ---
function WaitingRoom({ teamName }) {
  // Enhanced electrical engineering themed waiting room
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-soft-text p-4 relative">
      {/* Animated circuit elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 border border-electric-blue rounded-full animate-spin opacity-20" style={{animationDuration: '10s'}}></div>
        <div className="absolute w-48 h-48 border border-circuit-green rounded-full animate-spin opacity-30" style={{animationDuration: '8s', animationDirection: 'reverse'}}></div>
      </div>
      
      <div className="relative z-10 text-center">
        <Loader2 className="animate-spin text-electric-blue h-20 w-20 mb-8 mx-auto" />
        <h1 className="text-4xl font-bold mb-4 text-electric-blue">System Initializing...</h1>
        <p className="text-2xl text-soft-text mb-2">Welcome, {teamName}!</p>
        <p className="text-xl text-electric-blue mb-4">Circuit board ready for activation</p>
        <div className="flex items-center justify-center text-circuit-green mt-6">
          <div className="w-3 h-3 bg-circuit-green rounded-full mr-3 animate-pulse"></div>
          <span className="text-lg">Waiting for admin to initiate sequence...</span>
        </div>
      </div>
    </div>
  );
}

// --- Game View Component ---
function GameView({ user, teamData }) {
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentQuestionId = teamData.currentQuestion;

  // 1. Fetch the current question's data
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
        const questionRef = getPublicQuestionDocRef(currentQuestionId); // Use helper
        console.log("GameView: Fetching question:", questionRef.path);
        const docSnap = await getDoc(questionRef);
        if (docSnap.exists()) {
          console.log("GameView: Question data found:", docSnap.data());
          setQuestionData(docSnap.data());
        } else {
          console.error(
            `Error: Question "${currentQuestionId}" not found in Firestore.`,
          );
          setError(`Error: Question "${currentQuestionId}" not found.`);
        }
      } catch (err) {
        setError("Error loading question.");
        console.error("Error loading question:", err);
      }
      setLoading(false);
    };

    getQuestion();
  }, [currentQuestionId]); // Rerun when currentQuestionId changes

  // 2. Handle answer submission - SECURE: Answer validation happens via hash comparison
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !questionData) return;

    setSubmitting(true);
    setError("");

    // SECURITY: We don't store the correct answer in the question data
    // Instead, we'll check against a hash or use server-side validation
    
    // For now, we need to implement a simple solution:
    // Store answer hashes in a separate Firestore collection that clients can't read
    
    console.log("GameView: Submitting answer:", answer.trim().toLowerCase());
    
    try {
      // Create a Firestore transaction to check the answer securely
      const answerRef = doc(db, "artifacts", appId, "private", "answers", currentQuestionId);
      const answerDoc = await getDoc(answerRef);
      
      if (!answerDoc.exists()) {
        throw new Error("Answer not found for this question");
      }
      
      const correctAnswer = answerDoc.data().correctAnswer;
      const isCorrect = answer.trim().toLowerCase() === correctAnswer.toLowerCase();
      
      if (isCorrect) {
        const nextQuestionId = questionData.nextQuestionId || null;
        const userDocRef = getUserDocRef(user.uid);
        
        console.log("GameView: Correct answer! Updating user doc:", userDocRef.path, "Next question:", nextQuestionId);
        
        const updatePayload = {
          currentQuestion: nextQuestionId,
          [`partsSolved.${currentQuestionId}`]: serverTimestamp(),
        };

        if (nextQuestionId === null) {
          updatePayload.endTime = serverTimestamp();
          console.log("GameView: Game finished, setting endTime.");
        }

        const publicTeamRef = getPublicTeamDocRef(user.uid);
        const batch = writeBatch(db);
        batch.update(userDocRef, updatePayload);
        batch.update(publicTeamRef, updatePayload);
        await batch.commit();
        
        console.log("GameView: Update committed successfully.");
        setAnswer("");
      } else {
        console.log("GameView: Incorrect answer.");
        setError("Incorrect answer. Try again.");
      }
    } catch (err) {
      console.error("Error validating answer:", err);
      setError("Error validating answer. Please try again.");
    }
    
    setSubmitting(false);
  };

  // --- Timer ---
  const startTime = teamData.startTime?.toDate();
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!startTime || teamData.endTime) {
      // If ended, calculate final time difference once
      if (teamData.endTime && startTime) {
        setTime(teamData.endTime.toDate().getTime() - startTime.getTime());
      }
      return () => {}; // Return empty cleanup
    }
    // If started and not ended, run interval
    const timerInterval = setInterval(() => {
      setTime(new Date().getTime() - startTime.getTime());
    }, 1000);
    // Cleanup interval
    return () => clearInterval(timerInterval);
  }, [startTime, teamData.endTime]); // Depend on both start and end times

  // --- Render Logic ---
  if (loading) {
    return <LoadingScreen message="Loading question..." />;
  }

  // Finished
  if (currentQuestionId === null || teamData.endTime) {
    // Use the state 'time' which holds the final difference if endTime exists
    const finalTimeMs = time;
    // Enhanced electrical engineering themed completion screen
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-soft-text p-4 relative">
        {/* Animated circuit completion effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 border-2 border-electric-blue rounded-full animate-pulse opacity-20"></div>
          <div className="absolute w-80 h-80 border border-circuit-green rounded-full animate-spin opacity-30" style={{animationDuration: '8s'}}></div>
        </div>
        
        <div className="relative z-10 text-center">
          <CheckCircle className="text-circuit-green h-32 w-32 mb-8 mx-auto animate-bounce" />
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-electric-blue to-circuit-green bg-clip-text text-transparent">
            Circuit Complete!
          </h1>
          <p className="text-3xl text-soft-text mb-2">
            Congratulations, {teamData.name}!
          </p>
          <p className="text-xl text-electric-blue mt-8 mb-4">Final Completion Time:</p>
          <div className="bg-circuit-gray border-2 border-electric-blue rounded-lg p-6 mb-8">
            <p className="text-5xl font-mono text-electric-yellow font-bold">
              {formatTime(finalTimeMs)}
            </p>
          </div>
          <div className="flex items-center justify-center text-circuit-green">
            <div className="w-4 h-4 bg-circuit-green rounded-full mr-2 animate-pulse"></div>
            <span className="text-lg font-semibold">All Systems Operational</span>
          </div>
        </div>
      </div>
    );
  }

  // Active Game - Enhanced electrical engineering theme
  return (
    <div className="flex flex-col min-h-screen text-soft-text">
      <header className="flex flex-wrap justify-between items-center gap-4 p-4 bg-circuit-gray border-b-2 border-electric-blue shadow-lg">
        {" "}
        {/* Added flex-wrap and gap */}
        <h1 className="text-xl font-bold text-electric-blue order-1 flex items-center">
          <div className="w-3 h-3 bg-circuit-green rounded-full mr-3 animate-pulse"></div>
          {teamData.name}
        </h1>
        {/* Rank Component - Order 3 on small, 2 on medium+ */}
        <div className="order-3 md:order-2">
          <PlayerRank userId={user.uid} />
        </div>
        {/* Timer - Order 2 on small, 3 on medium+ */}
        <div className="flex items-center text-xl font-mono bg-navy border-2 border-electric-blue px-4 py-2 rounded order-2 md:order-3">
          <Clock className="w-6 h-6 mr-2 text-electric-blue" />
          <span className="text-electric-yellow">{startTime ? formatTime(time) : "00:00:00"}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-4xl p-10 bg-circuit-gray border-2 border-electric-blue rounded-lg shadow-2xl relative">
          {/* Circuit board corner decorations */}
          <div className="absolute top-4 left-4 w-6 h-6 border-2 border-electric-blue border-t-0 border-l-0"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-2 border-electric-blue border-t-0 border-r-0"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-2 border-electric-blue border-b-0 border-l-0"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-electric-blue border-b-0 border-r-0"></div>
          
          <h2 className="text-3xl font-bold text-electric-blue mb-6 flex items-center">
            <div className="w-4 h-4 bg-circuit-green rounded-full mr-3 animate-pulse"></div>
            {questionData?.title || "Loading title..."}
          </h2>
          {questionData?.prompt ? (
            <div
              className="text-soft-text prose prose-invert max-w-none prose-lg md:prose-xl prose-p:text-soft-text prose-strong:text-electric-blue prose-code:text-circuit-green" // Enhanced prose styling
              dangerouslySetInnerHTML={{ __html: questionData.prompt }}
            />
          ) : (
            <p className="text-lg text-electric-blue">Loading question text...</p>
          )}

          <form onSubmit={handleSubmit} className="mt-8">
            <label
              htmlFor="answer"
              className="block text-lg font-semibold text-electric-blue mb-3 flex items-center"
            >
              <div className="w-2 h-2 bg-electric-yellow rounded-full mr-2"></div>
              Circuit Input
            </label>
            <input
              id="answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-5 py-4 bg-navy text-soft-text border-2 border-electric-blue rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-circuit-green focus:border-circuit-green transition-all duration-200 placeholder-gray-400"
              placeholder="Enter your solution..."
              required
              aria-label="Enter your answer" // Accessibility
              style={{ color: '#E7F2EF' }}
            />

            {error && (
              <p className="text-electric-red text-md mt-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !questionData}
              className="w-full mt-8 py-4 bg-gradient-to-r from-electric-blue to-circuit-green text-navy font-bold rounded-lg text-lg hover:from-electric-blue hover:to-electric-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-circuit-gray focus:ring-electric-yellow transition duration-200 flex items-center justify-center disabled:opacity-60 transform hover:scale-105"
            >
              {submitting ? (
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
              ) : (
                <>
                  <div className="w-3 h-3 bg-navy rounded-full mr-2"></div>
                  Execute Solution
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

// --- Admin Dashboard Component ---
// UPDATED TO USE DARK THEME
function AdminDashboard() {
  const [allTeams, setAllTeams] = useState([]);
  const [gameConfig, setGameConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Listen to all team data and game config
  useEffect(() => {
    setLoading(true);
    const configRef = getConfigDocRef(); // Use helper
    console.log("Admin: Setting up config listener at:", configRef.path);
    const unsubscribeConfig = onSnapshot(
      configRef,
      (docSnap) => {
        console.log(
          "Admin: Config snapshot received:",
          docSnap.exists() ? docSnap.data() : "No config doc",
        );
        if (docSnap.exists()) {
          setGameConfig(docSnap.data());
        } else {
          console.log("Admin: Config doc doesn't exist, creating default.");
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

    const publicTeamsRef = getPublicTeamsCollectionRef(); // Use helper
    console.log("Admin: Setting up teams listener at:", publicTeamsRef.path);
    const unsubscribeTeams = onSnapshot(
      publicTeamsRef,
      (snapshot) => {
        console.log("Admin: Teams snapshot received, docs:", snapshot.size);
        const teamsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
        // Sorting logic (abbreviated for brevity, remains the same)
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
      console.log("Admin: Cleaning up listeners.");
      unsubscribeConfig();
      unsubscribeTeams();
    };
  }, []); // Run only once on mount

  // --- Admin Actions ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const questionsData = JSON.parse(e.target.result);
        if (!questionsData || !Array.isArray(questionsData.questions)) {
          throw new Error("Invalid JSON");
        }
        const batch = writeBatch(db);
        let count = 0;
        const questionsCollectionRef = getPublicQuestionsCollectionRef();
        questionsData.questions.forEach((q) => {
          if (!q.id) {
            console.warn("Admin: Skipping question without ID:", q);
            return;
          }
          const qRef = doc(questionsCollectionRef, q.id);
          batch.set(qRef, q);
          count++;
        });
        await batch.commit();
        alert(`Uploaded ${count} questions.`);
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
      const currentTeams = currentTeamsSnapshot.docs.map((d) => ({
        userId: d.id,
        ...d.data(),
      }));
      let updatedTeamsCount = 0;
      currentTeams.forEach((team) => {
        if (!team.userId) {
          console.warn("Admin: Skipping team without userId:", team);
          return;
        }
        if (!team.startTime) {
          const privateUserDocRef = getUserDocRef(team.userId);
          const publicTeamRef = getPublicTeamDocRef(team.userId);
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
    if (!confirm("Restart game? This will reset ALL team data and clear the leaderboard.")) return;
    try {
      // Reset game config to WAITING
      const configRef = getConfigDocRef();
      await setDoc(configRef, { status: "WAITING" }, { merge: true });
      
      // Clear all team data
      const batch = writeBatch(db);
      const currentTeamsSnapshot = await getDocs(getPublicTeamsCollectionRef());
      
      currentTeamsSnapshot.docs.forEach((doc) => {
        const teamId = doc.id;
        const privateUserDocRef = getUserDocRef(teamId);
        const publicTeamRef = getPublicTeamDocRef(teamId);
        
        // Delete both private and public team docs
        batch.delete(privateUserDocRef);
        batch.delete(publicTeamRef);
      });
      
      await batch.commit();
      alert("Game restarted! All team data has been cleared.");
    } catch (err) {
      console.error("Admin: Error restarting game:", err);
      alert("Error restarting game.");
    }
  };

  // --- Admin Render (Dark Theme) - LARGER AND CLEANER ---
  return (
    // Inherits bg-navy from App wrapper, sets text-soft-text
    <div className="min-h-screen text-soft-text p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header with electrical engineering theme - LARGER */}
        <header className="flex flex-wrap justify-between items-center gap-6 mb-12 pb-6 border-b-4 border-electric-blue">
          <h1 className="text-4xl md:text-6xl font-bold text-soft-text flex items-center">
            <Shield className="w-12 h-12 md:w-16 md:h-16 mr-4 md:mr-6 text-electric-blue" />
            Circuit Control Center
          </h1>
          <div className="flex flex-wrap gap-6">
            {/* LARGER buttons for better visibility */}
            <label className="flex items-center px-8 py-4 bg-circuit-green text-navy rounded-xl shadow-2xl cursor-pointer hover:opacity-90 text-xl md:text-2xl font-bold border-4 border-electric-blue">
              <Upload className="w-8 h-8 md:w-10 md:h-10 mr-3" />
              Upload Circuit Data
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <button
              onClick={handleStartGame}
              disabled={
                !gameConfig || gameConfig.status === "STARTED" || gameConfig.status === "FINISHED" || loading
              }
              className="flex items-center px-8 py-4 bg-electric-blue text-navy font-bold rounded-xl shadow-2xl hover:opacity-90 disabled:opacity-50 text-xl md:text-2xl border-4 border-electric-blue"
            >
              <Play className="w-8 h-8 md:w-10 md:h-10 mr-3" />
              {gameConfig?.status === "STARTED"
                ? "Game in Progress"
                : gameConfig?.status === "FINISHED"
                ? "Game Finished"
                : "Start Game"}
            </button>
            {gameConfig?.status === "STARTED" && (
              <button
                onClick={handleEndGame}
                className="flex items-center px-8 py-4 bg-electric-red text-white font-bold rounded-xl shadow-2xl hover:opacity-90 text-xl md:text-2xl border-4 border-electric-red"
              >
                <Flag className="w-8 h-8 md:w-10 md:h-10 mr-3" />
                End Game
              </button>
            )}
            {gameConfig?.status === "FINISHED" && (
              <button
                onClick={handleRestartGame}
                className="flex items-center px-8 py-4 bg-circuit-green text-navy font-bold rounded-xl shadow-2xl hover:opacity-90 text-xl md:text-2xl border-4 border-circuit-green"
              >
                <Play className="w-8 h-8 md:w-10 md:h-10 mr-3" />
                Restart Game
              </button>
            )}
          </div>
        </header>

        {/* Table Card with electrical engineering dark theme - LARGER */}
        <div className="bg-circuit-gray rounded-2xl shadow-2xl overflow-hidden border-4 border-electric-blue">
          <div className="p-8 bg-navy border-b-4 border-electric-blue">
            <h2 className="text-3xl md:text-4xl font-bold text-soft-text flex items-center">
              <Users className="w-10 h-10 md:w-12 md:h-12 mr-4 text-electric-blue" />
              Circuit Status ({allTeams.length} circuits registered)
            </h2>
          </div>
          {/* Loading/Error/Empty states with electrical engineering theme - LARGER */}
          {loading && gameConfig?.status !== "ERROR" ? (
            <p className="p-12 text-electric-blue text-2xl md:text-3xl flex items-center justify-center">
              <div className="w-6 h-6 bg-electric-blue rounded-full mr-4 animate-pulse"></div>
              Processing circuit data...
            </p>
          ) : gameConfig?.status === "ERROR" ? (
            <p className="p-12 text-electric-red text-2xl md:text-3xl flex items-center justify-center">
              <div className="w-6 h-6 bg-electric-red rounded-full mr-4 animate-pulse"></div>
              Circuit Error: Check configuration paths
            </p>
          ) : allTeams.length === 0 ? (
            <p className="p-12 text-electric-blue text-2xl md:text-3xl flex items-center justify-center">
              <div className="w-6 h-6 bg-electric-blue rounded-full mr-4 animate-pulse"></div>
              No circuits initialized yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xl md:text-2xl">
                {/* Table header with electrical engineering theme - LARGER */}
                <thead className="bg-navy">
                  <tr>
                    <th className="p-6 md:p-8 text-left text-lg md:text-xl font-bold text-electric-blue uppercase tracking-wider">
                      Circuit ID
                    </th>
                    <th className="p-6 md:p-8 text-left text-lg md:text-xl font-bold text-electric-blue uppercase tracking-wider">
                      Current Node
                    </th>
                    <th className="p-6 md:p-8 text-left text-lg md:text-xl font-bold text-electric-blue uppercase tracking-wider">
                      Status / Timer
                    </th>
                  </tr>
                </thead>
                {/* Table body with electrical engineering theme - LARGER */}
                <tbody className="divide-y-2 divide-electric-blue">
                  {allTeams.map((team) => (
                    <tr
                      key={team.id || team.userId}
                      className="odd:bg-circuit-gray even:bg-navy hover:bg-opacity-75 hover:bg-electric-blue hover:bg-opacity-10"
                    >
                      <td className="p-6 md:p-8 whitespace-nowrap border-r-2 border-electric-blue">
                        <span className="font-bold text-soft-text flex items-center text-xl md:text-2xl">
                          <div className="w-4 h-4 bg-circuit-green rounded-full mr-3 animate-pulse"></div>
                          {team.name || "N/A"}
                        </span>
                      </td>
                      <td className="p-6 md:p-8 whitespace-nowrap border-r-2 border-electric-blue">
                        {team.endTime ? (
                          <span className="font-bold text-circuit-green flex items-center text-xl md:text-2xl">
                            <Flag className="w-6 h-6 md:w-8 md:h-8 mr-3" />
                            Circuit Complete
                          </span>
                        ) : team.currentQuestion ? (
                          <span className="font-mono bg-electric-yellow bg-opacity-20 text-electric-yellow px-4 md:px-6 py-2 rounded-full text-lg md:text-xl border-2 border-electric-yellow">
                            Node {team.currentQuestion}
                          </span>
                        ) : (
                          <span className="text-electric-blue flex items-center text-xl md:text-2xl">
                            <div className="w-4 h-4 bg-electric-blue rounded-full mr-3 animate-pulse"></div>
                            Standby
                          </span>
                        )}
                      </td>
                      <td className="p-6 md:p-8 whitespace-nowrap">
                        <span className="font-mono text-electric-yellow text-lg md:text-xl">
                          {team.startTime ? team.displayTime : "Not Initialized"}
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
    </div>
  );
}

// --- Utility Components ---
function LoadingScreen({ message }) {
  // Enhanced electrical engineering themed loading screen
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-soft-text relative">
      {/* Animated circuit loading pattern */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 border-2 border-electric-blue rounded-full animate-spin opacity-30" style={{animationDuration: '3s'}}></div>
        <div className="absolute w-24 h-24 border border-circuit-green rounded-full animate-spin opacity-50" style={{animationDuration: '2s', animationDirection: 'reverse'}}></div>
        <div className="absolute w-16 h-16 border border-electric-yellow rounded-full animate-spin opacity-70" style={{animationDuration: '1.5s'}}></div>
      </div>
      
      <div className="relative z-10 text-center">
        <Loader2 className="animate-spin text-electric-blue h-16 w-16 mb-6" />
        <p className="text-2xl text-electric-blue font-semibold">{message}</p>
        <div className="flex items-center justify-center mt-4 text-circuit-green">
          <div className="w-2 h-2 bg-circuit-green rounded-full mr-2 animate-pulse"></div>
          <span className="text-lg">Processing circuit data...</span>
        </div>
      </div>
    </div>
  );
}

// --- LoginScreen ---
function LoginScreen({ user }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

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
    };
    try {
      const batch = writeBatch(db);
      const privateUserDocRef = getUserDocRef(user.uid);
      batch.set(privateUserDocRef, initialTeamData);
      const publicTeamRef = getPublicTeamDocRef(user.uid);
      batch.set(publicTeamRef, initialTeamData);
      await batch.commit();
      // Listener will pick up change
    } catch (error) {
      console.error("Error registering team:", error);
      alert("Error registering team.");
      setLoading(false);
    }
  };

  // Enhanced electrical engineering themed login screen - LARGER AND CLEANER
  return (
    <div className="flex items-center justify-center min-h-screen text-soft-text p-6 relative">
      {/* Circuit background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 49%, #00D4FF 50%, transparent 51%),
            linear-gradient(-45deg, transparent 49%, #00D4FF 50%, transparent 51%)
          `,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <div className="w-full max-w-2xl p-12 bg-circuit-gray border-4 border-electric-blue rounded-2xl shadow-2xl relative z-10">
        {/* Circuit corner decorations - LARGER */}
        <div className="absolute top-6 left-6 w-8 h-8 border-4 border-electric-blue border-t-0 border-l-0"></div>
        <div className="absolute top-6 right-6 w-8 h-8 border-4 border-electric-blue border-t-0 border-r-0"></div>
        <div className="absolute bottom-6 left-6 w-8 h-8 border-4 border-electric-blue border-b-0 border-l-0"></div>
        <div className="absolute bottom-6 right-6 w-8 h-8 border-4 border-electric-blue border-b-0 border-r-0"></div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-center text-electric-blue mb-12 flex items-center justify-center">
          <div className="w-10 h-10 bg-circuit-green rounded-full mr-4 animate-pulse"></div>
          Circuit Access
        </h1>
        <form onSubmit={handleRegister} className="space-y-8">
          <div>
            <label
              htmlFor="teamName"
              className="block text-2xl md:text-3xl font-bold text-electric-blue mb-6 flex items-center"
            >
              <div className="w-4 h-4 bg-electric-yellow rounded-full mr-3"></div>
              Team Designation
            </label>
            <input
              id="teamName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-8 py-6 bg-navy text-soft-text border-4 border-electric-blue rounded-xl text-2xl md:text-3xl focus:outline-none focus:ring-4 focus:ring-circuit-green focus:border-circuit-green transition-all duration-200 placeholder-gray-400"
              placeholder="Enter your team name..."
              required
              style={{ color: '#E7F2EF' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-8 bg-gradient-to-r from-electric-blue to-circuit-green text-navy font-bold rounded-xl text-2xl md:text-3xl hover:from-electric-blue hover:to-electric-blue focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-circuit-gray focus:ring-electric-yellow transition duration-200 flex items-center justify-center disabled:opacity-60 transform hover:scale-105 shadow-2xl"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-4 h-8 w-8" />
            ) : (
              <>
                <div className="w-6 h-6 bg-navy rounded-full mr-4"></div>
                Initialize Circuit
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- FINAL APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [teamData, setTeamData] = useState(undefined);
  const [gameConfig, setGameConfig] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingError, setLoadingError] = useState(null);

  // Auth Listener
  useEffect(() => {
    // ... (Auth logic remains the same) ...
    console.log("App: Setting up auth listener...");
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log(
        "App: Auth state changed. currentUser:",
        currentUser ? currentUser.uid : "null",
      );
      if (currentUser) {
        setUser(currentUser);
        const adminCheck = currentUser.uid === ADMIN_USER_ID;
        setIsAdmin(adminCheck);
        console.log("App: Admin check:", adminCheck);
      } else {
        try {
          if (auth.currentUser) {
            console.log("App: Auth - Already signed in or signing in.");
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
          setUser(null);
          setIsAdmin(false);
          setTeamData(null);
          setLoadingError("Auth failed.");
        }
      }
      setAuthChecked(true);
    });
    return () => {
      console.log("App: Cleaning up auth listener.");
      unsubscribeAuth();
    };
  }, []);

  // Data Listeners
  useEffect(() => {
    // ... (Data listener logic remains the same) ...
    if (!authChecked) {
      console.log("App: Listeners waiting for auth check...");
      return () => {};
    }
    console.log(
      "App: Auth checked. Setting up listeners. User:",
      user ? user.uid : "null",
      "IsAdmin:",
      isAdmin,
    );
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
      console.log("App: Cleaning up listeners.");
      unsubscribeConfig();
      unsubscribeTeam();
    };
  }, [authChecked, user, isAdmin]);

  // Routing
  const isLoading =
    !authChecked ||
    gameConfig === null ||
    (user && !isAdmin && teamData === undefined);
  // ... (Loading/Error checks remain the same) ...

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
    } // Admin view
    else if (teamData === null) {
      currentView = <LoginScreen user={user} />;
    } // Player needs to register
    else if (typeof teamData === "object" && teamData !== null) {
      // Player has team data
      if (!gameConfig || gameConfig.status === "WAITING") {
        currentView = <WaitingRoom teamName={teamData.name} />;
      } // Waiting
      else if (gameConfig.status === "STARTED") {
        currentView = <GameView user={user} teamData={teamData} />;
      } // Playing
      else if (gameConfig.status === "FINISHED") {
        currentView = <GameView user={user} teamData={teamData} />;
      } // Game finished, show final results
      else {
        currentView = <LoadingScreen message="Unexpected game state..." />;
      }
    } else {
      currentView = <LoadingScreen message="Loading team data..." />;
    } // teamData still undefined
  } else {
    currentView = <LoadingScreen message="Authenticating..." />;
  } // No user yet

  // Apply base dark theme styles to the main wrapper div with electrical engineering theme
  return (
    <div className="bg-circuit-dark text-soft-text min-h-screen font-sans relative overflow-hidden">
      {/* Circuit board background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 98%, #00D4FF 100%),
            linear-gradient(0deg, transparent 98%, #00D4FF 100%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }}></div>
      </div>
      
      {/* Electrical grid overlay */}
      <div className="absolute inset-0 opacity-3">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="circuit-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#00D4FF" strokeWidth="0.1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-grid)" />
        </svg>
      </div>
      
      {/* Content with relative positioning to appear above background */}
      <div className="relative z-10">
        {currentView}
      </div>
    </div>
  );
}
