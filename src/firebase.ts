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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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
  const blob = await (await fetch(dataUrl)).blob();

  const storageRef = ref(storage, `games/${sessionId}/zones/${zoneId}.jpg`);

  await uploadBytes(storageRef, blob);

  const url = await getDownloadURL(storageRef);

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
-------------------------------------------------------------- */
export function subscribePhotos(
  sessionId: string,
  onZones: (photos: any[]) => void,
  onExtras: (extras: any[]) => void
) {
  const unsub1 = onSnapshot(
    collection(db, "games", sessionId, "photos"),
    (snap) => {
      onZones(snap.docs.map((d) => d.data()));
    }
  );

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
