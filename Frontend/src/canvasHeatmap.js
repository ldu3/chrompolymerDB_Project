import React, { useEffect, useRef, useState } from 'react';
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { GeneList } from './geneList.js';
import * as d3 from 'd3';

export const Heatmap = ({ cellLineName, chromosomeName, chromosomeData, selectedChromosomeSequence, totalChromosomeSequences, geneList }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [minDimension, setMinDimension] = useState(0);

    const download = () => {
        if (chromosomeData) {
            const filteredData = chromosomeData.filter(row => row.fdr < 0.05);

            if (filteredData.length === 0) {
                alert("no suitable data (fdr < 0.05)");
                return;
            }

            const csvData = filteredData.map(row =>
                `${row.cell_line},${row.chrid},${row.ibp},${row.jbp},${row.fq},${row.fdr}`
            ).join('\n');

            const header = 'cell_line,chrid,ibp,jbp,fq,fdr\n';
            const csvContent = header + csvData;

            // create a blob object and set MIME type to text/csv
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);

            // create a temporary download link and trigger click
            const link = document.createElement('a');
            link.href = url;
            link.download = `${cellLineName}.${chromosomeName}.${selectedChromosomeSequence.start}.${selectedChromosomeSequence.end}.csv`;
            link.click();

            // realease the URL resource
            URL.revokeObjectURL(url);
        }
    }

    useEffect(() => {
        const parentWidth = containerRef.current.offsetWidth;
        const parentHeight = containerRef.current.offsetHeight;
        const margin = { top: 35, right: 10, bottom: 50, left: 60 };

        setMinDimension(Math.min(parentWidth, parentHeight));
        const width = minDimension - margin.left - margin.right;
        const height = minDimension - margin.top - margin.bottom;

        // Set up the canvas
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = width + margin.left + margin.right;
        canvas.height = height + margin.top + margin.bottom;

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Set up the axis
        d3.select('#axis').selectAll('*').remove();

        const svg = d3.select('#axis')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .style('position', 'relative')
            .style('z-index', 1)
            .style('font-size', 10)
            .style('pointer-events', 'none')
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Convert to numbers
        chromosomeData.forEach(d => {
            d.ibp = +d.ibp;
            d.jbp = +d.jbp;
            d.fq = +d.fq;
            d.fdr = +d.fdr;
        });

        // Define scales based on chromosomeSequence length and step size
        const { start, end } = selectedChromosomeSequence;
        const step = 5000;
        const adjustedStart = Math.floor(start / step) * step;
        const adjustedEnd = Math.ceil(end / step) * step;

        const axisValues = Array.from(
            { length: Math.floor((adjustedEnd - adjustedStart) / step) + 1 },
            (_, i) => adjustedStart + i * step
        );

        const colorScale = d3.scaleSequential(
            t => d3.interpolateReds(t * 0.8 + 0.2)
        ).domain([0, d3.max(chromosomeData, d => d.fq)]);

        const xScale = d3.scaleBand()
            .domain(axisValues)
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleBand()
            .domain(axisValues)
            .range([height, 0])
            .padding(0.1);

        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale)
                .tickValues(axisValues.filter((_, i) => i % 30 === 0))
                .tickFormat(d => {
                    if (d >= 1000000) {
                        return `${(d / 1000000).toFixed(3)}M`;
                    };
                    if (d > 10000 && d < 1000000) {
                        return `${(d / 10000).toFixed(3)}W`;
                    }
                    return d;
                }))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-45)")
            .attr("dx", "-1em")
            .attr("dy", "0em");

        svg.append('g')
            .call(d3.axisLeft(yScale)
                .tickValues(axisValues.filter((_, i) => i % 30 === 0))
                .tickFormat(d => {
                    if (d >= 1000000) {
                        return `${(d / 1000000).toFixed(3)}M`;
                    };
                    if (d > 10000 && d < 1000000) {
                        return `${(d / 10000).toFixed(3)}W`;
                    }
                    return d;
                }));

        // Map for storing frequency values with symmetry
        const fqMap = new Map();

        chromosomeData.forEach(d => {
            fqMap.set(`X:${d.ibp}, Y:${d.jbp}`, { fq: d.fq, fdr: d.fdr });
            fqMap.set(`X:${d.jbp}, Y:${d.ibp}`, { fq: d.fq, fdr: d.fdr });
        });

        const hasData = (ibp, jbp) => {
            const inRange = totalChromosomeSequences.some(seq =>
                ibp >= seq.start && ibp <= seq.end &&
                jbp >= seq.start && jbp <= seq.end
            );

            return inRange;
        };

        // Draw heatmap using Canvas
        axisValues.forEach(ibp => {
            axisValues.forEach(jbp => {
                const { fq, fdr } = fqMap.get(`X:${ibp}, Y:${jbp}`) || fqMap.get(`X:${jbp}, Y:${ibp}`) || { fq: -1, fdr: -1 };

                const x = margin.left + xScale(jbp);
                const y = margin.top + yScale(ibp);
                const width = xScale.bandwidth();
                const height = yScale.bandwidth();

                context.fillStyle = !hasData(ibp, jbp) ? 'white' : (jbp <= ibp && (fdr > 0.05 || (fdr === -1 && fq === -1))) ? 'white' : colorScale(fq);
                context.fillRect(x, y, width, height);
            });
        });
    }, [chromosomeData, totalChromosomeSequences, minDimension]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '35%', height: '100%' }}>
            <div ref={containerRef} style={{ width: '100%', height: '72%', borderRight: "1px solid #eaeaea", position: 'relative' }}>
                <Button
                    style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        fontSize: 15,
                        cursor: "pointer",
                        zIndex: 10,
                    }}
                    icon={<DownloadOutlined />}
                    onClick={() => download()}
                />
                <canvas ref={canvasRef} style={{ position: 'absolute', zIndex: 0 }} />
                <svg id="axis"></svg>
            </div>
            {minDimension > 0 && <GeneList
                geneList={geneList}
                selectedChromosomeSequence={selectedChromosomeSequence}
                minDimension={minDimension}
            />}
        </div>
    );
};
