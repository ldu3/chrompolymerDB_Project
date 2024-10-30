import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import "./Styles/chromosomeBar.css";

export const ChromosomeBar = ({ setSelectedChromosomeSequence, chromosomeSequenceDatabyChromosName }) => {
    const svgRef = useRef();
    const parentRef = useRef();
    const [tooltip, setTooltip] = useState({ visible: false, minStart: 0, maxEnd: 0, left: 0, top: 0 });
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    useEffect(() => {
        const { min_start, max_end, seqs } = chromosomeSequenceDatabyChromosName;
        const height = 50;
        const margin = { top: 10, bottom: 10, left: 10, right: 10 };
        const width = parentRef.current ? parentRef.current.clientWidth - margin.left - margin.right : 0;

        const xScale = d3.scaleLinear()
            .domain([min_start, max_end])
            .range([margin.left, width + margin.left]);

        const svg = d3.select(svgRef.current)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        svg.selectAll('*').remove();

        // Background
        svg.append('rect')
            .attr('x', margin.left)
            .attr('y', margin.top + height / 4)
            .attr('width', width)
            .attr('height', height / 2)
            .attr('fill', '#F5F5F5');

        // Seqs rects
        seqs.forEach((seq) => {
            svg.append('rect')
                .attr('class', 'rect')
                .attr('x', xScale(seq.min_start))
                .attr('y', margin.top + height / 4)
                .attr('width', xScale(seq.max_end) - xScale(seq.min_start))
                .attr('height', height / 2)
                .attr('fill', selection.start < seq.max_end && selection.end > seq.min_start ? '#FFC107' : '#4CAF50')
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

        // Selection triangles
        const triangleHeight = 10;
        const triangleY = margin.top + height / 4 - triangleHeight;

        const drawTriangles = () => {
            svg.selectAll('.triangle').remove();

            // Start triangle
            svg.append('polygon')
                .attr('class', 'triangle')
                .attr('points', `${xScale(selection.start)},${triangleY + triangleHeight} ${xScale(selection.start) - 5},${triangleY} ${xScale(selection.start) + 5},${triangleY}`)
                .attr('fill', 'blue')
                .style('cursor', 'pointer')
                .call(d3.drag()
                    .on('drag', (event) => {
                        const mouseX = d3.pointer(event)[0];
                        const newStart = Math.min(xScale.invert(mouseX), selection.end);
                        if (newStart !== selection.start) {
                            setSelection((prev) => ({ ...prev, start: newStart }));
                        }
                    }));

            // End triangle
            svg.append('polygon')
                .attr('class', 'triangle')
                .attr('points', `${xScale(selection.end)},${triangleY + triangleHeight} ${xScale(selection.end) - 5},${triangleY} ${xScale(selection.end) + 5},${triangleY}`)
                .attr('fill', 'blue')
                .style('cursor', 'pointer')
                .call(d3.drag()
                    .on('drag', (event) => {
                        const mouseX = d3.pointer(event)[0];
                        const newEnd = Math.max(xScale.invert(mouseX), selection.start);
                        if (newEnd !== selection.end) {
                            setSelection((prev) => ({ ...prev, end: newEnd }));
                        }
                    }));
        };

        if (selection.start === 0 && selection.end === 0) {
            setSelection({ start: min_start, end: min_start });
        }

        drawTriangles();

        svg.append('text')
            .attr('x', margin.left)
            .attr('y', height + margin.top + 5)
            .attr('text-anchor', 'start')
            .attr('font-size', '12px')
            .text(min_start);

        svg.append('text')
            .attr('x', width + margin.left)
            .attr('y', height + margin.top + 5)
            .attr('text-anchor', 'end')
            .attr('font-size', '12px')
            .text(max_end);
    }, [chromosomeSequenceDatabyChromosName, selection]);

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
