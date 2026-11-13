import React from 'react'
import { Link } from 'react-router-dom'
import { FaReceipt } from 'react-icons/fa'
import ThemeToggle from '../../theme/ThemeToggle'

const TopBar = () => {
  return (
    <section className="topBarSection">
      <div className="companyTitle">
        <Link to="/" className="link" aria-label="Yummy home">
          <h2>yummy<span className="dot" aria-hidden="true" /></h2>
        </Link>
      </div>
      <div className="topBarLinks">
        <ThemeToggle />
        <Link to="/my-orders" className="link"><FaReceipt aria-hidden="true" /> My orders</Link>
      </div>
    </section>
  )
}

export default TopBar
