const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

if (loginTab && registerTab) {
  loginTab.addEventListener("click", function () {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  });
  registerTab.addEventListener("click", function () {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.style.display = "block";
    loginForm.style.display = "none";
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const messageEl = document.getElementById("loginMessage");
    try {
      messageEl.textContent = "Logging in...";
      messageEl.style.color = "#666";
      const user = await loginUser(email, password);
      messageEl.textContent = "Login successful! Redirecting...";
      messageEl.style.color = "#2E7D32";
      setTimeout(function () { window.location.href = "index.html"; }, 1000);
    } catch (error) {
      messageEl.textContent = "Error: " + error.message;
      messageEl.style.color = "#E53935";
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const phone = document.getElementById("regPhone").value;
    const address = document.getElementById("regAddress").value;
    const messageEl = document.getElementById("regMessage");
    if (password.length < 6) {
      messageEl.textContent = "Password must be at least 6 characters";
      messageEl.style.color = "#E53935";
      return;
    }
    try {
      messageEl.textContent = "Creating account...";
      messageEl.style.color = "#666";
      const user = await registerUser(name, email, password, phone, address);
      messageEl.textContent = "Account created! Redirecting...";
      messageEl.style.color = "#2E7D32";
      setTimeout(function () { window.location.href = "index.html"; }, 1000);
    } catch (error) {
      messageEl.textContent = "Error: " + error.message;
      messageEl.style.color = "#E53935";
    }
  });
}
