import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Graph from './components/graph'
import './styling/App.css'

function App() {

  return (
    <>
      <div className='flex'>
        <div className='graph'>
          <Graph/>
        </div>
      </div>
      
    </>
  )
}

export default App
