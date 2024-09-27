import React, {useState, useEffect} from 'react';
import './App.css';
import { Heatmap } from './heatmap.js';

function App() {
  useEffect(() => {
    fetch('/members')
      .then(response => response.json())
      .then(data => console.log(data));
  }, []);
  return (
    <div className="App">
      <Heatmap />
    </div>
  );
}

export default App;
