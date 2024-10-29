import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import "./Styles/chromosomeBar.css";

export const ChromosomeBar = ({ setSelectedChromosomeSequence, chromosomeSequenceDatabyChromosName }) => {
    const svgRef = useRef();
    const parentRef = useRef();
    const [tooltip, setTooltip] = useState({ visible: false, minStart: 0, maxEnd: 0, left: 0, top: 0 });

    useEffect(() => {
        const { min_start, max_end, seqs } = chromosomeSequenceDatabyChromosName;
        const height = 50;
        const width = parentRef.current ? parentRef.current.clientWidth : 0;

        const xScale = d3.scaleLinear()
            .domain([min_start, max_end])
            .range([0, width]);

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll('*').remove();

        // Background rect
        svg.append('rect')
            .attr('x', 0)
            .attr('y', height / 4)
            .attr('width', width)
            .attr('height', height / 2)
            .attr('fill', '#F5F5F5');

        // Add seqs rects
        seqs.forEach((seq) => {
            svg.append('rect')
                .attr('class', 'rect')
                .attr('x', xScale(seq.min_start))
                .attr('y', height / 4)
                .attr('width', xScale(seq.max_end) - xScale(seq.min_start))
                .attr('height', height / 2)
                .attr('fill', '#4CAF50')
                .style('cursor', 'pointer')
                .on('click', () => {
                    setSelectedChromosomeSequence({
                        start: seq.min_start,
                        end: seq.max_end
                    });
                    console.log('clicked', seq.min_start, seq.max_end);
                })
                .on('mouseover', (event) => {
                    d3.select(event.currentTarget)
                        .attr('stroke', '#333')
                        .attr('stroke-width', 1);
                    setTooltip({
                        visible: true,
                        minStart: seq.min_start,
                        maxEnd: seq.max_end,
                        left: event.pageX + 5,
                        top: event.pageY - 28
                    });
                })
                .on('mouseout', (event) => {
                    d3.select(event.currentTarget)
                        .attr('stroke', 'none')
                        .attr('stroke-width', 0);
                    setTooltip((prev) => ({ ...prev, visible: false }));
                });
        });

        // Add min and max labels
        svg.append('text')
            .attr('x', 0)
            .attr('y', height)
            .attr('text-anchor', 'start')
            .attr('font-size', '12px')
            .text(min_start);

        svg.append('text')
            .attr('x', width)
            .attr('y', height)
            .attr('text-anchor', 'end')
            .attr('font-size', '12px')
            .text(max_end);
    }, [chromosomeSequenceDatabyChromosName]);

    return (
        <div ref={parentRef} style={{ width: '100%', position: 'relative' }}>
            <svg ref={svgRef}></svg>
            <div
                className={`tooltip ${tooltip.visible ? 'visible' : ''}`}
                style={{
                    left: tooltip.left,
                    top: tooltip.top
                }}
            >
                <div className="chromosomeBarTooltipText">Start: {tooltip.minStart}</div>
                <div className="chromosomeBarTooltipText">End: {tooltip.maxEnd}</div>
            </div>
        </div>
    );
};
