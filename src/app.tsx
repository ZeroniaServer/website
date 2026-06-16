import React from "react";
import ReactDOM from "react-dom/client";
import "./app.css";
import Navbar from "./components/navbar";
import HomePage from "./pages/home";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Navbar />
    <HomePage />
  </React.StrictMode>,
);
