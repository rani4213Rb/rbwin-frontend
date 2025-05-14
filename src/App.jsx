import React from "react";
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom";
import Bet from "./pages/Bet";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navbar */}
        <nav className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">RBWIN</h1>
            <div className="space-x-4">
              <Link to="/bet" className="hover:text-yellow-300">Bet</Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/bet" element={<Bet />} />
            <Route path="*" element={<Navigate to="/bet" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
