import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/academic-ui.css";

createRoot(document.getElementById("root")!).render(<App />);
