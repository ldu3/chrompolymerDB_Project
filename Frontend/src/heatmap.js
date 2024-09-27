import React, { useEffect } from 'react';
import * as d3 from 'd3';

export const Heatmap = () => {
    useEffect(() => {
        const margin = { top: 50, right: 30, bottom: 50, left: 50 };
        const width = 700 - margin.left - margin.right;
        const height = 700 - margin.top - margin.bottom;

        const svg = d3.select('#heatmap')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        d3.csv('/hic.clean.csv').then(data => {
            // Convert to numbers
            data.forEach(d => {
                d.i1 = +d.i1;
                d.j1 = +d.j1;
                d.fq = +d.fq;
                d.fdr = +d.fdr;
            });

            const i1Values = Array.from(new Set(data.map(d => d.i1)));
            const j1Values = Array.from(new Set(data.map(d => d.j1)));

            i1Values.sort((a, b) => a - b);
            j1Values.sort((a, b) => a - b);

            const colorScale = d3.scaleSequential(d3.interpolateYlOrBr)
                .domain([0, d3.max(data, d => d.fq)]);

            const xScale = d3.scaleBand()
                .domain(j1Values)
                .range([0, width])
                .padding(0.1);

            const yScale = d3.scaleBand()
                .domain(i1Values)
                .range([height, 0])
                .padding(0.1);

            svg.append('g')
                .attr('transform', `translate(0, ${height})`)
                .call(d3.axisBottom(xScale)
                    .tickValues(j1Values.filter((_, i) => i % 5 === 0)));

            svg.append('g')
                .call(d3.axisLeft(yScale)
                    .tickValues(i1Values.filter((_, i) => i % 5 === 0)));

            // Create a mapping to account for symmetry
            const fqMap = new Map();

            data.forEach(d => {
                fqMap.set(`x:${d.i1}, y:${d.j1}`, { fq: d.fq, fdr: d.fdr });
                fqMap.set(`X:${d.j1}, y:${d.i1}`, { fq: d.fq, fdr: d.fdr });
            });            

            svg.selectAll()
                .data(i1Values.flatMap(i1 => j1Values.map(j1 => {
                    const value = fqMap.get(`X:${i1}, y:${j1}`) || fqMap.get(`X:${j1}, y:${i1}`) || { fq: 0, fdr: 0 };
                    return {
                        i1,
                        j1,
                        fq: value.fq,
                        fdr: value.fdr
                    };
                })))
                .enter()
                .append('rect')
                .attr('x', d => xScale(d.j1))
                .attr('y', d => yScale(d.i1))
                .attr('width', xScale.bandwidth())
                .attr('height', yScale.bandwidth())
                .style('fill', d => d.j1 <= d.i1 ? (d.fdr > 0.05 ? 'white' : colorScale(d.fq)) : colorScale(d.fq))
                .style('stroke', 'black')
                .style('stroke-width', 0.01);

            svg.append('text')
                .attr('x', (width / 2))
                .attr('y', -20)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .text('Heatmap of FQ values');
        });
    }, []);

    return <div id="heatmap" />;
};
