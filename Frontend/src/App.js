import React, { useState, useEffect } from 'react';
import { Select, Input, Button, message, Empty, Spin, Tabs } from 'antd';
import './App.css';
// import { Heatmap } from './heatmap.js';
import { Heatmap } from './canvasHeatmap.js';
import { ChromosomeBar } from './chromosomeBar.js';
import { Chromosome3D } from './Chromosome3D.js';
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";


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

  // 3D Chromosome Comparison settings
  const [chromosome3DComparisonShowing, setChromosome3DComparisonShowing] = useState(false);
  const [comparisonCellLineList, setComparisonCellLineList] = useState([]);
  const [comparisonCellLine, setComparisonCellLine] = useState(null);
  const [comparisonCellLine3DData, setComparisonCellLine3DData] = useState([]);
  const [comparisonCellLine3DSampleID, setComparisonCellLine3DSampleID] = useState(0);
  const [comparisonCellLine3DLoading, setComparisonCellLine3DLoading] = useState(false);

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

  const fetchExampleChromos3DData = (cell_line, sample_id, sampleChange, isComparison) => {
    if (cell_line && chromosomeName && selectedChromosomeSequence) {
      fetch("/getExampleChromos3DData", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cell_line: cell_line, chromosome_name: chromosomeName, sequences: selectedChromosomeSequence, sample_id: sample_id })
      })
        .then(res => res.json())
        .then(data => {
          if (isComparison) {
            setComparisonCellLine3DData(data);
            setComparisonCellLine3DLoading(false);
          } else {
            setChromosome3DExampleData(data);
            if (sampleChange === "submit") {
              setChromosome3DLoading(false);
            }
          }
        });
    }
  };

  const fetchComparisonCellLineList = () => {
    if (chromosomeName && selectedChromosomeSequence) {
      fetch("/getComparisonCellLineList", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cell_line: cellLineName, chromosome_name: chromosomeName, sequences: selectedChromosomeSequence })
      })
        .then(res => res.json())
        .then(data => {
          if (data.length > 0) {
            setComparisonCellLineList(data);
            setChromosome3DComparisonShowing(true);
          } else {
            warning('noComparison3DData');
            setChromosome3DComparisonShowing(false);
          }
        });
    }
  };

  // Warning message
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
    if (type === 'noComparison3DData') {
      messageApi.open({
        type: 'warning',
        content: 'No Cell Line with the same chromosome and sequence',
        duration: 1.5,
      });
    }
  };

  // Cell Line selection change
  const cellLineChange = value => {
    setCellLineName(value);
    setChromosomeName(null);
    setChromosomeSize(0);
    setSelectedChromosomeSequence({ start: 0, end: 0 });
    setChromosomeData([]);
    setChromosome3DExampleData([]);
    setComparisonCellLine3DData([]);
    fetchChromosomeList(value);
    setChromosome3DComparisonShowing(false);
  };

  // Chromosome selection change
  const chromosomeChange = value => {
    setChromosomeName(value);
    setChromosomeData([]);
    setChromosome3DExampleData([]);
    setComparisonCellLine3DData([]);
    setComparisonCellLineList([]);
    setComparisonCellLine(null);
    setComparisonCellLine3DSampleID(0);
    fetchChromosomeSize(value);
    setChromosome3DComparisonShowing(false);
  };

  // Chromosome sequence change
  const chromosomeSequenceChange = (position, value) => {
    const newValue = Number(value);
    setChromosome3DComparisonShowing(false);
    setComparisonCellLine(null);
    setComparisonCellLine3DSampleID(0);
    setComparisonCellLineList([]);
    setComparisonCellLine3DData([]);

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

  // 3D Original Chromosome sample change
  const originalSampleChange = (key) => {
    setChromosome3DExampleID(key);
    fetchExampleChromos3DData(cellLineName, key, "sampleChange", false);
  };

  // 3D Comparison Chromosome sample change
  const comparisonSampleChange = (key) => {
    setComparisonCellLine3DSampleID(key);
    fetchExampleChromos3DData(comparisonCellLine, key, "sampleChange", true);
  };

  // Add 3D Chromosome Comparison
  const handleAddChromosome3D = () => {
    fetchComparisonCellLineList();
  };

  // Remove 3D Chromosome Comparison
  const handleRemoveChromosome3D = () => {
    setChromosome3DComparisonShowing(false);
  };

  // Comparison Cell Line change
  const comparisonCellLineChange = (value) => {
    setComparisonCellLine(value);
    setComparisonCellLine3DLoading(true);
    fetchExampleChromos3DData(value, comparisonCellLine3DSampleID, "sampleChange", true);
  };

  // Submit button click
  const submit = () => {
    if (selectedChromosomeSequence.end - selectedChromosomeSequence.start < 4000000) {
      setHeatmapLoading(true);
    }
    setChromosome3DComparisonShowing(false);
    setComparisonCellLine3DSampleID(0);
    setComparisonCellLineList([]);
    setComparisonCellLine3DData([]);
    setChromosome3DExampleID(0);
    setChromosome3DExampleData([]);
    setChromosome3DLoading(true);
    fetchChromosomeData();
    fetchExampleChromos3DData(cellLineName, chromosome3DExampleID, "submit", false);
  };

  return (
    <div className="App">
      {contextHolder}
      {/* header part */}
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

      {/* main content part */}
      <div className='content'>
        {/* Heatmap */}
        {heatmapLoading ? (
          <Spin spinning={true} size="large" style={{ width: '30%', height: '100%', borderRight: "1px solid #eaeaea", margin: 0 }} />
        ) : (
          chromosomeData.length > 0 ? (
            <Heatmap
              cellLineName={cellLineName}
              chromosomeName={chromosomeName}
              chromosomeData={chromosomeData}
              totalChromosomeSequences={totalChromosomeSequences}
              selectedChromosomeSequence={selectedChromosomeSequence}
            />
          ) : (
            <Empty
              style={{ width: '30%', height: '100%', borderRight: "1px solid #eaeaea", margin: 0 }}
              description="No Heatmap Data"
            />
          )
        )}

        {/* Original 3D chromosome */}
        {chromosome3DLoading ? (
          <Spin spinning={true} size="large" style={{ width: '70%', height: '100%', margin: 0 }} />
        ) : (
          chromosome3DExampleData.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '100%' }}>
              <div style={{ width: chromosome3DComparisonShowing ? '49.9%' : '100%', marginRight: chromosome3DComparisonShowing ? '0.2%' : '0%' }}>
                <Tabs
                  size="small"
                  defaultActiveKey={chromosome3DExampleID}
                  style={{ width: '100%', height: '100%' }}
                  onChange={originalSampleChange}
                  tabBarExtraContent={
                    <Button
                      style={{
                        fontSize: 15,
                        cursor: "pointer",
                        marginRight: 5,
                      }}
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={handleAddChromosome3D}
                    />
                  }
                  items={new Array(3).fill(null).map((_, i) => {
                    const id = i;
                    return {
                      label: `Sample ${id + 1}`,
                      key: id,
                      children: (
                        <Chromosome3D
                          chromosome3DExampleData={chromosome3DExampleData}
                        />
                      ),
                    };
                  })}
                />
              </div>

              {/* Comparison 3D chromosome */}
              {chromosome3DComparisonShowing && (
                <div style={{ width: '49.9%' }}>
                  <Tabs
                    size="small"
                    defaultActiveKey={chromosome3DExampleID}
                    style={{ width: '100%', height: '100%' }}
                    onChange={comparisonSampleChange}
                    tabBarExtraContent={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginRight: '5px' }}>
                        <span className="controlGroupText">Cell Line:</span>
                        <Select
                          value={comparisonCellLine}
                          style={{
                            minWidth: 150,
                            marginRight: 10,
                          }}
                          size="small"
                          onChange={comparisonCellLineChange}
                          options={comparisonCellLineList}
                        />
                        <Button
                          style={{
                            fontSize: 15,
                            cursor: 'pointer',
                          }}
                          size="small"
                          icon={<MinusOutlined />}
                          onClick={handleRemoveChromosome3D}
                        />
                      </div>
                    }
                    items={new Array(3).fill(null).map((_, i) => {
                      const id = i;
                      const isLoading = comparisonCellLine3DLoading;
                      return {
                        label: `Sample ${id + 1}`,
                        key: id,
                        children: isLoading ? (
                          <Spin
                            size="large"
                            style={{ display: 'block', margin: '20px auto' }}
                          />
                        ) : (
                          <Chromosome3D
                            chromosome3DExampleData={comparisonCellLine3DData}
                          />
                        ),
                      };
                    })}
                  />
                </div>
              )}
            </div>
          ) : (
            <Empty
              style={{ width: '70%', height: '100%', margin: 0 }}
              description="No 3D Data"
            />
          )
        )}
      </div>
    </div>
  );
}

export default App;
