import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Configuración de Firebase enviada
const firebaseConfig = {
  apiKey: "AIzaSyDHasrMZXKWaJYQI9-evDYh59oANrp1UII",
  authDomain: "vivero-web-3776a.firebaseapp.com",
  projectId: "vivero-web-3776a",
  storageBucket: "vivero-web-3776a.firebasestorage.app",
  messagingSenderId: "799570652318",
  appId: "1:799570652318:web:e162da39f86dee26245f8f",
  measurementId: "G-9P5ZXKRD5N"
};

// Inicializar la app y los servicios
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
