import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export const Heatmap = ({ chromosomeData, selectedChromosomeSequence, totalChromosomeSequences }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const margin = { top: 10, right: 10, bottom: 50, left: 60 };
        const width = 700 - margin.left - margin.right;
        const height = 700 - margin.top - margin.bottom;

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

        const colorScale = d3.scaleSequential(d3.interpolateYlOrBr)
            .domain([0, d3.max(chromosomeData, d => d.fq)]);

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
                .tickValues(axisValues.filter((_, i) => i % 12 === 0))
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
                .tickValues(axisValues.filter((_, i) => i % 12 === 0))
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
            fqMap.set(`x:${d.ibp}, y:${d.jbp}`, { fq: d.fq, fdr: d.fdr });
            fqMap.set(`X:${d.jbp}, y:${d.ibp}`, { fq: d.fq, fdr: d.fdr });
        });

        const hasData = (ibp, jbp) => {
            return totalChromosomeSequences.seqs.some(seq =>
                ibp >= seq.min_start && ibp <= seq.max_end &&
                jbp >= seq.min_start && jbp <= seq.max_end
            );
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
        <div >
            <canvas ref={canvasRef} style={{ position: 'absolute', zIndex: 0 }} />
            <svg id="axis"></svg>
        </div>
    );
};
