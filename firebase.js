import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAC4MVFsXVc9AWyKBzDUIUrxjmkcQu6DxE",
  authDomain: "kirana-store-af039.firebaseapp.com",
  projectId: "kirana-store-af039",
  storageBucket: "kirana-store-af039.appspot.com",
  messagingSenderId: "383514829490",
  appId: "1:383514829490:web:af7eba443e3b149ca65fab"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
