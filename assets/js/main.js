(function(){
  "use strict";
  var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* Reveal on scroll, in two stages and both ways.

     Stage: a section's heading is meant to land before the information under
     it, so anything that counts as information is given a deeper trigger line
     — it waits until the reader has scrolled further into the section. The
     split is by selector rather than by hand-tagging every element; data-late
     is there for the cases the selector cannot name.

     Both ways: an element that leaves also drops back to its start state, so
     coming back to it plays the fade again rather than finding it already
     resolved. Exit is watched by a separate observer at the true viewport
     edge, so nothing ever fades while any part of it is still on screen —
     the deeper entry line must not become a fade-out line. */
  var LATE = ".card,.mcard,.marq,.hero__acts,.rows,.disc,.rail-wrap,[data-late]";

  function enterObserver(bottom){
    return new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting) e.target.classList.add("in"); });
    }, { threshold:.1, rootMargin:"0px 0px " + bottom + " 0px" });
  }
  var ioHead = enterObserver("-8%"),
      ioBody = enterObserver("-22%");

  var ioOut = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(!e.isIntersecting) e.target.classList.remove("in"); });
  }, { threshold:0 });

  $$(".r").forEach(function(el){
    (el.matches(LATE) ? ioBody : ioHead).observe(el);
    ioOut.observe(el);
  });

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

  /* the discipline panel.

     Content is lifted out of the clicked item rather than duplicated into the
     dialog, so each description has exactly one home in the markup. The
     `pop-ok` class is what hides the in-place descriptions — set here, after
     showModal is confirmed, so a browser without it keeps them readable
     instead of hiding text behind a control that cannot open. */
  var pop = document.getElementById("pop");
  if(pop && typeof pop.showModal === "function"){
    document.documentElement.classList.add("pop-ok");

    var popTitle = pop.querySelector(".pop__title"),
        popBody  = pop.querySelector(".pop__body"),
        opener   = null;

    $$(".disc__t").forEach(function(btn){
      btn.addEventListener("click", function(){
        var item = btn.parentNode.querySelector(".disc__d");
        popTitle.textContent = btn.textContent.trim();
        popBody.textContent  = item ? item.textContent.trim() : "";
        pop.style.setProperty("--chip", btn.style.getPropertyValue("--chip") || "");
        opener = btn;
        pop.showModal();
      });
    });

    pop.querySelector(".pop__x").addEventListener("click", function(){ pop.close(); });

    /* the backdrop is the dialog itself — a click landing on the element
       rather than on the panel inside it is a click outside */
    pop.addEventListener("click", function(e){ if(e.target === pop) pop.close(); });

    /* put the reader back where they were */
    pop.addEventListener("close", function(){ if(opener) opener.focus(); });
  }

  /* one disclosure control per row.

     Every card keeps its own <details>, so the page still works without this;
     what the button adds is opening the whole row at once instead of card by
     card. The summaries are hidden by CSS only when the script is present. */
  $$(".disc-all").forEach(function(btn){
    var scope = document.getElementById(btn.dataset.disc);
    if(!scope) return;
    var panels = Array.prototype.slice.call(scope.querySelectorAll("details.more"));
    if(!panels.length){ btn.hidden = true; return; }

    btn.addEventListener("click", function(){
      var open = btn.getAttribute("aria-expanded") !== "true";
      panels.forEach(function(d){ d.open = open; });
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.querySelector("span").textContent = open ? "Hide detail" : "Detail and outcomes";
      /* the row grew or shrank, so the rail's own end-detection is stale */
      dispatchEvent(new Event("resize"));
    });
  });

  /* drag to pan, shared by the marquees and the rails.

     Mouse and pen only. A touch screen already drags an overflow-x container
     natively, and taking over the pointer there would mean deciding for
     ourselves whether a finger meant to pan the row or scroll the page —
     which is exactly the judgement the browser already makes correctly.

     `wrap` is passed by the marquees, whose scroll position is a loop rather
     than a range; the rails leave it out and let the browser clamp at the
     ends as usual. */
  function dragToPan(el, wrap){
    var down = false, startX = 0, startLeft = 0, moved = 0;

    el.addEventListener("pointerdown", function(e){
      if(e.pointerType === "touch") return;
      if(e.pointerType === "mouse" && e.button !== 0) return;
      down = true; moved = 0;
      startX = e.clientX; startLeft = el.scrollLeft;
      el.classList.add("is-drag");
      try{ el.setPointerCapture(e.pointerId); }catch(_){}
    });

    el.addEventListener("pointermove", function(e){
      if(!down) return;
      var dx = e.clientX - startX;
      if(Math.abs(dx) > moved) moved = Math.abs(dx);
      var to = startLeft - dx;
      el.scrollLeft = wrap ? wrap(to) : to;
      e.preventDefault();
    });

    function up(e){
      if(!down) return;
      down = false;
      el.classList.remove("is-drag");
      try{ el.releasePointerCapture(e.pointerId); }catch(_){}
    }
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    /* a drag that ends on a card must not also count as a click on it */
    el.addEventListener("click", function(e){
      if(moved > 4){ e.preventDefault(); e.stopPropagation(); }
    }, true);
    el.addEventListener("dragstart", function(e){ e.preventDefault(); });

    return { dragging: function(){ return down; } };
  }

  $$(".rail").forEach(function(rail){ dragToPan(rail); });

  /* continuous marquees — rows that travel on their own, and that the reader
     can also take hold of.

     Two identical tracks sit side by side, so a scroll position of exactly one
     track width shows the same thing as a position of zero. Travel is a frame
     by frame addition to scrollLeft, wrapped into that one-track range: the
     row never reaches an end to stop at, and because the wrap point is a place
     where the content repeats, crossing it is invisible. The seamlessness only
     holds while a track is wider than the visible row, so a short set is
     repeated until it is.

     Driving scrollLeft rather than a transform is what makes the row draggable
     at the same time: the travel and the drag are writing to the same number,
     so a reader taking hold of it does not have to fight an animation, and
     letting go does not snap it back to where the animation had got to.

     Speed is in pixels per second, so a six-card row and a three-card row
     travel at the same pace. */
  var MARQ_PX_PER_SEC = 34;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  $$(".marq").forEach(function(marq){
    var row = marq.querySelector(".marq__row");
    var track = marq.querySelector(".marq__track");
    if(!row || !track) return;
    var seed = Array.prototype.slice.call(track.children);
    if(!seed.length) return;

    var lap = 0;

    function loop(x){
      if(!lap) return x;
      x = x % lap;
      return x < 0 ? x + lap : x;
    }

    var drag = dragToPan(marq, loop);

    function build(){
      /* start from the original set every time, so a resize does not stack
         clones from the previous pass on top of the ones before it */
      while(track.children.length > seed.length) track.removeChild(track.lastChild);
      var twin = row.querySelector("[data-marq-twin]");
      if(twin) row.removeChild(twin);

      var visible = marq.clientWidth;
      var guard = 0;
      while(track.scrollWidth < visible && guard++ < 12){
        seed.forEach(function(el){ track.appendChild(el.cloneNode(true)); });
      }

      lap = track.scrollWidth;

      var copy = track.cloneNode(true);
      copy.setAttribute("data-marq-twin", "");
      copy.setAttribute("aria-hidden", "true");
      /* the duplicate is decoration; nothing in it should be tabbable */
      Array.prototype.forEach.call(copy.querySelectorAll("a,button"), function(el){
        el.setAttribute("tabindex", "-1");
      });
      row.appendChild(copy);
      marq.setAttribute("data-ready", "");
      marq.scrollLeft = loop(marq.scrollLeft);
    }

    build();

    var rt;
    addEventListener("resize", function(){
      clearTimeout(rt);
      rt = setTimeout(build, 200);
    });

    /* travel stops for anything that means the row is being read or handled:
       a pointer over it, keyboard focus inside it, a drag in progress, or the
       section being off screen entirely. */
    var hovered = false, focused = false, onScreen = true;
    marq.addEventListener("mouseenter", function(){ hovered = true; });
    marq.addEventListener("mouseleave", function(){ hovered = false; });
    marq.addEventListener("focusin",  function(){ focused = true; });
    marq.addEventListener("focusout", function(){ focused = false; });
    new IntersectionObserver(function(es){
      onScreen = es[es.length - 1].isIntersecting;
    }).observe(marq);

    /* No travel under reduced motion, and none when the page is being driven
       by a screenshot — a rAF that never settles keeps headless Chrome's
       virtual clock from going idle, the same way an infinite CSS animation
       does. The row stays draggable in both cases. */
    if(reduced || window.CESS_NO_AUTOSCROLL) return;

    var last = 0;
    requestAnimationFrame(function frame(now){
      requestAnimationFrame(frame);
      var dt = last ? now - last : 0;
      last = now;
      if(!lap || hovered || focused || !onScreen || drag.dragging()) return;
      /* a backgrounded tab hands back one enormous delta; without the clamp
         the row would leap most of a lap on the frame the reader comes back */
      if(dt > 64) dt = 64;
      marq.scrollLeft = loop(marq.scrollLeft + MARQ_PX_PER_SEC * dt / 1000);
    });
  });

  /* pinned heading, travelling objectives.

     The pinning is pure CSS (position:sticky), so the section releases on its
     own once the list runs out. What JS adds is the reading line: whichever
     objective is nearest it sits at full strength, and the ones above and
     below recede in proportion to their distance from it — so the one you
     just read fades upward as the next one arrives. */
  /* below this width the two columns collapse into one and everything is read
     in order, so the fade would only be in the way */
  var wide = matchMedia("(min-width:901px)");

  $$(".stack").forEach(function(stack){
    var objList = stack.querySelector(".stack__list");
    var objDots = stack.querySelector(".stack__dots");
    if(!objList) return;
    var objs = Array.prototype.slice.call(objList.children);
    var dots = objDots ? Array.prototype.slice.call(objDots.children) : [];
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
  });

  /* The hero recedes as the page leaves it, and the ghost wordmark drifts
     against the scroll behind it. Both ride one scroll handler, and both write
     a single property, so the frame stays cheap. */
  var mark = document.querySelector(".hero__mark");
  var heroIn = document.querySelector(".hero__in");
  var hero = document.getElementById("top");
  if((mark || heroIn) && !reduced){
    var hTick = false;
    function heroPaint(){
      var y = scrollY;
      if(mark && y < innerHeight * 1.2){
        mark.style.transform = "translateY(" + (y * -0.08).toFixed(1) + "px)";
      }
      if(heroIn && hero){
        /* fully present until the page has moved a third of the hero, then
           gone by the time the hero is behind you */
        var h = hero.offsetHeight || innerHeight;
        var gone = Math.min(1, Math.max(0, (y - h * 0.30) / (h * 0.55)));
        heroIn.style.setProperty("--gone", gone.toFixed(3));
      }
    }
    addEventListener("scroll", function(){
      if(hTick) return;
      hTick = true;
      requestAnimationFrame(function(){ hTick = false; heroPaint(); });
    }, { passive:true });
    heroPaint();
  }
})();
