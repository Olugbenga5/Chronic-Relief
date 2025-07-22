// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhTYn57GDGSelMMIAYMwHylJgbWy3f7Gc",
  authDomain: "chronicrelief-1e8ef.firebaseapp.com",
  projectId: "chronicrelief-1e8ef",
  storageBucket: "chronicrelief-1e8ef.firebasestorage.app",
  messagingSenderId: "428612452294",
  appId: "1:428612452294:web:7d21edb36cdb04a38e7cc7",
  measurementId: "G-9YG2CY7F84"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, auth };