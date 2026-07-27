/* ============================================
   Login / Register — Client Logic
   Password toggle, validation, loading spinners,
   toast notifications, tab switching
   ============================================ */

(function () {
  "use strict";

  // ─── DOM refs ───
  var loginTab = document.getElementById("loginTab");
  var registerTab = document.getElementById("registerTab");
  var loginForm = document.getElementById("loginForm");
  var registerForm = document.getElementById("registerForm");

  var loginSubmitBtn = document.getElementById("loginSubmitBtn");
  var loginSpinner = document.getElementById("loginSpinner");
  var loginBtnText = document.getElementById("loginBtnText");

  var regSubmitBtn = document.getElementById("regSubmitBtn");
  var regSpinner = document.getElementById("regSpinner");
  var regBtnText = document.getElementById("regBtnText");

  // ─── Password Visibility Toggle ───
  window.togglePasswordVisibility = function (inputId, btn) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    var icon = btn.querySelector("i");
    if (icon) {
      icon.className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
    }
    btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
  };

  // ─── Toast Notification ───
  window.showToast = function (type, message) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    var icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>',
      info: '<i class="fas fa-info-circle"></i>',
    };
    toast.innerHTML = (icons[type] || icons.info) + " " + message;
    toast.className = "show";
    setTimeout(function () {
      toast.className = "";
    }, 3500);
  };

  // ─── Show / Hide Field Error ───
  function showFieldError(id, message) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.className = "auth-field-error" + (message ? " visible" : "");
    // Mark the associated input
    var input = el.previousElementSibling;
    if (input && input.tagName === "DIV" && input.classList.contains("auth-password-wrap")) {
      input = input.querySelector("input");
    }
    if (input && (input.tagName === "INPUT" || input.tagName === "TEXTAREA" || input.tagName === "SELECT")) {
      input.classList.remove("input-success");
      if (message) {
        input.classList.add("input-error");
      } else {
        input.classList.remove("input-error");
      }
    }
  }

  function clearAllFieldErrors(formId) {
    var form = document.getElementById(formId);
    if (!form) return;
    var errors = form.querySelectorAll(".auth-field-error");
    errors.forEach(function (el) {
      el.textContent = "";
      el.className = "auth-field-error";
    });
    var inputs = form.querySelectorAll("input.input-error, textarea.input-error, select.input-error");
    inputs.forEach(function (el) {
      el.classList.remove("input-error");
    });
  }

  function markFieldSuccess(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var input = el.previousElementSibling;
    if (input && input.tagName === "DIV" && input.classList.contains("auth-password-wrap")) {
      input = input.querySelector("input");
    }
    if (input && (input.tagName === "INPUT" || input.tagName === "TEXTAREA")) {
      input.classList.remove("input-error");
    }
  }

  // ─── Set loading state ───
  function setLoading(btn, spinner, btnText, loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (spinner) spinner.className = "auth-spinner" + (loading ? " visible" : "");
    if (btnText) btnText.textContent = loading ? "Please wait..." : btnText.getAttribute("data-original") || btnText.textContent;
  }

  // ─── Show form message ───
  function showFormMessage(id, message, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = message || "";
    el.className = "auth-message" + (message ? " visible " + (type || "info") : "");
  }

  // ═══════════════════════════════════════════
  // TAB SWITCHING
  // ═══════════════════════════════════════════
  function switchToLogin() {
    loginTab.classList.add("active");
    loginTab.setAttribute("aria-selected", "true");
    loginTab.tabIndex = 0;
    registerTab.classList.remove("active");
    registerTab.setAttribute("aria-selected", "false");
    registerTab.tabIndex = -1;
    loginForm.style.display = "flex";
    registerForm.style.display = "none";
    clearAllFieldErrors("loginForm");
    clearAllFieldErrors("registerForm");
    showFormMessage("loginMessage", "");
    showFormMessage("regMessage", "");
  }

  function switchToRegister() {
    registerTab.classList.add("active");
    registerTab.setAttribute("aria-selected", "true");
    registerTab.tabIndex = 0;
    loginTab.classList.remove("active");
    loginTab.setAttribute("aria-selected", "false");
    loginTab.tabIndex = -1;
    registerForm.style.display = "flex";
    loginForm.style.display = "none";
    clearAllFieldErrors("loginForm");
    clearAllFieldErrors("registerForm");
    showFormMessage("loginMessage", "");
    showFormMessage("regMessage", "");
  }

  if (loginTab && registerTab) {
    loginTab.addEventListener("click", switchToLogin);
    registerTab.addEventListener("click", switchToRegister);

    // Keyboard navigation for tabs
    loginTab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        switchToRegister();
        registerTab.focus();
      }
    });
    registerTab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        switchToLogin();
        loginTab.focus();
      }
    });
  }

  // ═══════════════════════════════════════════
  // VALIDATION HELPERS
  // ═══════════════════════════════════════════
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    if (!phone) return true; // optional
    return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
  }

  // ═══════════════════════════════════════════
  // LOGIN FORM
  // ═══════════════════════════════════════════
  if (loginForm) {
    // Save original button text
    if (loginBtnText) loginBtnText.setAttribute("data-original", loginBtnText.textContent);

    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      clearAllFieldErrors("loginForm");
      showFormMessage("loginMessage", "");

      var email = document.getElementById("loginEmail").value.trim();
      var password = document.getElementById("loginPassword").value;
      var remember = document.getElementById("rememberMe") ? document.getElementById("rememberMe").checked : false;

      // ─── Validation ───
      var hasError = false;

      if (!email) {
        showFieldError("loginEmailError", "Please enter your email address");
        hasError = true;
      } else if (!validateEmail(email)) {
        showFieldError("loginEmailError", "Please enter a valid email address");
        hasError = true;
      }

      if (!password) {
        showFieldError("loginPasswordError", "Please enter your password");
        hasError = true;
      } else if (password.length < 6) {
        showFieldError("loginPasswordError", "Password must be at least 6 characters");
        hasError = true;
      }

      if (hasError) return;

      // ─── Submit ───
      setLoading(loginSubmitBtn, loginSpinner, loginBtnText, true);

      try {
        if (remember) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        var user = await loginUser(email, password);
        showFormMessage("loginMessage", "Login successful! Redirecting...", "success");
        showToast("success", "Welcome back, " + (user.name || "") + "!");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 800);
      } catch (error) {
        showFormMessage("loginMessage", error.message, "error");
        showToast("error", error.message);
        // Highlight password on auth failure
        var pwInput = document.getElementById("loginPassword");
        if (pwInput) pwInput.classList.add("input-error");
      } finally {
        setLoading(loginSubmitBtn, loginSpinner, loginBtnText, false);
      }
    });

    // Real-time validation on blur
    document.getElementById("loginEmail").addEventListener("blur", function () {
      var val = this.value.trim();
      if (val && !validateEmail(val)) {
        showFieldError("loginEmailError", "Please enter a valid email address");
      } else if (val) {
        showFieldError("loginEmailError", "");
        this.classList.add("input-success");
      }
    });
    document.getElementById("loginPassword").addEventListener("blur", function () {
      var val = this.value;
      if (val && val.length < 6) {
        showFieldError("loginPasswordError", "Password must be at least 6 characters");
      } else if (val) {
        showFieldError("loginPasswordError", "");
        this.classList.add("input-success");
      }
    });

    // Restore remembered email
    var remembered = localStorage.getItem("rememberedEmail");
    if (remembered) {
      document.getElementById("loginEmail").value = remembered;
      var rm = document.getElementById("rememberMe");
      if (rm) rm.checked = true;
    }
  }

  // ═══════════════════════════════════════════
  // REGISTER FORM
  // ═══════════════════════════════════════════
  if (registerForm) {
    // Save original button text
    if (regBtnText) regBtnText.setAttribute("data-original", regBtnText.textContent);

    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      clearAllFieldErrors("registerForm");
      showFormMessage("regMessage", "");

      var name = document.getElementById("regName").value.trim();
      var email = document.getElementById("regEmail").value.trim();
      var password = document.getElementById("regPassword").value;
      var phone = document.getElementById("regPhone").value.trim();
      var address = document.getElementById("regAddress").value.trim();

      // ─── Validation ───
      var hasError = false;

      if (!name) {
        showFieldError("regNameError", "Please enter your full name");
        hasError = true;
      } else if (name.length < 2) {
        showFieldError("regNameError", "Name must be at least 2 characters");
        hasError = true;
      }

      if (!email) {
        showFieldError("regEmailError", "Please enter your email address");
        hasError = true;
      } else if (!validateEmail(email)) {
        showFieldError("regEmailError", "Please enter a valid email address");
        hasError = true;
      }

      if (!password) {
        showFieldError("regPasswordError", "Please create a password");
        hasError = true;
      } else if (password.length < 6) {
        showFieldError("regPasswordError", "Password must be at least 6 characters");
        hasError = true;
      }

      if (phone && !validatePhone(phone)) {
        showFieldError("regPhoneError", "Please enter a valid phone number");
        hasError = true;
      }

      if (hasError) return;

      // ─── Submit ───
      setLoading(regSubmitBtn, regSpinner, regBtnText, true);

      try {
        var user = await registerUser(name, email, password, phone || undefined, address || undefined);
        showFormMessage("regMessage", "Account created! Redirecting...", "success");
        showToast("success", "Welcome to GroceryHub, " + name + "!");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 800);
      } catch (error) {
        showFormMessage("regMessage", error.message, "error");
        showToast("error", error.message);
      } finally {
        setLoading(regSubmitBtn, regSpinner, regBtnText, false);
      }
    });

    // Real-time validation on blur
    document.getElementById("regName").addEventListener("blur", function () {
      var val = this.value.trim();
      if (val && val.length < 2) {
        showFieldError("regNameError", "Name must be at least 2 characters");
      } else if (val) {
        showFieldError("regNameError", "");
        this.classList.add("input-success");
      }
    });
    document.getElementById("regEmail").addEventListener("blur", function () {
      var val = this.value.trim();
      if (val && !validateEmail(val)) {
        showFieldError("regEmailError", "Please enter a valid email address");
      } else if (val) {
        showFieldError("regEmailError", "");
        this.classList.add("input-success");
      }
    });
    document.getElementById("regPassword").addEventListener("blur", function () {
      var val = this.value;
      if (val && val.length < 6) {
        showFieldError("regPasswordError", "Password must be at least 6 characters");
      } else if (val) {
        showFieldError("regPasswordError", "");
        this.classList.add("input-success");
      }
    });
    document.getElementById("regPhone").addEventListener("blur", function () {
      var val = this.value.trim();
      if (val && !validatePhone(val)) {
        showFieldError("regPhoneError", "Please enter a valid phone number");
      } else if (val) {
        showFieldError("regPhoneError", "");
        this.classList.add("input-success");
      }
    });
  }

})();
