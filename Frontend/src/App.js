import React, { useState, useEffect } from 'react';
import { Select, Input, Button, message } from 'antd';
import './App.css';
// import { Heatmap } from './heatmap.js';
import { Heatmap } from './canvasHeatmap.js';
import { ChromosomeBar } from './chromosomeBar.js';

function App() {
  const [cellLineList, setCellLineList] = useState([]);
  const [chromosList, setChromosList] = useState([]);
  const [cellLineName, setCellLineName] = useState(null);
  const [chromosomeName, setChromosomeName] = useState(null);
  const [selectedChromosomeSequence, setSelectedChromosomeSequence] = useState({ start: 0, end: 0 });
  const [chromosomeData, setChromosomeData] = useState([]);
  const [totalChromosomeSequences, setTotalChromosomeSequences] = useState({});
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetch('/getCellLines')
      .then(res => res.json())
      .then(data => {
        setCellLineList(data);
        setCellLineName(data[0].value);
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

  const warning = (type) => {
    if (type === 'overrange') {
      messageApi.open({
        type: 'warning',
        content: 'Please limits the range to 4,000,000',
        duration: 1.5,
      });
    }
    if (type === 'smallend') {
      messageApi.open({
        type: 'warning',
        content: 'Please set the end value greater than the start value',
        duration: 1.5,
      });
    }
  };

  const cellLineChange = value => {
    setCellLineName(value);
  }
  const chromosomeChange = value => {
    setChromosomeName(value);
  };

  const fetchChromosomeData = () => {
    if (selectedChromosomeSequence.end - selectedChromosomeSequence.start > 4000000) {
      warning('overrange');
    } else {
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
  }

  const chromosomeSequenceChange = (position, value) => {
    if (position === 'start') {
      if (selectedChromosomeSequence.end < Number(value.target.value)) {
        warning('smallend');
      } else {
        setSelectedChromosomeSequence({ ...selectedChromosomeSequence, start: Number(value.target.value) });
      }
    } else {
      if (Number(value.target.value) - selectedChromosomeSequence.start > 4000000) {
        warning('overrange');
      } else {
        setSelectedChromosomeSequence({ ...selectedChromosomeSequence, end: Number(value.target.value) });
      }
    }
  };

  return (
    <div className="App">
      {contextHolder}
      <div className="controlHeader">
        <div className="controlGroup">
          {/* TODO: WITH MORE TISSUE TYPES */}
          <span className="controlGroupText">Cell line:</span>
          <Select
            defaultValue={cellLineName}
            size="small"
            style={{
              width: 120,
              marginRight: 20
            }}
            onChange={cellLineChange}
            options={cellLineList}
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
          <Button size="small" color="primary" variant="outlined" onClick={fetchChromosomeData}>Check</Button>
        </div>

        {Object.keys(totalChromosomeSequences).length > 0 && (
          <ChromosomeBar
            warning={warning}
            selectedChromosomeSequence={selectedChromosomeSequence}
            setSelectedChromosomeSequence={setSelectedChromosomeSequence}
            totalChromosomeSequences={totalChromosomeSequences}
          />
        )}
      </div>
      <div className='content'>
        {chromosomeData.length > 0 && (
          <Heatmap
            chromosomeName={chromosomeName}
            chromosomeData={chromosomeData}
            totalChromosomeSequences={totalChromosomeSequences}
            selectedChromosomeSequence={selectedChromosomeSequence}
          />)}
      </div>
    </div>
  );
}

export default App;
