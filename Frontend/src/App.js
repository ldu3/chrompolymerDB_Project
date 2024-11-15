import React, { useState, useEffect } from 'react';
import { Select, Input, Button, message, Empty, Spin, Tabs } from 'antd';
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
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [chromosome3DLoading, setChromosome3DLoading] = useState(false);

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
          setHeatmapLoading(false);
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
          setChromosome3DLoading(false);
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
    setChromosomeName(null);
    setChromosomeSize(0);
    setSelectedChromosomeSequence({ start: 0, end: 0 });
    setChromosomeData([]);
    setChromosome3DExampleData([]);
    fetchChromosomeList(value);
  };

  const chromosomeChange = value => {
    setChromosomeName(value);
    setChromosome3DExampleData([]);
    fetchChromosomeSize(value);
  };

  const submit = () => {
    setHeatmapLoading(true);
    setChromosome3DLoading(true);
    fetchChromosomeData();
    getExampleChromos3DData();
  };

  const chromosomeSequenceChange = (position, value) => {
    const newValue = Number(value);

    if (position === 'start') {
      if (selectedChromosomeSequence.end < newValue) {
        warning('smallend');
      } else {

        setSelectedChromosomeSequence(prevState => ({
          ...prevState,
          start: newValue,
        }));
      }
    } else {
      if (newValue - selectedChromosomeSequence.start > 4000000) {
        warning('overrange');
      } else {
        setSelectedChromosomeSequence(prevState => ({
          ...prevState,
          end: newValue,
        }));
      }
    }
  };
  const onChange = (key) => {
    console.log(key);
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
          <Input size="small" style={{ width: "10%", marginRight: 10 }} placeholder="Start" onChange={(e) => chromosomeSequenceChange('start', e.target.value)} value={selectedChromosomeSequence.start} />
          <span className="controlGroupText">~</span>
          <Input size="small" style={{ width: "10%", marginRight: 20 }} placeholder="End" onChange={(e) => chromosomeSequenceChange('end', e.target.value)} value={selectedChromosomeSequence.end} />
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
        <Spin spinning={heatmapLoading || chromosome3DLoading} fullscreen />
        {chromosomeData.length > 0 ? (
          <Heatmap
            cellLineName={cellLineName}
            chromosomeName={chromosomeName}
            chromosomeData={chromosomeData}
            totalChromosomeSequences={totalChromosomeSequences}
            selectedChromosomeSequence={selectedChromosomeSequence}
          />) : <Empty style={{ width: '30%', height: '100%', borderRight: "1px solid #eaeaea", margin: 0 }} description="No data" />}
        {/* {chromosome3DExampleData.length > 0 ? (
          <Chromosome3D
            chromosome3DExampleData={chromosome3DExampleData}
          />
        ) : <Empty style={{ width: '70%', height: '100%', margin: 0 }} description="No data" />} */}
        {chromosome3DExampleData.length > 0 ? (
          <Tabs
            size='small'
            style={{ width: '70%', height: '100%', margin: 0 }}
            onChange={onChange}
            items={new Array(3).fill(null).map((_, i) => {
              const id = String(i + 1);
              return {
                label: `Sample ${id}`,
                key: id,
                children: <Chromosome3D
                  chromosome3DExampleData={chromosome3DExampleData}
                />,
              };
            })}
          />
        ) : <Empty style={{ width: '70%', height: '100%', margin: 0 }} description="No data" />}
      </div>
    </div>
  );
}

export default App;
