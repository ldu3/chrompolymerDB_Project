import React, { useEffect, useRef } from 'react';
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import * as d3 from 'd3';

export const Heatmap = ({ chromosomeName, chromosomeData, selectedChromosomeSequence, totalChromosomeSequences }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const download = () => {
        if(chromosomeData) {
            const csvData = chromosomeData.map(row => 
                `${row.chrid},${row.ibp},${row.jbp},${row.avg_fq},${row.fdr}`
            ).join('\n');
            
            const header = 'chrid,ibp,jbp,fq,fdr\n';
            const csvContent = header + csvData;
            
            // create a blob object and set MIME type to text/csv
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
    
            // create a temporary download link and trigger click
            const link = document.createElement('a');
            link.href = url;
            link.download = `${chromosomeName}.${selectedChromosomeSequence.start}.${selectedChromosomeSequence.end}.csv`;
            link.click();

            // realease the URL resource
            URL.revokeObjectURL(url);
        }
    }

    useEffect(() => {
        const parentHeight = containerRef.current.offsetHeight;
        const margin = { top: 35, right: 10, bottom: 50, left: 60 };
        const width = parentHeight / 1.5 - margin.left - margin.right;
        const height = parentHeight / 1.5 - margin.top - margin.bottom;

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
            .style('pointer-events', 'none')
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Convert to numbers
        chromosomeData.forEach(d => {
            d.ibp = +d.ibp;
            d.jbp = +d.jbp;
            d.avg_fq = +d.avg_fq;
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

        const colorScale = d3.scaleSequential(d3.interpolateYlOrBr)
            .domain([0, d3.max(chromosomeData, d => d.avg_fq)]);

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
                .tickValues(axisValues.filter((_, i) => i % 15 === 0))
                .tickFormat(d => {
                    if (d >= 1000000) {
                        return `${(d / 1000000).toFixed(2)}M`;
                    };
                    if (d > 10000 && d < 1000000) {
                        return `${(d / 10000).toFixed(2)}W`;
                    }
                    return d;
                }))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("dx", "-1em")
            .attr("dy", "-0.5em");

        svg.append('g')
            .call(d3.axisLeft(yScale)
                .tickValues(axisValues.filter((_, i) => i % 15 === 0))
                .tickFormat(d => {
                    if (d >= 1000000) {
                        return `${(d / 1000000).toFixed(2)}M`;
                    };
                    if (d > 10000 && d < 1000000) {
                        return `${(d / 10000).toFixed(2)}W`;
                    }
                    return d;
                }));

        // Map for storing frequency values with symmetry
        const fqMap = new Map();

        chromosomeData.forEach(d => {
            fqMap.set(`x:${d.ibp}, y:${d.jbp}`, { fq: d.avg_fq, fdr: d.fdr });
            fqMap.set(`X:${d.jbp}, y:${d.ibp}`, { fq: d.avg_fq, fdr: d.fdr });
        });

        const hasData = (ibp, jbp) => {
            const inRange = totalChromosomeSequences.seqs.some(seq =>
                ibp >= seq.min_start && ibp <= seq.max_end &&
                jbp >= seq.min_start && jbp <= seq.max_end
            );

            // check fq and fdr exist and are not both 0
            const value = fqMap.get(`X:${ibp}, y:${jbp}`) || fqMap.get(`X:${jbp}, y:${ibp}`);
            const hasNonZeroData = value && (value.fq !== 0 || value.fdr !== 0);

            return inRange && hasNonZeroData;
        };

        // Draw heatmap using Canvas
        axisValues.forEach(ibp => {
            axisValues.forEach(jbp => {
                const { fq, fdr } = fqMap.get(`X:${ibp}, y:${jbp}`) || fqMap.get(`X:${jbp}, y:${ibp}`) || { fq: 0, fdr: 0 };

                const x = margin.left + xScale(jbp);
                const y = margin.top + yScale(ibp);
                const width = xScale.bandwidth();
                const height = yScale.bandwidth();

                context.fillStyle = !hasData(ibp, jbp) ? 'white' :
                    (jbp <= ibp && (fdr > 0.05 || (fdr === 0 && fq === 0))) ? 'white' :
                        colorScale(fq);
                context.fillRect(x, y, width, height);
            });
        });
    }, [chromosomeData, totalChromosomeSequences]);

    return (
        <div ref={containerRef} style={{ width: '30%', height: '100%', borderRight: "1px solid #eaeaea", position: 'relative' }}>
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
    );
};
