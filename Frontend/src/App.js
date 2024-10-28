import React, { useState, useEffect } from 'react';
import { Select, Input, Button } from 'antd';
import './App.css';
import { Heatmap } from './heatmap.js';

function App() {
  const [chromosList, setChromosList] = useState([]);
  const [chromosomeName, setChromosomeName] = useState(null);
  const [chromosomeSequence, setChromosomeSequence] = useState({ start: null, end: null });
  const [chromosomeData, setChromosomeData] = useState([]);

  useEffect(() => {
    fetch('/getChromosList')
      .then(res => res.json())
      .then(data => {
        setChromosList(data)
        if (data.length > 0) {
          setChromosomeName(data[0].value);
        }
      });
  }, []);

  const chromosomeChange = value => {
    setChromosomeName(value);
  };

  const chromosomeSequenceChange = (position, value) => {
    if (position === 'start') {
      setChromosomeSequence({ ...chromosomeSequence, start: Number(value.target.value) });
    } else {
      setChromosomeSequence({ ...chromosomeSequence, end: Number(value.target.value) });
    }
  };

  const submit = () => {
    fetch("/getChromosData", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chromosome_name: chromosomeName, chromosomeSequence: chromosomeSequence })
    })
      .then(res => res.json())
      .then(data => {
        setChromosomeData(data);
      });
  }

  return (
    <div className="App">
      {chromosList.length > 0 && (
        <Select
          defaultValue={chromosomeName}
          style={{
            width: 120,
          }}
          onChange={chromosomeChange}
          options={chromosList}
        />
      )}
      <Input placeholder="Start" onChange={(value) => chromosomeSequenceChange('start', value)} />
      <Input placeholder="End" onChange={(value) => chromosomeSequenceChange('end', value)} />
      <Button type="primary" onClick={submit}>Submit</Button>
      {chromosomeData.length > 0 && (
        <Heatmap
          chromosomeData={chromosomeData}
          chromosomeSequence={chromosomeSequence}
        />)}
    </div>
  );
}

export default App;
