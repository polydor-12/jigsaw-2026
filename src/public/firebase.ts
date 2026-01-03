// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWSEFzhs46dB6DSUERsdidH7cDeqFcYYk",
  authDomain: "jigsaw-2026.firebaseapp.com",
  projectId: "jigsaw-2026",
  storageBucket: "jigsaw-2026.firebasestorage.app",
  messagingSenderId: "279515266238",
  appId: "1:279515266238:web:0a707028776819435072ef",
};

export const initFirebase = () => initializeApp(firebaseConfig);
// Initialize Firebase
