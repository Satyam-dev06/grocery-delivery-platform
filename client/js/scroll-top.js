/**
 * Scroll-to-Top Button - standalone, no dependencies.
 * Shows when scrolled past 300px, hides otherwise.
 */
(function () {
  var btn = document.getElementById("scrollTop");
  if (!btn) return;
  var ticking = false;
  function update() {
    var y = window.scrollY || window.pageYOffset;
    btn.classList.toggle("visible", y > 300);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  });
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  update();
})();
