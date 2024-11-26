import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Button } from 'antd';
import { DownloadOutlined } from "@ant-design/icons";
import { TriangleGeneList } from './triangleGeneList.js';

export const HeatmapTriangle = ({ cellLineName, chromosomeName, geneName, currentChromosomeSequence, geneList, totalChromosomeSequences, chromosomeData, epigeneticTrackData }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const axisSvgRef = useRef(null);
    const brushSvgRef = useRef(null);

    const [minCanvasDimension, setMinCanvasDimension] = useState(0);
    const [triangleCurrentChromosomeSequence, setTriangleCurrentChromosomeSequence] = useState(currentChromosomeSequence);

    const downloadImage = () => {
        const canvas = canvasRef.current;
        const svg = axisSvgRef.current;

        const serializer = new XMLSerializer();
        const svgData = serializer.serializeToString(svg);

        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgURL = URL.createObjectURL(svgBlob);

        const svgImage = new Image();
        svgImage.onload = () => {
            // Create a new canvas to merge canvas and SVG
            const combinedCanvas = document.createElement("canvas");
            combinedCanvas.width = canvas.width;
            combinedCanvas.height = canvas.height + svgImage.height;

            const combinedContext = combinedCanvas.getContext("2d");

            combinedContext.drawImage(canvas, 0, 0);

            combinedContext.drawImage(svgImage, 0, canvas.height);

            // Convert the combined canvas to an image and trigger download
            const dataURL = combinedCanvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = dataURL;
            link.download = "heatmap_triangle.png";
            link.click();

            URL.revokeObjectURL(svgURL);
        };

        svgImage.src = svgURL;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const margin = { top: 5, right: 5, bottom: 5, left: 5 };
        const parentWidth = containerRef.current.offsetWidth;
        const parentHeight = containerRef.current.offsetHeight;

        const width = (Math.min(parentWidth, parentHeight) - margin.left - margin.right);
        const height = (Math.min(parentWidth, parentHeight) - margin.top - margin.bottom);

        canvas.width = width * Math.sqrt(2);
        canvas.height = height / 1.4;

        setMinCanvasDimension(canvas.width);
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Apply rotation transformation
        context.scale(1, -1)
        context.translate(canvas.width / 2, -canvas.height * 2);
        context.rotate((Math.PI / 180) * 45);

        const { start, end } = triangleCurrentChromosomeSequence;
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
            .range([0, canvas.width - margin.right])
            .padding(0.1);

        const colorScale = d3.scaleSequential(
            t => d3.interpolateReds(t * 0.8 + 0.2)
        ).domain([0, d3.max(chromosomeData, d => d.fq)]);

        const fqMap = new Map();
        chromosomeData.forEach(d => {
            fqMap.set(`X:${d.ibp}, Y:${d.jbp}`, { fq: d.fq, fdr: d.fdr });
        });

        const hasData = (ibp, jbp) => {
            const inRange = totalChromosomeSequences.some(seq =>
                ibp >= seq.start && ibp <= seq.end &&
                jbp >= seq.start && jbp <= seq.end
            );

            return inRange;
        };

        axisValues.forEach(ibp => {
            axisValues.forEach(jbp => {
                const { fq } = fqMap.get(`X:${ibp}, Y:${jbp}`) || { fq: -1, fdr: -1 };

                const x = margin.left + xScale(jbp);
                const y = margin.top + yScale(ibp);
                const width = xScale.bandwidth();
                const height = yScale.bandwidth();

                context.fillStyle = !hasData(ibp, jbp) ? 'white' : (jbp <= ibp) ? 'white' : colorScale(fq);
                context.fillRect(x, y, width, height);
            });
        });

        const brushSvg = d3.select(brushSvgRef.current)
            .attr('width', canvas.width + margin.left + margin.right)
            .attr('height', canvas.height + margin.top + margin.bottom);

        brushSvg.selectAll('*').remove();

        brushSvg.append('g')
            .attr('class', 'brush')
            .call(d3.brushX()
                .extent([[margin.left, margin.top], [canvas.width + margin.left, height + margin.top]])
                .on('end', ({ selection }) => {
                    if (!selection) {
                        setTriangleCurrentChromosomeSequence(currentChromosomeSequence);
                        return;
                    }

                    const [x0, x1] = selection;
                    const brushedX = axisValues.filter(val => {
                        const pos = margin.left + xScale(val) + xScale.bandwidth() / 2;
                        return pos >= x0 && pos <= x1;
                    });
                    setTriangleCurrentChromosomeSequence({ start: brushedX[0], end: brushedX[brushedX.length - 1] });
                })
            );

        const axisSvg = d3.select(axisSvgRef.current)
            .attr('width', parentWidth)

        axisSvg.selectAll('*').remove();

        // Calculate the range of the current chromosome sequence
        const range = triangleCurrentChromosomeSequence.end - triangleCurrentChromosomeSequence.start;

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
            .attr('transform', `translate(${(parentWidth - canvas.width) / 2}, ${margin.top})`)
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
            .style("text-anchor", "start")
            .attr("transform", "rotate(45)")
            .attr("dx", "1em")
            .attr("dy", "0em");

    }, [chromosomeData]);

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%', height: '100%' }}>
            <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 10,
                display: 'flex',
                gap: '10px',
            }}>
                <Button
                    style={{
                        fontSize: 15,
                        cursor: "pointer",
                    }}
                    icon={<DownloadOutlined />}
                    onClick={downloadImage}
                />
            </div>
            <canvas ref={canvasRef} />
            <svg ref={brushSvgRef} style={{ position: 'absolute', zIndex: 2, pointerEvents: 'all' }} />
            <svg ref={axisSvgRef} style={{ height: '50px', flexShrink: 0 }} />
            {minCanvasDimension > 0 && (
                <TriangleGeneList
                    cellLineName={cellLineName}
                    chromosomeName={chromosomeName}
                    geneList={geneList}
                    epigeneticTrackData={epigeneticTrackData}
                    currentChromosomeSequence={triangleCurrentChromosomeSequence}
                    minCanvasDimension={minCanvasDimension}
                    geneName={geneName}
                />
            )}
        </div>
    );
};
