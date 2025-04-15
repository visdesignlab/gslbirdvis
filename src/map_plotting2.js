// USING SVG
// function plot_map(svg) {
//     const projection = d3.geoAlbers();
//     const path = d3.geoPath().projection(projection);
//     // const svg = d3.select("#pelican-map svg");

//     const tooltip = d3.select("body")
//         .append("div")
//         .style("position", "absolute")
//         .style("background", "white")
//         .style("padding", "5px 10px")
//         .style("border", "1px solid black")
//         .style("border-radius", "5px")
//         .style("font-size", "14px")
//         .style("pointer-events", "none")
//         .style("opacity", 0);
    
//     Promise.all([
//         d3.json('/birds/map_geojsons/us_states.geojson'),
//         d3.json('/birds/map_geojsons/states.geojson')
//     ]).then(([usGeojson, mexicoGeojson]) => {
//         const combinedGeojson = {
//             type: "FeatureCollection",
//             features: usGeojson.features.concat(mexicoGeojson.features)
//         };
    
//         // Draw the map
//         svg.selectAll("path")
//             .data(combinedGeojson.features)
//             .enter()
//             .append("path")
//             .attr("d", path)
//             .attr("fill", "white")
//             .attr("stroke", "black")
//             .attr("stroke-width", 1);
    
//         // ⭐️ Add Star on Great Salt Lake ⭐️
//         const greatSaltLakeCoords = [-112.2146, 40.7]; // Example coordinates for GSL
//         const [x, y] = projection(greatSaltLakeCoords); // Convert to SVG coordinates
    
//         const star = svg.append("text")
//             .attr("id", "great-salt-lake-star") // Added an ID here
//             .attr("x", x)
//             .attr("y", y)
//             .attr("text-anchor", "middle")
//             .attr("font-size", "30px")
//             .attr("fill", "gold")
//             .text("★") // Unicode star character
//             .attr("display", "inline") // Make it visible initially
//             .on("mouseover", function (event) {
//                 tooltip.style("opacity", 1)
//                     .html("Great Salt Lake!")
//                     .style("left", (event.pageX + 10) + "px")
//                     .style("top", (event.pageY - 20) + "px");
//             })
//             .on("mousemove", function (event) {
//                 tooltip.style("left", (event.pageX + 10) + "px")
//                     .style("top", (event.pageY - 20) + "px");
//             })
//             .on("mouseout", function () {
//                 tooltip.style("opacity", 0);
//             });
//     }).catch(error => {
//         console.error("Error loading map background files: ", error);
//     });

//     // plot_climate(svg, path)

// }

// function plot_climate(svg, path) {
//     var graticule = d3.geoGraticule();
//     svg.append("path")
//         .datum(graticule)
//         .attr("class", "graticule")
//         .attr("d", path);

//     // Load SST data (replace with the correct path to your JSON file)
//     d3.json("birds/src/sst_2004_2023.json").then(function(data) {
//         var map = {
//             plot_points: [],
//             max: 30,  // Define max and min for SST
//             min: -1
//         };

//         // Filter data for January 2004 (assuming the data includes a `date` field or `month` field)
//         data.forEach(function(point) {
//             var date = new Date(point.date);  // Assuming `point.date` is in ISO format
//             // Filter for January 2004
//             if (date.getFullYear() === 2004 && date.getMonth() === 0 && point.sst !== 999) {
//                 map.plot_points.push({
//                     lat: point.latitude,
//                     long: point.longitude,
//                     value: point.sst
//                 });
//             }
//         });

//         console.log(map);

//         // Define color scale for SST (you can adjust the colors as needed)
//         var rainbow = ["#CE0C82", "#800CCE", "#1F0CCE", "#0C5BCE", "#0C99CE", "#2ECE0C", "#BAE806", "#FEFF00", "#FFCD00", "#FF9A00", "#FF6000", "#FF0000"];
//         var colorScale = d3.scaleLinear()
//             .domain([map.min, map.max])
//             .range([0, rainbow.length - 1]);

//         // Plot points (rectangles) on the map
//         var points = svg.selectAll("rect.points")
//             .data(map.plot_points)
//             .enter()
//             .append("rect")
//             .attr("class", "points")
//             .style("fill", function(d) {
//                 var scale = colorScale(d.value);
//                 return rainbow[Math.round(scale)];
//             })
//             .attr("width", 8)  // Width of each point
//             .attr("height", 8) // Height of each point
//             .style("fill-opacity", 0.7)
//             .attr("transform", function(d) {
//                 // Map latitude and longitude to the GeoAlbers projection
//                 return "translate(" + projection([d.long, d.lat]) + ")";
//             });

