/**
 * Plots a time-series visualization of bird species reported at the Great Salt Lake (GSL),
 * using normalized monthly averages from a GeoJSON dataset. The plot includes both a raw
 * trend line and a smoothed moving average line.
 *
 * The data is grouped by year-month, averaged across observations per month,
 * and normalized using min-max scaling to bring values to a 0–1 range.
 * The visualization includes labeled axes, smoothed and unsmoothed trend lines,
 * and ticks on the x-axis for monthly and yearly intervals.
 *
 * @param {HTMLElement} svg - The SVG element where the plot will be rendered.
 * @param {string} path - The file path to the GeoJSON dataset containing bird observations.
 */
async function plot_gsl_birds(svg, path) {
    const width = 900;
    const height = 500;
    const margin = { top: 50, right: 80, bottom: 80, left: 80 };
    const d3Svg = d3.select(svg);

    // Load JSON data
    const response = await fetch(path);
    const data = await response.json();
    const features = data.features || [];

    // Process data to aggregate species counts by month
    const speciesByMonth = new Map();
    features.forEach(feature => {
        const dateStr = feature.properties?.observation_date;
        const speciesReported = parseInt(feature.properties?.species_reported || "0", 10);
        
        if (!dateStr || isNaN(speciesReported)) return;

        const dateObj = new Date(dateStr);
        const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

        // If the month already exists in the Map, update it, otherwise initialize it
        if (!speciesByMonth.has(yearMonth)) {
            speciesByMonth.set(yearMonth, { totalSpecies: 0, count: 0 });
        }

        const monthData = speciesByMonth.get(yearMonth);
        monthData.totalSpecies += speciesReported;  
        monthData.count += 1; 
    });

    // Calculate average species reported per month
    const sortedMonths = Array.from(speciesByMonth.keys()).sort();
    const speciesCounts = sortedMonths.map(month => {
        const data = speciesByMonth.get(month);
        return data.totalSpecies / data.count;  
    });

    // Normalize the species counts (min-max scaling)
    const maxSpecies = d3.max(speciesCounts) || 1; 
    const normalizedCounts = speciesCounts.map(count => count / maxSpecies);
    const dates = sortedMonths.map(month => new Date(month + "-01"));
    const startDate = new Date("2004-01-01");
    const endDate = d3.max(dates); 

    const filteredData = dates
        .map((date, i) => ({ date, value: normalizedCounts[i] }))
        .filter(d => d.date >= startDate);

    const xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, 1]) 
        .range([height - margin.bottom, margin.top]);

    const xAxisMajor = d3.axisBottom(xScale)
        .ticks(d3.timeYear.every(1)) 
        .tickFormat(d3.timeFormat("%Y-%m"));

    const xAxisMinor = d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1)) 
        .tickSize(5) 
        .tickFormat(""); 

    const yAxis = d3.axisLeft(yScale).ticks(5);

    // Compute a smoothed line to show general trend using a moving average
    const windowSize = 30;
    const smoothedData = filteredData.map((d, i, arr) => {
        const halfWindow = Math.floor(windowSize / 2);
        const start = Math.max(0, i - halfWindow);
        const end = Math.min(arr.length, i + halfWindow + 1);
        const subset = arr.slice(start, end);
        const avg = d3.mean(subset, s => s.value);
        return { date: d.date, value: avg };
    });

    // Plot the smoothed trend line
    d3Svg.append("path")
        .datum(smoothedData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX)  
        );
    
    // Append minor x-axis ticks (months)
    d3Svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxisMinor)
        .selectAll("line")
        .style("stroke", "light-grey"); 

    // Append major x-axis ticks (years)
    d3Svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxisMajor)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Append y-axis
    d3Svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis);

    // Append line path
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

    d3Svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("d", line);

    d3Svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Normalized Species Reported Over Time at the GSL");

    d3Svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 2 + 30)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Time (Year-Month)");

    d3Svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 3)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Normalized Species Reported");

}

/**
 * Fetches bird observation data from a GeoJSON file, processes monthly average species counts, 
 * normalizes them, and plots a line chart comparing two specific years using D3.js.
 * 
 * The chart shows the normalized average number of bird species reported per month
 * for two given years, allowing for visual comparison of trends across the year.
 * 
 * @param {string} path - File path to the GeoJSON data file containing bird observations.
 * @param {string} svg_id - ID tag for the SVG element where the chart will be rendered.
 * @param {string} comparison_year1 - The first year to include in the comparison.
 * @param {string} comparison_year2 - The second year to include in the comparison.
 */
