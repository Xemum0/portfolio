/* =====================================================================
   Youcef Mhammdi Bouzina — portfolio
   Vanilla JS, no dependencies, classic script (works from file:// too).

   English lives in the HTML (single source of truth, readable without JS).
   Translations are overlays in assets/js/i18n.js.

   Modules: util · theme · i18n · nav · reveal · counters · hero · phone
            projects · abex flow · palette · contact · boot
   ===================================================================== */
(function () {
  "use strict";

  /* ───────────────────────── util ───────────────────────── */
  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = { out: function (t) { return 1 - Math.pow(1 - t, 4); }, inOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; } };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  var isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "");
  var scrollBehavior = function () { return mqReduce.matches ? "auto" : "smooth"; };

  function onFrame(fn) {
    var queued = false;
    return function () {
      var args = arguments;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn.apply(null, args); });
    };
  }
  function safe(name, fn) {
    try { return fn(); } catch (err) { if (window.console) console.error("[portfolio] " + name + " failed:", err); }
  }
  function lockScroll(on) { root.style.overflow = on ? "hidden" : ""; }

  /* ───────────────────────── theme ───────────────────────── */
  var Theme = {
    current: function () { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; },
    apply: function (t) {
      root.setAttribute("data-theme", t);
      var m = $('meta[name="theme-color"]');
      if (m) m.setAttribute("content", t === "dark" ? "#0b0b0a" : "#f2f0e9");
    },
    /* Circular reveal from the click point where the View Transitions API exists; instant elsewhere. */
    toggle: function (ev) {
      var next = this.current() === "dark" ? "light" : "dark";
      store.set("theme", next);
      var self = this;
      if (!doc.startViewTransition || mqReduce.matches) { self.apply(next); return; }
      var x = innerWidth / 2, y = 0;
      if (ev && ev.clientX) { x = ev.clientX; y = ev.clientY; }
      else if (ev && ev.currentTarget && ev.currentTarget.getBoundingClientRect) {
        var r = ev.currentTarget.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2;
      }
      var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add("vt-theme");
      var vt = doc.startViewTransition(function () { self.apply(next); });
      vt.ready.then(function () {
        root.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
          { duration: 650, easing: "cubic-bezier(.2,.75,.2,1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(function () {});
      vt.finished.then(function () { root.classList.remove("vt-theme"); }, function () { root.classList.remove("vt-theme"); });
    },
    init: function () {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var follow = function (e) { if (!store.get("theme")) Theme.apply(e.matches ? "dark" : "light"); };
      if (mq.addEventListener) mq.addEventListener("change", follow); else if (mq.addListener) mq.addListener(follow);
      Theme.apply(Theme.current());
    },
  };

  /* ───────────────────────── i18n ───────────────────────── */
  /* French typography: no-break space before ? ! : ; » and after « */
  function fixFr(s) { return s.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« "); }

  var I18N = {
    lang: "en",
    dicts: window.PORTFOLIO_I18N || {},
    orig: new WeakMap(),
    listeners: [],
    locale: function () { return this.lang === "fr" ? "fr-FR" : "en-US"; },
    t: function (key) {
      var d = this.dicts[this.lang], e = this.dicts.en;
      var v = d && d[key];
      if (v == null) v = e && e[key];
      if (v == null) return key;
      return this.lang === "fr" ? fixFr(v) : v;
    },
    on: function (fn) { this.listeners.push(fn); },
    set: function (lang, opts) {
      opts = opts || {};
      var self = this;
      if (lang !== "fr") lang = "en";
      if (lang === this.lang && !opts.force) return;
      var run = function () { self.apply(lang); };
      if (opts.animate && doc.startViewTransition && !mqReduce.matches) doc.startViewTransition(run); else run();
      if (opts.persist) {
        store.set("lang", lang);
        try {
          var u = new URL(location.href);
          u.searchParams.set("lang", lang);
          history.replaceState(null, "", u.pathname + u.search + u.hash);
        } catch (e) { /* file:// or sandbox */ }
        var live = $("[data-live]");
        if (live) live.textContent = this.t("js.lang");
      }
    },
    apply: function (lang) {
      var self = this;
      this.lang = lang;
      var dict = this.dicts[lang] || {};
      var fr = lang === "fr";
      var val = function (k) { var v = dict[k]; return v == null ? null : fr ? fixFr(v) : v; };
      var rec = function (el) { var o = self.orig.get(el); if (!o) { o = {}; self.orig.set(el, o); } return o; };

      $$("[data-i18n]").forEach(function (el) {
        var o = rec(el);
        if (o.text === undefined) o.text = el.textContent;
        var v = lang === "en" ? null : val(el.getAttribute("data-i18n"));
        el.textContent = v == null ? o.text : v;
      });
      $$("[data-i18n-html]").forEach(function (el) {
        var o = rec(el);
        if (o.html === undefined) o.html = el.innerHTML;
        var v = lang === "en" ? null : val(el.getAttribute("data-i18n-html"));
        el.innerHTML = v == null ? o.html : v;
      });
      $$("[data-i18n-attr]").forEach(function (el) {
        var o = rec(el);
        o.attrs = o.attrs || {};
        el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
          var i = pair.indexOf(":");
          if (i < 0) return;
          var attr = pair.slice(0, i).trim(), key = pair.slice(i + 1).trim();
          if (!(attr in o.attrs)) o.attrs[attr] = el.getAttribute(attr);
          var v = lang === "en" ? null : val(key);
          el.setAttribute(attr, v == null ? o.attrs[attr] : v);
        });
      });

      // document-level metadata
      var setMeta = function (sel, key, attr) {
        var el = $(sel); if (!el) return;
        var o = rec(el); o.attrs = o.attrs || {};
        if (!(attr in o.attrs)) o.attrs[attr] = el.getAttribute(attr);
        var v = lang === "en" ? null : val(key);
        el.setAttribute(attr, v == null ? o.attrs[attr] : v);
      };
      var tr = rec(doc.documentElement);
      if (tr.title === undefined) tr.title = doc.title;
      doc.title = lang === "en" ? tr.title : val("meta.title") || tr.title;
      setMeta('meta[name="description"]', "meta.desc", "content");
      setMeta('meta[property="og:title"]', "meta.ogTitle", "content");
      setMeta('meta[property="og:description"]', "meta.ogDesc", "content");
      var loc = $('meta[property="og:locale"]'); if (loc) loc.setAttribute("content", fr ? "fr_FR" : "en_US");

      root.setAttribute("lang", lang);
      $$("[data-lang-switch]").forEach(function (s) { s.setAttribute("data-active", lang); });
      $$("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang)); });

      // store pages open in the visitor's language
      $$("a[data-store]").forEach(function (a) {
        if (!a.getAttribute("data-base")) a.setAttribute("data-base", a.getAttribute("href"));
        try {
          var u = new URL(a.getAttribute("data-base"), location.href);
          u.searchParams.set(a.getAttribute("data-store") === "apple" ? "l" : "hl", lang);
          a.setAttribute("href", u.toString());
        } catch (e) { /* ignore */ }
      });

      this.listeners.forEach(function (fn) { fn(lang); });
    },
    detect: function () {
      var l = root.getAttribute("lang");
      return l === "fr" ? "fr" : "en";
    },
  };

  /* ───────────────────────── nav ───────────────────────── */
  function initNav() {
    var links = $$(".nav__links a");
    var sections = links.map(function (a) { return $(a.getAttribute("href")); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.removeAttribute("aria-current"); });
          var i = sections.indexOf(e.target);
          if (i > -1) links[i].setAttribute("aria-current", "true");
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      sections.forEach(function (s) { if (s) io.observe(s); });
      var hero = $(".hero");
      if (hero) new IntersectionObserver(function (e) { if (e[0].isIntersecting) links.forEach(function (a) { a.removeAttribute("aria-current"); }); }, { rootMargin: "-45% 0px -50% 0px" }).observe(hero);
    }
    var bar = $(".progress");
    var update = onFrame(function () {
      var max = root.scrollHeight - innerHeight;
      if (bar) bar.style.setProperty("--p", max > 0 ? clamp(scrollY / max, 0, 1).toFixed(4) : 0);
    });
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ───────────────────────── reveal on scroll ───────────────────────── */
  function initReveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () { els.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-in"); }); }, 1200);
  }

  /* ───────────────────────── counters ───────────────────────── */
  var Counters = {
    els: [],
    fmt: function (el, v) {
      var d = parseInt(el.getAttribute("data-decimals") || "0", 10);
      return new Intl.NumberFormat(I18N.locale(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(v).replace(/[  ]/g, " ");
    },
    show: function (el, v) { el._v = v; el.textContent = this.fmt(el, v); },
    rerender: function () { var self = this; this.els.forEach(function (el) { self.show(el, el._v == null ? parseFloat(el.getAttribute("data-count")) : el._v); }); },
    run: function (el) {
      var self = this, target = parseFloat(el.getAttribute("data-count")), t0 = null, dur = 1500;
      if (mqReduce.matches) { self.show(el, target); return; }
      var step = function (ts) {
        if (t0 === null) t0 = ts;
        var p = clamp((ts - t0) / dur, 0, 1);
        self.show(el, target * ease.out(p));
        if (p < 1) requestAnimationFrame(step); else self.show(el, target);
      };
      requestAnimationFrame(step);
    },
    init: function () {
      var self = this;
      this.els = $$("[data-count]");
      I18N.on(function () { self.rerender(); });
      if (mqReduce.matches || !("IntersectionObserver" in window)) { this.els.forEach(function (el) { self.show(el, parseFloat(el.getAttribute("data-count"))); }); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { self.run(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.6 });
      this.els.forEach(function (el) { self.show(el, 0); io.observe(el); });
    },
  };

  /* ───────────────────────── ticker ───────────────────────── */
  function initTicker() {
    var set = $(".ticker__set");
    if (!set) return;
    var clone = set.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    set.parentNode.appendChild(clone);
  }

  /* ───────────────────────── hero: variable-font name + phone tilt ───────────────────────── */
  function initHero() {
    var hero = $(".hero");
    if (!hero) return;

    // 1. split the name into letters
    var letters = [];
    $$(".hero__name .word").forEach(function (w) {
      var txt = w.textContent; w.textContent = "";
      Array.prototype.forEach.call(txt, function (c) {
        var s = doc.createElement("span");
        s.className = "ch"; s.textContent = c; s.setAttribute("aria-hidden", "true");
        w.appendChild(s); letters.push({ el: s, v: 0 });
      });
    });

    var phone = $(".phone");
    var finePointer = mqFine.matches && !mqReduce.matches;
    var BASE = { wdth: 78, wght: 740 }, PEAK = { wdth: 100, wght: 800 }, RADIUS = 280;
    var px = -9999, py = -9999, over = false, running = false;

    function loop() {
      var moving = false;
      for (var i = 0; i < letters.length; i++) {
        var L = letters[i], r = L.el.getBoundingClientRect();
        var d = over ? Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2)) : Infinity;
        var target = over ? clamp(1 - d / RADIUS, 0, 1) : 0;
        target = target * target * (3 - 2 * target);
        L.v = lerp(L.v, target, 0.16);
        if (Math.abs(L.v - target) > 0.002) moving = true; else L.v = target;
        L.el.style.fontVariationSettings = '"wdth" ' + lerp(BASE.wdth, PEAK.wdth, L.v).toFixed(1) + ', "wght" ' + lerp(BASE.wght, PEAK.wght, L.v).toFixed(0);
      }
      if (moving || over) requestAnimationFrame(loop); else { running = false; letters.forEach(function (L) { L.el.style.fontVariationSettings = ""; }); }
    }

    if (finePointer) {
      hero.addEventListener("pointermove", function (e) {
        px = e.clientX; py = e.clientY; over = true;
        if (!running) { running = true; requestAnimationFrame(loop); }
        // 2. phone tilt + glare
        if (phone) {
          var r = phone.getBoundingClientRect();
          var nx = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1);
          var ny = clamp((e.clientY - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1);
          phone.style.setProperty("--ry", (nx * 12).toFixed(2) + "deg");
          phone.style.setProperty("--rx", (-ny * 9).toFixed(2) + "deg");
          phone.style.setProperty("--gx", (50 + nx * 45).toFixed(1) + "%");
          phone.style.setProperty("--gy", (22 + ny * 30).toFixed(1) + "%");
        }
      });
      hero.addEventListener("pointerleave", function () {
        over = false;
        if (!running) { running = true; requestAnimationFrame(loop); }
        if (phone) { phone.style.setProperty("--ry", "0deg"); phone.style.setProperty("--rx", "0deg"); phone.style.setProperty("--gx", "30%"); phone.style.setProperty("--gy", "8%"); }
      });
    }

    // 3. clock in the status bar
    var clock = $("[data-clock]");
    if (clock) {
      var tick = function () { var d = new Date(); clock.textContent = d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"); };
      tick(); setInterval(tick, 15000);
    }
  }

  /* ───────────────────────── projects accordion ───────────────────────── */
  var Projects = {
    items: [],
    byId: function (id) { return doc.getElementById(id); },
    isOpen: function (it) { return it.classList.contains("is-open"); },
    set: function (it, open) {
      it.classList.toggle("is-open", open);
      var b = $(".proj__btn", it); if (b) b.setAttribute("aria-expanded", String(open));
    },
    /* Collapse siblings instantly and keep the clicked header where it was (Safari has no scroll anchoring). */
    open: function (id, opts) {
      opts = opts || {};
      var it = typeof id === "string" ? this.byId(id) : id;
      if (!it || !it.classList.contains("proj")) return;
      var self = this, others = this.items.filter(function (o) { return o !== it && self.isOpen(o); });
      var before = it.getBoundingClientRect().top;
      others.forEach(function (o) { o.classList.add("no-anim"); self.set(o, false); });
      var after = it.getBoundingClientRect().top;
      if (others.length && Math.abs(after - before) > 1 && !opts.scroll) scrollTo({ top: scrollY + (after - before), behavior: "instant" });
      requestAnimationFrame(function () { others.forEach(function (o) { o.classList.remove("no-anim"); }); });
      this.set(it, true);
      if (opts.scroll) {
        requestAnimationFrame(function () { it.scrollIntoView({ behavior: scrollBehavior(), block: "start" }); });
        try { history.replaceState(null, "", "#" + it.id); } catch (e) { /* ignore */ }
      }
    },
    toggle: function (it) {
      if (this.isOpen(it)) this.set(it, false); else this.open(it);
    },
    init: function () {
      var self = this;
      this.items = $$(".proj");
      this.items.forEach(function (it) {
        var b = $(".proj__btn", it);
        b.addEventListener("click", function () { self.toggle(it); });
      });
      // roving focus between headers
      var btns = this.items.map(function (it) { return $(".proj__btn", it); });
      btns.forEach(function (b, i) {
        b.addEventListener("keydown", function (e) {
          var n = null;
          if (e.key === "ArrowDown") n = btns[(i + 1) % btns.length];
          else if (e.key === "ArrowUp") n = btns[(i - 1 + btns.length) % btns.length];
          else if (e.key === "Home") n = btns[0];
          else if (e.key === "End") n = btns[btns.length - 1];
          if (n) { e.preventDefault(); n.focus(); }
        });
      });
      // deep link: /#swiga
      var h = location.hash.slice(1);
      var target = h && this.byId(h);
      if (target && target.classList.contains("proj")) {
        this.open(target, { scroll: true });
      } else if (this.items[0] && !h) {
        this.set(this.items[0], true);
      }
    },
  };

  /* ───────────────────────── phone: app open / close ───────────────────────── */
  var Phone = {
    current: null,
    origin: null,
    data: function (id) {
      var el = Projects.byId(id);
      if (id === "abex") {
        var apps = $$(".abex-app").map(function (a) {
          return { icon: $("img", a).getAttribute("src"), name: $("h3", a).textContent, href: $("a", a).getAttribute("href") };
        });
        return {
          id: id, c: "#4b1596", on: "#ffffff",
          icon: $(".abex__brand img").getAttribute("src"),
          name: "ABEX Express",
          cat: I18N.t("av.abex.cat"),
          metric: I18N.t("av.abex.metric"),
          apps: apps,
          links: [{ href: "https://abex-express.com/", label: I18N.t("av.site"), icon: "#i-arrow-up-right", stroke: true }],
          more: "#abex",
        };
      }
      if (!el) return null;
      var cs = getComputedStyle(el);
      return {
        id: id, c: cs.getPropertyValue("--c").trim(), on: cs.getPropertyValue("--on-c").trim(),
        icon: $(".proj__logo", el).getAttribute("src"),
        name: $(".proj__name", el).textContent,
        cat: $(".proj__cat", el).textContent,
        metric: $(".proj__metric", el).innerHTML,
        apps: [],
        links: $$(".proj__links a", el).map(function (a) {
          return { href: a.getAttribute("href"), label: a.textContent.trim(), icon: $("use", a).getAttribute("href"), store: a.getAttribute("data-store") };
        }),
        more: "#" + id,
      };
    },
    fill: function (d) {
      var v = $("[data-appview]");
      v.style.setProperty("--c", d.c); v.style.setProperty("--on-c", d.on);
      var icon = $('[data-av="icon"]', v); icon.setAttribute("src", d.icon);
      $('[data-av="name"]', v).textContent = d.name;
      $('[data-av="cat"]', v).textContent = d.cat;
      $('[data-av="metric"]', v).innerHTML = d.metric;
      var apps = $('[data-av="apps"]', v); apps.textContent = "";
      d.apps.forEach(function (a) {
        var l = doc.createElement("a");
        l.href = a.href; l.target = "_blank"; l.rel = "noopener noreferrer";
        l.setAttribute("data-store", "apple");
        l.innerHTML = '<img src="' + a.icon + '" width="64" height="64" alt="" /><span></span>';
        $("span", l).textContent = a.name.replace(/^Abex /, "");
        apps.appendChild(l);
      });
      var links = $('[data-av="links"]', v); links.textContent = "";
      d.links.forEach(function (l) {
        var a = doc.createElement("a");
        a.href = l.href; a.target = "_blank"; a.rel = "noopener noreferrer";
        if (l.store) a.setAttribute("data-store", l.store);
        a.innerHTML = '<svg class="i" aria-hidden="true" focusable="false"><use href="' + l.icon + '"></use></svg><span></span>';
        $("span", a).textContent = l.label;
        links.appendChild(a);
      });
      $('[data-av="more"]', v).setAttribute("href", d.more);
    },
    open: function (id, btn) {
      var d = this.data(id); if (!d) return;
      var v = $("[data-appview]"), screen = $(".phone__screen"), home = $("[data-home]");
      this.current = id; this.origin = btn;
      this.fill(d);
      var sr = screen.getBoundingClientRect(), br = btn.getBoundingClientRect();
      v.style.setProperty("--ox", (br.left + br.width / 2 - sr.left).toFixed(0) + "px");
      v.style.setProperty("--oy", (br.top + br.height / 2 - sr.top).toFixed(0) + "px");
      v.hidden = false; v.setAttribute("aria-hidden", "false");
      void v.offsetWidth;
      v.classList.add("is-open");
      home.inert = true;
      setTimeout(function () { var back = $("[data-appview-close]"); if (back) back.focus({ preventScroll: true }); }, 60);
    },
    close: function (returnFocus) {
      var v = $("[data-appview]"), home = $("[data-home]");
      if (!v || v.hidden) return;
      var self = this;
      v.classList.remove("is-open");
      home.inert = false;
      var done = function () { v.hidden = true; v.setAttribute("aria-hidden", "true"); };
      if (mqReduce.matches) done(); else setTimeout(done, 680);
      if (returnFocus !== false && this.origin) this.origin.focus({ preventScroll: true });
      this.current = null;
    },
    init: function () {
      var self = this;
      $$("[data-open]").forEach(function (b) {
        b.addEventListener("click", function () { self.open(b.getAttribute("data-open"), b); });
      });
      $("[data-appview-close]").addEventListener("click", function () { self.close(); });
      $('[data-av="more"]').addEventListener("click", function (e) {
        var id = self.current;
        e.preventDefault(); self.close(false);
        if (id === "abex") goto("#abex"); else Projects.open(id, { scroll: true });
      });
      doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && self.current) self.close(); });
      I18N.on(function () { if (self.current) { var d = self.data(self.current); if (d) self.fill(d); } });
    },
  };

  /* ───────────────────────── ABEX parcel-flow ───────────────────────── */
  var Flow = {
    init: function () {
      var fig = $("[data-flow]"); if (!fig) return;
      var stage = $(".flow__stage", fig), list = $("[data-steps]"), toggle = $("[data-flow-toggle]");
      var paths = { mc: $("#p-mc"), cu: $("#p-cu"), cb: $("#p-cb"), cd: $("#p-cd") };
      var VB = { w: 160, h: 110 };
      var nodes = {}; $$("[data-node]", fig).forEach(function (n) { nodes[n.getAttribute("data-node")] = n; });
      var steps = $$(".step", list);
      var DUR = 3400, SEG = 1050;
      var defs = [
        { nodes: ["merchant", "core", "backoffice"], segs: [{ p: "mc", d: 1, k: "parcel" }, { p: "cb", d: 1, k: "parcel", at: 950 }] },
        { nodes: ["core", "driver"], segs: [{ p: "cd", d: 1, k: "parcel" }] },
        { nodes: ["driver", "core", "customer"], segs: [{ p: "cd", d: -1, k: "parcel" }, { p: "cu", d: 1, k: "parcel", at: 950 }] },
        { nodes: ["driver", "core", "backoffice"], segs: [{ p: "cd", d: -1, k: "cash" }, { p: "cb", d: 1, k: "cash", at: 950 }] },
        { nodes: ["core", "merchant"], segs: [{ p: "mc", d: -1, k: "cash" }] },
      ];
      var layer = doc.createElement("div"); layer.className = "flow__packets"; layer.setAttribute("aria-hidden", "true"); stage.appendChild(layer);
      var idx = 0, playing = !mqReduce.matches, visible = false, timer = 0, raf = 0, pk = [];
      list.style.setProperty("--dur", DUR + "ms");

      function packets(segs) {
        cancelAnimationFrame(raf); layer.textContent = ""; pk = [];
        if (mqReduce.matches) return;
        segs.forEach(function (s) {
          var el = doc.createElement("i"); el.className = "pk pk--" + s.k; el.style.opacity = "0"; layer.appendChild(el);
          pk.push({ s: s, el: el, len: paths[s.p].getTotalLength() });
        });
        var t0 = performance.now();
        (function frame(now) {
          var e = now - t0, alive = false;
          pk.forEach(function (o) {
            var at = o.s.at || 0;
            if (e < at) { alive = true; return; }
            var p = clamp((e - at) / SEG, 0, 1), q = ease.inOut(p);
            var pt = paths[o.s.p].getPointAtLength((o.s.d > 0 ? q : 1 - q) * o.len);
            o.el.style.left = (pt.x / VB.w * 100) + "%"; o.el.style.top = (pt.y / VB.h * 100) + "%";
            o.el.style.opacity = p < 1 ? "1" : "0";
            if (p < 1) alive = true;
          });
          if (alive) raf = requestAnimationFrame(frame);
        })(t0);
      }

      function go(i) {
        idx = (i + defs.length) % defs.length;
        var def = defs[idx];
        fig.setAttribute("data-step", idx);
        steps.forEach(function (b, j) {
          if (j === idx) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
        });
        Object.keys(nodes).forEach(function (k) { nodes[k].classList.toggle("is-on", def.nodes.indexOf(k) > -1); });
        Object.keys(paths).forEach(function (k) {
          var seg = def.segs.filter(function (s) { return s.p === k; })[0];
          paths[k].classList.toggle("is-on", !!seg);
          if (seg) paths[k].style.setProperty("--seg", seg.k === "cash" ? "#f08216" : "var(--hl)");
        });
        packets(def.segs);
        schedule();
      }
      function schedule() {
        clearTimeout(timer);
        if (playing && visible) timer = setTimeout(function () { go(idx + 1); }, DUR);
      }
      function setPlaying(on) {
        playing = on;
        list.classList.toggle("is-paused", !on);
        toggle.setAttribute("aria-pressed", String(!on));
        if (on) go(idx); else { clearTimeout(timer); }
      }

      steps.forEach(function (b, j) { b.addEventListener("click", function () { go(j); }); });
      toggle.addEventListener("click", function () { setPlaying(!playing); });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          visible = es[0].isIntersecting;
          if (visible) { if (playing) go(idx); else schedule(); } else { clearTimeout(timer); cancelAnimationFrame(raf); }
        }, { threshold: 0.35 }).observe(fig);
      } else { visible = true; }
      doc.addEventListener("visibilitychange", function () { if (doc.hidden) clearTimeout(timer); else schedule(); });
      list.classList.toggle("is-paused", !playing);
      toggle.setAttribute("aria-pressed", String(!playing));
      go(0);
    },
  };

  /* ───────────────────────── command palette ───────────────────────── */
  function goto(sel) {
    var el = $(sel); if (!el) return;
    el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    try { history.replaceState(null, "", sel === "#top" ? location.pathname + location.search : sel); } catch (e) { /* ignore */ }
  }
  var norm = function (s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };

  var Palette = {
    dlg: null, input: null, list: null, items: [], shown: [], active: 0,
    build: function () {
      var t = function (k) { return I18N.t(k); }, G = { nav: t("pal.g.nav"), proj: t("pal.g.proj"), act: t("pal.g.act") };
      var out = [];
      [["#abex", "nav.abex"], ["#work", "nav.work"], ["#about", "nav.about"], ["#stack", "nav.stack"], ["#contact", "nav.contact"]].forEach(function (n) {
        var a = $('.nav__links a[href="' + n[0] + '"]');
        out.push({ g: G.nav, icon: "#i-arrow-right", label: a ? a.textContent : n[1], hint: "", run: function () { goto(n[0]); } });
      });
      out.push({ g: G.proj, img: $(".abex__brand img").getAttribute("src"), label: "ABEX Express", hint: t("pal.abex.hint"), run: function () { goto("#abex"); } });
      Projects.items.forEach(function (p) {
        out.push({
          g: G.proj, img: $(".proj__logo", p).getAttribute("src"), label: $(".proj__name", p).textContent,
          hint: $(".proj__metric", p).textContent.replace(/\s+/g, " ").trim(),
          run: function () { Projects.open(p, { scroll: true }); },
        });
      });
      out.push({ g: G.act, icon: "#i-globe", label: t("pal.act.lang"), hint: "EN / FR", run: function () { I18N.set(I18N.lang === "fr" ? "en" : "fr", { persist: true, animate: true }); } });
      out.push({ g: G.act, icon: "#i-moon", label: t("pal.act.theme"), hint: "", run: function () { Theme.toggle(); } });
      out.push({ g: G.act, icon: "#i-copy", label: t("pal.act.copy"), hint: "", run: function () { copyEmail(); } });
      out.push({ g: G.act, icon: "#i-mail", label: t("pal.act.mail"), hint: "", run: function () { location.href = "mailto:youcefmhammdibouzina@gmail.com"; } });
      out.push({ g: G.act, icon: "#i-arrow-up-right", label: t("pal.act.site"), hint: "", run: function () { window.open("https://abex-express.com/", "_blank", "noopener"); } });
      out.push({ g: G.act, icon: "#i-arrow-up", label: t("pal.act.top"), hint: "", run: function () { goto("#top"); } });
      out.forEach(function (o, i) { o.id = "pal-opt-" + i; o.key = norm(o.label + " " + o.hint + " " + o.g); });
      this.items = out;
    },
    render: function () {
      var q = norm(this.input.value).trim().split(/\s+/).filter(Boolean);
      this.shown = this.items.filter(function (o) { return q.every(function (w) { return o.key.indexOf(w) > -1; }); });
      this.active = clamp(this.active, 0, Math.max(0, this.shown.length - 1));
      var html = "", last = "", self = this;
      this.list.textContent = "";
      if (!this.shown.length) {
        var e = doc.createElement("li"); e.className = "palette__empty"; e.setAttribute("role", "presentation"); e.textContent = I18N.t("pal.empty");
        this.list.appendChild(e); this.input.removeAttribute("aria-activedescendant"); return;
      }
      this.shown.forEach(function (o, i) {
        if (o.g !== last) { var g = doc.createElement("li"); g.className = "palette__group"; g.setAttribute("role", "presentation"); g.textContent = o.g; self.list.appendChild(g); last = o.g; }
        var li = doc.createElement("li");
        li.className = "palette__item"; li.id = o.id; li.setAttribute("role", "option"); li.setAttribute("aria-selected", String(i === self.active));
        li.innerHTML = (o.img ? '<img src="' + o.img + '" width="30" height="30" alt="" />' : '<svg class="i" aria-hidden="true" focusable="false"><use href="' + o.icon + '"></use></svg>') + "<span></span>" + (o.hint ? "<small></small>" : "");
        $("span", li).textContent = o.label; if (o.hint) $("small", li).textContent = o.hint;
        li.addEventListener("pointermove", function () { if (self.active !== i) { self.active = i; self.mark(); } });
        li.addEventListener("click", function () { self.run(i); });
        self.list.appendChild(li);
      });
      this.mark(true);
    },
    mark: function (noScroll) {
      var opts = $$(".palette__item", this.list), cur = null;
      opts.forEach(function (el, i) { var on = i === this.active; el.setAttribute("aria-selected", String(on)); if (on) cur = el; }, this);
      if (cur) { this.input.setAttribute("aria-activedescendant", cur.id); if (!noScroll) cur.scrollIntoView({ block: "nearest" }); }
    },
    run: function (i) {
      var o = this.shown[i]; if (!o) return;
      this.close();
      setTimeout(o.run, 60);
    },
    open: function () {
      if (this.dlg.open) return;
      this.build(); this.input.value = ""; this.active = 0; this.render();
      if (typeof this.dlg.showModal === "function") this.dlg.showModal(); else this.dlg.setAttribute("open", "");
      lockScroll(true);
      this.input.focus();
    },
    close: function () {
      if (typeof this.dlg.close === "function") this.dlg.close(); else this.dlg.removeAttribute("open");
      lockScroll(false);
    },
    init: function () {
      var self = this;
      this.dlg = $("#palette"); this.input = $("#palette-input"); this.list = $("#palette-list");
      if (!this.dlg) return;
      this.input.addEventListener("input", function () { self.active = 0; self.render(); });
      this.input.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); self.active = (self.active + 1) % Math.max(1, self.shown.length); self.mark(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); self.active = (self.active - 1 + self.shown.length) % Math.max(1, self.shown.length); self.mark(); }
        else if (e.key === "Home") { e.preventDefault(); self.active = 0; self.mark(); }
        else if (e.key === "End") { e.preventDefault(); self.active = Math.max(0, self.shown.length - 1); self.mark(); }
        else if (e.key === "Enter") { e.preventDefault(); self.run(self.active); }
      });
      this.dlg.addEventListener("click", function (e) { if (e.target === self.dlg) self.close(); });
      this.dlg.addEventListener("close", function () { lockScroll(false); });
      this.dlg.addEventListener("cancel", function () { lockScroll(false); });
      doc.addEventListener("keydown", function (e) {
        var k = e.key.toLowerCase();
        if ((e.metaKey || e.ctrlKey) && k === "k") { e.preventDefault(); if (self.dlg.open) self.close(); else self.open(); }
        else if (k === "/" && !/^(input|textarea|select)$/i.test((doc.activeElement || {}).tagName || "") && !self.dlg.open && !e.metaKey && !e.ctrlKey) { e.preventDefault(); self.open(); }
      });
      I18N.on(function () { if (self.dlg.open) { self.build(); self.render(); } });
    },
  };

  /* ───────────────────────── mobile menu ───────────────────────── */
  var Menu = {
    dlg: null,
    open: function () {
      if (typeof this.dlg.showModal === "function") this.dlg.showModal(); else this.dlg.setAttribute("open", "");
      lockScroll(true);
    },
    close: function () {
      if (typeof this.dlg.close === "function") this.dlg.close(); else this.dlg.removeAttribute("open");
      lockScroll(false);
    },
    init: function () {
      var self = this;
      this.dlg = $("#menu"); if (!this.dlg) return;
      $$("[data-close]", this.dlg).forEach(function (el) { el.addEventListener("click", function () { self.close(); }); });
      this.dlg.addEventListener("close", function () { lockScroll(false); });
      addEventListener("resize", function () { if (self.dlg.open && innerWidth > 1000) self.close(); });
    },
  };

  /* ───────────────────────── contact: copy email + toast ───────────────────────── */
  var toastTimer = 0;
  function toast(msg) {
    var el = $("[data-toast]"); if (!el) return;
    el.textContent = msg; el.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove("is-on"); }, 2400);
  }
  function copyEmail() {
    var btn = $("[data-copy]"), text = btn ? btn.getAttribute("data-copy") : "youcefmhammdibouzina@gmail.com";
    var done = function () {
      toast(I18N.t("js.copied"));
      if (btn) { btn.classList.add("is-copied"); setTimeout(function () { btn.classList.remove("is-copied"); }, 2200); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() {
      var ta = doc.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;top:0";
      doc.body.appendChild(ta); ta.select();
      try { doc.execCommand("copy"); done(); } catch (e) { /* ignore */ }
      doc.body.removeChild(ta);
    }
  }

  /* ───────────────────────── pointer spotlight on dark panels ───────────────────────── */
  function initSpot() {
    if (!mqFine.matches) return;
    $$("[data-spot]").forEach(function (el) {
      var set = onFrame(function (x, y) { el.style.setProperty("--mx", x + "px"); el.style.setProperty("--my", y + "px"); });
      el.addEventListener("pointermove", function (e) { var r = el.getBoundingClientRect(); set(Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)); });
    });
  }

  /* The visible shortcut text must be part of the accessible name (WCAG 2.5.3). */
  function labelShortcut() {
    $$("[data-kbd]").forEach(function (b) {
      b.setAttribute("aria-label", I18N.t("nav.palette") + ", " + b.textContent.replace(/\s+/g, " ").trim());
    });
  }

  /* ───────────────────────── boot ───────────────────────── */
  function boot() {
    safe("modifier key", function () { $$("[data-mod]").forEach(function (el) { el.textContent = isApple ? "⌘" : "Ctrl"; }); });
    safe("theme", function () { Theme.init(); });
    safe("projects", function () { Projects.init(); });
    safe("i18n", function () { I18N.apply(I18N.detect()); });
    safe("shortcut label", function () { labelShortcut(); I18N.on(labelShortcut); });
    safe("ticker", initTicker);
    safe("nav", initNav);
    safe("reveal", initReveal);
    safe("counters", function () { Counters.init(); });
    safe("hero", initHero);
    safe("phone", function () { Phone.init(); });
    safe("flow", function () { Flow.init(); });
    safe("palette", function () { Palette.init(); });
    safe("menu", function () { Menu.init(); });
    safe("spot", initSpot);

    // one delegated handler for every button that triggers a global action
    doc.addEventListener("click", function (e) {
      var langBtn = e.target.closest && e.target.closest("[data-lang]");
      if (langBtn) { I18N.set(langBtn.getAttribute("data-lang"), { persist: true, animate: true }); return; }
      var act = e.target.closest && e.target.closest("[data-action]");
      if (act) {
        var a = act.getAttribute("data-action");
        if (a === "theme") Theme.toggle({ clientX: e.clientX, clientY: e.clientY, currentTarget: act });
        else if (a === "lang") I18N.set(I18N.lang === "fr" ? "en" : "fr", { persist: true, animate: true });
        else if (a === "palette") Palette.open();
        else if (a === "menu") Menu.open();
        return;
      }
      var cp = e.target.closest && e.target.closest("[data-copy]");
      if (cp) copyEmail();
    });

    root.classList.remove("i18n-pending");
    if (window.console && console.log) console.log("%cYoucef M.B.%c  Plain HTML, CSS and a little JS — no framework. Say hello: youcefmhammdibouzina@gmail.com", "background:#d8ff3e;color:#0e0e0c;padding:3px 8px;border-radius:6px;font-weight:700", "color:inherit");
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})();
