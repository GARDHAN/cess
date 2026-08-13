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
