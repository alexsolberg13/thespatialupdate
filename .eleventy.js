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
  // reel-frame.css / reel-frame.js are the shared frame every reel loads.
  eleventyConfig.addPassthroughCopy({ "src/reels/*.html": "reels" });
  eleventyConfig.addPassthroughCopy({ "src/reels/*.css": "reels" });
  eleventyConfig.addPassthroughCopy({ "src/reels/*.js": "reels" });
  // Home Screen web app: manifest and icons.
  eleventyConfig.addPassthroughCopy({ "src/reels/*.webmanifest": "reels" });
  eleventyConfig.addPassthroughCopy({ "src/reels/*.png": "reels" });

  // The reels index is built from the reels that exist in src/reels/, newest
  // first (scripts/reels_index.js), so a new reel can never be left off it.
  eleventyConfig.on("eleventy.after", () => {
    const { render, reelFiles } = require("./scripts/reels_index.js");
    const { html, reels } = render();
    require("fs").writeFileSync("docs/reels/index.html", html, "utf-8");
    console.log(`[reels index] listed ${reels.length} of ${reelFiles().length} reels, newest first: ` + reels.map((r) => r.name).join(", "));
  });

  // Instagram slide posts: src/posts/<slug>/ holds each post's page, slide data, slide text
  // and the saved PNGs. The build publishes the post pages and PNGs plus the posts index,
  // newest first (scripts/posts_index.js); the slide sources stay unpublished.
  eleventyConfig.on("eleventy.after", () => {
    const posts = require("./scripts/posts_index.js").build();
    console.log(`[posts index] published ${posts.length} post(s), newest first: ` + posts.map((p) => `${p.slug} (${p.slides} slides)`).join(", "));
  });

  // The studio home page (the Home Screen web app's start page): every reel, post and tool,
  // newest first, built from what exists (scripts/studio_index.js). Runs after the reels
  // and posts indexes so it only lists posts that passed their checks.
  eleventyConfig.on("eleventy.after", () => {
    const o = require("./scripts/studio_index.js").build();
    console.log(`[studio] listed ${o.reels.length} reel(s), ${o.posts.length} post(s), ${o.tools.length} tool(s)`);
  });

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