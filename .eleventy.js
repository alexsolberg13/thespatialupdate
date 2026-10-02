module.exports = function(eleventyConfig) {

  // Pass GeoJSON data files through to the output unchanged
  eleventyConfig.addPassthroughCopy("src/stories/**/*.geojson");

  // Pass any images or other assets through unchanged
  eleventyConfig.addPassthroughCopy("src/assets");

  // Custom-domain file for GitHub Pages. Lives in src/ so a clean rebuild of
  // docs/ can never drop it (losing docs/CNAME disconnects thespatialupdate.com).
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });

  // Story Beat Reels: standalone pages, copied as-is to /reels/<slug>.html.
  // Their narration scripts (*-script.md) stay in src/reels/ unpublished;
  // .eleventyignore keeps Eleventy from turning them into pages.
  eleventyConfig.addPassthroughCopy({ "src/reels/*.html": "reels" });

  return {
    dir: {
      input: "src",       // Eleventy reads from this folder
      output: "docs",     // Eleventy writes finished HTML here
      includes: "_includes", // templates live here
      data: "_data"          // shared data files live here
    },
    templateFormats: ["njk", "md", "html"]
  };

};