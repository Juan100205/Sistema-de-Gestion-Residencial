import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./view/App.jsx";
import { BrowserRouter } from "react-router-dom";
import webApiClient from "./utils/webApiClient.js";

// In web (non-Electron) mode, polyfill window.api with fetch-based client
if (!window.api) {
  window.api = webApiClient;
}

ReactDOM.createRoot(document.getElementById("root")).render(
<React.StrictMode>
  <App />   
</React.StrictMode>
);