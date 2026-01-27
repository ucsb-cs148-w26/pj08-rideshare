// src/firebase.js
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGaKmpxxrKF4gRez_gCm8JJ2ZVD_QXXIo",
  authDomain: "proj-08-rideshare.firebaseapp.com",
  projectId: "proj-08-rideshare",
  storageBucket: "proj-08-rideshare.firebasestorage.app",
  messagingSenderId: "58979781979",
  appId: "1:58979781979:web:110b0c27a6791ddbb71e7e"
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

