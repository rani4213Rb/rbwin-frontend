import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
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
              <Link to="/" className="hover:text-yellow-300">Live</Link>
              <Link to="/bet" className="hover:text-yellow-300">Bet</Link>
              <Link to="/wallet" className="hover:text-yellow-300">Wallet</Link>
              <Link to="/recharge" className="hover:text-yellow-300">Recharge</Link> {/* ✅ Recharge link */}
              <Link to="/login" className="hover:text-yellow-300">Login</Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Live />} />
            <Route path="/bet" element={<Bet />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/recharge" element={<Recharge />} /> {/* ✅ Recharge route */}
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
