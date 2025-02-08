import React from 'react';

const MainMenu = ({ onStartGame, onSelectDifficulty, difficulty }) => {
  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert', 'Impossible'];

  return (
    <div className="main-menu">
      <h1>PONG</h1>
      <button className="menu-button" onClick={onStartGame}>
        PLAY
      </button>
      <div className="difficulty-selector">
        <h2>Difficulty: {difficulties[difficulty]}</h2>
        <div className="difficulty-buttons">
          {difficulties.map((diff, index) => (
            <button
              key={diff}
              className={`difficulty-button ${difficulty === index ? 'active' : ''}`}
              onClick={() => onSelectDifficulty(index)}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainMenu; 