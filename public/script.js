function createChoropleth() {
  try {
      // Verify TopoJSON and D3 are available
      if (typeof topojson === 'undefined' || typeof d3 === 'undefined') {
          throw new Error('TopoJSON or D3 is not loaded');
      }

      // Fetch data
      Promise.all([
          fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json')
              .then(response => response.json()),
          fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json')
              .then(response => response.json())
      ]).then(([countyData, educationData]) => {
          // Debugging: Log raw data
          console.log('County Data:', countyData);
          console.log('Education Data:', educationData);

          // Chart dimensions with responsive design
          const width = 960;
          const height = 600;
          const margin = { top: 20, right: 20, bottom: 30, left: 40 };

          // Clear any existing SVG content
          d3.select("#choropleth").selectAll("*").remove();

          // Create SVG with viewBox for responsiveness
          const svg = d3.select("#choropleth")
              .attr("width", width)
              .attr("height", height)
              .attr("viewBox", `0 0 ${width} ${height}`)
              .style("background", "#f0f0f0"); // Add background to verify rendering

          // Projection and path generator
          const projection = d3.geoAlbersUsa()
              .scale(1000)
              .translate([width / 2, height / 2]);

          const pathGenerator = d3.geoPath()
              .projection(projection);

          // Color scale
          const colorScale = d3.scaleQuantile()
              .domain(educationData.map(d => d.bachelorsOrHigher))
              .range(d3.schemeBlues[9]);

          // Convert TopoJSON to GeoJSON
          const counties = topojson.feature(countyData, countyData.objects.counties);

          // Debugging: Log counties
          console.log('Counties:', counties);

          // Render counties
          svg.selectAll(".county")
              .data(counties.features)
              .enter()
              .append("path")
              .attr("class", "county")
              .attr("d", pathGenerator)
              .attr("data-fips", d => d.id)
              .attr("data-education", d => {
                  const countyData = educationData.find(edu => edu.fips === d.id);
                  return countyData ? countyData.bachelorsOrHigher : 0;
              })
              .style("fill", d => {
                  const countyData = educationData.find(edu => edu.fips === d.id);
                  return countyData ? colorScale(countyData.bachelorsOrHigher) : '#ccc';
              })
              .style("stroke", "white")
              .style("stroke-width", "0.5px")
              .on("mouseover", (event, d) => {
                  const countyData = educationData.find(edu => edu.fips === d.id);
                  if (countyData) {
                      d3.select("#tooltip")
                          .html(`
                              ${countyData.area_name}, ${countyData.state}<br>
                              ${countyData.bachelorsOrHigher}%
                          `)
                          .attr("data-education", countyData.bachelorsOrHigher)
                          .style("left", `${event.pageX + 10}px`)
                          .style("top", `${event.pageY - 28}px`)
                          .classed("visible", true);
                  }
              })
              .on("mouseout", () => {
                  d3.select("#tooltip").classed("visible", false);
              });

          // Optional: Add state boundaries
          svg.append("path")
              .datum(topojson.mesh(countyData, countyData.objects.states))
              .attr("fill", "none")
              .attr("stroke", "white")
              .attr("stroke-linejoin", "round")
              .attr("d", pathGenerator);

          // Legend Creation
          const legendWidth = 300;
          const legendHeight = 50;

          const legend = d3.select("#legend")
              .append("svg")
              .attr("width", legendWidth)
              .attr("height", legendHeight);

          const legendScale = d3.scaleLinear()
              .domain(colorScale.domain())
              .range([0, legendWidth]);

          const legendAxis = d3.axisBottom(legendScale)
              .tickFormat(d => `${d}%`)
              .ticks(4);

          // Add color gradient to legend
          const gradient = legend.append("defs")
              .append("linearGradient")
              .attr("id", "legend-gradient")
              .attr("x1", "0%")
              .attr("y1", "0%")
              .attr("x2", "100%")
              .attr("y2", "0%");

          colorScale.range().forEach((color, i) => {
              gradient.append("stop")
                  .attr("offset", `${i / (colorScale.range().length - 1) * 100}%`)
                  .attr("stop-color", color);
          });

          legend.append("rect")
              .attr("width", legendWidth)
              .attr("height", 20)
              .style("fill", "url(#legend-gradient)");

          legend.append("g")
              .attr("transform", `translate(0, 20)`)
              .call(legendAxis);

      }).catch(error => {
          console.error('Data Fetch Error:', error);
      });

  } catch (error) {
      console.error('Choropleth Creation Error:', error);
  }
}

// Call the function when the page loads
window.onload = createChoropleth;