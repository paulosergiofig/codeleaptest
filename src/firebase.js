// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Usar variáveis de ambiente do Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project",
};

// Inicialização condicional para evitar erros
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { auth };
