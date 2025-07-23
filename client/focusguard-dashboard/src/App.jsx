// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import SignUp from "@/pages/SignUp";
import FocusSession from "@/pages/FocusSession";

export default function App() {
  return (
    <Router>
      <Navbar />
      <main className="pt-16">
        {/* pt-16 to offset fixed navbar height */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/focus" element={<FocusSession />} />
        </Routes>
      </main>
    </Router>
  );
}
