import React, { useState, useEffect } from 'react';
import { Select, Input, Button, message } from 'antd';
import './App.css';
// import { Heatmap } from './heatmap.js';
import { Heatmap } from './canvasHeatmap.js';
import { ChromosomeBar } from './chromosomeBar.js';
import { Chromosome3D } from './Chromosome3D.js';

function App() {
  const [cellLineList, setCellLineList] = useState([]);
  const [chromosList, setChromosList] = useState([]);
  const [cellLineName, setCellLineName] = useState(null);
  const [chromosomeName, setChromosomeName] = useState(null);
  const [chromosomeSize, setChromosomeSize] = useState(0);
  const [totalChromosomeSequences, setTotalChromosomeSequences] = useState([]);
  const [selectedChromosomeSequence, setSelectedChromosomeSequence] = useState({ start: 0, end: 0 });
  const [chromosomeData, setChromosomeData] = useState([]);
  const [chromosome3DExampleID, setChromosome3DExampleID] = useState(0);
  const [chromosome3DExampleData, setChromosome3DExampleData] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetch('/getCellLines')
      .then(res => res.json())
      .then(data => {
        setCellLineList(data);
      });
  }, []);

  useEffect(() => {
    if (cellLineName && chromosomeName) {
      fetch('/getChromosSequence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cell_line: cellLineName, chromosome_name: chromosomeName })
      })
        .then(res => res.json())
        .then(data => {
          setTotalChromosomeSequences(data);
        });
    }
  }, [cellLineName, chromosomeName]);

  useEffect(() => {
    if (totalChromosomeSequences.length > 0) {
      setSelectedChromosomeSequence({ start: totalChromosomeSequences[0].start, end: totalChromosomeSequences[0].start });
    }
  }, [totalChromosomeSequences]);

  useEffect(() => {
    setChromosomeName(null);
    setChromosomeSize(0);
    setSelectedChromosomeSequence({ start: 0, end: 0 });
  }, [cellLineName]);

  useEffect(() => {
    setChromosomeSize(0);
    setSelectedChromosomeSequence({ start: 0, end: 0 });
  }, [chromosomeName]);

  const fetchChromosomeList = (value) => {
    fetch('/getChromosList', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cell_line: value })
    })
      .then(res => res.json())
      .then(data => {
        setChromosList(data);
      });
  };

  const fetchChromosomeSize = (value) => {
    fetch("/getChromosSize", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chromosome_name: value })
    })
      .then(res => res.json())
      .then(data => {
        setChromosomeSize(data);
      });
  };

  const fetchChromosomeData = () => {
    if (selectedChromosomeSequence.end - selectedChromosomeSequence.start > 4000000) {
      warning('overrange');
    } else if (!cellLineName || !chromosomeName) {
      warning('noData');
    } else {
      fetch("/getChromosData", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cell_line: cellLineName, chromosome_name: chromosomeName, sequences: selectedChromosomeSequence })
      })
        .then(res => res.json())
        .then(data => {
          setChromosomeData(data);
        });
    }
  };

  const getExampleChromos3DData = () => {
    if (cellLineName && chromosomeName && selectedChromosomeSequence) {
      fetch("/getExampleChromos3DData", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cell_line: cellLineName, chromosome_name: chromosomeName, sequences: selectedChromosomeSequence, sample_id: chromosome3DExampleID })
      })
        .then(res => res.json())
        .then(data => {
          setChromosome3DExampleData(data);
        });
    }
  };

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
    if (type === 'noData') {
      messageApi.open({
        type: 'warning',
        content: 'Select cell line and chromosome first',
        duration: 1.5,
      });
    }
  };

  const cellLineChange = value => {
    setCellLineName(value);
    fetchChromosomeList(value);
  }

  const chromosomeChange = value => {
    setChromosomeName(value);
    fetchChromosomeSize(value);
  };

  const submit = () => {
    fetchChromosomeData();
    getExampleChromos3DData();
  };

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
          <span className="controlGroupText">Cell Line:</span>
          <Select
            value={cellLineName}
            size="small"
            style={{
              width: "15%",
              marginRight: 20
            }}
            onChange={cellLineChange}
            options={cellLineList}
          />
          <>
            <span className="controlGroupText">Chromosome:</span>
            <Select
              value={chromosomeName}
              size="small"
              style={{
                width: "10%",
                marginRight: 20
              }}
              onChange={chromosomeChange}
              options={chromosList}
            />
          </>
          <span className="controlGroupText">Sequences:</span>
          <Input size="small" style={{ width: "10%", marginRight: 10 }} placeholder="Start" onChange={(value) => chromosomeSequenceChange('start', value)} value={selectedChromosomeSequence.start} />
          <span className="controlGroupText">~</span>
          <Input size="small" style={{ width: "10%", marginRight: 20 }} placeholder="End" onChange={(value) => chromosomeSequenceChange('end', value)} value={selectedChromosomeSequence.end} />
          <Button size="small" color="primary" variant="outlined" onClick={submit}>Check</Button>
        </div>
        <ChromosomeBar
          warning={warning}
          selectedChromosomeSequence={selectedChromosomeSequence}
          setSelectedChromosomeSequence={setSelectedChromosomeSequence}
          chromosomeSize={chromosomeSize}
          totalChromosomeSequences={totalChromosomeSequences}
        />
      </div>
      <div className='content'>
        {chromosomeData.length > 0 && (
          <Heatmap
            cellLineName={cellLineName}
            chromosomeName={chromosomeName}
            chromosomeData={chromosomeData}
            totalChromosomeSequences={totalChromosomeSequences}
            selectedChromosomeSequence={selectedChromosomeSequence}
          />)}
        {chromosome3DExampleData.length > 0 && (
          <Chromosome3D
            chromosome3DExampleData={chromosome3DExampleData}
          />
        )}
      </div>
    </div>
  );
}

export default App;
