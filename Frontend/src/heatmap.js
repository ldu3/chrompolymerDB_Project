import React, { useEffect } from 'react';
import * as d3 from 'd3';

export const Heatmap = ({ chromosomeData }) => {
    useEffect(() => {
        const margin = { top: 50, right: 30, bottom: 50, left: 50 };
        const width = 700 - margin.left - margin.right;
        const height = 700 - margin.top - margin.bottom;

        d3.select('#heatmap').selectAll('*').remove();
        const svg = d3.select('#heatmap')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

            // Convert to numbers
            chromosomeData.forEach(d => {
                d.ibp = +d.ibp;
                d.jbp = +d.jbp;
                d.fq = +d.fq;
                d.fdr = +d.fdr;
            });

            const ibpValues = Array.from(new Set(chromosomeData.map(d => d.ibp)));
            const jbpValues = Array.from(new Set(chromosomeData.map(d => d.jbp)));

            ibpValues.sort((a, b) => a - b);
            jbpValues.sort((a, b) => a - b);

            const colorScale = d3.scaleSequential(d3.interpolateYlOrBr)
                .domain([0, d3.max(chromosomeData, d => d.fq)]);

            const xScale = d3.scaleBand()
                .domain(jbpValues)
                .range([0, width])
                .padding(0.1);

            const yScale = d3.scaleBand()
                .domain(ibpValues)
                .range([height, 0])
                .padding(0.1);

            svg.append('g')
                .attr('transform', `translate(0, ${height})`)
                .call(d3.axisBottom(xScale)
                    .tickValues(jbpValues.filter((_, i) => i % 5 === 0)));

            svg.append('g')
                .call(d3.axisLeft(yScale)
                    .tickValues(ibpValues.filter((_, i) => i % 5 === 0)));

            // Create a mapping to account for symmetry
            const fqMap = new Map();

            chromosomeData.forEach(d => {
                fqMap.set(`x:${d.ibp}, y:${d.jbp}`, { fq: d.fq, fdr: d.fdr });
                fqMap.set(`X:${d.jbp}, y:${d.ibp}`, { fq: d.fq, fdr: d.fdr });
            });            

            svg.selectAll()
                .data(ibpValues.flatMap(ibp => jbpValues.map(jbp => {
                    const value = fqMap.get(`X:${ibp}, y:${jbp}`) || fqMap.get(`X:${jbp}, y:${ibp}`) || { fq: 0, fdr: 0 };
                    return {
                        ibp,
                        jbp,
                        fq: value.fq,
                        fdr: value.fdr
                    };
                })))
                .enter()
                .append('rect')
                .attr('x', d => xScale(d.jbp))
                .attr('y', d => yScale(d.ibp))
                .attr('width', xScale.bandwidth())
                .attr('height', yScale.bandwidth())
                .style('fill', d => d.jbp <= d.ibp ? (d.fdr > 0.05 ? 'white' : colorScale(d.fq)) : colorScale(d.fq))
                .style('stroke', 'black')
                .style('stroke-width', 0.01);

            svg.append('text')
                .attr('x', (width / 2))
                .attr('y', -20)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .text('Heatmap of FQ values');
    }, [chromosomeData]);

    return <div id="heatmap" />;
};
