(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- neural-network canvas backdrop ---------- */
  var canvas = document.createElement("canvas");
  canvas.id = "net";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);

  if (!reduced) {
    var ctx = canvas.getContext("2d");
    var dots = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, raf = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.min(70, Math.round((w * h) / 26000));
      dots = [];
      for (var i = 0; i < target; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.6 + 0.6,
          warm: Math.random() > 0.42
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, d2;
      for (i = 0; i < dots.length; i++) {
        a = dots[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
      }
      for (i = 0; i < dots.length; i++) {
        a = dots[i];
        for (j = i + 1; j < dots.length; j++) {
          b = dots[j];
          dx = a.x - b.x; dy = a.y - b.y;
          d2 = dx * dx + dy * dy;
          if (d2 < 16900) {
            var t = 1 - d2 / 16900;
            ctx.strokeStyle = "rgba(255,180,84," + (0.10 * t).toFixed(3) + ")";
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = a.warm ? "rgba(255,180,84,.5)" : "rgba(95,211,196,.42)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }

    resize();
    step();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) { raf = requestAnimationFrame(step); }
    });
  } else {
    canvas.remove();
  }

  /* ---------- scramble-decode headline ---------- */
  var decodeEl = document.querySelector(".decode");
  if (decodeEl) {
    var finalText = decodeEl.getAttribute("data-text") || "";
    if (reduced) {
      decodeEl.textContent = finalText;
    } else {
      var glyphs = "!<>-_\\/[]{}=+*^?#01";
      var frame = 0;
      var queue = finalText.split("").map(function (ch, i) {
        return { ch: ch, start: i * 2 + Math.floor(Math.random() * 12), end: i * 2 + 24 + Math.floor(Math.random() * 18) };
      });
      (function tick() {
        var out = "";
        var done = 0;
        for (var i = 0; i < queue.length; i++) {
          var q = queue[i];
          if (frame >= q.end) { out += q.ch; done++; }
          else if (frame >= q.start) { out += q.ch === " " ? " " : glyphs[Math.floor(Math.random() * glyphs.length)]; }
          else { out += " "; }
        }
        decodeEl.textContent = out;
        frame++;
        if (done < queue.length) requestAnimationFrame(tick);
      })();
    }
  }

  /* ---------- terminal typing ---------- */
  var term = document.getElementById("term");
  if (term) {
    var lines = [
      { p: true, text: "whoami" },
      { p: false, text: "lijianyu — llm app & algorithm engineer" },
      { p: true, text: "cat focus.txt" },
      { p: false, text: "rag / agents / vlm finetune / data infra" },
      { p: true, text: "status --now" },
      { p: false, text: "master @ whut x efrei · grad 2027.04 · open to work" }
    ];
    if (reduced) {
      term.innerHTML = lines.map(function (l) {
        return l.p
          ? '<span class="p">$ </span><span class="out">' + l.text + "</span>"
          : '<span class="out">' + l.text + "</span>";
      }).join("\n");
    } else {
      var li = 0, ci = 0, buf = "";
      var caret = '<span class="caret"></span>';
      (function type() {
        if (li >= lines.length) {
          term.innerHTML = buf + caret;
          return;
        }
        var line = lines[li];
        var prefix = line.p ? '<span class="p">$ </span>' : "";
        var shown = line.text.slice(0, ci);
        term.innerHTML = buf + prefix + '<span class="' + (line.p ? "out" : "out") + '">' + shown + "</span>" + caret;
        ci++;
        if (ci > line.text.length) {
          buf += prefix + '<span class="out">' + line.text + "</span>\n";
          li++; ci = 0;
          setTimeout(type, line.p ? 260 : 90);
        } else {
          setTimeout(type, line.p ? 46 : 16);
        }
      })();
    }
  }

  /* ---------- scroll reveal ---------- */
  var revealTargets = document.querySelectorAll(
    ".section-head, .about-lede, .fact, .skill-group, .job, .project, .edu, .contact-box, .badge, .term"
  );
  if (reduced || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  } else {
    revealTargets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 70 + "ms";
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- nav scrollspy ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".topnav a[href^='#']"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id);
        });
      });
    }, { rootMargin: "-42% 0px -52% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
