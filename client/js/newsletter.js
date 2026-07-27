// Newsletter functionality is now handled by app.js subscribeNewsletter()
// This file provides Enter key support to trigger the app.js handler

const subInput = document.querySelector(".newsletter-form input");

if (subInput) {
  subInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (typeof subscribeNewsletter === "function") {
        subscribeNewsletter();
      }
    }
  });
}
