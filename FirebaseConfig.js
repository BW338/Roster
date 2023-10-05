// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPJPwVSP9iOanpcv8jGJ-Dnu8MUSNmeoI",
  authDomain: "roster-app-dd7dd.firebaseapp.com",
  projectId: "roster-app-dd7dd",
  storageBucket: "roster-app-dd7dd.appspot.com",
  messagingSenderId: "245233151085",
  appId: "1:245233151085:web:819176ed258e5124fb6364",
  measurementId: "G-TX7RW7K7JY"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_FIRESTORE = getFirestore(FIREBASE_APP);
