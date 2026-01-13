<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
  <link rel="icon" type="image/png" href="favicon.png" />
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vollkorn:wght@400&family=Vollkorn:wght@700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="reset.css">
  <link rel="stylesheet" href="style.css">
  <style>
    h1 {
      font-weight: bold;
      font-size: 1.5em;
      margin-bottom: 1em;
    }
    .container {
      background-color: var(--panel-color);
      padding: 20px;
      max-width: 500px;
      margin: 2em auto;
      box-shadow: var(--shadow-color) 0px 8px 24px;
      line-height: 1.5;
      border: 3px solid var(--border-color);
    }
    .presentation {
      font-style: italic;
      margin: 2em 0;
    }
    .loader {
      margin: 2em 0;
      height: 15px;
      aspect-ratio: 5;
      background: radial-gradient(closest-side at 37.5% 50%, var(--font-color) 94%, transparent) 0/calc(80%/3) 100%;
      animation: l47 .75s infinite;
    }
    @keyframes l47 {
      100% {background-position: 36.36%}
    }
    input {
      width: 80%;
      padding: 10px;
      margin-bottom: 1em;
      background: var(--search-bg);
      border: 1px solid var(--border-color);
      color: var(--font-color);
      font-family: "Vollkorn", serif;
      font-size: 1em;
    }
    input::placeholder {
      color: var(--font-color-muted);
    }
    label {
      display: block;
      color: var(--font-color);
    }
    .btn-grad {
      background: var(--accent-color);
      margin: 10px;
      padding: 1em 1.5em;
      text-align: center;
      transition: 0.3s ease all;
      color: var(--font-color-on-accent);
      box-shadow: var(--shadow-color) 0px 4px 12px;
      border-radius: 10px;
      cursor: pointer;
      display: inline-block;
      border: 0;
      font-size: 1em;
      font-family: "Vollkorn", serif;
    }
    .btn-grad:hover {
      filter: brightness(1.1);
    }
    hr {
      border: 1px solid var(--border-color);
      width: 100%;
      margin-bottom: 2em;
    }
    #form {
      width: 80%;
      text-align: center;
    }
    #error-message {
      border: 3px solid var(--accent-color);
      padding: 1em 2em;
      margin-bottom: 2em;
      color: var(--accent-color);
      background: var(--panel-color-alt);
    }
    #welcome {
      font-size: .6em;
      font-style: italic;
    }
  </style>
  <script src="https://unpkg.com/@simplewebauthn/browser@9.0.1/dist/bundle/index.umd.min.js" integrity="sha384-9+Bm5pUMP2324xMjhRahdomA9HaTxP6JcMhbl3tUAcV2+Jiohq8/T+dGj/rx/MaM" crossorigin="anonymous"></script>
</head>
<body>
  <div class="container">
    <h1>Poèmes</h1>
    <p class="presentation">
      Des mots alignés,<br>
      Une éternité à rimer.
    </p>
    <hr>
    <div class="hidden" id="error-message"></div>
    <form id="form">
      <label for="email">E-mail</label>
      <input type="email" id="email" required>
      <label for="password" id="password-label" class="hidden">Mot de passe</label>
      <input type="password" id="password" class="hidden">
      <button class="btn-grad" id="submit">Se connecter</button>
    </form>
    <div class="hidden" id="welcome"></div>
    <div class="loader hidden" id="loader"></div>
  </div>
  <script type="text/javascript" src="login.js"></script>
  <script>
    const action = new URLSearchParams(window.location.search).get("action");
    if (action == undefined) {
      window.location.href = "?action=login"
    }
  </script>
</body>
</html>