//         // Optional: Add a legend for SST values
//         var legend = svg.append("g")
//             .attr("class", "legend")
//             .attr("transform", "translate(20, 20)");

//         var legendScale = d3.scaleLinear()
//             .domain([map.min, map.max])
//             .range([0, 200]);

//         var legendAxis = d3.axisBottom(legendScale)
//             .ticks(5)
//             .tickFormat(d3.format(".1f"));

//         legend.append("rect")
//             .attr("width", 200)
//             .attr("height", 10)
//             .style("fill", "url(#gradient)");

//         var gradient = svg.append("defs").append("linearGradient")
//             .attr("id", "gradient")
//             .attr("x1", "0%")
//             .attr("x2", "100%")
//             .attr("y1", "0%")
//             .attr("y2", "0%");

//         gradient.selectAll("stop")
//             .data(rainbow)
//             .enter().append("stop")
//             .attr("offset", function(d, i) { return (i / (rainbow.length - 1)) * 100 + "%"; })
//             .attr("stop-color", function(d) { return d; });

//         legend.append("g")
//             .attr("class", "axis")
//             .attr("transform", "translate(0, 15)")
//             .call(legendAxis);
//     });
// }

// function plot_pixels(svg, jsonPaths) {
//     d3.select("#great-salt-lake-star").style("visibility", "hidden");
//     const projection = d3.geoAlbers();
    
//     const yearSlider = document.getElementById("year-slider");
//     const yearLabel = document.getElementById("year-label"); // Label to show current year
//     const monthSlider = document.getElementById("month-slider");
//     const monthLabel = document.getElementById("month-label"); // Label for month
//     const ticksContainer = document.getElementById("slider-ticks");

//     const monthNames = [
//         "January", "February", "March", "April", "May", "June", 
//         "July", "August", "September", "October", "November", "December"
//     ];

//     const startYear = 2004;
//     const endYear = 2023;

//     // Set the range for the year slider (only years)
//     yearSlider.min = startYear;
//     yearSlider.max = endYear;
//     yearSlider.step = 1;
//     yearSlider.value = startYear; // Start at 2004
//     yearSlider.disabled = true;

//     // Set the range for the month slider (0 to 11 for months)
//     monthSlider.min = 0;
//     monthSlider.max = 11;
//     monthSlider.step = 1;
//     monthSlider.value = 0; // Start at January
//     monthSlider.disabled = true;

//     let allObservations = [];

//     svg.selectAll("circle").remove();

//     function updateDateLabel() {
//         const selectedYear = yearSlider.value;
//         const selectedMonth = monthSlider.value;
//         yearLabel.textContent = `${selectedYear}`;  // Only show year
//         monthLabel.textContent = monthNames[selectedMonth]; // Show month label
//     }

//     // Add year ticks to the year slider
//     for (let i = startYear; i <= endYear; i++) {
//         const tick = document.createElement("div");
//         tick.style.position = "absolute";
//         tick.style.left = `${((i - startYear) / (endYear - startYear)) * 100}%`;
//         tick.style.height = "10px";
//         tick.style.width = "1px";
//         tick.style.backgroundColor = "black";

//         const yearLabel = document.createElement("span");
//         yearLabel.textContent = i;
//         yearLabel.style.position = "absolute";
//         yearLabel.style.top = "15px";
//         yearLabel.style.right = "-12px";
//         yearLabel.style.fontSize = "10px";
//         yearLabel.style.color = "black";
//         tick.appendChild(yearLabel);

//         ticksContainer.appendChild(tick);
//     }

//     // Add month ticks to the month slider
//     const monthTicksContainer = document.getElementById("month-ticks"); // Assuming you have a container with this ID
//     for (let i = 0; i < 12; i++) {
//         const tick = document.createElement("div");
//         tick.style.position = "absolute";
//         tick.style.left = `${(i / 12) * 100}%`;
//         tick.style.height = "10px";
//         tick.style.width = "1px";
//         tick.style.backgroundColor = "black";

//         const monthLabel = document.createElement("span");
//         monthLabel.textContent = monthNames[i];
//         monthLabel.style.position = "absolute";
//         monthLabel.style.top = "15px";
//         monthLabel.style.right = "-12px";
//         monthLabel.style.fontSize = "10px";
//         monthLabel.style.color = "black";
//         tick.appendChild(monthLabel);

//         monthTicksContainer.appendChild(tick);
//     }

