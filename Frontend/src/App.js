import React, { useState, useEffect } from 'react';
import { Select, Input, Button } from 'antd';
import './App.css';
// import { Heatmap } from './heatmap.js';
import { Heatmap } from './canvasHeatmap.js';
import { ChromosomeBar } from './chromosomeBar.js';

function App() {
  const [chromosList, setChromosList] = useState([]);
  const [chromosomeName, setChromosomeName] = useState(null);
  const [selectedChromosomeSequence, setSelectedChromosomeSequence] = useState({ start: 0, end: 0 });
  const [chromosomeData, setChromosomeData] = useState([]);
  const [totalChromosomeSequences, setTotalChromosomeSequences] = useState({});

  useEffect(() => {
    fetch('/getChromosList')
      .then(res => res.json())
      .then(data => {
        setChromosList(data);
        setChromosomeName(data[0].value);
      });
  }, []);

  useEffect(() => {
    if (chromosomeName) {
      fetch('/getChromosSequence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chromosome_name: chromosomeName })
      })
        .then(res => res.json())
        .then(data => {
          setTotalChromosomeSequences(data);
        });
    }
  }, [chromosomeName]);

  useEffect(() => {
    setSelectedChromosomeSequence({ start: totalChromosomeSequences.min_start, end: totalChromosomeSequences.min_start });
  }, [totalChromosomeSequences]);

  const chromosomeChange = value => {
    setChromosomeName(value);
  };

  const fetchChromosomeData = () => {
    fetch("/getChromosData", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chromosome_name: chromosomeName, selectedChromosomeSequence: selectedChromosomeSequence })
    })
      .then(res => res.json())
      .then(data => {
        setChromosomeData(data);
      });
  }

  const chromosomeSequenceChange = (position, value) => {
    if (position === 'start') {
      setSelectedChromosomeSequence({ ...selectedChromosomeSequence, start: Number(value.target.value) });
    } else {
      setSelectedChromosomeSequence({ ...selectedChromosomeSequence, end: Number(value.target.value) });
    }
  };

  return (
    <div className="App">
      <div className="controlGroup">
        {/* TODO: WITH MORE TISSUE TYPES */}
        <span className="controlGroupText">Cell line:</span>
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
          <>
            <span className="controlGroupText">Chromosome:</span>
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
          </>
        )}
        <span className="controlGroupText">Sequences:</span>
        <Input size="small" style={{ width: 200, marginRight: 10 }} placeholder="Start" onChange={(value) => chromosomeSequenceChange('start', value)} value={selectedChromosomeSequence.start} />
        <span className="controlGroupText">~</span>
        <Input size="small" style={{ width: 200, marginRight: 20 }} placeholder="End" onChange={(value) => chromosomeSequenceChange('end', value)} value={selectedChromosomeSequence.end} />
        <Button size="small" color="primary" variant="outlined" onClick={fetchChromosomeData}>Submit</Button>
      </div>
      {Object.keys(totalChromosomeSequences).length > 0 && (
        <ChromosomeBar
          selectedChromosomeSequence={selectedChromosomeSequence}
          setSelectedChromosomeSequence={setSelectedChromosomeSequence}
          totalChromosomeSequences={totalChromosomeSequences}
        />
      )}
      {chromosomeData.length > 0 && (
        <Heatmap
          chromosomeData={chromosomeData}
          totalChromosomeSequences={totalChromosomeSequences}
          selectedChromosomeSequence={selectedChromosomeSequence}
        />)}
    </div>
  );
}

export default App;
