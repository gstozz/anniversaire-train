import { useEffect, useState } from "react";
import App from "./App";
import { getActiveSessionId } from "./firebase";

export default function Player() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const session = await getActiveSessionId();

      if (!session) {
        console.error("Aucune session active trouvée !");
        return;
      }

      setSessionId(session);
    }

    load();
  }, []);

  if (!sessionId) {
    return (
      <div
        style={{
          color: "white",
          fontSize: "20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        }}
      >
        Connexion…
      </div>
    );
  }

  return <App mode="player" sessionId={sessionId} />;
}