async function plot_gsl_comparisons_fixed_years(path, svg_id, comparison_year1, comparison_year2) {
    const response = await fetch(path);
    const data = await response.json();
    const features = data.features || [];

    const speciesByMonth = new Map();

    features.forEach(feature => {
        const dateStr = feature.properties?.observation_date;
        const speciesReported = parseInt(feature.properties?.species_reported || "0", 10);
        if (!dateStr || isNaN(speciesReported)) return;

        const dateObj = new Date(dateStr);
        const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

        if (!speciesByMonth.has(yearMonth)) {
            speciesByMonth.set(yearMonth, { totalSpecies: 0, count: 0 });
        }

        const monthData = speciesByMonth.get(yearMonth);
        monthData.totalSpecies += speciesReported;
        monthData.count += 1;
    });

    const sortedMonths = Array.from(speciesByMonth.keys()).sort();
    const speciesCounts = sortedMonths.map(month => {
        const data = speciesByMonth.get(month);
        return data.totalSpecies / data.count;
    });

    const maxSpecies = d3.max(speciesCounts) || 1;
    const normalizedCounts = speciesCounts.map(count => count / maxSpecies);

    const speciesByYear = {};
    sortedMonths.forEach((month, index) => {
        const year = month.split('-')[0];
        if (!speciesByYear[year]) {
            speciesByYear[year] = Array(12).fill(0);
        }
        speciesByYear[year][parseInt(month.split('-')[1], 10) - 1] = normalizedCounts[index];
    });

    const year1 = comparison_year1;
    const year2 = comparison_year2;
    const svg = d3.select(svg_id);
    svg.style.display = 'block';
    svg.selectAll("*").remove();

    const year1Data = speciesByYear[year1] || Array(12).fill(0);
    const year2Data = speciesByYear[year2] || Array(12).fill(0);

    const minVal = Math.min(d3.min(year1Data), d3.min(year2Data));
    const maxVal = Math.max(d3.max(year1Data), d3.max(year2Data));

    const xScale = d3.scaleBand()
        .domain(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
        .range([50, 850])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([minVal, maxVal])
        .range([550, 50]);

    const xAxis = svg.append("g")
        .attr("transform", "translate(0,550)")
        .call(d3.axisBottom(xScale));

    const yAxis = svg.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(yScale));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    svg.append("path")
        .data([year1Data])
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x((d, i) => xScale(monthNames[i]) + xScale.bandwidth() / 2)
            .y(d => yScale(d)));

    svg.append("path")
        .data([year2Data])
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x((d, i) => xScale(monthNames[i]) + xScale.bandwidth() / 2)
            .y(d => yScale(d)));

    svg.append("text").attr("x", 820).attr("y", 50).attr("fill", "blue").text(year1);
    svg.append("text").attr("x", 820).attr("y", 70).attr("fill", "red").text(year2);
    svg.append("text").attr("x", 450).attr("y", 590).attr("text-anchor", "middle").attr("font-size", "14px").text("Month");
    svg.append("text")
        .attr("x", -250).attr("y", 15).attr("text-anchor", "middle").attr("font-size", "14px")
        .attr("transform", "rotate(-90)")
        .text("Normalized Average Species Reported");
    svg.append("text")
        .attr("x", 450).attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text(`Bird Species Comparison: ${year1} vs ${year2}`);
}

/**
 * Loads bird observation data from a GeoJSON file, processes average monthly species counts,
 * normalizes the data, and plots a dynamic line chart comparing two selected years using D3.js.
 * 
 * The chart updates interactively based on selections from two dropdown menus allowing users
 * to compare the normalized average number of bird species reported per month across years.
 * 
 * While similar to the above function, this method allows for full user interaction, iteratively
 * updating data based on user request. 
 * 
 * @param {string} path - File path to GeoJSON data containing bird species observations.
 * @param {string} dropdown1 - ID tag for the first dropdown used to select year 1.
 * @param {string} dropdown2 - ID tag for the second dropdown used to select year 2.
 * @param {string} svg_id - ID tag of the SVG element where the chart will be rendered.
 */
