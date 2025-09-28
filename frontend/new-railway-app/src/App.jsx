import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import RailwayMap from './RailwayMap.jsx';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>My Railway Map</h1>
      </header>
      <main>
        <RailwayMap />
      </main>
    </div>
  )
}
export default App
