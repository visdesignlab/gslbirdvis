/**
 * 
 * @param {*} year 
 * @param {*} month 
 */
export function updateData(year, month) {
}

window.plot_map = plot_map;
window.plot_pixels = plot_pixels;
window.updateData = updateData;

/**
 * Draws a geographic map of the US and Mexico onto a canvas element, using GeoJSON data.
 * Also renders a highlighted star on the Great Salt Lake with tooltip interaction.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element where the map will be drawn.
 * @param {string} id - ID tah of canvas element used for sizing and layout.
 */
function plot_map(canvas, id) {
    const pelicanMapDiv = document.getElementById(id);
    const context = canvas.getContext("2d");

    canvas.width = pelicanMapDiv.offsetWidth;
    canvas.height = pelicanMapDiv.offsetHeight - 100;

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "5px 10px")
        .style("border", "1px solid black")
        .style("border-radius", "5px")
        .style("font-size", "14px")
        .style("pointer-events", "none")
        .style("opacity", 0);
    
    Promise.all([
        d3.json('./map_geojsons/us_states.geojson'),
        d3.json('./map_geojsons/states.geojson')
    ]).then(([usGeojson, mexicoGeojson]) => {
        const combinedGeojson = {
            type: "FeatureCollection",
            features: usGeojson.features.concat(mexicoGeojson.features)
        };

        const projection = d3.geoAlbers().fitSize([canvas.width, canvas.height], combinedGeojson);
        const path = d3.geoPath().projection(projection);
    
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "white";
        context.strokeStyle = "black";
        context.lineWidth = 1;

        // Draw the map (iterate over geojson features and draw each path)
        combinedGeojson.features.forEach(feature => {
            const geoPath = path(feature);              
            context.beginPath();
            const pathData = new Path2D(geoPath);
            context.fill(pathData);
            context.stroke(pathData);
        });
    
        // Add Star on Great Salt Lake 
        const greatSaltLakeCoords = [-112.2146, 40.7]; 
        const [x, y] = projection(greatSaltLakeCoords);     
        context.font = "30px sans-serif";
        context.fillStyle = "gold";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("★", x, y);
    
        // Tooltip interactions
        canvas.addEventListener("mousemove", function (event) {
            const mousePos = d3.pointer(event); 
            const distance = Math.sqrt(Math.pow(mousePos[0] - x, 2) + Math.pow(mousePos[1] - y, 2));
            
            if (distance < 15) {  
                tooltip.style("opacity", 1)
                    .html("Great Salt Lake!")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            } else {
                tooltip.style("opacity", 0);
            }
        });        
    }).catch(error => {
        console.error("Error loading map background files: ", error);
    });
}

/**
 * Renders a dynamic animated bird observation map, along with 2 date slider, map tooltips,
 * and user controls for year and month. It handles loading and drawing of GeoJSON features
 * and observation points based on selected dates.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to draw the map and data onto.
 * @param {Object} jsonPathsByYear - An object mapping date keys (YYYY-MM) to GeoJSON file paths by state.
 * @param {string} id - ID of the map container div.
 * @param {string} slider_id - ID of the parent slider element.
 * @param {string} yearLabel_id - ID of the element displaying the year label.
 * @param {string} yearSlider_id - ID of the year slider input.
 * @param {string} monthLabel_id - ID of the element displaying the month label.
 * @param {string} monthSlider_id - ID of the month slider input.
 * @param {string} year_ticks_id - ID of the container for year slider ticks.
 * @param {string} month_ticks_id - ID of the container for month slider ticks.
 * @param {Object} animationState - Object to hold animation control flags and timeout reference.
 * @param {string} icon_id - D3 selector string for the tooltip info icon container.
 */
