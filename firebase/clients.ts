// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import {getAuth} from 'firebase/auth';
import { getFirestore } from "firebase-admin/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjrCujrJn3QuNEDa6Eg2FzTxHuEQOBmxk",
  authDomain: "prepwise-e0019.firebaseapp.com",
  projectId: "prepwise-e0019",
  storageBucket: "prepwise-e0019.firebasestorage.app",
  messagingSenderId: "1025896699589",
  appId: "1:1025896699589:web:d18900c6dd0c7de8aa02ac",
  measurementId: "G-TQGM1DLXSZ"
};

const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);