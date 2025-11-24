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
      background-color: #fff;
      padding: 20px;
      max-width: 500px;
      margin: 2em auto;
      box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
      line-height: 1.5;
    }
    @keyframes gradient {
      0% {
        background-position: 0% 50%;
      }

      50% {
        background-position: 100% 50%;
      }

      100% {
        background-position: 0% 50%;
      }
    }
    .gradient {
      background: linear-gradient(-45deg, #777, #333, #444, #555);
      background-size: 400% 400%;
      animation: gradient 10s  ease infinite;
    }
    .presentation {
      font-style: italic;
      margin: 2em 0;
    }
    .loader {
      margin: 2em 0;
      height: 15px;
      aspect-ratio: 5;
      background: radial-gradient(closest-side at 37.5% 50%,#000 94%,#0000) 0/calc(80%/3) 100%;
      animation: l47 .75s infinite;
    }
    @keyframes l47 {
      100% {background-position: 36.36%}
    }
    input[type="email"] {
      width: 80%;
      padding: 10px;
      margin-bottom: 1em;
    }
   .btn-grad {background-image: linear-gradient(to right, #777 0%, #555  51%, #777 100%)}
   .btn-grad {
      margin: 10px;
      padding: 1em 1.5em;
      text-align: center;
      transition: 0.5s;
      background-size: 200% auto;
      color: white;
      box-shadow: 0 0 20px #666;
      border-radius: 10px;
      display: block;
      cursor: pointer;
      display: inline-block;
      border: 0;
      font-size: 1em;
    }
    .btn-grad:hover {
      background-position: right center;
      color: #fff;
      text-decoration: none;
    }
    hr {
      border: 1px solid #ccc;
      width: 100%;
      margin-bottom: 2em;
    }
    #form {
      width: 80%;
      text-align: center;
    }
    #error-message {
      border: 5px solid #ccc;
      padding: 1em 2em;
      margin-bottom: 2em;
      color: #c0392b;
    }
    #welcome {
      font-size: .6em;
      font-style: italic;
    }
  </style>
  <script src="https://unpkg.com/@simplewebauthn/browser@9.0.1/dist/bundle/index.umd.min.js" integrity="sha384-9+Bm5pUMP2324xMjhRahdomA9HaTxP6JcMhbl3tUAcV2+Jiohq8/T+dGj/rx/MaM" crossorigin="anonymous"></script>
</head>
<body class="gradient">
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