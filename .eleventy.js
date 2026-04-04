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
  // Sorted by date (newest first) so fresh deals always appear on top
  eleventyConfig.addCollection("highValueDeals", function(collection) {
    return collection.getFilteredByGlob("src/deals/*.md")
      .filter(item => !item.data.expired && Number(item.data.dealPrice) >= 1000)
      .sort((a, b) => {
        // Newest deals first, then by price for same-day deals
        if (b.date.getTime() !== a.date.getTime()) return b.date - a.date;
        const priceB = Number(b.data.dealPrice) || 0;
        const priceA = Number(a.data.dealPrice) || 0;
        return priceB - priceA;
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

  // Filter blog posts by tags (for topical related guides)
  eleventyConfig.addFilter("filterByTags", function(collection, tags) {
    if (!tags || !tags.length) return collection;
    const tagSet = new Set(tags.map(t => t.toLowerCase()));
    return collection.filter(item => {
      const itemTags = item.data.tags || [];
      return itemTags.some(t => tagSet.has(t.toLowerCase()));
    });
  });

  // Filter blog posts by category
  eleventyConfig.addFilter("filterBlogByCategory", function(collection, category) {
    if (!category) return collection;
    const cat = category.toLowerCase();
    return collection.filter(item => {
      const itemCat = (item.data.category || "").toLowerCase();
      const itemTags = (item.data.tags || []).map(t => t.toLowerCase());
      return itemCat === cat || itemTags.includes(cat);
    });
  });

  // Extract headings from HTML content for auto-TOC
  eleventyConfig.addFilter("extractHeadings", function(content) {
    if (!content) return [];
    const headings = [];
    const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        id: match[2],
        text: match[3].replace(/<[^>]+>/g, "").trim()
      });
    }
    return headings;
  });

  // ── Markdown-it: Add IDs to headings for TOC linking ──────────────
  eleventyConfig.amendLibrary("md", mdLib => {
    const originalHeadingOpen = mdLib.renderer.rules.heading_open ||
      function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
      };

    mdLib.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
      const token = tokens[idx];
      const level = parseInt(token.tag.slice(1));
      if (level === 2 || level === 3) {
        // Get the text content from the next inline token
        const contentToken = tokens[idx + 1];
        if (contentToken && contentToken.children) {
          const text = contentToken.children
            .filter(t => t.type === "text" || t.type === "code_inline")
            .map(t => t.content)
            .join("");
          const id = text.toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
          token.attrSet("id", id);
        }
      }
      return originalHeadingOpen(tokens, idx, options, env, self);
    };
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