//     // Initialize label
//     updateDateLabel();

//     function updateData() {
//         const selectedYear = parseInt(yearSlider.value);  // Use year slider value directly
//         const selectedMonth = parseInt(monthSlider.value);  // Use month slider value directly

//         yearLabel.textContent = `${selectedYear}`;  // Only show year
//         monthLabel.textContent = monthNames[selectedMonth];  // Show month label

//         const filteredData = allObservations.filter(d => {
//             const obsDate = new Date(d.properties.observation_date);
//             return obsDate.getFullYear() === selectedYear && obsDate.getMonth() === selectedMonth;
//         });

//         svg.selectAll("circle").remove();

//         svg.selectAll("circle")
//             .data(filteredData)
//             .enter()
//             .append("circle")
//             .attr("cx", d => projection(d.geometry.coordinates)[0])
//             .attr("cy", d => projection(d.geometry.coordinates)[1])
//             .attr("r", 1.5)
//             .attr("fill", d => d.properties.color || "red")
//             .attr("opacity", 0.1)
//             .on("click", (event, d) => {
//                 alert(`Date: ${d.properties.observation_date}\nSpecies Reported: ${d.properties.species_reported}`);
//             });
//     }

//     Promise.all(jsonPaths.map(path => d3.json(path))).then(datasets => {
//         allObservations = datasets.flatMap(data => data.features);
//         updateData(); // Initial load for first month of 2004
//         animateData();
//     }).catch(error => {
//         console.error("Error loading observation JSON files: ", error);
//     });

//     function animateData() {
//         let year = startYear; // Start at the first year (2004)
//         let month = 0; // Start at January
//         const totalMonths = (endYear - startYear + 1) * 12; // Total months to go through
//         const animationDuration = 100000; // Duration for full animation in milliseconds
    
//         let isUserInteracting = false; // Flag to check if the user is interacting with the slider
//         let animationStartTime = null; // Keep track of when the animation started
    
//         // Disable the sliders immediately to prevent user interaction
//         yearSlider.disabled = true;
//         monthSlider.disabled = true;
    
//         // Optional: You can also visually style them as disabled if you'd like
//         yearSlider.style.opacity = 0.5;
//         monthSlider.style.opacity = 0.5;
    
//         // Event listener to track if the user interacts with the slider
//         yearSlider.addEventListener('input', () => {
//             isUserInteracting = true; // User is interacting with the slider
//         });
    
//         // Recursive function to perform the animation smoothly using requestAnimationFrame
//         function animate(time) {
//             if (!animationStartTime) animationStartTime = time;
    
//             const elapsedTime = time - animationStartTime;
//             const progress = Math.min(elapsedTime / animationDuration, 1);
    
//             // Calculate the total months that have passed
//             const totalMonthsPassed = Math.floor(progress * totalMonths);  // Go through all months
    
//             // Calculate current year and month based on total months passed
//             year = startYear + Math.floor(totalMonthsPassed / 12);
//             month = totalMonthsPassed % 12;
    
//             // Update the sliders
//             monthSlider.value = month;
//             yearSlider.value = year;
    
//             // Update data and the year/month label
//             updateData();
//             updateDateLabel();
    
//             // Continue animating until complete or user interacts
//             if (progress < 1 && !isUserInteracting) {
//                 requestAnimationFrame(animate); // Continue animating
//             } else {
//                 // Ensure the final values remain at December 2023
//                 yearSlider.value = endYear;
//                 monthSlider.value = 11;
            
//                 // Update labels and data one last time to reflect final state
//                 updateData();
//                 updateDateLabel();
            
//                 // Enable sliders after animation finishes
//                 yearSlider.disabled = false;
//                 monthSlider.disabled = false;
            
//                 // Restore opacity to make them appear enabled again
//                 yearSlider.style.opacity = 1;
//                 monthSlider.style.opacity = 1;
//             }
            
//         }
    
//         // Start the animation using requestAnimationFrame
//         requestAnimationFrame(animate);
    
//         // Event listener for the slider input (user interaction)
//         yearSlider.addEventListener('input', function () {
//             updateData();  // Update the map based on year and month
//             updateDateLabel(); // Update the year/month label
//             isUserInteracting = true;  // Pause the animation if user is interacting
//         });
    
//         monthSlider.addEventListener('input', function () {
//             updateData();  // Update the map based on year and month
//             updateDateLabel(); // Update the year/month label
//             isUserInteracting = true;  // Pause the animation if user is interacting
//         });
//     }
// }


