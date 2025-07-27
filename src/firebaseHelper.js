import {doc,getDoc,setDoc,collection,addDoc,getDocs,query,orderBy,} from "firebase/firestore";
import { db } from "./firebase";

//Save selected pain area
export const savePainArea = async (uid, selectedArea) => {
  if (!uid || !selectedArea) return;

  const userRef = doc(db, "users", uid);
  try {
    await setDoc(userRef, { selectedArea }, { merge: true });
    console.log("Pain area saved!");
  } catch (error) {
    console.error("Error saving pain area:", error);
  }
};

//Save a 5-exercise routine for a given area
export const saveRoutine = async (uid, area, exerciseIds) => {
  if (!uid || !area || !Array.isArray(exerciseIds)) return;

  const routineRef = doc(db, `users/${uid}/routines`, area);
  try {
    await setDoc(routineRef, {
      exerciseIds,
      createdAt: new Date().toISOString(),
    });
    console.log("Routine saved!");
  } catch (error) {
    console.error("Error saving routine:", error);
  }
};

//Get saved routine for a given area
export const getRoutine = async (uid, area) => {
  if (!uid || !area) return [];

  const routineRef = doc(db, `users/${uid}/routines`, area);
  try {
    const docSnap = await getDoc(routineRef);
    return docSnap.exists() ? docSnap.data().exerciseIds : [];
  } catch (error) {
    console.error("Error fetching routine:", error);
    return [];
  }
};

//Save completed exercise IDs (progress)
export const saveProgress = async (uid, area, completedIds) => {
  if (!uid || !area || !Array.isArray(completedIds)) return;

  const progressRef = doc(db, `users/${uid}/progress`, area);
  try {
    await setDoc(progressRef, { completed: completedIds }, { merge: true });
    console.log("Progress saved!");
  } catch (error) {
    console.error("Error saving progress:", error);
  }
};

//Get completed exercise IDs (progress)
export const getProgress = async (uid, area) => {
  if (!uid || !area) return [];

  const progressRef = doc(db, `users/${uid}/progress`, area);
  try {
    const snap = await getDoc(progressRef);
    return snap.exists() ? snap.data().completed : [];
  } catch (error) {
    console.error("Error fetching progress:", error);
    return [];
  }
};

//Save completed routine entry to history
export const saveHistoryEntry = async (uid, area, exerciseIds) => {
  if (!uid || !area || !Array.isArray(exerciseIds)) return;

  try {
    const historyRef = collection(db, "users", uid, "history");
    await addDoc(historyRef, {
      area,
      exerciseIds,
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to save history:", err);
  }
};

//Fetch all routine history entries
export const fetchRoutineHistory = async (uid) => {
  if (!uid) return [];

  try {
    const historyRef = collection(db, "users", uid, "history");
    const q = query(historyRef, orderBy("completedAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error fetching routine history:", error);
    return [];
  }
};
