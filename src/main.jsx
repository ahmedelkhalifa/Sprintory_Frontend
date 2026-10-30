import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ColorModeProvider from "./context/ColorModeProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* the theme (light / dark) and CssBaseline */}
    <ColorModeProvider>
      <App />
    </ColorModeProvider>
  </StrictMode>,
);
