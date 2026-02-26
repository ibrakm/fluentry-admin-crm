import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppVercel from "./AppVercel";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppVercel />
  </StrictMode>
);
