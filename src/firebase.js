// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhTYn57GDGSelMMIAYMwHylJgbWy3f7Gc",
  authDomain: "chronicrelief-1e8ef.firebaseapp.com",
  projectId: "chronicrelief-1e8ef",
  storageBucket: "chronicrelief-1e8ef.firebasestorage.app",
  messagingSenderId: "428612452294",
  appId: "1:428612452294:web:7d21edb36cdb04a38e7cc7",
  measurementId: "G-9YG2CY7F84",
};

const app = initializeApp(firebaseConfig);

// Avoid analytics errors in non-browser envs
isSupported().then((ok) => {
  if (ok) getAnalytics(app);
});

export const auth = getAuth(app);
export const db = getFirestore(app);
