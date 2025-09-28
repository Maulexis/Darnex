import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import RailwayMap from './RailwayMap.jsx';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>My Railway Map</h1>
        <p>(Use your mouse wheel to zoom and click-drag to pan)</p>
      </header>
      <main>
        <TransformWrapper>
          <TransformComponent>
            <RailwayMap />
          </TransformComponent>
        </TransformWrapper>
      </main>
    </div>
  );
}

export default App;