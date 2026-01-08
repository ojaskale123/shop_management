import { db, auth } from "./firebase.js";
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export async function loadUserData(key) {
  const uid = auth.currentUser.uid;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data()[key] || [] : [];
}

export async function saveUserData(key, data) {
  const uid = auth.currentUser.uid;
  const ref = doc(db, "users", uid);
  await setDoc(ref, { [key]: data }, { merge: true });
}
