import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyUQHY7Wmm0ki-iLalj2sOk2tdTxwmLO4",
  authDomain: "myfirstapp-39c8d.firebaseapp.com",
  projectId: "myfirstapp-39c8d",
  storageBucket: "myfirstapp-39c8d.firebasestorage.app",
  messagingSenderId: "725209330041",
  appId: "1:725209330041:web:7b938ec7db4cee52b27fa8",
  measurementId: "G-N9R4VTV7LT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
