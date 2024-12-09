import { useState } from 'react'
import Graph from './components/graph'
import { BalanceBar } from './components/balance'
import './styling/App.css'

function App() {

  return (
    <>
      <div className='flex'>
        <div className='header'>
          <BalanceBar/>
        </div>
        <div className='body'>
          <div className='graph'>
            <Graph/>
          </div>
        </div>
        
      </div>
      
    </>
  )
}

export default App
