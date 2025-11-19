import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDoc
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import {
  getAuth,
  signInAnonymously
} from "firebase/auth";

// --- CONFIG FIREBASE (depuis variables Netlify/Vite)
const firebaseConfig = {
  apiKey: "AIzaSyBLWue6gztYQVVOdQlGVUTzk5oEvDNrj_s",
  authDomain: "anniversaire-train.firebaseapp.com",
  projectId: "anniversaire-train",
  storageBucket: "anniversaire-train.appspot.com",
  messagingSenderId: "804980963640",
  appId: "1:804980963640:web:7debb742668ae32d6869cd"
};

// Init
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Auth anonyme automatique
signInAnonymously(auth).catch((err) =>
  console.error("Erreur auth anonyme:", err)
);

/* -------------------------------------------------------------
   UPLOAD PHOTO ZONE
-------------------------------------------------------------- */
export async function uploadZonePhoto(
  sessionId: string,
  zoneId: number,
  x: number,
  y: number,
  dataUrl: string
) {
  // Convertir dataURL -> blob
  const blob = await (await fetch(dataUrl)).blob();

  // Path Storage
  const storageRef = ref(storage, `games/${sessionId}/zones/${zoneId}.jpg`);

  // Upload
  await uploadBytes(storageRef, blob);

  // URL publique
  const url = await getDownloadURL(storageRef);

  // Enregistrement Firestore
  await setDoc(
    doc(db, "games", sessionId, "photos", String(zoneId)),
    {
      zoneId,
      x,
      y,
      photoUrl: url,
      timestamp: Date.now(),
    },
    { merge: true }
  );

  return url;
}

/* -------------------------------------------------------------
   UPLOAD PHOTO EXTRA
-------------------------------------------------------------- */
export async function uploadExtraPhoto(
  sessionId: string,
  extraIndex: number,
  x: number,
  y: number,
  dataUrl: string
) {
  const blob = await (await fetch(dataUrl)).blob();

  const storageRef = ref(
    storage,
    `games/${sessionId}/extra/${extraIndex}.jpg`
  );

  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);

  await setDoc(
    doc(db, "games", sessionId, "extraPhotos", String(extraIndex)),
    {
      extraIndex,
      x,
      y,
      photoUrl: url,
      timestamp: Date.now(),
    },
    { merge: true }
  );

  return url;
}

/* -------------------------------------------------------------
   ABONNEMENT TEMPS RÉEL
   Pour le viewer : reçoit les photos synchronisées
-------------------------------------------------------------- */
export function subscribePhotos(
  sessionId: string,
  onZones: (photos: any[]) => void,
  onExtras: (extras: any[]) => void
) {
  // Zones
  const unsub1 = onSnapshot(
    collection(db, "games", sessionId, "photos"),
    (snap) => {
      onZones(snap.docs.map((d) => d.data()));
    }
  );

  // Photos extra
  const unsub2 = onSnapshot(
    collection(db, "games", sessionId, "extraPhotos"),
    (snap) => {
      onExtras(snap.docs.map((d) => d.data()));
    }
  );

  return () => {
    unsub1();
    unsub2();
  };
}

/* -------------------------------------------------------------
   RÉCUPÉRER LA SESSION ACTIVE
   Utilisé par /player pour rejoindre automatiquement la partie
-------------------------------------------------------------- */
export async function getActiveSessionId(): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, "activeSession", "current"));
    return snap.data()?.sessionId ?? null;
  } catch (err) {
    console.error("Erreur getActiveSessionId:", err);
    return null;
  }
}