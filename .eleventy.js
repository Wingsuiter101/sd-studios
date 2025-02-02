const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");

// Debug mode setup
const DEBUG = process.env.ELEVENTY_ENV === 'development';

module.exports = function(eleventyConfig) {
  // Passthrough file copy
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("favicon.ico");

  // Watch targets
  eleventyConfig.addWatchTarget("./css/");
  eleventyConfig.addWatchTarget("./js/");
  eleventyConfig.addWatchTarget("./_data/");

  // BrowserSync Config
  eleventyConfig.setBrowserSyncConfig({
    files: ['_site/**/*', '_data/**/*'],
    ghostMode: false,
    notify: true
  });

// Add a collection for homepage carousel (limited to 6)
eleventyConfig.addCollection("projects", function() {
  try {
    const projects = require("./_data/projects.json");
    delete require.cache[require.resolve("./_data/projects.json")];
    
    return projects.map((project) => ({
      ...project,
      slug: project.title.toLowerCase().replace(/[^\w-]+/g, '-').replace(/-+/g, '-'),
      permalink: `/works/${project.slug}/`,
      fullDescription: project.fullDescription || project.description,
      gallery: project.gallery || [],
      services: project.services || [],
      completionDate: project.completionDate || new Date().getFullYear().toString(),
      clientName: project.clientName || ''
    }));
  } catch (error) {
    console.error("Error loading projects:", error);
    return [];
  }
});

// Collection that filters the first 6 for homepage
eleventyConfig.addFilter("homeProjects", function(projects) {
  return projects.slice(0, 6);
});


  // Gallery Collection - using the simpler working version
  eleventyConfig.addCollection("galleryData", function() {
    try {
      delete require.cache[require.resolve("./_data/gallery.json")];
      const gallery = require("./_data/gallery.json");
      
      const processedGallery = {
        albums: gallery.albums.map(album => ({
          ...album,
          coverImage: album.coverImage.startsWith('/') ? album.coverImage : `/${album.coverImage}`,
          photos: album.photos.map(photo => ({
            ...photo,
            url: photo.url.startsWith('/') ? photo.url : `/${photo.url}`
          }))
        }))
      };
      
      return processedGallery;
    } catch (error) {
      console.warn("Warning: Gallery data not found or invalid", error);
      return { albums: [] };
    }
  });

  // Event handler for watching data changes
  eleventyConfig.on('beforeWatch', (changedFiles) => {
    changedFiles.forEach(file => {
      if (file.endsWith('.json')) {
        delete require.cache[require.resolve(file)];
      }
    });
  });

  // Filters - combining all needed filters
  eleventyConfig.addFilter("formatDate", (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  eleventyConfig.addFilter("stringify", function(value) {
    return JSON.stringify(value);
  });

  eleventyConfig.addFilter("filterProjectsByCategory", function(projects, category) {
    if (category === "all") return projects;
    return projects.filter(project => project.category === category);
  });

  eleventyConfig.addFilter("slugify", function(str) {
    return str.toLowerCase()
      .replace(/[^\w-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  });

  // Shortcodes
  eleventyConfig.addShortcode("projectImage", function(imagePath) {
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  });

  // Configure Markdown
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: true,
    permalinkClass: 'anchor-link',
    permalinkSymbol: '#'
  });
  
  eleventyConfig.setLibrary("md", markdownLibrary);

  // Set template formats
  eleventyConfig.setTemplateFormats(["njk", "md", "html", "liquid"]);

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};