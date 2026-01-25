import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import NoteList from "./pages/NoteList";
import NoteDetail from "./pages/NoteDetail";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/notes" element={<NoteList />}></Route>
        <Route path="/notes/:id" element={<NoteDetail />}></Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
