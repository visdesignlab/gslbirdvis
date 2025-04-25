import * as d3 from 'd3'
import './map_plotting.js';
import './climate_data.js';
import './gsl_plot.js';
import './gsl_birds_plot.js';

/**
 * This function setups the structure of the website. The setup code allows certain html elements to be visible, triggers transitions, 
 * and calls functions that animate visualizations or allow the user to interact.  
 */
function setup() {
     
    const body = d3.select('body')
    body.style("background-color", "white"); 
    const opening = document.querySelector(".opening");
    const openingStoryline = document.querySelector(".opening_storyline");
    
    // Event listener that triggers transition from first page to second page
    let scrollProgress = 0; 
    function updateTransition() {
        const shiftAmount = window.innerHeight * 0.65; // Dynamically based on viewport
        if (scrollProgress >= 50) {
            opening.style.opacity = 0;
            openingStoryline.style.transform = `translateY(-${shiftAmount}px)`;
            openingStoryline.style.opacity = 1;
        } else {
            opening.style.opacity = 1;
            openingStoryline.style.transform = "translateY(0)";
            openingStoryline.style.opacity = 0;
        }
    }
    
    window.addEventListener("wheel", (event) => {
        if (event.deltaY > 0) {
            scrollProgress = Math.min(scrollProgress + 10, 100); // Scroll down
        } else {
            scrollProgress = Math.max(scrollProgress - 10, 0); // Scroll up
        }
    
        updateTransition(); // Apply the transformation here
    });
    // window.addEventListener("wheel", (event) => {
    //     if (event.deltaY > 0) {
    //         scrollProgress = Math.min(scrollProgress + 10, 100); // Scroll down 
    //     } else {
    //         scrollProgress = Math.max(scrollProgress - 10, 0); // Scroll up 
    //     }
    
    //     // Trigger transition
    //     if (scrollProgress >= 50) {
    //         opening.style.opacity = 0;
    //         openingStoryline.style.transform = `translateY(-65vh)`;
    //         openingStoryline.style.opacity = 1;
    //     } else {
    //         opening.style.opacity = 1;
    //         openingStoryline.style.transform = "translateY(0)";
    //         openingStoryline.style.opacity = 0;
    //     }
    // });

    const homeButton = document.getElementById('home-button')
    homeButton.addEventListener('click', function () {
        window.location.reload();
    });

    document.getElementById('about-button').addEventListener('click', function() {
        document.getElementById('popup').style.display = 'block';
        document.getElementById('popup-overlay').style.display = 'block';
    });

    document.getElementById('close-button').addEventListener('click', function() {
        document.getElementById('popup').style.display = 'none';
        document.getElementById('popup-overlay').style.display = 'none';
    });

    document.getElementById('grebe-button').addEventListener('click', function() {
        changeContent('grebe'); 
        homeButton.style.display = 'block';
        homeButton.style.opacity = 1;
    });
    
    document.getElementById('pelican-button').addEventListener('click', function() {
        changeContent('pelican'); 
        homeButton.style.display = 'block';
        homeButton.style.opacity = 1;
    });

    const grebeOpening = document.querySelector('.EG_opening');
    const grebeContent = document.querySelector('.grebe-content');
    const pelicanContent = document.querySelector('.pelican-content');
    const pelicanOpening = document.querySelector('.pelican-opening');

    /**
     * This functinon changes html content based on the button clicked
     * @param {*} birdType : user selected species
     */
    function changeContent(birdType) {
        if (birdType === 'grebe') {
            opening.style.display = 'none'; 
            openingStoryline.style.display = 'none'; 
            pelicanOpening.style.display = 'none';
            grebeContent.style.visibility = 'visible'; 
            grebeContent.style.opacity = 1; 
        } 
        else if (birdType === 'pelican') {
            opening.style.display = 'none'; 
            openingStoryline.style.display = 'none'; 
            grebeOpening.style.display = 'none';
            pelicanContent.style.opacity = 1;
            pelicanContent.style.visibility = 'visible'; 
      }
    }

    // Loads all the json files for pelican data
    const pelicanJsons = {};
    for (let year = 2004; year <= 2023; year++) {
        for (let month = 0; month < 12; month++) {
            const formattedMonth = String(month + 1).padStart(2, '0');  
            const yearMonthKey = `${year}-${formattedMonth}`;  

            pelicanJsons[yearMonthKey] = {
                MX: `./amp_geojsons/monthly_MX_jsons/AMP_MX_${year}-${formattedMonth}.json`,
                UT: `./amp_geojsons/monthly_UT_jsons/AMP_UT_${year}-${formattedMonth}.json`,
                AZ: `./amp_geojsons/monthly_AZ_jsons/AMP_AZ_${year}-${formattedMonth}.json`
            };
        }
    }

    // Loads all the json files for grebe data
    const egJsons = {};
    for (let year = 2004; year <= 2023; year++) {
        for (let month = 0; month < 12; month++) {
            const formattedMonth = String(month + 1).padStart(2, '0');  
            const yearMonthKey = `${year}-${formattedMonth}`;  

            egJsons[yearMonthKey] = {
                MX: `./eg_geojsons/monthly_MX_jsons/EG_MX_${year}-${formattedMonth}.json`,
                UT: `./eg_geojsons/monthly_UT_jsons/EG_UT_${year}-${formattedMonth}.json`,
                AZ: `./eg_geojsons/monthly_AZ_jsons/EG_AZ_${year}-${formattedMonth}.json`
            };
        }
    }

    const egMap = document.getElementById("eg-map-canvas");
    const pelicanMap = document.getElementById("pelican-map-canvas");

    /**
     * Resizes content within the given canvas element by draw the content using the ResizeObservor. 
     * Helpful for scaling the observation map, which has non-traditional dimensions, to different
     * screen sizes. 
     * @param {*} canvas : canvas element to apply resizing 
     * @param {*} id : canvas id tag
     */
    function plotMapWithResizeObserver(canvas, id) {
        function drawContent() {
            plot_map(canvas, id);
        }
        drawContent();
        const resizeObserver = new ResizeObserver(() => {
            drawContent();
        });
        resizeObserver.observe(canvas);
    }
    
    plotMapWithResizeObserver(pelicanMap, "pelican-map");
    plotMapWithResizeObserver(egMap, "grebe-map");

    /**
     * Resizes content within the given canvas element by drawing the content using the ResizeObservor. 
     * Helpful for scaling the observation map when data begins to be plotted and other html elements
     * come into focus, affecting the sizing of the map. Calls plot_pixels(), which performs the data 
     * animation and prompts the updating of data upon user request. Parameters allow function to be 
     * reusable for both species views. 
     * @param {*} canvas : canvas element to apply resizing
     * @param {*} jsons : data to plot
     * @param {*} id : canavs id tag
     * @param {*} slider_id : id tag for the sliders' parent div
     * @param {*} yearLabel_id : id tag for year labels
     * @param {*} yearSlider_id : id tag for the slider displaying year
     * @param {*} monthLabel_id : id tag for month labels
     * @param {*} monthSlider_id : id tag for the slider displaying months
     * @param {*} year_ticks_id : id tag for year ticks
     * @param {*} month_ticks_id : id tag for month ticks
     * @param {*} animationState : current state of animation (running, or not)
     * @param {*} icon_id : id tag for the tooltip icon
     * @returns 
     */
    function plotPixelsWithResizeObserver(canvas, jsons, id, slider_id, yearLabel_id, yearSlider_id, monthLabel_id, monthSlider_id,year_ticks_id, month_ticks_id, animationState, icon_id) {
        let updateController;    
        function drawContent() {
            updateController = plot_pixels(canvas, jsons, id, slider_id, yearLabel_id, yearSlider_id, monthLabel_id, monthSlider_id, year_ticks_id, month_ticks_id, animationState, icon_id);
        }
        drawContent();
        const resizeObserver = new ResizeObserver(() => {
            drawContent();
        });
        resizeObserver.observe(canvas);
        return updateController
    }

    // Calls map animation for pelican and displays initial content
    document.getElementById('map_button').addEventListener('click', function() {
        const pelicanSlider = document.getElementById('pelican-slider');
        const mapButton = document.getElementById('map_button');
        const climateButton = document.getElementById('climate_button');
        const pelicanContent2 = document.getElementById('pelican-content2');

        mapButton.textContent = 'REPLAY ANIMATION'
        climateButton.style.display = 'block';

        pelicanSlider.style.display = 'block';
        pelicanContent2.style.display = 'block';
        pelicanContent2.style.transition = 'opacity 3s ease, transform 1s ease';
        pelicanContent2.style.opacity = 1;

        let animationState = {
            animationRunning: false,
            timeoutId: null
        };
        window.pelicanUpdateController = plotPixelsWithResizeObserver(pelicanMap, pelicanJsons, "pelican-map", "pelican-slider", "year-label", "year-slider", "month-label", "month-slider", "slider-ticks", "month-ticks", animationState, "#info-icon-pelican");
    });

    // Calls map animation for grebes and displays initial content
    document.getElementById('visualize-migration').addEventListener('click', function() {
        const egSlider = document.getElementById('eg-slider');
        const mapButton = document.getElementById('visualize-migration');
        const climateButton = document.getElementById('climate_button_eg');
        const egcontent4 = document.getElementById('grebe-content4');

        mapButton.textContent = 'REPLAY ANIMATION'
        climateButton.style.display = 'block';

        egSlider.style.display = 'block';
        egcontent4.style.display = 'block';
        egcontent4.style.transition = 'opacity 3s ease, transform 1s ease';
        egcontent4.style.opacity = 1;

        let animationState_eg = {
            animationRunning: false,
            timeoutId: null
        };
        window.pelicanUpdateController = plotPixelsWithResizeObserver(egMap, egJsons, "grebe-map", "eg-slider", "eg-year-label", "eg-year-slider", "eg-month-label", "eg-month-slider", "eg-slider-ticks", "eg-month-ticks", animationState_eg, "#info-icon-eg");
    });
    

    // Plots climate map for pelican view
    document.getElementById('climate_button').addEventListener('click', function() {

        const pelican_climate = document.getElementById('pelican_climate_svg');
        const pelicanContent3 = document.getElementById('pelican-content3');
        const pelicanContent4 = document.getElementById('pelican-content4');
        const gslButton = document.getElementById('gsl_button');

        pelican_climate.style.display = 'block';
        pelicanContent3.style.display = 'block';
        pelicanContent3.style.transition = 'opacity 3s ease, transform 1s ease';
        pelicanContent3.style.opacity = 1;
        pelicanContent4.style.display = 'block';
        pelicanContent4.style.transition = 'opacity 3s ease, transform 1s ease';
        pelicanContent4.style.opacity = 1;
        gslButton.style.display = 'block';

        climate_map(pelican_climate, "year-slider", "month-slider");
    });

    // Plots climate map for grebe view
    document.getElementById('climate_button_eg').addEventListener('click', function() {

        const eg_climate = document.getElementById('eg_climate_svg');
        const egClimateContent = document.getElementById('eg-content');
        const egClimateContent2 = document.getElementById('eg-content2');
        const gslButton = document.getElementById('eg_gsl_button');

        eg_climate.style.display = 'block';
        egClimateContent.style.display = 'block';
        egClimateContent.style.transition = 'opacity 3s ease, transform 1s ease';
        egClimateContent.style.opacity = 1;
        egClimateContent2.style.display = 'block';
        egClimateContent2.style.transition = 'opacity 3s ease, transform 1s ease';
        egClimateContent2.style.opacity = 1;
        gslButton.style.display = 'block';

        climate_map(eg_climate, "eg-year-slider", "eg-month-slider");
    });

    // Plots GSL vis, fixed year comparisons, and interactive year comparisons for Pelicans
    document.getElementById('gsl_button').addEventListener('click', function() {

        const gslOpener = document.getElementById('gsl-opener');
        gslOpener.style.display = 'block';
        gslOpener.style.transition = 'opacity 3s ease, transform 1s ease';
        gslOpener.style.opacity = 1;

        const gsl_elevation_svg = document.getElementById('gsl_elevation_svg');
        gsl_elevation_svg.style.display = 'block';
        plot_gsl_elevation(gsl_elevation_svg, "year-slider", "month-slider");

        const gsl_content = document.getElementById('gsl-content1');
        gsl_content.style.display = 'block';
        gsl_content.style.transition = 'opacity 3s ease, transform 1s ease';
        gsl_content.style.opacity = 1;

        const gsl_birds_plot = document.getElementById('gsl_birds_plot_svg')
        gsl_birds_plot.style.display = 'block';
        plot_gsl_birds(gsl_birds_plot, "./amp_geojsons/filtered_AMP_UT_Year_Avgs.json");

        const gsl_content2 = document.getElementById('gsl-content2');
        gsl_content2.style.display = 'block';
        gsl_content2.style.transition = 'opacity 3s ease, transform 1s ease';
        gsl_content2.style.opacity = 1;

        const comparison_plot1 = document.getElementById('comparison_plot_1_svg')
        comparison_plot1.style.display = 'block';
        plot_gsl_comparisons_fixed_years("./amp_geojsons/filtered_AMP_UT_Year_Avgs.json", "#comparison_plot_1_svg", '2009', '2011');

        const comparison_plot1_text = document.getElementById('comparison_plot1');
        comparison_plot1_text.style.display = 'block';
        comparison_plot1_text.style.transition = 'opacity 3s ease, transform 1s ease';
        comparison_plot1_text.style.opacity = 1;

        const comparison_plot2 = document.getElementById('comparison_plot_2_svg')
        comparison_plot2.style.display = 'block';
        plot_gsl_comparisons_fixed_years("./amp_geojsons/filtered_AMP_UT_Year_Avgs.json", "#comparison_plot_2_svg", '2010', '2011');

        const comparison_plot2_text = document.getElementById('comparison_plot2');
        comparison_plot2_text.style.display = 'block';
        comparison_plot2_text.style.transition = 'opacity 3s ease, transform 1s ease';
        comparison_plot2_text.style.opacity = 1;

        const comparison_plot3 = document.getElementById('comparison_plot_3_svg')
        comparison_plot3.style.display = 'block';
        plot_gsl_comparisons_fixed_years("./amp_geojsons/filtered_AMP_UT_Year_Avgs.json", "#comparison_plot_3_svg", '2015', '2023');

        const comparison_plot3_text = document.getElementById('comparison_plot3');
        comparison_plot3_text.style.display = 'block';
        comparison_plot3_text.style.transition = 'opacity 3s ease, transform 1s ease';
        comparison_plot3_text.style.opacity = 1;

        const gsl_comparison_plots = document.getElementById('gsl_comparison_plots_svg')
        gsl_comparison_plots.style.display = 'block';
        plot_gsl_comparisons("./amp_geojsons/filtered_AMP_UT_Year_Avgs.json", "year1-dropdown", "year2-dropdown", "#gsl_comparison_plots_svg");

        const dropdown_div = document.getElementById("dropdown-container")
        dropdown_div.style.display = 'block';  

        const story_end = document.getElementById('story_end');
        story_end.style.display = 'block';
        story_end.style.transition = 'opacity 3s ease, transform 1s ease';
        story_end.style.opacity = 1;

        const switchButton = document.getElementById('switch-story-button')
        switchButton.style.display = 'block'
        switchButton.style.opacity = 1;

        switchButton.addEventListener('click', function () {
            window.location.reload();
        });

    });

    // Plots GSL vis, fixed year comparisons, and interactive year comparisons for grebes
    document.getElementById('eg_gsl_button').addEventListener('click', function() {

        const gsl_elevation_svg = document.getElementById('eg_gsl_elevation_svg');
        gsl_elevation_svg.style.display = 'block';
        plot_gsl_elevation(gsl_elevation_svg, "eg-year-slider", "eg-month-slider");

        const gsl_content = document.getElementById('eg-gsl-content1');
        gsl_content.style.display = 'block';
        gsl_content.style.transition = 'opacity 3s ease, transform 1s ease';
        gsl_content.style.opacity = 1;

        const gsl_birds_plot = document.getElementById('eg_gsl_birds_plot_svg')
        gsl_birds_plot.style.display = 'block';
        plot_gsl_birds(gsl_birds_plot, "./eg_geojsons/filtered_EG_UT_Year_Avgs.json");

        const gsl_content2 = document.getElementById('eg-gsl-content2');
        gsl_content2.style.display = 'block';
        gsl_content2.style.transition = 'opacity 3s ease, transform 1s ease';
        gsl_content2.style.opacity = 1;

        const comparison_plot1 = document.getElementById('eg_comparison_plot_1_svg')
        comparison_plot1.style.display = 'block';
        plot_gsl_comparisons_fixed_years("./eg_geojsons/filtered_EG_UT_Year_Avgs.json", "#eg_comparison_plot_1_svg", '2009', '2011');

        const comparison_plot1_text = document.getElementById('eg_comparison_plot2');
        comparison_plot1_text.style.display = 'block';
        comparison_plot1_text.style.transition = 'opacity 3s ease, transform 1s ease';
        comparison_plot1_text.style.opacity = 1;

        const comparison_plot2 = document.getElementById('eg_comparison_plot_2_svg')
        comparison_plot2.style.display = 'block';
        plot_gsl_comparisons_fixed_years("./eg_geojsons/filtered_EG_UT_Year_Avgs.json", "#eg_comparison_plot_2_svg", '2011', '2015');

        const comparison_plot2_text = document.getElementById('eg_comparison_plot1');
        comparison_plot2_text.style.display = 'block';
        comparison_plot2_text.style.transition = 'opacity 3s ease, transform 1s ease';
        comparison_plot2_text.style.opacity = 1;

        const gsl_comparison_plots = document.getElementById('eg_gsl_comparison_plots_svg')
        gsl_comparison_plots.style.display = 'block';
        plot_gsl_comparisons("./eg_geojsons/filtered_EG_UT_Year_Avgs.json", "eg-year1-dropdown", "eg-year2-dropdown", "#eg_gsl_comparison_plots_svg");

        const dropdown_div = document.getElementById("eg-dropdown-container")
        dropdown_div.style.display = 'block';  

        const story_end = document.getElementById('eg_story_end');
        story_end.style.display = 'block';
        story_end.style.transition = 'opacity 3s ease, transform 1s ease';
        story_end.style.opacity = 1;

        const switchButton = document.getElementById('eg-switch-story-button')
        switchButton.style.display = 'block'
        switchButton.style.opacity = 1;

        switchButton.addEventListener('click', function () {
            window.location.reload();
        });
    });

}

setup();