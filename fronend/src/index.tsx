import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "app";
import reportWebVitals from "./reportWebVitals";
import { installThemeStyles } from "shared/theme";

installThemeStyles();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
