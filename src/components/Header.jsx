import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center">
      <h1 className="text-lg font-bold text-yellow-400">RBWIN</h1>
      <div className="flex space-x-4">
        <Link to="/" className="hover:text-yellow-400">Live</Link>
        <Link to="/bet" className="hover:text-yellow-400">Bet</Link>
        <Link to="/wallet" className="hover:text-yellow-400">Wallet</Link>
        <Link to="/login" className="hover:text-yellow-400">Login</Link>
      </div>
    </nav>
  )
}

export default Header
