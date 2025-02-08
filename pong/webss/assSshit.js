import React, { useState, useEffect } from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Test backend connection
    fetch('http://localhost:8000/api/ping')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Web App</h1>
        <p>Message from backend: {message}</p>
      </header>
    </div>
  );
}

export default App;
