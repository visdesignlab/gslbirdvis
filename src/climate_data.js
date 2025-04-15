import { updateData } from './map_plotting.js';
window.climate_map = climate_map;

/**
 * Initializes and draws a climate visualization within a given svg element.
 * Displays ONI and SST data trends over time, including interactive elements like tooltips and updates triggers.
 * 
 * @param {svgElement} svg - svg element where visualization will be rendered.
 * @param {string} year_slider - ID tag of the year slider element for syncing data.
 * @param {string} month_slider - ID tag of the month slider element for syncing data.
 */
function climate_map(svg, year_slider, month_slider) {
    const width = 900;
    const height = 900;
    const margin = 80;
    const d3Svg = d3.select(svg);

    draw_plots(width, height, margin, d3Svg);

    /**
     * Loads climate datasets (ONI Index and SST data), parses them, and renders the visualization on the provided svg.
     * Includes line and area plots, color gradients, legends, axes, interactive tooltip, and syncing with sliders.
     * 
     * @param {number} width - Width of svg.
     * @param {number} height - Height of svg.
     * @param {number} margin - Margin used for axis and layout spacing.
     * @param {Object} d3Svg - D3 selection of the svg element.
     */
    async function draw_plots(width, height, margin, d3Svg) {
        const oniResponse = await fetch("birds/climate_data/oni_data.txt");
        const oniText = await oniResponse.text();
        const oniLines = oniText.trim().split("\n");
        const oniData = [];

        oniLines.forEach(line => {
            const values = line.trim().split(/\s+/);
            const year = +values.shift(); 
            values.forEach((value, index) => {
                oniData.push({
                    date: new Date(year, index), 
                    value: parseFloat(value) 
                });
            });
        });

        const sstResponse = await fetch("birds/climate_data/sst_data.txt");
        const sstText = await sstResponse.text();
        const sstLines = sstText.trim().split("\n");
        const sstData = [];

        sstLines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const nino3 = parseFloat(parts[5]); 
            
            // Store data for January
            if (year >= 2004 && year <= 2024 && month === 1) {
                sstData.push({
                    date: new Date(year, 0), 
                    value: nino3 
                });
            }
        });

        // Set up scales (same for ONI and SST data)
        const xScale = d3.scaleTime()
            .domain(d3.extent(oniData, d => d.date)) 
            .range([margin, width - margin]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(oniData, d => d.value), d3.max(oniData, d => d.value)])
            .range([height - margin, margin]);

        const yScaleSST = d3.scaleLinear()
            .domain([d3.min(sstData, d => d.value), d3.max(sstData, d => d.value)])
            .range([height - margin, margin]);
            
        const oniLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX); 

        const sstLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScaleSST(d.value))
            .curve(d3.curveMonotoneX); 

        const oniArea = d3.area()
            .x(d => xScale(d.date))
            .y0(d => yScale(0)) 
            .y1(d => yScale(d.value)) 
            .curve(d3.curveMonotoneX); 

        const maxAbsValue = d3.max([...oniData, ...sstData], d => Math.abs(d.value));
        const defs = d3Svg.append("defs");

        // Custom gradient for ONI Index area that aligns with color-coding of climate indices.
        const oniGradient = defs.append("linearGradient")
            .attr("id", "oniGradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", "0%").attr("x2", "0%")
            .attr("y1", yScale(maxAbsValue))
            .attr("y2", yScale(-maxAbsValue));

        oniGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", d3.interpolateReds(1));

        oniGradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", d3.interpolateBlues(0.1));

        oniGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", d3.interpolateBlues(1));

        // Append ONI area with custom gradient
        d3Svg.append("path")
            .datum(oniData)
            .attr("fill", "url(#oniGradient)")
            .attr("d", oniArea)
            .on("mousemove", handleMouseMove)
            .on("mouseleave", handleMouseLeave)
            .on("click", handleClick);

        d3Svg.append("path")
            .datum(sstData)
            .attr("fill", "none")
            .attr("stroke", "orange")
            .attr("stroke-width", 4)
            .attr("d", sstLine)
            .style("pointer-events", "visibleStroke")
            .on("mousemove", handleMouseMove)
            .on("mouseleave", handleMouseLeave)
            .on("click", handleClick);

        d3Svg.append("path")
            .datum(oniData)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("d", oniLine)
            .style("pointer-events", "visibleStroke")
            .on("mousemove", handleMouseMove)
            .on("mouseleave", handleMouseLeave)
            .on("click", handleClick);

        d3Svg.append("line")
            .attr("x1", margin)
            .attr("x2", width - margin)
            .attr("y1", yScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "gray")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4 2");

        d3Svg.append("g")
            .attr("transform", `translate(0,${height - margin})`)
            .call(d3.axisBottom(xScale).ticks(10));

        d3Svg.append("g")
            .attr("transform", `translate(${margin},0)`)
            .call(d3.axisLeft(yScale));

        d3Svg.append("g")
            .attr("transform", `translate(${width - margin},0)`)
            .attr("class", "sst-axis")
            .call(d3.axisRight(yScaleSST));
        
        d3Svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .text("ONI Index & NINO3 January Temperatures");

        d3Svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - margin / 3)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Year");

        d3Svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", margin / 3)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text("ONI Index");

        d3Svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", width - margin / 3)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Nino3 Temperature Index");

        d3Svg.append("line")
            .attr("x1", width - margin) 
            .attr("x2", width - margin) 
            .attr("y1", margin) 
            .attr("y2", height - margin) 
            .attr("stroke", "black") 
            .attr("stroke-width", 1); 

        const infoIcon = d3Svg.append("g")
            .attr("transform", `translate(${width - margin - 40}, ${margin - 60})`)
            .style("cursor", "pointer");

        infoIcon.append("circle")
            .attr("r", 20)
            .attr("fill", "lightgray")
            .attr("stroke", "black");

        infoIcon.append("text")
            .attr("x", -5)
            .attr("y", 6)
            .attr("font-size", "24px")
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
            .style("max-width", "250px") 
            .style("display", "none")
            .html("<strong>What does this graph show?</strong><br>This graph displays the ONI Index, along with the NINO3 temperature variations over time, taken from January of each year.<br><br> The ONI index is a primary indicator for monitoring El Niño and La Niña. The ONI Index is calculated by averaging the difference between the current sea surface temperature and the long-term average sea surface temperature. <br><br> The Nino3 temperature index measures sea surface temperature anomalies in the eastern Pacific Ocean (where Mexico lies). Understanding the change in sea surface temperature helps further explain the intensity of an El Niño and/or La Niña event. <br><br> This graph syncs with the observation map and updates as you explore different climate events. ");

            infoIcon.on("mouseover", function(event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 25}px`)
                    .style("display", "block");
            });
            
            infoIcon.on("mouseout", function() {
                tooltip.style("display", "none");
            });

        const legend = d3Svg.append("g")
            .attr("transform", `translate(${margin + 20}, ${margin - 20})`);

        legend.append("circle")
            .attr("cx", 10)
            .attr("cy", 10)
            .attr("r", 6)
            .attr("fill", "orange");

        legend.append("text")
            .attr("x", 20)
            .attr("y", 14)
            .style("font-size", "14px")
            .attr("fill", "black")
            .text("NINO3 Temperature");
        
        addCustomGradientLegend(d3Svg, defs);

        /**
         * Appends a vertical gradient legend to the svg indicating El Niño and La Niña intensities.
         * @param {*} d3Svg - D3 selection of the svg element.
         * @param {*} defs - Defs section used to define gradients. 
         */
        function addCustomGradientLegend(d3Svg, defs) {
            const legendWidth = 20;
            const legendHeight = 200;
            const legendX = 750; 
            const legendY = 80;

            const legendGradient = defs.append("linearGradient")
            .attr("id", "legendGradient")
            .attr("x1", "0%").attr("x2", "0%")
            .attr("y1", "0%").attr("y2", "100%");
        
            legendGradient.append("stop").attr("offset", "0%").attr("stop-color", d3.interpolateReds(1)); // Dark Red (max)
            legendGradient.append("stop").attr("offset", "50%").attr("stop-color", d3.interpolateReds(0)); // 0
            legendGradient.append("stop").attr("offset", "100%").attr("stop-color", d3.interpolateBlues(1)); // Dark Blue (-max)
        
            d3Svg.append("rect")
                .attr("x", legendX)
                .attr("y", legendY)
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#legendGradient)");
        
            d3Svg.append("text")
                .attr("x", legendX + legendWidth / 2)  
                .attr("y", legendY - 10) 
                .style("font-size", "12px")
                .style("text-anchor", "middle") 
                .text("Strong El Niño"); 

            d3Svg.append("text")
                .attr("x", legendX + legendWidth / 2)  
                .attr("y", legendY + legendHeight + 20)  
                .style("font-size", "12px")
                .style("text-anchor", "middle")  
                .text("Strong La Niña");
        }

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
            .style("display", "none")
            .text("Click to select a month")

        /**
         * Displays a floating tooltip near the cursor when hovering over the ONI or SST lines.
         * Tooltip gives a prompt to click or wait depending on animation state.
         * @param {*} event - The mousemove event.
         */
        function handleMouseMove(event) {
            const [mouseX, mouseY] = d3.pointer(event);

            if (mouseX >= margin && mouseX <= width - margin &&
                mouseY >= margin && mouseY <= height - margin) 
                
                {
                    const { animationState } = window.pelicanUpdateController;
                    const tipText = animationState.animationRunning
                        ? "Wait for animation to finish"
                        : "Click to update data";
                    pointerTip
                        .text(tipText)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`)
                        .style("display", "block");
                }
            else 
                {
                    pointerTip.style("display", "none");
                }
            }
        
        /**
         * Hides the tooltip when the mouse leaves the graph lines.
         */
        function handleMouseLeave() {
            pointerTip.style("display", "none");
        }
        
        /**
         * Handles click events on the graph. If within bounds and no animation is running,
         * updates the year and month sliders and triggers the data update function.
         * @param {*} event - The click event.
         */
        function handleClick(event) {
            const [mouseX, mouseY] = d3.pointer(event);

            if (mouseX < margin || mouseX > width - margin || mouseY < margin || mouseY > height - margin) {
                        return;
            }
        
            const clickedDate = xScale.invert(mouseX);
            const clickedYear = clickedDate.getFullYear();
            const clickedMonth = clickedDate.getMonth(); 
        
            const {
                updateData,
                animationState
            } = window.pelicanUpdateController;
        
            if (!animationState.animationRunning) {
                document.getElementById(year_slider).value = clickedYear;
                document.getElementById(month_slider).value = clickedMonth;
                updateData(clickedYear, clickedMonth);
            }
        }
        
    }
}


