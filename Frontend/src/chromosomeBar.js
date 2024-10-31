import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import "./Styles/chromosomeBar.css";

export const ChromosomeBar = ({ selectedChromosomeSequence, setSelectedChromosomeSequence, totalChromosomeSequences, warning }) => {
    const svgRef = useRef();
    const parentRef = useRef();
    const [tooltip, setTooltip] = useState({ visible: false, minStart: 0, maxEnd: 0, left: 0, top: 0 });

    useEffect(() => {
        if (selectedChromosomeSequence.start !== undefined && selectedChromosomeSequence.end !== undefined) {
            const { min_start, max_end, seqs } = totalChromosomeSequences;
            const height = 50;
            const margin = { top: 10, bottom: 5, left: 10, right: 10 };
            const width = parentRef.current ? parentRef.current.clientWidth - margin.left - margin.right : 0;

            const xScale = d3.scaleLinear()
                .domain([min_start, max_end])
                .range([margin.left, width + margin.left]);

            const svg = d3.select(svgRef.current)
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom);

            svg.selectAll('*').remove();

            // Background rect
            const backgroundY = margin.top + height / 4;
            const backgroundHeight = height / 2;

            svg.append('rect')
                .attr('x', margin.left)
                .attr('y', backgroundY)
                .attr('width', width)
                .attr('height', backgroundHeight)
                .attr('fill', '#F5F5F5');

            // Highlighted selection area
            svg.append('rect')
                .attr('x', xScale(selectedChromosomeSequence.start))
                .attr('y', backgroundY)
                .attr('width', xScale(selectedChromosomeSequence.end) - xScale(selectedChromosomeSequence.start))
                .attr('height', backgroundHeight)
                .attr('fill', '#FFE0B2');

            // Seqs rects
            seqs.forEach((seq) => {
                svg.append('rect')
                    .attr('class', 'rect')
                    .attr('x', xScale(seq.min_start))
                    .attr('y', backgroundY)
                    .attr('width', xScale(seq.max_end) - xScale(seq.min_start))
                    .attr('height', backgroundHeight)
                    .attr('fill', selectedChromosomeSequence.start < seq.max_end && selectedChromosomeSequence.end > seq.min_start ? '#FFC107' : '#4CAF50')
                    .style('cursor', 'pointer')
                    .on('click', () => {
                        setSelectedChromosomeSequence({
                            start: seq.min_start,
                            end: seq.max_end
                        });
                    })
                    .on('mouseover', (event) => {
                        d3.select(event.currentTarget)
                            .attr('stroke', '#333')
                            .attr('stroke-width', 1);

                        const tooltipWidth = 150;
                        const tooltipX = event.pageX + 5;

                        const adjustedLeft = tooltipX + tooltipWidth > window.innerWidth
                            ? window.innerWidth - tooltipWidth - 10
                            : tooltipX;

                        setTooltip({
                            visible: true,
                            minStart: seq.min_start,
                            maxEnd: seq.max_end,
                            left: adjustedLeft,
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

            // Function to draw triangles and vertical lines
            const drawSelectionMarkers = () => {
                svg.selectAll('.triangle, .line-marker').remove();

                let hasShownAlert = false;
                const triangleHeight = 10;
                const triangleY = backgroundY - triangleHeight;

                // Start triangle and line
                svg.append('polygon')
                    .attr('class', 'triangle')
                    .attr('points', `${xScale(selectedChromosomeSequence.start)},${triangleY + triangleHeight} ${xScale(selectedChromosomeSequence.start) - 5},${triangleY} ${xScale(selectedChromosomeSequence.start) + 5},${triangleY}`)
                    .attr('fill', '#666')
                    .attr('stroke', '#666')
                    .attr('stroke-width', 1.5)
                    .style('cursor', 'pointer')
                    .call(d3.drag()
                        .on('drag', (event) => {
                            const mouseX = d3.pointer(event)[0];
                            let newStart = Math.round(Math.min(Math.max(xScale.invert(mouseX), min_start), selectedChromosomeSequence.end));
                            if (selectedChromosomeSequence.end - newStart <= 4000000 && newStart !== selectedChromosomeSequence.start) {
                                setSelectedChromosomeSequence((prev) => ({ ...prev, start: newStart }));
                                hasShownAlert = false;
                            } else if (!hasShownAlert) {
                                warning('overrange');
                                hasShownAlert = true;
                            }
                        })
                        .on('end', () => {
                            hasShownAlert = false;
                        }));

                svg.append('line')
                    .attr('class', 'line-marker')
                    .attr('x1', xScale(selectedChromosomeSequence.start))
                    .attr('x2', xScale(selectedChromosomeSequence.start))
                    .attr('y1', backgroundY)
                    .attr('y2', backgroundY + backgroundHeight)
                    .attr('stroke', '#666')
                    .attr('stroke-width', 1.5);

                // End triangle and line
                svg.append('polygon')
                    .attr('class', 'triangle')
                    .attr('points', `${xScale(selectedChromosomeSequence.end)},${triangleY + triangleHeight} ${xScale(selectedChromosomeSequence.end) - 5},${triangleY} ${xScale(selectedChromosomeSequence.end) + 5},${triangleY}`)
                    .attr('fill', '#666')
                    .attr('stroke', '#666')
                    .attr('stroke-width', 1.5)
                    .style('cursor', 'pointer')
                    .call(d3.drag()
                        .on('drag', (event) => {
                            const mouseX = d3.pointer(event)[0];
                            let newEnd = Math.round(Math.max(Math.min(xScale.invert(mouseX), max_end), selectedChromosomeSequence.start));
                            if (newEnd - selectedChromosomeSequence.start <= 4000000 && newEnd !== selectedChromosomeSequence.end) {
                                setSelectedChromosomeSequence((prev) => ({ ...prev, end: newEnd }));
                                hasShownAlert = false;
                            } else if (!hasShownAlert) {
                                warning('overrange');
                                hasShownAlert = true;
                            }
                        })
                        .on('end', () => {
                            hasShownAlert = false;
                        }));

                svg.append('line')
                    .attr('class', 'line-marker')
                    .attr('x1', xScale(selectedChromosomeSequence.end))
                    .attr('x2', xScale(selectedChromosomeSequence.end))
                    .attr('y1', backgroundY)
                    .attr('y2', backgroundY + backgroundHeight)
                    .attr('stroke', '#666')
                    .attr('stroke-width', 1.5);
            };

            drawSelectionMarkers();

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
        }
    }, [totalChromosomeSequences, selectedChromosomeSequence]);

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
