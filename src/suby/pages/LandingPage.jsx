import React from 'react'
import TopBar from '../components/TopBar'
import ItemsDisplay from '../components/ItemsDisplay'
import Chains from '../components/Chains'
import FirmCollections from '../components/FirmCollections'

const LandingPage = () => {
  return (
    <div>
      <TopBar />
      <div className="landingSection">
        <header className="intro">
          <h1>What are you craving?</h1>
          <p>Order from kitchens near you and follow it to your door.</p>
        </header>
        <ItemsDisplay />
        <Chains />
        <FirmCollections />
      </div>
    </div>
  )
}

export default LandingPage
