import React from 'react'
import { Link } from 'react-router-dom'

const TopBar = () => {
  return (
   <section className="topBarSection">
        <div className="companyTitle">
            <Link to='/' className='link'>
            <h2>YUMMY</h2>
            </Link>
        </div>
        {/* NEW: My Orders link */}
        <div className="topBarLinks">
            <Link to='/my-orders' className='link'>My Orders</Link>
        </div>
{/*         <div className="searchBar">
            <input type="text" placeholder='Search...' />
        </div>
        <div className="userAuth">
            Login / SignUp
        </div> */}
   </section>
  )
}

export default TopBar
