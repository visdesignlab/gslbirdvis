import { updateData } from './map_plotting.js';
window.plot_gsl_elevation = plot_gsl_elevation;

/**
 * Initializes and renders an interactive elevation line graph for the Great Salt Lake (GSL).
 *
 * This function sets up the SVG and triggers the drawing of the GSL elevation graph,
 * using D3 to visualize historical elevation data from a text file. It enables user interaction
 * through mouse movement, tooltips, and click events that update the associated year and month sliders.
 *
 * @param {string|SVGElement} svg - The SVG element to render the graph in.
 * @param {string} year_slider - ID tag of the year slider that syncs with the graph.
 * @param {string} month_slider - ID tag of the month slider that syncs with the graph.
 */

function plot_gsl_elevation(svg, year_slider, month_slider) {

    const gsl_svg = d3.select(svg)

    /**
     * Draws the GSL elevation line chart with axes, labels, interactivity, and tooltip behavior.
     *
     * This function fetches elevation data, parses it, and creates a line chart with
     * the following features:
     * - Scaled axes with appropriate labels and a title
     * - A line path showing elevation over time
     * - A red circle that follows mouse movement with interpolated data
     * - A floating tooltip prompting interaction
     * - Click functionality to update the linked UI (sliders and map)
     * - An info icon with a hoverable tooltip for context     *
     */
    async function drawLineGraph() {
        const data = await d3.text('./climate_data/processed_gsl_elevation_data.txt');        
        const parsedData = data.trim().split("\n").map(line => {
            const [year, value] = line.split("\t").map(d => +d);
            return { year, value };
        });

        const margin = { top: 60, right: 30, bottom: 60, left: 80 };  
        const width = 600 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const xScale = d3.scaleLinear()
            .domain(d3.extent(parsedData, d => d.year))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(parsedData, d => d.value) - 1, d3.max(parsedData, d => d.value) + 1])
            .range([height, 0]);
        
        const g = gsl_svg
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 45)  
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Year");

        g.append("g").call(d3.axisLeft(yScale));

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -60)  
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Elevation (ft)");

        g.append("text")
            .attr("x", width / 2)
            .attr("y", -30) 
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("GSL Elevation Over Time");

        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX);

        g.append("path")
            .datum(parsedData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        const hoverCircle = g.append("circle")
            .attr("r", 4)
            .attr("fill", "red")
            .style("display", "none");  
        
        gsl_svg.on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event);
            const correctedX = mouseX - margin.left;
        
            if (correctedX < 0 || correctedX > xScale.range()[1]) {
                hoverCircle.style("display", "none");
                return;
            }
        
            const hoveredYearFloat = xScale.invert(correctedX); 
        
            let i = 0;
            while (i < parsedData.length - 1 && parsedData[i + 1].year < hoveredYearFloat) {
                i++;
            }
        
            const p1 = parsedData[i];
            const p2 = parsedData[i + 1];
        
            if (!p1 || !p2) {
                hoverCircle.style("display", "none");
                return;
            }
        
            const t = (hoveredYearFloat - p1.year) / (p2.year - p1.year);
            const interpolatedValue = p1.value + t * (p2.value - p1.value);
        
            const xPos = xScale(hoveredYearFloat);
            const yPos = yScale(interpolatedValue);
        
            hoverCircle
                .attr("cx", xPos)
                .attr("cy", yPos)
                .style("display", "block");
        });
            
        const pointerTip = d3.select("body")
            .append("div")
            .attr("id", "graph-hover-tip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.7)")
            .style("color", "#fff")
            .style("padding", "6px 10px")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("display", "none");

        g.on("mousemove", function(event) {
            const [mouseX, mouseY] = d3.pointer(event);

            if (mouseX >= xScale.range()[0] && mouseX <= xScale.range()[1]) {
                const { animationState } = window.pelicanUpdateController;

                const tipText = animationState.animationRunning
                    ? "Wait for animation to finish"
                    : "Click to update data";

                pointerTip
                    .text(tipText)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`)
                    .style("display", "block");
            } else {
                pointerTip.style("display", "none");
            }
        })
        .on("mouseleave", function() {
            pointerTip.style("display", "none");
        })
        .on("click", function(event) {
            const [mouseX, mouseY] = d3.pointer(event);

            if (mouseX < xScale.range()[0] || mouseX > xScale.range()[1]) return;

            const clickedYearFloat = xScale.invert(mouseX);
            const clickedYear = Math.floor(clickedYearFloat);
            const clickedMonth = Math.floor((clickedYearFloat % 1) * 12);

            const {
                updateData,
                animationState
            } = window.pelicanUpdateController;

            if (!animationState.animationRunning) {
                document.getElementById(year_slider).value = clickedYear;
                document.getElementById(month_slider).value = clickedMonth;
                updateData(clickedYear, clickedMonth);
            }
        });

        const infoIcon = gsl_svg.append("g")
            .attr("transform", `translate(${width + margin.left - 10}, ${margin.top - 30})`)
            .style("cursor", "pointer");

        infoIcon.append("circle")
            .attr("r", 10)
            .attr("fill", "lightgray")
            .attr("stroke", "black");

        infoIcon.append("text")
            .attr("x", -5)
            .attr("y", 6)
            .attr("font-size", "19px")
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text("?");

        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid black")
            .style("padding", "5px")
            .style("border-radius", "3px")
            .style("box-shadow", "1px 1px 3px rgba(0,0,0,0.3)")
            .style("font-size", "10px") 
            .style("max-width", "200px") 
            .style("display", "none") 
            .html("<strong>What does this graph show?</strong><br>This graph displays changes in elevation at the Great Salt Lake over time.<br><br> This graph syncs with the observation map and updates as you explore different elevation levels.");

            infoIcon.on("mouseover", function(event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`)
                    .style("display", "block");
            });
            
            infoIcon.on("mouseout", function() {
                tooltip.style("display", "none");
            });        
    }  

    drawLineGraph();
}
