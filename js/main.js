(function () {
  "use strict";

  /* ---------- Year in footer ---------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- WhatsApp links: add the prefilled message ----------
     The phone number lives in the HTML (search for 917666480080 to change it). */
  document.querySelectorAll("a.wa").forEach(function (a) {
    var msg = a.getAttribute("data-msg");
    if (msg) a.href = a.href.split("?")[0] + "?text=" + encodeURIComponent(msg);
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* ---------- Hero window: the blind rolls up once, then follows your hand ---------- */
  (function () {
    var room = document.getElementById("room");
    var pull = document.getElementById("pull");
    if (!room || !pull) return;
    var win = room.querySelector(".window");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var CLOSED = 0.06, REST = 0.62, OPEN = 0.92;
    var open = CLOSED;
    var drag = null;

    function set(v) {
      open = Math.min(0.94, Math.max(0.04, v));
      room.style.setProperty("--open", open.toFixed(3));
      pull.setAttribute("aria-valuenow", String(Math.round(open * 100)));
    }
    function toggle() { set(open > 0.5 ? CLOSED : OPEN); }

    if (reduce) {
      room.classList.add("no-anim");
      set(REST);
    } else {
      set(CLOSED);
      window.setTimeout(function () { set(REST); }, 700);
    }

    pull.addEventListener("pointerdown", function (e) {
      pull.setPointerCapture(e.pointerId);
      drag = { y: e.clientY, start: open, moved: false };
      room.classList.add("is-dragging");
    });
    pull.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dy = e.clientY - drag.y;
      if (Math.abs(dy) > 4) drag.moved = true;
      var h = win.getBoundingClientRect().height - 20;
      set(drag.start - dy / h);
    });
    function end(cancelled) {
      if (!drag) return;
      var wasTap = !drag.moved;
      drag = null;
      room.classList.remove("is-dragging");
      if (wasTap && !cancelled) toggle();
    }
    pull.addEventListener("pointerup", function () { end(false); });
    pull.addEventListener("pointercancel", function () { end(true); });
    pull.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "ArrowUp" || k === "ArrowRight") { set(open + 0.08); }
      else if (k === "ArrowDown" || k === "ArrowLeft") { set(open - 0.08); }
      else if (k === "Home") { set(CLOSED); }
      else if (k === "End") { set(OPEN); }
      else if (k === "Enter" || k === " ") { toggle(); }
      else { return; }
      e.preventDefault();
    });
  })();

  /* ---------- Our work: Photos / Videos -> products -> items. Built from js/gallery-data.js ---------- */
  (function () {
    var cats = (window.GALLERY && Array.isArray(window.GALLERY.categories)) ? window.GALLERY.categories : [];
    var root = document.getElementById("work-view");
    var intro = document.getElementById("work-intro");
    var section = document.getElementById("work");
    var navVideos = document.getElementById("nav-videos");
    if (!root) return;

    var withPhotos = cats.filter(function (c) { return c.photos && c.photos.length; });
    var withVideos = cats.filter(function (c) { return c.videos && c.videos.length; });
    var total = function (list, f) { return list.reduce(function (n, c) { return n + c[f].length; }, 0); };

    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }
    function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }
    function ytThumb(id) { return "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg"; }
    function find(list, key) { for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i]; return null; }

    /* ----- Viewer (photos and videos) ----- */
    var lb = document.getElementById("lightbox");
    var stage = document.getElementById("lb-stage");
    var caption = document.getElementById("lb-caption");
    var list = [], pos = 0;

    function show(i) {
      pos = (i + list.length) % list.length;
      var it = list[pos];
      stage.textContent = "";
      stage.classList.toggle("is-vertical", !!it.vertical);
      if (it.youtube) {
        var f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(it.youtube) + "?autoplay=1&rel=0";
        f.title = it.title || "Video";
        f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        f.allowFullscreen = true;
        stage.appendChild(f);
      } else {
        var img = document.createElement("img");
        img.alt = it.title || "";
        img.src = it.src;
        stage.appendChild(img);
      }
      caption.textContent = it.title || "";
    }
    function openViewer(items, i) {
      if (!lb || typeof lb.showModal !== "function") return;
      list = items;
      show(i);
      lb.showModal();
    }
    if (lb) {
      document.getElementById("lb-close").addEventListener("click", function () { lb.close(); });
      document.getElementById("lb-prev").addEventListener("click", function () { show(pos - 1); });
      document.getElementById("lb-next").addEventListener("click", function () { show(pos + 1); });
      lb.addEventListener("close", function () { stage.textContent = ""; });
      lb.addEventListener("click", function (e) {
        var t = e.target;
        if (t === lb || (t.classList && (t.classList.contains("lb-inner") || t.classList.contains("lb-stage")))) lb.close();
      });
      lb.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") show(pos - 1);
        else if (e.key === "ArrowRight") show(pos + 1);
      });
    }

    /* ----- Building blocks ----- */
    // A big picture card that links to another view
    function card(cls, href, imgSrc, title, sub, withPlay) {
      var a = el("a", cls);
      a.href = href;
      if (imgSrc) {
        var img = document.createElement("img");
        img.loading = "lazy";
        img.decoding = "async";
        img.alt = "";
        img.src = imgSrc;
        img.addEventListener("error", function () { img.remove(); });
        a.appendChild(img);
      }
      if (withPlay) {
        var play = el("span", "play");
        play.innerHTML = "<i></i>";
        a.appendChild(play);
      }
      var txt = el("span", "card-text");
      txt.appendChild(el("strong", "", title));
      txt.appendChild(el("span", "", sub));
      a.appendChild(txt);
      return a;
    }

    function tile(items, idx, label, isVideo) {
      var it = items[idx];
      var fig = el("figure", "tile" + (isVideo ? " tile--video" : ""));
      var btn = el("button", "tile-btn");
      btn.type = "button";
      var name = it.title || label;
      btn.setAttribute("aria-label", (isVideo ? "Play video: " : "Enlarge photo: ") + name);
      var img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = isVideo ? "" : name;
      img.src = isVideo ? ytThumb(it.youtube) : it.src;
      img.addEventListener("error", function () { if (fig.parentNode) fig.parentNode.removeChild(fig); });
      btn.appendChild(img);
      if (isVideo) {
        var play = el("span", "play");
        play.innerHTML = "<i></i>";
        btn.appendChild(play);
      }
      btn.addEventListener("click", function () { openViewer(items, idx); });
      fig.appendChild(btn);
      if (it.title) fig.appendChild(el("figcaption", "", it.title));
      return fig;
    }

    function back(href, text) {
      var a = el("a", "back", "\u2190 " + text);
      a.href = href;
      return a;
    }
    function crossLink(href, text) {
      var p = el("p", "cross");
      var a = el("a", "", text);
      a.href = href;
      p.appendChild(a);
      return p;
    }

    /* ----- Views ----- */
    function home() {
      intro.textContent = "Photos and videos from recent jobs. Choose what you would like to see.";
      var grid = el("div", "type-grid");
      if (withPhotos.length) {
        grid.appendChild(card("type-card", "#photos", withPhotos[0].photos[0].src, "Photos",
          plural(total(withPhotos, "photos"), "photo") + " in " + plural(withPhotos.length, "section"), false));
      }
      if (withVideos.length) {
        grid.appendChild(card("type-card", "#videos", ytThumb(withVideos[0].videos[0].youtube), "Videos",
          plural(total(withVideos, "videos"), "video") + " in " + plural(withVideos.length, "section"), true));
      }
      if (!grid.children.length) {
        root.appendChild(el("p", "empty", "New photos and videos coming soon. Message us on WhatsApp to see recent work."));
      } else {
        root.appendChild(grid);
      }
    }

    function typeList(type) {
      var isVideo = type === "videos";
      var set = isVideo ? withVideos : withPhotos;
      var f = isVideo ? "videos" : "photos";
      intro.textContent = isVideo ? "Choose a product to see its videos." : "Choose a product to see its photos.";
      root.appendChild(back("#work", "Our work"));
      root.appendChild(el("h3", "view-title", isVideo ? "Videos" : "Photos"));
      var grid = el("div", "cat-grid");
      set.forEach(function (c) {
        var cover = isVideo ? ytThumb(c.videos[0].youtube) : c.photos[0].src;
        grid.appendChild(card("cat-card", "#" + type + "/" + encodeURIComponent(c.key), cover, c.label,
          plural(c[f].length, isVideo ? "video" : "photo"), isVideo));
      });
      root.appendChild(grid);
    }

    function category(type, c) {
      var isVideo = type === "videos";
      var items = isVideo ? c.videos : c.photos;
      intro.textContent = isVideo ? "Tap a video to play it." : "Tap any photo to enlarge it.";
      root.appendChild(back("#" + type, isVideo ? "All video sections" : "All photo sections"));
      var h = el("h3", "view-title", c.label);
      h.appendChild(el("span", "count", plural(items.length, isVideo ? "video" : "photo")));
      root.appendChild(h);
      var grid = el("div", isVideo ? "vgrid" : "grid");
      items.forEach(function (_, idx) { grid.appendChild(tile(items, idx, c.label, isVideo)); });
      root.appendChild(grid);
      var other = isVideo ? c.photos : c.videos;
      if (other && other.length) {
        var t = isVideo ? "photos" : "videos";
        root.appendChild(crossLink("#" + t + "/" + encodeURIComponent(c.key),
          (isVideo ? "See " : "Watch ") + c.label.toLowerCase() + " " + t + " (" + other.length + ")"));
      }
    }

    function render(hash, scroll) {
      var m = /^#(photos|videos)(?:\/(.+))?$/.exec(hash || "");
      root.textContent = "";
      var type = m && m[1];
      var set = type === "videos" ? withVideos : withPhotos;
      if (type && set.length) {
        var key = m[2] ? decodeURIComponent(m[2]) : "";
        var c = key ? find(set, key) : null;
        if (c) category(type, c); else typeList(type);
      } else {
        home();
      }
      if (scroll && section) section.scrollIntoView();
    }

    if (navVideos) navVideos.hidden = true; // videos are inside Our work now

    window.addEventListener("hashchange", function () {
      var h = location.hash;
      if (/^#(photos|videos)(\/|$)/.test(h)) render(h, true);
      else if (h === "#work") render("", false);
    });
    render(location.hash, /^#(photos|videos)/.test(location.hash));
  })();
})();
