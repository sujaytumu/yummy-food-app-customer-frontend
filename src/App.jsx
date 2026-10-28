import React from 'react'
import LandingPage from './suby/pages/LandingPage'
import { Routes, Route } from 'react-router-dom'

import './App.css'
import ProductMenu from './suby/components/ProductMenu'
import MyOrders from './suby/pages/MyOrders' // NEW
import OrderStatus from './suby/pages/OrderStatus' // NEW

const App = () => {
  return (
    <div>
      <Routes>
          <Route path='/' element = { <LandingPage />} />
          <Route path='/products/:firmId/:firmName' element = {<ProductMenu />} />
          <Route path='/my-orders' element = {<MyOrders />} /> {/* NEW */}
          <Route path='/order/:orderId' element = {<OrderStatus />} /> {/* NEW: live order status */}
      </Routes>
    
    </div>
  )
}

export default App