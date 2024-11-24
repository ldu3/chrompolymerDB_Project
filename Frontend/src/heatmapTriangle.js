import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export const HeatmapTriangle = ({ selectedChromosomeSequence, chromosomeData }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const margin = { top: 0, right: 0, bottom: 0, left: 0 };
        const parentWidth = containerRef.current.offsetWidth;
        const parentHeight = containerRef.current.offsetHeight;

        const width = Math.min(parentWidth, parentHeight) - margin.left - margin.right;
        const height = Math.min(parentWidth, parentHeight) - margin.top - margin.bottom;

        canvas.width = (width + margin.left + margin.right) * Math.sqrt(2);
        canvas.height = (height + margin.top + margin.bottom) / Math.sqrt(2);

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Apply rotation transformation
        context.save();
        context.translate(canvas.width / 2, canvas.height);
        context.rotate((Math.PI / 180) * -135);
        context.translate(-width / 2, -height / 2);
        
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
    }, [chromosomeData]);

    return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};
