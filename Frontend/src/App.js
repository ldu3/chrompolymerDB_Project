import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import './App.css';
import { Heatmap } from './heatmap.js';

function App() {
  const [chromosList, setChromosList] = useState([]);
  const [defaultChromos, setDefaultChromos] = useState(null);

  useEffect(() => {
    fetch('/getChromosList')
      .then(res => res.json())
      .then(data => {
        setChromosList(data)
        if (data.length > 0) {
          setDefaultChromos(data[0].value);
        }
      });
  }, []);

  const chromosomeChange = (value) => {
    fetch("/getChromosSeq", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chromosome_name: value })
    })
      .then(res => res.json())
      .then(data => {
        console.log(data, '//');
      });
  };

  return (
    <div className="App">
      {chromosList.length > 0 && (
        <Select
          defaultValue={defaultChromos}
          style={{
            width: 120,
          }}
          onChange={chromosomeChange}
          options={chromosList}
        />
      )}
      <Heatmap />
    </div>
  );
}

export default App;
