import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./providers/theme-provider.tsx";

// Debug environment variables on app startup
console.log("🚀 APP STARTUP - Environment check:");
console.log("  - import.meta.env:", import.meta.env);
console.log("  - VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "  - VITE_SUPABASE_ANON_KEY present:",
  !!import.meta.env.VITE_SUPABASE_ANON_KEY
);
console.log(
  "  - All VITE_ vars:",
  Object.entries(import.meta.env).filter(([key]) => key.startsWith("VITE_"))
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
