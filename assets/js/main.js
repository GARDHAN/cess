(function(){
  "use strict";
  var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* reveal on scroll */
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold:.12, rootMargin:"0px 0px -6% 0px" });
  $$(".r").forEach(function(el){ io.observe(el); });

  /* once the page moves, the utility strip collapses and the masthead
     tightens — the bar gives its height back to the content */
  var bar = document.getElementById("bar");
  function onScroll(){
    bar.classList.toggle("stuck", scrollY > 40);
  }
  addEventListener("scroll", onScroll, { passive:true });
  addEventListener("resize", onScroll);
  onScroll();

  /* mobile menu */
  var menuBtn = document.getElementById("menuBtn");
  var menu = document.getElementById("menu");
  if(menuBtn && menu){
    menu.hidden = false;           /* only revealed once the script can control it */

    var setMenu = function(open){
      menu.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menuBtn.querySelector(".menu-btn__txt").textContent = open ? "Close" : "Menu";
      document.documentElement.classList.toggle("locked", open);
    };

    menuBtn.addEventListener("click", function(){
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });

    /* a tapped link should navigate, not leave the panel covering the page */
    $$("#menu a").forEach(function(a){
      a.addEventListener("click", function(){ setMenu(false); });
    });

    addEventListener("keydown", function(e){
      if(e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true"){
        setMenu(false);
        menuBtn.focus();
      }
    });

    /* if the viewport grows past the breakpoint the panel must not stay latched */
    matchMedia("(min-width:1001px)").addEventListener("change", function(e){
      if(e.matches) setMenu(false);
    });
  }

  /* horizontal rails — arrow buttons, and edge state for the fade masks */
  $$(".rail").forEach(function(rail){
    var btns = $$('.rail__btn[data-rail="' + rail.id + '"]');
    var hint = rail.parentNode.querySelector(".rail__hint");

    function step(){
      var first = rail.firstElementChild;
      return first ? first.getBoundingClientRect().width + 18 : rail.clientWidth * 0.8;
    }

    /* scroll-snap parks the first card behind the rail's own padding, so a
       rail at rest sits a few px in rather than at exactly 0 */
    var EPS = 8;

    function sync(){
      var max = rail.scrollWidth - rail.clientWidth;
      var x = rail.scrollLeft;
      var scrollable = max > EPS;
      var atStart = x <= EPS, atEnd = x >= max - EPS;
      rail.dataset.pos = !scrollable ? "none" : (atStart ? "start" : (atEnd ? "end" : "mid"));
      btns.forEach(function(b){
        b.disabled = !scrollable || (Number(b.dataset.dir) < 0 ? atStart : atEnd);
      });
      if(hint) hint.style.visibility = scrollable ? "visible" : "hidden";
    }

    btns.forEach(function(b){
      b.addEventListener("click", function(){
        rail.scrollBy({ left: Number(b.dataset.dir) * step(), behavior: "smooth" });
      });
    });

    rail.addEventListener("scroll", function(){
      /* cheap enough to run raw, but coalesce to a frame anyway */
      if(rail._t) return;
      rail._t = requestAnimationFrame(function(){ rail._t = 0; sync(); });
    }, { passive:true });

    addEventListener("resize", sync);
    sync();
  });

  /* continuous marquees — rows that travel on their own.

     Two tracks sit side by side and both slide left by exactly their own
     width, so when the animation restarts, track two is standing where track
     one began and the loop shows no seam. That only holds if a track is wider
     than the visible row, so a short set is repeated until it is; otherwise a
     three-card section would loop with a gap in it.

     Speed is fixed in pixels per second rather than in seconds per lap, so a
     six-card row and a three-card row travel at the same pace. */
  var MARQ_PX_PER_SEC = 34;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  $$(".marq").forEach(function(marq){
    var row = marq.querySelector(".marq__row");
    var track = marq.querySelector(".marq__track");
    if(!row || !track) return;

    /* a reader who has asked for less motion gets the same row to push
       themselves, not a stalled animation */
    if(reduced){ marq.classList.add("marq--static"); marq.setAttribute("data-ready",""); return; }

    var seed = Array.prototype.slice.call(track.children);
    if(!seed.length) return;

    function build(){
      /* start from the original set every time, so a resize does not stack
         clones from the previous pass on top of the ones before it */
      while(track.children.length > seed.length) track.removeChild(track.lastChild);
      var twin = row.querySelector('[data-marq-twin]');
      if(twin) row.removeChild(twin);

      var visible = marq.clientWidth;
      /* repeat the set until one track alone can cover the row */
      var guard = 0;
      while(track.scrollWidth < visible && guard++ < 12){
        seed.forEach(function(el){ track.appendChild(el.cloneNode(true)); });
      }

      var w = track.scrollWidth;
      marq.style.setProperty("--marq-dur", (w / MARQ_PX_PER_SEC).toFixed(1) + "s");

      var copy = track.cloneNode(true);
      copy.setAttribute("data-marq-twin", "");
      copy.setAttribute("aria-hidden", "true");
      /* the duplicate is decoration; nothing in it should be tabbable */
      Array.prototype.forEach.call(copy.querySelectorAll("a,button"), function(el){
        el.setAttribute("tabindex", "-1");
      });
      row.appendChild(copy);
      marq.setAttribute("data-ready", "");
    }

    build();

    var rt;
    addEventListener("resize", function(){
      clearTimeout(rt);
      rt = setTimeout(build, 200);
    });
  });

  /* pinned heading, travelling objectives.

     The pinning is pure CSS (position:sticky), so the section releases on its
     own once the list runs out. What JS adds is the reading line: whichever
     objective is nearest it sits at full strength, and the ones above and
     below recede in proportion to their distance from it — so the one you
     just read fades upward as the next one arrives. */
  var objList = document.getElementById("objList");
  var objDots = document.getElementById("objDots");
  if(objList){
    var objs = Array.prototype.slice.call(objList.children);
    var dots = objDots ? Array.prototype.slice.call(objDots.children) : [];
    /* below this width the two columns collapse into one and everything is
       read in order, so the fade would only be in the way */
    var wide = matchMedia("(min-width:901px)");
    var oTick = false;

    function paint(){
      if(!wide.matches || reduced){
        objs.forEach(function(el){ el.style.opacity = ""; el.style.transform = ""; });
        dots.forEach(function(d){ d.classList.remove("on"); });
        return;
      }
      var line = innerHeight * 0.42;   /* the reading line */
      var reach = innerHeight * 0.40;  /* how far from it an item still counts */
      var best = 0, bestD = Infinity;

      objs.forEach(function(el, i){
        var r = el.getBoundingClientRect();
        var mid = r.top + r.height / 2;
        var raw = mid - line;
        var d = Math.min(1, Math.abs(raw) / reach);
        if(Math.abs(raw) < bestD){ bestD = Math.abs(raw); best = i; }
        /* squared falloff: the active item holds full strength across a band
           rather than dimming the moment it moves off the line */
        el.style.opacity = (1 - d * d * 0.8).toFixed(3);
        el.style.transform = "translateY(" + (raw < 0 ? -1 : 1) * (d * 10) + "px)";
      });

      dots.forEach(function(dot, i){ dot.classList.toggle("on", i === best); });
    }

    addEventListener("scroll", function(){
      if(oTick) return;
      oTick = true;
      requestAnimationFrame(function(){ oTick = false; paint(); });
    }, { passive:true });
    addEventListener("resize", paint);
    wide.addEventListener("change", paint);
    paint();
  }

  /* ghost wordmark drifts a little against the scroll */
  var mark = document.querySelector(".hero__mark");
  if(mark && !matchMedia("(prefers-reduced-motion: reduce)").matches){
    var ticking = false;
    addEventListener("scroll", function(){
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        var y = scrollY;
        if(y < innerHeight * 1.2) mark.style.transform = "translateY(" + (y * -0.08).toFixed(1) + "px)";
        ticking = false;
      });
    }, { passive:true });
  }
})();
