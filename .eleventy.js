module.exports = function(eleventyConfig) {

  // Pass GeoJSON data files through to the output unchanged
  eleventyConfig.addPassthroughCopy("src/stories/**/*.geojson");

  // Pass any images or other assets through unchanged
  eleventyConfig.addPassthroughCopy("src/assets");

  return {
    dir: {
      input: "src",       // Eleventy reads from this folder
      output: "_site",    // Eleventy writes finished HTML here
      includes: "_includes", // templates live here
      data: "_data"          // shared data files live here
    },
    templateFormats: ["njk", "md", "html"]
  };

};