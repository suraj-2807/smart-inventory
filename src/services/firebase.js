import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAke0164KMxr7qMGfKDLSITr6F69wnibvs",
  authDomain: "smart-inventory-7797d.firebaseapp.com",
  projectId: "smart-inventory-7797d",
  storageBucket: "smart-inventory-7797d.firebasestorage.app",
  messagingSenderId: "604728908136",
  appId: "1:604728908136:web:7f50603b44dec3b4ef1edd",
  measurementId: "G-G1X3RRQ2VL"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 Firebase initialized");
