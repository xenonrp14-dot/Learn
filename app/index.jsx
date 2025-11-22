<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LEARN – Unlock Your Potential</title>

  <style>
    :root {
      --primary: #0D9488;
      --accent: #14B8A6;
      --dark-bg: #0a120eff;
      --text-light: #F1F5F9;
      --text-faint: #9CA3AF;
    }

    body {
      margin: 0;
      font-family: "Inter", Arial, sans-serif;
      background: linear-gradient(to bottom right, #000000, #0A0E12, #0F1A1F);
      color: var(--text-light);
      overflow-x: hidden;
      position: relative;
    }

    /* PURE CSS STAR FIELD */
    .starfield {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: -1;
    }

    .star {
      position: absolute;
      width: 2px;
      height: 2px;
      background: white;
      border-radius: 50%;
      opacity: 0.8;
      animation: twinkle 3s infinite ease-in-out alternate;
    }

    @keyframes twinkle {
      from { opacity: 0.2; }
      to { opacity: 1; }
    }

    /* Glow */
    .glow {
      position: absolute;
      width: 600px;
      height: 600px;
      background: rgba(20, 184, 166, 0.10);
      border-radius: 50%;
      top: 12%;
      left: 50%;
      transform: translateX(-50%);
      filter: blur(90px);
      z-index: -1;
    }

    header {
      text-align: center;
      padding: 25px 0;
      font-size: 30px;
      font-weight: 800;
      letter-spacing: 1px;
      color: var(--accent);
    }

    .container {
      max-width: 680px;
      margin: 100px auto;
      padding: 0 24px;
      text-align: center;
    }

    h1 {
      font-size: 40px;
      font-weight: 800;
      margin-bottom: 12px;
    }

    p {
      font-size: 19px;
      color: var(--text-faint);
      line-height: 1.6;
      margin-bottom: 45px;
    }

    .download-btn {
      display: inline-block;
      padding: 16px 38px;
      background: var(--primary);
      color: white;
      font-size: 19px;
      font-weight: 700;
      border-radius: 12px;
      text-decoration: none;
      transition: 0.3s ease;
      box-shadow: 0 0 20px rgba(13, 148, 136, 0.4);
    }

    .download-btn:hover {
      background: #0b7c72;
      box-shadow: 0 0 25px rgba(20, 184, 166, 0.55);
    }

    footer {
      margin-top: 100px;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: var(--text-faint);
    }
  </style>
</head>

<body>

  <div class="starfield" id="stars"></div>
  <div class="glow"></div>

  <header>LEARN</header>

  <div class="container">
    <h1>Unlock Your Potential</h1>

    <p>
      Learn smarter, grow faster, and connect with expert mentors.
      LEARN empowers you to track progress, stay motivated, and achieve excellence.
    </p>

    <a href="https://expo.dev/artifacts/eas/vGUy9RSb4vBPCoYNCUYXD8.apk" class="download-btn">
      Download App
    </a>
  </div>

  <footer>© 2025 LEARN · All rights reserved</footer>

  <script>
    // Generate 60 stars dynamically
    const starField = document.getElementById("stars");
    for (let i = 0; i < 60; i++) {
      const star = document.createElement("div");
      star.classList.add("star");
      star.style.top = Math.random() * 100 + "%";
      star.style.left = Math.random() * 100 + "%";
      star.style.animationDelay = Math.random() * 5 + "s";
      starField.appendChild(star);
    }
  </script>

</body>
</html>
