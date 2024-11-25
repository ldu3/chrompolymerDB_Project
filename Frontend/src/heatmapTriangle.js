import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export const HeatmapTriangle = ({ selectedChromosomeSequence, chromosomeData }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const axisSvgRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const margin = { top: 0, right: 0, bottom: 0, left: 0 };
        const parentWidth = containerRef.current.offsetWidth;
        const parentHeight = containerRef.current.offsetHeight;

        const width = Math.min(parentWidth, parentHeight) - margin.left - margin.right;
        const height = Math.min(parentWidth, parentHeight) - margin.top - margin.bottom;

        canvas.width = Math.max((width + margin.left + margin.right) * Math.sqrt(2), parentWidth);
        canvas.height = Math.max((height + margin.top + margin.bottom) / Math.sqrt(2), parentHeight);

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Apply rotation transformation
        context.save();
        context.translate(canvas.width / 2, canvas.height);
        context.scale(-1, 1);
        context.rotate((Math.PI / 180) * -135);
        context.translate(-width / 2, -height / 2);
        
        console.log(width, height, canvas.width, canvas.height);
        const { start, end } = selectedChromosomeSequence;
        const step = 5000;
        const adjustedStart = Math.floor(start / step) * step;
        const adjustedEnd = Math.ceil(end / step) * step;

        const axisValues = Array.from(
            { length: Math.floor((adjustedEnd - adjustedStart) / step) + 1 },
            (_, i) => adjustedStart + i * step
        );

        const xScale = d3.scaleBand()
            .domain(axisValues)
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleBand()
            .domain(axisValues)
            .range([height, 0])
            .padding(0.1);

        const transformedXScale = d3.scaleBand()
            .domain(axisValues)
            .range([0, canvas.width])
            .padding(0.1);

        const colorScale = d3.scaleSequential(
            t => d3.interpolateReds(t * 0.8 + 0.2)
        ).domain([0, d3.max(chromosomeData, d => d.fq)]);

        const fqMap = new Map();
        chromosomeData.forEach(d => {
            fqMap.set(`X:${d.ibp}, Y:${d.jbp}`, { fq: d.fq, fdr: d.fdr });
        });

        axisValues.forEach(ibp => {
            axisValues.forEach(jbp => {
                const { fq } = fqMap.get(`X:${ibp}, Y:${jbp}`) || { fq: -1, fdr: -1 };

                const x = margin.left + xScale(jbp);
                const y = margin.top + yScale(ibp);
                const width = xScale.bandwidth();
                const height = yScale.bandwidth();

                context.fillStyle = (jbp <= ibp) ? 'white' : colorScale(fq);
                context.fillRect(x, y, width, height);
            });
        });

        context.restore();

        const axisSvg = d3.select(axisSvgRef.current)
            .attr('width', "100%");

        axisSvg.selectAll('*').remove();

        // Calculate the range of the current chromosome sequence
        const range = selectedChromosomeSequence.end - selectedChromosomeSequence.start;

        // Dynamically determine the tick count based on the range
        let tickCount;
        if (range < 1000000) {
            tickCount = Math.max(Math.floor(range / 20000), 5);
        } else if (range >= 1000000 && range <= 10000000) {
            tickCount = Math.max(Math.floor(range / 50000), 5);
        } else {
            tickCount = 30;
        }

        tickCount = Math.min(tickCount, 30);

        // X-axis
        axisSvg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .call(d3.axisBottom(transformedXScale)
                .tickValues(axisValues.filter((_, i) => i % tickCount === 0))
                .tickFormat(d => {
                    if (d >= 1000000) {
                        return `${(d / 1000000).toFixed(3)}M`;
                    }
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

    }, [chromosomeData]);

    return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} style={{
                width: '100%', 
                height: '100%',
            }} />
            <svg ref={axisSvgRef} style={{ width: '100%', height: '40px' }} />
        </div>
    );
};
