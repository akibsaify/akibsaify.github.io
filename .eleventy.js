module.exports = function(eleventyConfig) {

  // ── Passthrough copies ──────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("src/ads.txt");
  eleventyConfig.addPassthroughCopy("src/83b51dfcb2be4637b63d985069ed0a29.txt");

  // ── Collections ─────────────────────────────────────────────────────
  eleventyConfig.addCollection("deals", function(collection) {
    return collection.getFilteredByGlob("src/deals/*.md")
      .filter(item => !item.data.expired)
      .sort((a, b) => {
        // High-value deals first (by deal price descending), then newest
        const priceA = Number(a.data.dealPrice) || 0;
        const priceB = Number(b.data.dealPrice) || 0;
        if (priceB !== priceA) return priceB - priceA;
        return b.date - a.date;
      });
  });

  // High-value deals only (₹1000+) for homepage featured section
  eleventyConfig.addCollection("highValueDeals", function(collection) {
    return collection.getFilteredByGlob("src/deals/*.md")
      .filter(item => !item.data.expired && Number(item.data.dealPrice) >= 1000)
      .sort((a, b) => {
        const priceA = Number(a.data.dealPrice) || 0;
        const priceB = Number(b.data.dealPrice) || 0;
        if (priceB !== priceA) return priceB - priceA;
        return b.date - a.date;
      });
  });

  eleventyConfig.addCollection("allDeals", function(collection) {
    return collection.getFilteredByGlob("src/deals/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("blog", function(collection) {
    return collection.getFilteredByGlob("src/blog/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // ── Filters ──────────────────────────────────────────────────────────
  // Format price as ₹34,999
  eleventyConfig.addFilter("priceFormat", function(price) {
    if (!price) return "";
    return "₹" + Number(price).toLocaleString("en-IN");
  });

  // Format savings
  eleventyConfig.addFilter("savings", function(original, deal) {
    const saved = Number(original) - Number(deal);
    return "₹" + saved.toLocaleString("en-IN");
  });

  // Full date: 13 March 2026
  eleventyConfig.addFilter("dateFormat", function(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  });

  // Short date: 13 Mar 2026
  eleventyConfig.addFilter("shortDate", function(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  });

  // ISO date for schema/sitemap
  eleventyConfig.addFilter("isoDate", function(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split("T")[0];
  });

  // Filter collection by category
  eleventyConfig.addFilter("filterByCategory", function(collection, category) {
    return collection.filter(item => item.data.category === category && !item.data.expired);
  });

  // Filter collection by store
  eleventyConfig.addFilter("filterByStore", function(collection, store) {
    return collection.filter(item => item.data.store === store && !item.data.expired);
  });

  // Limit array length
  eleventyConfig.addFilter("limit", function(array, n) {
    return array.slice(0, n);
  });

  // Exclude current page from array
  eleventyConfig.addFilter("exclude", function(array, url) {
    return array.filter(item => item.url !== url);
  });

  // Absolute URL
  eleventyConfig.addFilter("absoluteUrl", function(url, base) {
    return (base || "https://deals.akibsaify.in") + url;
  });

  // Discount % (recalculate from prices if not in frontmatter)
  eleventyConfig.addFilter("calcDiscount", function(original, deal) {
    return Math.round(((original - deal) / original) * 100);
  });

  // ── Return config ────────────────────────────────────────────────────
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
