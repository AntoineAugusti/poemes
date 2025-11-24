/*global SimpleWebAuthnBrowser*/
let AUTH_SERVER_URL = "https://poemes.antoine-augusti.fr/api";
if (document.location.origin == "http://localhost:8080") {
  AUTH_SERVER_URL = "http://localhost:3000";
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2)
    return decodeURIComponent(parts.pop().split(";").shift());
}

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function loginError(message) {
  if (message == "User already exists") {
    const email = getCookie("email") || document.getElementById("email").value;
    setCookie("email", email, 90);
    window.location.href = "/";
    return;
  }
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
  document.getElementById("loader").classList.add("hidden");
  document.getElementById("welcome").classList.add("hidden");
  document.getElementById("form").classList.remove("hidden");
}

async function signup(email) {
  const initResponse = await fetch(
    `${AUTH_SERVER_URL}/init-register?email=${email}`,
    { credentials: "include" },
  );
  const options = await initResponse.json();
  if (!initResponse.ok) {
    loginError(options.error);
  }

  const registrationJSON =
    await SimpleWebAuthnBrowser.startRegistration(options);

  const verifyResponse = await fetch(`${AUTH_SERVER_URL}/verify-register`, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(registrationJSON),
  });

  const verifyData = await verifyResponse.json();
  if (!verifyResponse.ok) {
    console.log(verifyData.error);
  }
  if (verifyData.verified) {
    setCookie("email", email, 90);
    console.log(`Successfully registered ${email}`);
  } else {
    console.log(`Failed to register`);
  }
}

async function login(email) {
  const initResponse = await fetch(
    `${AUTH_SERVER_URL}/init-auth?email=${email}`,
    {
      credentials: "include",
    },
  );
  const options = await initResponse.json();
  if (!initResponse.ok) {
    loginError(options.error);
  }

  const authJSON = await SimpleWebAuthnBrowser.startAuthentication(options);

  const verifyResponse = await fetch(`${AUTH_SERVER_URL}/verify-auth`, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(authJSON),
  });

  const verifyData = await verifyResponse.json();
  if (!verifyResponse.ok) {
    console.log(verifyData.error);
  }
  if (verifyData.verified) {
    setCookie("email", email, 90);
    console.log(`Successfully logged in ${email}`);
  } else {
    loginError(`Failed to log in`);
  }
}

function submitLoginForm(email) {
  document.getElementById("error-message").classList.add("hidden");
  document.getElementById("form").classList.add("hidden");
  document.getElementById("loader").classList.remove("hidden");

  document.getElementById("welcome").textContent = `Hello, ${email}`;
  document.getElementById("welcome").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  async function checkLogin() {
    if (new URLSearchParams(window.location.search).get("action") == "login") {
      let email = getCookie("email");
      if (email == undefined) {
        document
          .getElementById("form")
          .addEventListener("submit", async (event) => {
            event.preventDefault();
            email = document.getElementById("email").value;
            submitLoginForm(email);
            await login(email);
            setTimeout(async () => {
              window.location.href = "/";
            }, 2_000);
          });
      } else {
        submitLoginForm(email);
        await login(email);
        setTimeout(async () => {
          window.location.href = "/";
        }, 2_000);
      }
    }
  }

  async function checkSignup() {
    if (new URLSearchParams(window.location.search).get("action") == "signup") {
      document
        .getElementById("form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const email = document.getElementById("email").value;
          submitLoginForm(email);
          await signup(email);
          setTimeout(async () => {
            window.location.href = "/";
          }, 2_000);
        });
    }
  }

  await checkLogin();
  await checkSignup();
});
