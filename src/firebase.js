// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "Your Api Key",
  authDomain: "returnshield-advitya.firebaseapp.com",
  projectId: "PROJECTID",
  storageBucket: "returnshield-advitya.firebasestorage.app",
  messagingSenderId: "226972892734",
  appId: "APP_ID",
  measurementId: "G-YN4WPL1Q60"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, db};
