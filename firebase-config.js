import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBl9jwmiIQnDjeobk9GBE5I0GO05ONPo6E",
  authDomain: "sucre-cafe.firebaseapp.com",
  projectId: "sucre-cafe",
  storageBucket: "sucre-cafe.firebasestorage.app",
  messagingSenderId: "1014358894897",
  appId: "1:1014358894897:web:ce72ad3e9a8a8e95e96810",
  measurementId: "G-6G6X1XX8GC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
