import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export const GeneList = ({ geneList, selectedChromosomeSequence }) => {
    const svgRef = useRef();
    const containerRef = useRef();
    const [svgWidth, setSvgWidth] = useState(0);
    const [svgHeight, setSvgHeight] = useState(0);

    const tooltipRef = useRef();

    useEffect(() => {
        const handleResize = () => {
            setSvgWidth(containerRef.current.offsetWidth);
            setSvgHeight(containerRef.current.offsetHeight);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        if (svgWidth === 0) return;

        const { start: selectedStart, end: selectedEnd } = selectedChromosomeSequence;

        // Filter genes that have overlap with selectedChromosomeSequence
        const filteredGenes = geneList.filter(({ start_location, end_location }) => {
            return (
                (start_location >= selectedStart && start_location <= selectedEnd) ||
                (end_location >= selectedStart && end_location <= selectedEnd) ||
                (start_location <= selectedStart && end_location >= selectedEnd)
            );
        });

        // Map genes to the range of selectedChromosomeSequence
        const genesToRender = filteredGenes.map((gene) => ({
            ...gene,
            displayStart: Math.max(gene.start_location, selectedStart),
            displayEnd: Math.min(gene.end_location, selectedEnd),
        }));

        const margin = { top: 20, right: 20, bottom: 20, left: 50 };

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const xScale = d3
            .scaleLinear()
            .domain([selectedStart, selectedEnd])
            .range([margin.left, svgWidth - margin.right]);

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

        // Gene sequences
        layers.forEach((layer, layerIndex) => {
            svg
                .selectAll(`.gene-layer-${layerIndex}`)
                .data(layer)
                .enter()
                .append("rect")
                .attr("x", (d) => xScale(d.displayStart))
                .attr("y", margin.top + layerIndex * layerHeight)
                .attr("width", (d) => xScale(d.displayEnd) - xScale(d.displayStart))
                .attr("height", layerHeight - 4)
                .attr("fill", "#69b3a2")
                .attr("stroke", "#333")
                .attr("stroke-width", 1)
                .on("mouseover", (event, d) => {
                    d3.select(event.target)
                        .style("stroke-width", 2);

                    const tooltip = d3.select(tooltipRef.current);
                    tooltip.style("visibility", "visible")
                        .html(`
                        <strong>Gene Symbol:</strong> ${d.symbol || d.gene_name}<br>
                        <strong>Start:</strong> ${d.start_location}<br>
                        <strong>End:</strong> ${d.end_location}
                        `)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`);
                })
                .on("mouseout", (event) => {
                    d3.select(event.target)
                        .style("stroke-width", 1);
                    const tooltip = d3.select(tooltipRef.current);
                    tooltip.style("visibility", "hidden");
                });
        });
    }, [geneList, selectedChromosomeSequence, svgWidth, svgHeight]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '30%', borderTop: "1px solid #eaeaea", overflowY: "auto" }}>
            <svg ref={svgRef}></svg>
            <div
                ref={tooltipRef}
                style={{
                    position: "absolute",
                    background: "white",
                    padding: '5px 12px',
                    border: "1px solid #d9d9d9",
                    borderRadius: 5,
                    opacity: 0.9,
                    fontSize: "12px",
                    padding: "5px",
                    borderRadius: "4px",
                    pointerEvents: "none",
                    visibility: "hidden",
                    zIndex: 10,
                    textAlign: "left",
                }}
            ></div>
        </div>
    );
};