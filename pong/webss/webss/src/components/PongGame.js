import React, { useEffect, useRef, useState } from 'react';
import MainMenu from './MainMenu';
import './PongGame.css';

const PongGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, ended
  const [difficulty, setDifficulty] = useState(1); // 0-4
  const [winner, setWinner] = useState(null);
  const gameLoopRef = useRef(null);
  
  const startGame = () => {
    setGameState('playing');
    setWinner(null);
  };

  const returnToMenu = () => {
    // Cancel the animation frame to stop the game loop
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    setGameState('menu');
    setWinner(null);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Game constants
    const WIDTH = 1200;
    const HEIGHT = 600;
    const PADDLE_HEIGHT = 100;
    const PADDLE_WIDTH = 15;
    const BALL_SIZE = 10;
    const INITIAL_BALL_SPEED = 7;
    const MAX_BALL_SPEED = 18;
    const SPEED_INCREASE = 0.5;
    const WINNING_SCORE = 15;
    
    // AI difficulty settings
    const AI_SETTINGS = {
      0: { speedFactor: 0.4, predictionError: 0.3 }, // Easy
      1: { speedFactor: 0.6, predictionError: 0.2 }, // Medium
      2: { speedFactor: 0.8, predictionError: 0.1 }, // Hard
      3: { speedFactor: 0.9, predictionError: 0.05 }, // Expert
      4: { speedFactor: 1.0, predictionError: 0 } // Impossible
    };
    
    // Game state
    let playerY = HEIGHT/2 - PADDLE_HEIGHT/2;
    let aiY = HEIGHT/2 - PADDLE_HEIGHT/2;
    let ballX = WIDTH/2;
    let ballY = HEIGHT/2;
    let ballSpeedX = INITIAL_BALL_SPEED;
    let ballSpeedY = INITIAL_BALL_SPEED;
    let playerScore = 0;
    let aiScore = 0;
    let particles = [];
    
    // Particle system for winning animation
    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = Math.random() * 8 + 2;
        this.angle = Math.random() * Math.PI * 2;
        this.size = Math.random() * 4 + 2;
        this.life = 1;
        this.color = `hsl(${Math.random() * 360}, 50%, 50%)`;
      }
      
      update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life -= 0.02;
        this.size *= 0.95;
      }
      
      draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    
    // Ball launch angle utilities
    const getRandomAngle = () => {
      // Returns an angle between -45 and 45 degrees in radians
      return (Math.random() * 90 - 45) * Math.PI / 180;
    };

    const resetBall = (direction = 1) => {
      ballX = WIDTH/2;
      ballY = HEIGHT/2;
      const angle = getRandomAngle();
      ballSpeedX = INITIAL_BALL_SPEED * Math.cos(angle) * direction;
      ballSpeedY = INITIAL_BALL_SPEED * Math.sin(angle);
    };
    
    // Paddle hit calculation
    const calculateBallAngle = (ballPos, paddlePos, paddleHeight) => {
      const relativePos = (ballPos - paddlePos) / paddleHeight;
      return (relativePos - 0.5) * Math.PI * 0.7; // 70% of 180 degrees
    };
    
    // Handle mouse/touch movement with smoothing
    let targetPlayerY = playerY;
    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      targetPlayerY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, mouseY - PADDLE_HEIGHT/2));
    };
    
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleMove(e.touches[0]);
    });
    
    // Improved AI with difficulty settings
    const updateAI = () => {
      const settings = AI_SETTINGS[difficulty];
      const aiCenter = aiY + PADDLE_HEIGHT/2;
      const predictionError = (Math.random() - 0.5) * HEIGHT * settings.predictionError;
      const ballPrediction = ballY + (ballSpeedY * (WIDTH - ballX) / ballSpeedX) + predictionError;
      const targetY = ballSpeedX > 0 ? 
        Math.max(PADDLE_HEIGHT/2, Math.min(HEIGHT - PADDLE_HEIGHT/2, ballPrediction)) : 
        HEIGHT/2;
      
      const aiSpeed = Math.abs(ballSpeedX) * settings.speedFactor;
      if (Math.abs(aiCenter - targetY) > 5) {
        aiY += aiCenter < targetY ? aiSpeed : -aiSpeed;
      }
      aiY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, aiY));
    };
    
    // Create winning animation
    const createWinningAnimation = (x, y) => {
      for (let i = 0; i < 100; i++) {
        particles.push(new Particle(x, y));
      }
    };
    
    // Game loop
    const gameLoop = () => {
      if (gameState !== 'playing') return;
      
      // Update particles
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => p.update());
      
      // Smooth player paddle movement
      playerY += (targetPlayerY - playerY) * 0.2;
      
      // Update ball position
      ballX += ballSpeedX;
      ballY += ballSpeedY;
      
      // Ball collision with top and bottom
      if (ballY <= BALL_SIZE || ballY >= HEIGHT - BALL_SIZE) {
        ballSpeedY = -ballSpeedY * 0.98; // Slight speed loss on bounce
        ballY = ballY <= BALL_SIZE ? BALL_SIZE : HEIGHT - BALL_SIZE;
      }
      
      // Ball collision with paddles
      if (ballX <= PADDLE_WIDTH + BALL_SIZE && 
          ballY >= playerY - BALL_SIZE && 
          ballY <= playerY + PADDLE_HEIGHT + BALL_SIZE) {
        const angle = calculateBallAngle(ballY, playerY, PADDLE_HEIGHT);
        const speed = Math.min(Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY) + SPEED_INCREASE, MAX_BALL_SPEED);
        ballSpeedX = Math.abs(speed * Math.cos(angle));
        ballSpeedY = speed * Math.sin(angle);
        ballX = PADDLE_WIDTH + BALL_SIZE;
      }
      
      if (ballX >= WIDTH - PADDLE_WIDTH - BALL_SIZE && 
          ballY >= aiY - BALL_SIZE && 
          ballY <= aiY + PADDLE_HEIGHT + BALL_SIZE) {
        const angle = calculateBallAngle(ballY, aiY, PADDLE_HEIGHT);
        const speed = Math.min(Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY) + SPEED_INCREASE, MAX_BALL_SPEED);
        ballSpeedX = -Math.abs(speed * Math.cos(angle));
        ballSpeedY = speed * Math.sin(angle);
        ballX = WIDTH - PADDLE_WIDTH - BALL_SIZE;
      }
      
      // Score points
      if (ballX <= 0) {
        aiScore++;
        resetBall(1);
      }
      if (ballX >= WIDTH) {
        playerScore++;
        resetBall(-1);
      }
      
      // Update AI
      updateAI();
      
      // Check for winner
      if (playerScore >= WINNING_SCORE || aiScore >= WINNING_SCORE) {
        const winner = playerScore > aiScore ? 'Player' : 'AI';
        setWinner(winner);
        setGameState('ended');
        createWinningAnimation(WIDTH/2, HEIGHT/2);
        return; // Stop the game loop
      }
      
      // Draw everything
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      
      // Draw particles
      particles.forEach(p => p.draw(ctx));
      
      // Draw paddles with gradient
      const paddleGradient = ctx.createLinearGradient(0, 0, PADDLE_WIDTH, 0);
      paddleGradient.addColorStop(0, '#fff');
      paddleGradient.addColorStop(1, '#ccc');
      ctx.fillStyle = paddleGradient;
      ctx.fillRect(0, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(WIDTH - PADDLE_WIDTH, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);
      
      // Draw ball with shadow
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL_SIZE, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Draw scores
      ctx.font = 'bold 60px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(playerScore, WIDTH/4, 80);
      ctx.fillText(aiScore, 3*WIDTH/4, 80);
      
      // Draw center line
      ctx.setLineDash([5, 15]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(WIDTH/2, 0);
      ctx.lineTo(WIDTH/2, HEIGHT);
      ctx.stroke();
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start the game
    resetBall();
    gameLoop();
    
    // Cleanup
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('touchmove', handleMove);
    };
  }, [gameState, difficulty]);
  
  if (gameState === 'menu') {
    return (
      <MainMenu 
        onStartGame={startGame}
        onSelectDifficulty={setDifficulty}
        difficulty={difficulty}
      />
    );
  }
  
  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={1200}
        height={600}
        style={{ border: '2px solid white', borderRadius: '4px' }}
      />
      {gameState === 'ended' && (
        <div className="game-over">
          <h2>{winner} Wins!</h2>
          <button onClick={returnToMenu}>Back to Menu</button>
        </div>
      )}
    </div>
  );
};

export default PongGame; 