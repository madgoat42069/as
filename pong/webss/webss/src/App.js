import React from 'react';
import './App.css';
import PongGame from './components/PongGame';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Pong Game</h1>
        <PongGame />
        <p>Use your mouse or touch to move the left paddle</p>
      </header>
    </div>
  );
}

export default App;
