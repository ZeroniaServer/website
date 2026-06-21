import React from "react";
import ReactDOM from "react-dom/client";
import "./app.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import HomePage from "./pages/home";
import GamePage from "./pages/game";
import { useRoute } from "./lib/router";

function App() {
  const slug = useRoute();
  return (
    <>
      <Navbar />
      {slug ? <GamePage slug={slug} /> : <HomePage />}
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
