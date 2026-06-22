import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyA2qaxPqiJcwjgtbVdsUbgSKunr6Nq9Mw4",
  authDomain: "ticketing-system-8f0c0.firebaseapp.com",
  projectId: "ticketing-system-8f0c0",
  storageBucket: "ticketing-system-8f0c0.firebasestorage.app",
  messagingSenderId: "422167561907",
  appId: "1:422167561907:web:a6c23f36a0ab76309212c6"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Services
export const auth = getAuth(app)
export const db = getFirestore(app)