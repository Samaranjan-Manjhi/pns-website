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

  /* ---------- Gallery: photo sections and video sections, built from js/gallery-data.js ---------- */
  (function () {
    var cats = (window.GALLERY && Array.isArray(window.GALLERY.categories)) ? window.GALLERY.categories : [];
    var photoRoot = document.getElementById("photo-sections");
    var videoRoot = document.getElementById("video-sections");
    var jump = document.getElementById("jump");
    var videoBand = document.getElementById("videos");
    var navVideos = document.getElementById("nav-videos");
    if (!photoRoot) return;

    var FIRST = 9; // photos shown before "Show all"
    var withPhotos = cats.filter(function (c) { return c.photos && c.photos.length; });
    var withVideos = cats.filter(function (c) { return c.videos && c.videos.length; });
    var vidByKey = {}, photoByKey = {};
    withVideos.forEach(function (c) { vidByKey[c.key] = c; });
    withPhotos.forEach(function (c) { photoByKey[c.key] = c; });

    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }
    function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

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
      img.src = isVideo ? "https://i.ytimg.com/vi/" + encodeURIComponent(it.youtube) + "/hqdefault.jpg" : it.src;
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

    /* ----- Photo sections ----- */
    withPhotos.forEach(function (c) {
      var box = el("div", "cat");
      box.id = "photos-" + c.key;
      var h = el("h3", "", c.label);
      h.appendChild(el("span", "count", plural(c.photos.length, "photo")));
      box.appendChild(h);

      var grid = el("div", "grid");
      c.photos.forEach(function (p, idx) {
        var t = tile(c.photos, idx, c.label, false);
        if (idx >= FIRST) t.hidden = true;
        grid.appendChild(t);
      });
      box.appendChild(grid);

      if (c.photos.length > FIRST) {
        var more = el("button", "chip more", "Show all " + c.photos.length + " photos");
        more.type = "button";
        more.addEventListener("click", function () {
          grid.querySelectorAll("figure[hidden]").forEach(function (f) { f.hidden = false; });
          more.remove();
        });
        box.appendChild(more);
      }

      var v = vidByKey[c.key];
      if (v) {
        var p = el("p", "cross");
        var a = el("a", "", "Watch " + c.label.toLowerCase() + " videos (" + v.videos.length + ")");
        a.href = "#videos-" + c.key;
        p.appendChild(a);
        box.appendChild(p);
      }
      photoRoot.appendChild(box);
    });

    if (jump && withPhotos.length > 1) {
      withPhotos.forEach(function (c) {
        var a = el("a", "chip", c.label);
        a.href = "#photos-" + c.key;
        jump.appendChild(a);
      });
    }

    if (!withPhotos.length) {
      photoRoot.appendChild(el("p", "empty", "New photos coming soon. Message us on WhatsApp to see recent work."));
    }

    /* ----- Video sections ----- */
    if (videoRoot && withVideos.length) {
      withVideos.forEach(function (c) {
        var box = el("div", "cat");
        box.id = "videos-" + c.key;
        var h = el("h3", "", c.label);
        h.appendChild(el("span", "count", plural(c.videos.length, "video")));
        box.appendChild(h);
        var grid = el("div", "vgrid");
        c.videos.forEach(function (_, idx) { grid.appendChild(tile(c.videos, idx, c.label, true)); });
        box.appendChild(grid);
        if (photoByKey[c.key]) {
          var p = el("p", "cross");
          var a = el("a", "", "See " + c.label.toLowerCase() + " photos");
          a.href = "#photos-" + c.key;
          p.appendChild(a);
          box.appendChild(p);
        }
        videoRoot.appendChild(box);
      });
    } else {
      if (videoBand) videoBand.hidden = true;
      if (navVideos) navVideos.hidden = true;
    }
    if (navVideos && withVideos.length) navVideos.hidden = false;
  })();
})();
