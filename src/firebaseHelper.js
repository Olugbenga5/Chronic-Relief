import {doc,getDoc,setDoc,collection,addDoc,getDocs,query,orderBy,updateDoc,deleteDoc,onSnapshot,serverTimestamp,increment,} from "firebase/firestore";
import { db } from "./firebase";
import {deleteUser,reauthenticateWithCredential,EmailAuthProvider,} from "firebase/auth";


// Ensure a base user doc exists 
export const ensureUserDoc = async (uid) => {
  if (!uid) return;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      selectedArea: null,
      routinesCompleted: 0,
      createdAt: serverTimestamp(),
    });
  }
};

// Read user doc
export const getUserDoc = async (uid) => {
  if (!uid) return null;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

// Save/Update selected pain area
export const savePainArea = async (uid, selectedArea) => {
  if (!uid || !selectedArea) return;
  const userRef = doc(db, "users", uid);
  try {
    await setDoc(
      userRef,
      { selectedArea, updatedAt: serverTimestamp() },
      { merge: true }
    );
    console.log("Pain area saved!");
  } catch (error) {
    console.error("Error saving pain area:", error);
  }
};

// Alias used by Profile page 
export const updateSelectedArea = savePainArea;

// Save a 5‑exercise routine for a given area
export const saveRoutine = async (uid, area, exerciseIds) => {
  if (!uid || !area || !Array.isArray(exerciseIds)) return;

  const routineRef = doc(db, `users/${uid}/routines`, area);
  try {
    await setDoc(routineRef, {
      exerciseIds,
      createdAt: serverTimestamp(),
      area,
    });
    console.log("Routine saved!");
  } catch (error) {
    console.error("Error saving routine:", error);
  }
};

// Get saved routine for a given area (returns array of ids)
export const getRoutine = async (uid, area) => {
  if (!uid || !area) return [];
  const routineRef = doc(db, `users/${uid}/routines`, area);
  try {
    const docSnap = await getDoc(routineRef);
    return docSnap.exists() ? docSnap.data().exerciseIds || [] : [];
  } catch (error) {
    console.error("Error fetching routine:", error);
    return [];
  }
};

// Save completed exercise IDs for an area
export const saveProgress = async (uid, area, completedIds) => {
  if (!uid || !area || !Array.isArray(completedIds)) return;

  const progressRef = doc(db, `users/${uid}/progress`, area);
  try {
    await setDoc(
      progressRef,
      { completed: completedIds, updatedAt: serverTimestamp() },
      { merge: true }
    );
    console.log("Progress saved!");
  } catch (error) {
    console.error("Error saving progress:", error);
  }
};

// Get completed exercise IDs for an area
export const getProgress = async (uid, area) => {
  if (!uid || !area) return [];
  const progressRef = doc(db, `users/${uid}/progress`, area);
  try {
    const snap = await getDoc(progressRef);
    return snap.exists() ? snap.data().completed || [] : [];
  } catch (error) {
    console.error("Error fetching progress:", error);
    return [];
  }
};

// Save completed routine entry to history
// Also increments user.routinesCompleted counter.
export const saveHistoryEntry = async (uid, area, exerciseIds) => {
  if (!uid || !area || !Array.isArray(exerciseIds)) return;

  try {
    const historyRef = collection(db, "users", uid, "history");
    await addDoc(historyRef, {
      area,
      exerciseIds,
      completedAt: serverTimestamp(),
    });

    // Increment routinesCompleted & set lastCompletedAt
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      routinesCompleted: increment(1),
      lastCompletedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to save history:", err);
  }
};

// Fetch all routine history entries 
export const fetchRoutineHistory = async (uid) => {
  if (!uid) return [];
  try {
    const historyRef = collection(db, "users", uid, "history");
    const q = query(historyRef, orderBy("completedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching routine history:", error);
    return [];
  }
};

// Count only 
export const getRoutineHistoryCount = async (uid) => {
  if (!uid) return 0;
  try {
    const c = collection(db, "users", uid, "history");
    const snap = await getDocs(c);
    return snap.size;
  } catch {
    return 0;
  }
};

// Add/Update a favorite exercise
export const addFavorite = async (uid, exercise) => {
  if (!uid || !exercise?.id) throw new Error("Missing uid or exercise.id");
  const ref = doc(db, "users", uid, "favorites", String(exercise.id));
  await setDoc(ref, {
    id: String(exercise.id),
    name: exercise.name || "",
    bodyPart: exercise.bodyPart || "",
    target: exercise.target || "",
    equipment: exercise.equipment || "",
    gifUrl: exercise.gifUrl || "",
    savedAt: serverTimestamp(),
  });
};

// Remove a favorite by exerciseId
export const removeFavorite = async (uid, exerciseId) => {
  if (!uid || !exerciseId) throw new Error("Missing uid or exerciseId");
  const ref = doc(db, "users", uid, "favorites", String(exerciseId));
  await deleteDoc(ref);
};

// Check if an exercise is favorited
export const isFavorite = async (uid, exerciseId) => {
  if (!uid || !exerciseId) return false;
  const ref = doc(db, "users", uid, "favorites", String(exerciseId));
  const s = await getDoc(ref);
  return s.exists();
};

// Toggle favorite on/off
export const toggleFavorite = async (uid, exercise) => {
  const fav = await isFavorite(uid, exercise?.id);
  if (fav) {
    await removeFavorite(uid, exercise.id);
    return false;
  } else {
    await addFavorite(uid, exercise);
    return true;
  }
};

// Live listener for favorites 
export const listenFavorites = (uid, cb) => {
  if (!uid) return () => {};
  const c = collection(db, "users", uid, "favorites");
  return onSnapshot(c, (snap) => cb(snap.docs.map((d) => d.data())));
};

// Delete all docs in a subcollection
const deleteSubcollection = async (uid, sub) => {
  const c = collection(db, "users", uid, sub);
  const snap = await getDocs(c);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
};

// Reset app data (favorites & history + routinesCompleted counter)
export const resetAppData = async (uid) => {
  if (!uid) return;
  await deleteSubcollection(uid, "favorites").catch(() => {});
  await deleteSubcollection(uid, "history").catch(() => {});
  const userRef = doc(db, "users", uid);
  try {
    await updateDoc(userRef, { routinesCompleted: 0, updatedAt: serverTimestamp() });
  } catch (e) {
    console.warn("Could not reset routinesCompleted:", e?.message);
  }
};

// Fully delete account (requires re-auth):
// 1) re-auth, 2) wipe subcollections, 3) delete user doc, 4) delete auth account
export const deleteAccountFully = async (auth, email, password) => {
  const user = auth?.currentUser;
  if (!user) throw new Error("Not signed in.");
  const cred = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(user, cred);

  await resetAppData(user.uid);
  const ref = doc(db, "users", user.uid);
  try {
    await deleteDoc(ref);
  } catch {}

  await deleteUser(user);
};
