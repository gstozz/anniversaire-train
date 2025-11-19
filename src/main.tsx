import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Viewer from "./viewer";
import Player from "./player";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/player" element={<Player />} />
        <Route path="*" element={<Navigate to="/viewer" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);