async function plot_gsl_comparisons(path, dropdown1, dropdown2, svg_id) {
    const response = await fetch(path);
    const data = await response.json();
    const features = data.features || [];
    const speciesByMonth = new Map();

    // Process the data to aggregate species counts by month
    features.forEach(feature => {
        const dateStr = feature.properties?.observation_date;
        const speciesReported = parseInt(feature.properties?.species_reported || "0", 10);
        
        if (!dateStr || isNaN(speciesReported)) return;

        const dateObj = new Date(dateStr);
        const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

        if (!speciesByMonth.has(yearMonth)) {
            speciesByMonth.set(yearMonth, { totalSpecies: 0, count: 0 });
        }

        const monthData = speciesByMonth.get(yearMonth);
        monthData.totalSpecies += speciesReported;  
        monthData.count += 1;  
    });

    // Calculate the average species count for each month
    const sortedMonths = Array.from(speciesByMonth.keys()).sort();
    const speciesCounts = sortedMonths.map(month => {
        const data = speciesByMonth.get(month);
        return data.totalSpecies / data.count;  
    });

    // Normalize the species counts (min-max scaling)
    const maxSpecies = d3.max(speciesCounts) || 1;  
    const normalizedCounts = speciesCounts.map(count => count / maxSpecies);

    // Prepare an object to store data by year 
    const speciesByYear = {};
    sortedMonths.forEach((month, index) => {
        const year = month.split('-')[0];
        if (!speciesByYear[year]) {
            speciesByYear[year] = Array(12).fill(0);
        }
        speciesByYear[year][parseInt(month.split('-')[1], 10) - 1] = normalizedCounts[index];
    });

    /**
     * Renders a line chart in the specified SVG element comparing normalized average bird species counts 
     * per month between two selected years. Uses D3.js for visualization.
     * 
     * @param {string|number} year1 - The first year to compare (blue line).
     * @param {string|number} year2 - The second year to compare (red line).
     * @param {string} svg_id - ID tag of the SVG element where the chart will be drawn.
     */
    function plotComparison(year1, year2, svg_id) {
        const svg = d3.select(svg_id);
        svg.style.display = 'block';
        svg.selectAll("*").remove(); 
    
        const year1Data = speciesByYear[year1] || Array(12).fill(0);
        const year2Data = speciesByYear[year2] || Array(12).fill(0);
    
        const minVal = Math.min(d3.min(year1Data), d3.min(year2Data));
        const maxVal = Math.max(d3.max(year1Data), d3.max(year2Data));
    
        const xScale = d3.scaleBand()
            .domain(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) 
            .range([50, 850])  
            .padding(0.1);  

        const yScale = d3.scaleLinear()
            .domain([minVal, maxVal])
            .range([550, 50]);
    
        const xAxis = svg.append("g")
            .attr("transform", "translate(0,550)") 
            .call(d3.axisBottom(xScale));
    
        const yAxis = svg.append("g")
            .attr("transform", "translate(50,0)") 
            .call(d3.axisLeft(yScale));
    
        xAxis.transition().duration(750).call(d3.axisBottom(xScale));
        yAxis.transition().duration(750).call(d3.axisLeft(yScale));
    
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
        const year1Line = svg.append("path")
            .data([year1Data])
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x((d, i) => xScale(monthNames[i]) + xScale.bandwidth() / 2) 
                .y(d => yScale(d))
            );
    
        year1Line.transition()
            .duration(750)
            .attr("d", d3.line()
                .x((d, i) => xScale(monthNames[i]) + xScale.bandwidth() / 2) 
                .y(d => yScale(d))
            );
    
        const year2Line = svg.append("path")
            .data([year2Data])
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x((d, i) => xScale(monthNames[i]) + xScale.bandwidth() / 2) 
                .y(d => yScale(d))
            );
    
        year2Line.transition()
            .duration(750)
            .attr("d", d3.line()
                .x((d, i) => xScale(monthNames[i]) + xScale.bandwidth() / 2) 
                .y(d => yScale(d))
            );
    
        svg.append("text")
            .attr("x", 820)
            .attr("y", 50)
            .attr("fill", "blue")
            .text(year1);
    
        svg.append("text")
            .attr("x", 820)
            .attr("y", 70)
            .attr("fill", "red")
            .text(year2);
    
        svg.append("text")
            .attr("x", 450) 
            .attr("y", 590) 
            .attr("text-anchor", "middle") 
            .attr("font-size", "14px") 
            .text("Month");
    
        // Y-axis Title
        svg.append("text")
            .attr("x", -250) 
            .attr("y", 15) 
            .attr("text-anchor", "middle") 
            .attr("font-size", "14px") 
            .attr("transform", "rotate(-90)") 
            .text("Normalized Average Species Reported");
    
        svg.append("text")
            .attr("id", "comparison-title")
            .attr("class", "main-title")
            .attr("x", 450) 
            .attr("y", 30) 
            .attr("text-anchor", "middle") 
            .attr("font-size", "20px") 
            .attr("font-weight", "bold") 
            .text(`Bird Species Comparison: ${year1} vs ${year2}`);
    }

    // Listen to changes in the dropdowns and update the plot
    document.getElementById(dropdown1).addEventListener("change", function() {
        const year1 = this.value;
        const year2 = document.getElementById(dropdown2).value;
        plotComparison(year1, year2, svg_id);
    });

    document.getElementById(dropdown2).addEventListener("change", function() {
        const year1 = document.getElementById(dropdown1).value;
        const year2 = this.value;
        plotComparison(year1, year2, svg_id);
    });

    /**
     * Sets default values in the year selection dropdowns to initialize the plot.
     * Default values are 2004 and 2023.
     */
    function setInitialDropdowns() {
        document.getElementById(dropdown1).value = 2004;
        document.getElementById(dropdown2).value = 2023;
    }

    setInitialDropdowns()
    plotComparison('2004', '2023', svg_id);
}
