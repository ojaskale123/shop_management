import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVO-bEIkHAdraH4HRXqKRzXdLV-JSH8XE",
  authDomain: "local-shop-af227.firebaseapp.com",
  projectId: "local-shop-af227",
  storageBucket: "local-shop-af227.firebasestorage.app",
  messagingSenderId: "868064283818",
  appId: "1:868064283818:web:f535177d3abc48e9a6d4d3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);   // ✅ CLOUD DATABASE
