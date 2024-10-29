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
      <div className="controlGroup">
        {/* TODO: WITH MORE TISSUE TYPES */}
        <Select
          defaultValue="Lung"
          size="small"
          style={{
            width: 120,
            marginRight: 20
          }}
          options={[
            {
              value: 'Lung',
              label: 'Lung',
            },
            {
              value: 'Breast',
              label: 'Breast',
            },
            {
              value: 'Liver',
              label: 'Liver',
            }
          ]}
        />
        {chromosList.length > 0 && (
          <Select
            defaultValue={chromosomeName}
            size="small"
            style={{
              width: 120,
              marginRight: 20
            }}
            onChange={chromosomeChange}
            options={chromosList}
          />
        )}
        <Input size="small" style={{ width: 200, marginRight: 10 }} placeholder="Start" onChange={(value) => chromosomeSequenceChange('start', value)} />
        <span style={{ marginRight: 10 }}>~</span>
        <Input size="small" style={{ width: 200, marginRight: 20 }} placeholder="End" onChange={(value) => chromosomeSequenceChange('end', value)} />
        <Button size="small" type="primary" onClick={submit}>Submit</Button>
      </div>
      {chromosomeData.length > 0 && (
        <Heatmap
          chromosomeData={chromosomeData}
          chromosomeSequence={chromosomeSequence}
        />)}
    </div>
  );
}

export default App;
