import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import "./Styles/chromosomeBar.css";

export const ChromosomeBar = ({ chromosomeSize, selectedChromosomeSequence, setSelectedChromosomeSequence, totalChromosomeSequences, warning }) => {
    const svgRef = useRef();
    const parentRef = useRef();
    const [tooltip, setTooltip] = useState({ visible: false, minStart: 0, maxEnd: 0, left: 0, top: 0 });

    useEffect(() => {
        if (selectedChromosomeSequence.start !== undefined && selectedChromosomeSequence.end !== undefined) {
            const min_start = chromosomeSize ? 1 : 0;
            const max_end = chromosomeSize ? chromosomeSize : 0;
            const seqs = totalChromosomeSequences;
            const height = 30;
            const margin = { top: 10, bottom: 20, left: 10, right: 10 };
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
                .attr('stroke', '#999')
                .attr('stroke-width', 0.3)
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
                    .attr('x', xScale(seq.start))
                    .attr('y', backgroundY)
                    .attr('width', xScale(seq.end) - xScale(seq.start))
                    .attr('height', backgroundHeight)
                    .attr('fill', selectedChromosomeSequence.start < seq.end && selectedChromosomeSequence.end > seq.start ? '#FFC107' : '#4CAF50')
                    .style('cursor', 'pointer')
                    .style('opacity', 0.8)  
                    .on('click', () => {
                        setSelectedChromosomeSequence({
                            start: seq.start,
                            end: seq.end
                        });
                    })
                    .on('mouseover', (event) => {
                        d3.select(event.currentTarget)
                            .transition()
                            .duration(250)
                            .attr('stroke', '#333')
                            .attr('stroke-width', 2)
                            .style('opacity', 1);

                        const tooltipWidth = 150;
                        const tooltipX = event.pageX + 5;

                        const adjustedLeft = tooltipX + tooltipWidth > window.innerWidth
                            ? window.innerWidth - tooltipWidth - 10
                            : tooltipX;

                        setTooltip({
                            visible: true,
                            minStart: seq.start,
                            maxEnd: seq.end,
                            left: adjustedLeft,
                            top: event.pageY - 28
                        });
                    })
                    .on('mouseout', (event) => {
                        d3.select(event.currentTarget)
                            .transition()
                            .duration(250)
                            .attr('stroke', 'none')
                            .attr('stroke-width', 0)
                            .style('opacity', 0.8);
                        setTooltip((prev) => ({ ...prev, visible: false }));
                    });
            });

            // Function to draw triangles and vertical lines
            const drawSelectionMarkers = () => {
                svg.selectAll('.triangle, .line-marker').remove();

                const triangleHeight = 10;
                const triangleY = backgroundY - triangleHeight;
                let newStart = selectedChromosomeSequence.start;
                let newEnd = selectedChromosomeSequence.end;

                // Start triangle and line
                svg.append('polygon')
                    .attr('class', 'triangle')
                    .attr('points', `${xScale(selectedChromosomeSequence.start)},${triangleY + triangleHeight} ${xScale(selectedChromosomeSequence.start) - 5},${triangleY} ${xScale(selectedChromosomeSequence.start) + 5},${triangleY}`)
                    .attr('fill', '#666')
                    .attr('stroke', '#666')
                    .attr('stroke-width', 1.5)
                    .style('cursor', 'pointer')
                    .call(d3.drag()
                        .on('start', () => {
                            if (totalChromosomeSequences.length === 0) {
                                warning('noData');
                                return;
                            }
                        })
                        .on('drag', (event) => {
                            const mouseX = d3.pointer(event)[0];
                            newStart = Math.round(Math.min(Math.max(xScale.invert(mouseX), min_start), selectedChromosomeSequence.end));

                            // Update the start position continuously while dragging
                            setSelectedChromosomeSequence((prev) => ({ ...prev, start: newStart }));
                        })
                        .on('end', () => {
                            // Check the warning condition when drag ends
                            if (newEnd - newStart > 4000000) {
                                warning('overrange');
                            }
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
                        .on('start', () => {
                            if (totalChromosomeSequences.length === 0) {
                                warning('noData');
                                return;
                            }
                        })
                        .on('drag', (event) => {
                            const mouseX = d3.pointer(event)[0];
                            newEnd = Math.round(Math.max(Math.min(xScale.invert(mouseX), max_end), selectedChromosomeSequence.start));
                            setSelectedChromosomeSequence((prev) => ({ ...prev, end: newEnd }));
                        })
                        .on('end', () => {
                            if (newEnd - newStart > 4000000) {
                                warning('overrange');
                            }
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

            // add X axis and explicitly set tick values
            const xAxis = d3.axisBottom(xScale)
                .tickValues([min_start, ...xScale.ticks(5), max_end])
                .tickFormat((d) => d);

            const xAxisGroup = svg.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0, ${height + margin.top})`)
                .call(xAxis);

            // get the last tick on the x-axis
            const lastTick = xAxisGroup.selectAll('.tick:last-child text');

            // if the last tick overflows the screen, adjust its position
            lastTick.each(function () {
                const tickWidth = this.getBBox().width;
                const availableWidth = width - tickWidth - margin.right;
                const tickX = xScale(max_end);

                if (tickX > availableWidth) {
                    d3.select(this)
                        .attr('transform', `translate(-${tickWidth / 500}, 0)`)
                        .style('text-anchor', 'end');
                }
            });
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
