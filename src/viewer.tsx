import { useEffect, useState } from "react";
import App from "./App";
import { db, getActiveSessionId } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Viewer() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const existing = await getActiveSessionId();
      if (existing) {
        setSessionId(existing);
        return;
      }

      // Si aucune session n’existe → on en crée une
      const newSession = String(Date.now());

      await setDoc(doc(db, "activeSession", "current"), {
        sessionId: newSession,
        createdAt: Date.now()
      });

      setSessionId(newSession);
    }

    load();
  }, []);

  if (!sessionId) {
    return <div style={{ color: "white" }}>Chargement…</div>;
  }

  return <App mode="viewer" sessionId={sessionId} />;
}