function plot_pixels(canvas, jsonPathsByYear, id, slider_id, yearLabel_id, yearSlider_id, monthLabel_id, monthSlider_id, year_ticks_id, month_ticks_id, animationState, icon_id) {
    const pelicanMapDiv = document.getElementById(id);
    pelicanMapDiv.style.justifyContent = '';
    d3.select("#great-salt-lake-star").style("visibility", "hidden");
    const parentSlider = document.getElementById(slider_id);

    const yearSlider = document.getElementById(yearSlider_id);
    const monthSlider = document.getElementById(monthSlider_id);

    const context = canvas.getContext("2d");
    canvas.width = pelicanMapDiv.offsetWidth;
    canvas.height = pelicanMapDiv.offsetHeight - parentSlider.offsetHeight - 25;

    let combinedGeojson = null;
    let projection = null;

    function drawMap() {
        context.fillStyle = "white";
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.globalAlpha = 1;
        
        projection = d3.geoAlbers().fitSize([canvas.width, canvas.height], combinedGeojson);
        const path = d3.geoPath().projection(projection);
        
        if (combinedGeojson) {
            combinedGeojson.features.forEach(feature => {
                const geoPath = path(feature);
                context.beginPath();
                const pathData = new Path2D(geoPath);
                context.fill(pathData);
                context.stroke(pathData);
            });
        }
    }

    Promise.all([d3.json('./map_geojsons/us_states.geojson'),d3.json('./map_geojsons/states.geojson')])
    .then(([usGeojson, mexicoGeojson]) => {combinedGeojson = {
        type: "FeatureCollection",
        features: usGeojson.features.concat(mexicoGeojson.features)};   
        // Initial drawing of the map
        d3.select("#great-salt-lake-star").style("visibility", "hidden");
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawMap();
    }).catch(error => {
        console.error("Error loading map background files: ", error);
    });

    const yearLabel = document.getElementById(yearLabel_id);
    const monthLabel = document.getElementById(monthLabel_id);
    const yearticksContainer = document.getElementById(year_ticks_id);
    const monthTicksContainer = document.getElementById(month_ticks_id);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const infoIcon = d3.select(icon_id);

    // Prevent multiple info icons from being appended
    if (infoIcon.select("circle").empty()) {
        infoIcon.append("circle")
            .attr("r", 10)  
            .attr("cx", 15) 
            .attr("cy", 15) 
            .attr("fill", "lightgray")
            .attr("stroke", "black");
    }

    if (infoIcon.select("text").empty()) {
        infoIcon.append("text")
            .attr("x", 11) 
            .attr("y", 19)
            .attr("font-size", "14px") 
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text("?");
    }

    if (d3.select("body").select(".info-tooltip").empty()) {
        d3.select("body").append("div")
            .attr("class", "info-tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid black")
            .style("padding", "5px")
            .style("border-radius", "3px")
            .style("box-shadow", "1px 1px 3px rgba(0,0,0,0.3)")
            .style("font-size", "10px") 
            .style("max-width", "250px") 
            .style("display", "none") 
            .html(`<strong>What does this map show?</strong><br>This map visualizes bird observations over the past 20 years, animating each month to reveal the migration and movement dynamics of the chosen species between their two primary hubs: Utah and Mexico. The animation is powered by observation data from eBird, a global citizen science platform that collects bird sightings from volunteers. <br><br> While the data shows an overall increase in observations over time, this trend is influenced by the growing number of birders contributing to eBird rather than a direct reflection of rising bird populations. As you continue through this story, we’ll explore what’s truly happening between seasons and how climate and habitat changes are shaping these migratory patterns. <br><br> Once the animation concludes, you can update the data to reflect your own curiosity—allowing you to explore different time periods or patterns that stand out to you.`);
    }

    const tooltip = d3.select(".info-tooltip");
    infoIcon.on("mouseover", function(event) {
        tooltip.style("left", `${event.pageX - 200}px`)
            .style("top", `${event.pageY - 350}px`)
            .style("display", "block");
    });
    infoIcon.on("mouseout", function() {
        tooltip.style("display", "none");
    });

    const startYear = 2004;
    const endYear = 2023;

    yearSlider.min = startYear;
    yearSlider.max = endYear;
    yearSlider.value = startYear;
    yearSlider.disabled = true;

    monthSlider.min = 0;
    monthSlider.max = 11;
    monthSlider.step = 1;
    monthSlider.value = 0;
    monthSlider.disabled = true;

    /**
     * Updates the slider based on the current date (year and month) being animated, 
     * or that the user selects. 
     */
    function updateDateLabel() {
        const selectedYear = yearSlider.value;
        const selectedMonth = monthSlider.value;
        yearLabel.textContent = `${selectedYear}`;  
        monthLabel.textContent = monthNames[selectedMonth];  
    }
    
    for (let i = startYear; i <= endYear; i++) {
        const tick = document.createElement("div");
        tick.style.position = "absolute";
        tick.style.left = `calc(${((i - startYear) / (endYear - startYear)) * 100}% - 0.5px)`;
        tick.style.height = "10px";
        tick.style.width = "2px";
        tick.style.backgroundColor = "black"; 

        const yearLabel = document.createElement("span");
        yearLabel.textContent = i;
        yearLabel.style.position = "absolute";
        yearLabel.style.top = "15px";
        yearLabel.style.right = "-12px";
        yearLabel.style.fontSize = "10px";
        yearLabel.style.color = "black";
        tick.appendChild(yearLabel);

        yearticksContainer.appendChild(tick);
    }

    for (let i = 0; i < 12; i++) {
        const tick = document.createElement("div");
        tick.style.position = "absolute";
        tick.style.left = `${(i / 12) * 100}%`;
        tick.style.height = "10px";
        tick.style.width = "2px";
        tick.style.backgroundColor = "black";

        const monthLabel = document.createElement("span");
        monthLabel.textContent = monthNames[i];
        monthLabel.style.position = "absolute";
        monthLabel.style.top = "15px";
        monthLabel.style.right = "-12px";
        monthLabel.style.fontSize = "10px";
        monthLabel.style.color = "black";
        tick.appendChild(monthLabel);

        monthTicksContainer.appendChild(tick);
    }

    updateDateLabel();
 
    /**
     * Loads and renders bird observation points for a specific year and month from provided GeoJSON paths.
     * Also updates the displayed year/month labels and redraws the base map.
     *
     * @param {number} year - The year for which to load and display observation data.
     * @param {number} month - The month (0–11) for which to load and display observation data.
     */
    function updateData(year, month) {
        yearLabel.textContent = `${year}`;
        monthLabel.textContent = monthNames[month];
        
        const formattedMonth = String(month + 1).padStart(2, '0');
        const yearMonthKey = `${year}-${formattedMonth}`;

        let current_observations = {}

        Promise.all([
                d3.json((jsonPathsByYear[yearMonthKey]).MX).then(data => {
                    current_observations[yearMonthKey] = current_observations[yearMonthKey] || {};
                    current_observations[yearMonthKey].MX = data.features;
                }),
                d3.json((jsonPathsByYear[yearMonthKey]).UT).then(data => {
                    current_observations[yearMonthKey] = current_observations[yearMonthKey] || {};
                    current_observations[yearMonthKey].UT = data.features;
                }),
                d3.json((jsonPathsByYear[yearMonthKey]).AZ).then(data => {
                    current_observations[yearMonthKey] = current_observations[yearMonthKey] || {};
                    current_observations[yearMonthKey].AZ = data.features;
                })
            ]).then(() => {
                // Get state observations for the current yearMonthKey
                const observations = current_observations[yearMonthKey] || {};
                const mxObservations = observations.MX || [];
                const utObservations = observations.UT || [];
                const azObservations = observations.AZ || [];
            
                // Clear the canvas again before re-drawing
                d3.select("#great-salt-lake-star").style("visibility", "hidden");
                context.clearRect(0, 0, canvas.width, canvas.height);
                drawMap();
                context.globalAlpha = 0.1;

                if (Array.isArray(mxObservations)) {
                    mxObservations.forEach(d => {
                        const [x, y] = projection(d.geometry.coordinates);
                        context.beginPath();
                        context.arc(x, y, 1.5, 0, 2 * Math.PI);
                        context.fillStyle = "blue"; 
                        context.fill();
                        context.globalAlpha = 0.1;
                    });
                }
            
                if (Array.isArray(utObservations)) {
                    utObservations.forEach(d => {
                        const [x, y] = projection(d.geometry.coordinates);
                        context.beginPath();
                        context.arc(x, y, 1.5, 0, 2 * Math.PI);
                        context.fillStyle = "blue"; 
                        context.fill();
                        context.globalAlpha = 0.1;
                    });
                }

                if (Array.isArray(azObservations)) {
                    azObservations.forEach(d => {
                        const [x, y] = projection(d.geometry.coordinates);
                        context.beginPath();
                        context.arc(x, y, 1.5, 0, 2 * Math.PI);
                        context.fillStyle = "blue"; 
                        context.fill();
                        context.globalAlpha = 0.1;
                    });
                }
                context.globalAlpha = 0.1;            
        }).catch(error => console.error("Error loading JSON data:", error));
    }

animateData(animationState);

// Calls animateData again if replay animation button is clicked
document.getElementById('map_button').addEventListener('click', function() {
    animateData(animationState);
});

/**
 * Starts an automated animation that iterates through years and months,
 * updating the map display at each time step unless, not allowing user interaction 
 * until animate ceases.
 *
 * @param {Object} animationState - An object that keeps track of whether the animation is running and holds a timeout ID.
 */
function animateData(animationState) {

    clearTimeout(animationState.timeoutId);

    let year = startYear;
    let month = 0;
    const duration = 50;
    let userInteracted = false;

    yearSlider.disabled = true;
    monthSlider.disabled = true;
    yearSlider.style.opacity = 0.5;
    monthSlider.style.opacity = 0.5;

    animationState.animationRunning = true;

    yearSlider.addEventListener("input", () => {
        userInteracted = true; 
        updateDateLabel();
        updateData(parseInt(yearSlider.value), parseInt(monthSlider.value));
    });
    
    monthSlider.addEventListener("input", () => {
        userInteracted = true; 
        updateDateLabel();
        updateData(parseInt(yearSlider.value), parseInt(monthSlider.value));
    });

    /**
     * Sets the step size for the animation. Here, the animation is set to iterate through
     * every other month of every year.
     */
    function step() {
        if (userInteracted || !animationState.animationRunning) return;

        updateData(year, month);
        yearSlider.value = year;
        monthSlider.value = month;

        month+=2;
        if (month === 12) {
            month = 0;
            year++;
        } 

        if (year <= endYear) {
            animationState.timeoutId = setTimeout(step, duration);
        } else {
            animationState.animationRunning = false;
            yearSlider.disabled = false;
            monthSlider.disabled = false;
            yearSlider.style.opacity = 1;
            monthSlider.style.opacity = 1;
        }
    }

    animationState.timeoutId = setTimeout(step, duration);
}

return {
    updateData, 
    animationState
}


}


