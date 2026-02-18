import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAptYqB4kbAY6RBY63tprx-eyATul8dOEM",
    authDomain: "codeneon-12130.firebaseapp.com",
    projectId: "codeneon-12130",
    storageBucket: "codeneon-12130.firebasestorage.app",
    messagingSenderId: "25761421610",
    appId: "1:25761421610:web:8bc350d435e1b0be286653",
    measurementId: "G-0MZZH8RB2L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
