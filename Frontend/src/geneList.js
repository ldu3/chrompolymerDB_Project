import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export const GeneList = ({ geneList, currentChromosomeSequence, minDimension, setCurrentChromosomeSequence, geneName, setGeneName, epigeneticTrackData }) => {
    const svgRef = useRef();
    const containerRef = useRef();
    const [scrollEnabled, setScrollEnabled] = useState(false);

    const tooltipRef = useRef();
    const initialHeightRef = useRef(null);

    useEffect(() => {
        // let width = containerRef.current.offsetWidth;
        let width = minDimension;
        let height = containerRef.current.offsetHeight;

        const margin = { top: 20, right: 10, bottom: 0, left: 60 };

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const { start, end } = currentChromosomeSequence;
        const step = 5000;
        const adjustedStart = Math.floor(start / step) * step;
        const adjustedEnd = Math.ceil(end / step) * step;

        const axisValues = Array.from(
            { length: Math.floor((adjustedEnd - adjustedStart) / step) + 1 },
            (_, i) => adjustedStart + i * step
        );

        // Map genes to the range of currentChromosomeSequence
        const genesToRender = geneList
            .filter((gene) =>
                gene.start_location <= end && gene.end_location >= start
            )
            .map((gene) => ({
                ...gene,
                displayStart: Math.max(gene.start_location, start),
                displayEnd: Math.min(gene.end_location, end),
            }));

        const xAxisScale = d3.scaleBand()
            .domain(axisValues)
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const xScaleLinear = d3.scaleLinear()
            .domain([adjustedStart, adjustedEnd])
            .range([margin.left, width - margin.right]);

        // Calculate height based on the number of layers
        const layerHeight = 20;

        // Calculate gene ranges and prevent overlap
        const layers = [];
        genesToRender.forEach((gene) => {
            let placed = false;
            for (const layer of layers) {
                if (
                    !layer.some(
                        (g) => g.displayStart < gene.displayEnd && g.displayEnd > gene.displayStart
                    )
                ) {
                    layer.push(gene);
                    placed = true;
                    break;
                }
            }
            if (!placed) layers.push([gene]);
        });

        // Store the initial height once
        if (initialHeightRef.current === null) {
            initialHeightRef.current = height;
        }

        // Check if scrolling is needed based on total height
        const totalHeight = (layers.length - 1) * layerHeight + (layerHeight - 4) + margin.top;

        if (totalHeight > initialHeightRef.current) {
            setScrollEnabled(true);
            height = totalHeight;
        } else {
            setScrollEnabled(false);
        }

        // Calculate the range of the current chromosome sequence
        const range = currentChromosomeSequence.end - currentChromosomeSequence.start;

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

        // Add x-axis tick lines
        const axis = d3.axisBottom(xAxisScale)
            .tickValues(axisValues.filter((_, i) => i % tickCount === 0))
            .tickFormat(() => "")
            .tickSize(-height);

        svg.attr("width", width).attr("height", height);

        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(axis)
            .selectAll("line")
            .attr("stroke", "#DCDCDC");

        svg.selectAll('.domain')
            .attr('stroke', '#DCDCDC');

        // Gene sequences
        layers.forEach((layer, layerIndex) => {
            svg
                .selectAll(`.gene-layer-${layerIndex}`)
                .data(layer)
                .enter()
                .append("rect")
                .attr("x", (d) => xScaleLinear(d.displayStart))
                .attr("y", margin.top + layerIndex * layerHeight)
                .attr("width", (d) => xScaleLinear(d.displayEnd) - xScaleLinear(d.displayStart))
                .attr("height", layerHeight - 4)
                .attr("fill", (d) => (d.symbol === geneName ? "#ff5733" : "#69b3a2"))
                .attr("stroke", "#333")
                .attr("stroke-width", 0.2)
                .style("transition", "all 0.3s ease")
                // .on("click", (event, d) => {
                //     setGeneName(d.symbol);
                // })
                .on("mouseover", (event, d) => {
                    d3.select(event.target)
                        .style("stroke-width", 1);

                    const tooltip = d3.select(tooltipRef.current);
                    tooltip.style("opacity", 0.8)
                        .style("visibility", "visible")
                        .html(`
                            <strong>Gene Symbol:</strong> ${d.symbol || d.gene_name}<br>
                            <strong>Start:</strong> ${d.displayStart}<br>
                            <strong>End:</strong> ${d.displayEnd}
                            `)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mouseout", (event) => {
                    d3.select(event.target)
                        .style("stroke-width", 0.2);
                    const tooltip = d3.select(tooltipRef.current);
                    tooltip.style("opacity", 0)
                        .style("visibility", "hidden");
                });
        });
    }, [geneList, currentChromosomeSequence, geneName]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '28%',
                borderRight: "1px solid #eaeaea",
                borderTop: "1px solid #eaeaea",
                boxSizing: "border-box",
                overflowY: scrollEnabled ? 'auto' : 'hidden',
                overflowX: "hidden",
            }}
        >
            <svg ref={svgRef}></svg>
            <div
                ref={tooltipRef}
                style={{
                    position: "absolute",
                    background: "white",
                    padding: '5px 12px',
                    border: "1px solid #d9d9d9",
                    borderRadius: 5,
                    opacity: 0,
                    fontSize: "12px",
                    padding: "5px",
                    borderRadius: "4px",
                    pointerEvents: "none",
                    visibility: "hidden",
                    zIndex: 10,
                    textAlign: "left",
                    transition: "opacity 0.4s ease, visibility 0.4s linear 0.4s",
                }}
            ></div>
        </div>
    );
};