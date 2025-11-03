<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <title>Element Shift Dash — Mobile</title>
  <style>
    :root{--bg:#020014;--panel:rgba(255,255,255,0.03);--accent1:#7b5cff;--accent2:#2bb7ff;}
    html,body{height:100%;margin:0;background:var(--bg);font-family:Inter,Arial,Helvetica,sans-serif;-webkit-tap-highlight-color:transparent}
    #container{position:relative;width:100%;height:100vh;overflow:hidden;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start}
    /* Top bar */
    .topbar{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));box-shadow:0 6px 20px rgba(0,0,0,0.35);z-index:80}
    .top-left,.top-right{color:#e9e7ff;font-weight:700;font-size:15px}
    .top-center{color:#dcdcff;font-size:13px;opacity:.9}
    /* Canvas area */
    #stage{flex:1;position:relative;display:block;touch-action:none}
    canvas#renderCanvas{width:100%;height:100%;display:block}
    /* hint footer */
    .hint{position:absolute;left:12px;right:12px;bottom:14px;text-align:center;color:rgba(230,230,255,0.62);z-index:50;font-size:13px;pointer-events:none}
    /* touch zones */
    #leftZone,#rightZone{position:absolute;top:0;bottom:0;width:50%;z-index:60}
    #leftZone{left:0}#rightZone{right:0}
    /* UI panels */
    .uiPanel{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:120;pointer-events:auto}
    .panel{background:linear-gradient(135deg,var(--panel),rgba(255,255,255,0.015));padding:16px;border-radius:14px;color:#eaeaff;text-align:center;width:86%;max-width:480px;box-shadow:0 12px 40px rgba(80,40,160,0.12)}
    .btn{background:linear-gradient(90deg,var(--accent1),var(--accent2));color:#fff;padding:12px 18px;border-radius:12px;border:none;font-weight:700;cursor:pointer;margin:10px;font-size:16px}
    .smallBtn{background:transparent;border:1px solid rgba(255,255,255,0.06);color:#ddd;padding:8px 10px;border-radius:8px;cursor:pointer;margin:8px}
    .gameoverTitle{font-size:28px;color:#fff;margin-bottom:6px}
    /* responsive tweaks for very tall phones */
    @media(min-aspect-ratio:9/16){ #container{max-width:700px;margin:0 auto} }
  </style>
</head>
<body>
  <div id="container">
    <div class="topbar">
      <div class="top-left" id="scoreHud">Score: 0</div>
      <div class="top-center">Element Shift — Portal</div>
      <div class="top-right" id="speedHud">Speed: 1</div>
    </div>

    <div id="stage">
      <canvas id="renderCanvas" tabindex="0"></canvas>

      <div id="leftZone"></div>
      <div id="rightZone"></div>

      <div class="hint" id="hintText">Tap LEFT to change element • Tap RIGHT to change color</div>

      <!-- Start UI -->
      <div class="uiPanel" id="startUI">
        <div class="panel">
          <h1 style="margin:0 0 8px 0;color:#eef;font-size:22px">Element Shift Dash</h1>
          <div style="color:#dcdcff;margin-bottom:10px">Portal Edition — match element & color to pass</div>
          <div style="margin:8px 0">
            <button id="playBtn" class="btn">Play</button>
            <button id="howBtn" class="smallBtn">How</button>
          </div>
          <div id="bestOnStart" style="color:#bfe;margin-top:8px;font-size:13px"></div>
        </div>
      </div>

      <!-- Game Over UI -->
      <div class="uiPanel" id="gameOverUI" style="display:none;pointer-events:auto">
        <div class="panel">
          <div class="gameoverTitle">Game Over</div>
          <div style="margin-top:8px">Score: <strong id="finalScore">0</strong></div>
          <div style="color:#b6f0ff;margin-top:6px">Best: <strong id="bestScore">0</strong></div>
          <div style="margin-top:12px">
            <button id="retryBtn" class="btn">Play Again</button>
            <button id="homeBtn" class="smallBtn">Home</button>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- BabylonJS CDN -->
  <script src="https://cdn.babylonjs.com/babylon.js"></script>
  <!-- Game script (separate file) -->
  <script src="game.js"></script>
</body>
</html>