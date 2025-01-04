function createChoropleth() {
  Promise.all([
      fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json')
          .then(response => response.json()),
      fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json')
          .then(response => response.json())
  ]).then(([countyData, educationData]) => {
      // Chart dimensions
      const width = 960;
      const height = 600;

      // Clear any existing SVG content
      d3.select("#choropleth").selectAll("*").remove();

      // Create SVG
      const svg = d3.select("#choropleth")
          .attr("width", width)
          .attr("height", height)
          .style("background", "#e6f3ff");

      // Create a more precise projection
      const projection = d3.geoAlbersUsa()
          .scale(1000)  // Adjust scale for better visibility
          .translate([width / 2, height / 2]);

      // Path generator
      const pathGenerator = d3.geoPath()
          .projection(projection);

      // Convert TopoJSON to GeoJSON
      const counties = topojson.feature(countyData, countyData.objects.counties);

      // Debug: Log the GeoJSON structure
      console.log('GeoJSON Structure:', counties);

      // Check if the GeoJSON features have the necessary properties
      if (counties.features && counties.features.length > 0) {
          console.log('Sample GeoJSON Feature:', counties.features[0]);
      } else {
          console.error('No GeoJSON features found');
      }

      // Create a map to quickly lookup education data
      const educationMap = new Map(
          educationData.map(d => [d.fips, d.bachelorsOrHigher])
      );

      // Debug: Verify data mapping
      console.log('Education Data Map:', educationMap);

      // Render counties
      const countyPaths = svg.selectAll(".county")
          .data(counties.features)
          .enter()
          .append("path")
          .attr("class", "county")
          .attr("d", pathGenerator)
          .attr("data-fips", d => d.id)
          .attr("data-education", d => {
              const educationValue = educationMap.get(d.id);
              return educationValue !== undefined ? educationValue : 0;
          })
          .style("fill", d => {
              const educationValue = educationMap.get(d.id);
              return educationValue !== undefined 
                  ? d3.interpolateBlues(educationValue / 100) 
                  : '#ccc';  // Default color for counties without data
          })
          .style("stroke", "#fff")
          .style("stroke-width", "0.5px")
          .on("mouseover", (event, d) => {
              const educationValue = educationMap.get(d.id);
              if (educationValue !== undefined) {
                  const countyData = educationData.find(edu => edu.fips === d.id);
                  d3.select("#tooltip")
                      .html(`
                          ${countyData.area_name}, ${countyData.state}<br>
                          ${educationValue}% Bachelor's or Higher
                      `)
                      .attr("data-education", educationValue)
                      .style("left", `${event.pageX + 10}px`)
                      .style("top", `${event.pageY - 28}px`)
                      .classed("visible", true);
              }
          })
          .on("mouseout", () => {
              d3.select("#tooltip").classed("visible", false);
          });

      // Add state boundaries for clearer definition
      svg.append("path")
          .datum(topojson.mesh(countyData, countyData.objects.states, (a, b) => a !== b))
          .attr("fill", "none")
          .attr("stroke", "#fff")
          .attr("stroke-width", "1.5px")
          .attr("d", pathGenerator);

  }).catch(error => {
      console.error('Error creating choropleth:', error);
  });
}

// Call the function when the page loads
window.onload = createChoropleth;