// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAs7EzuiHHpWCL2UFcUqVpRtwN9Du4uaqY",
  authDomain: "progress-635f7.firebaseapp.com",
  projectId: "progress-635f7",
  storageBucket: "progress-635f7.firebasestorage.app",
  messagingSenderId: "15441470395",
  appId: "1:15441470395:web:169a99e7844fff89801a9e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
