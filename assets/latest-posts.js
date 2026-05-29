// Populates the homepage "LATEST ARTICLES" sidebar from the Docusaurus blog's
// JSON feed. The static markup in index.html is the fallback: if the feed is
// unreachable (offline, blog down, CORS), whatever is already rendered stays.

(function () {
  "use strict";

  // Point at the local blog host during Docker dev, production otherwise.
  var BLOG_ORIGIN = /(^|\.)localhost$/.test(location.hostname)
    ? "http://blog.landonfoister.localhost"
    : "https://blog.landonfoister.com";
  var FEED_URL = BLOG_ORIGIN + "/feed.json";
  var BLOG_URL = BLOG_ORIGIN + "/";
  var MAX_POSTS = 3;

  var container = document.querySelector("[data-latest-posts]");
  if (!container) return;

  fetch(FEED_URL, { headers: { Accept: "application/json" } })
    .then(function (res) {
      if (!res.ok) throw new Error("Feed responded " + res.status);
      return res.json();
    })
    .then(function (feed) {
      var items = (feed && feed.items) || [];
      if (!items.length) return; // keep the fallback markup

      container.innerHTML = items
        .slice(0, MAX_POSTS)
        .map(renderItem)
        .join("");
    })
    .catch(function () {
      /* keep the hardcoded fallback */
    });

  function renderItem(item) {
    var url = item.url || BLOG_URL;
    var title = item.title || "Untitled";
    var date = (item.date_published || "").slice(0, 10);
    var tag = item.tags && item.tags.length ? item.tags[0] : "";

    var meta =
      (date ? '<span class="side-date">' + esc(date) + "</span>" : "") +
      (tag
        ? '<span class="side-tag">#' + esc(tag.toUpperCase()) + "</span>"
        : "");

    return (
      '<a class="side-article" href="' +
      esc(url) +
      '">' +
      "<h3>" +
      esc(title) +
      "</h3>" +
      '<div class="side-article-meta">' +
      meta +
      "</div>" +
      "</a>"
    );
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[ch];
    });
  }
})();
