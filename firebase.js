// firebase.js (BROWSER VERSION – CORRECT)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVO-bEIkHAdraH4HRXqKRzXdLV-JSH8XE",
  authDomain: "local-shop-af227.firebaseapp.com",
  projectId: "local-shop-af227",
  storageBucket: "local-shop-af227.firebasestorage.app",
  messagingSenderId: "868064283818",
  appId: "1:868064283818:web:f535177d3abc48e9a6d4d3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth so other files can use it
export const auth = getAuth(app);
