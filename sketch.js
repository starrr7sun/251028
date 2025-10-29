let table;
let pool = [];
let quiz = [];
let current = 0;
let selected = -1;
let score = 0;
let finished = false;
let showAnswer = false;
let confetti = [];
let fireworks = [];

// 新增全域變數
let textFlashHue = 0;
let isTextFlashing = false;

function preload() {
  // 把 questions.csv 放在同一個資料夾（相對路徑）
  // CSV 欄位：question, optionA, optionB, optionC, optionD, answer, explanation
  table = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  textFont('Arial');
  textSize(16);
  noStroke();

  // 將 table 轉成陣列
  for (let r = 0; r < table.getRowCount(); r++) {
    const row = table.getRow(r);
    pool.push({
      q: row.get('question'),
      choices: [
        row.get('optionA'),
        row.get('optionB'),
        row.get('optionC'),
        row.get('optionD')
      ],
      answer: (row.get('answer') || 'A').trim().toUpperCase(),
      explain: row.get('explanation') || ''
    });
  }

  // 隨機抽題（若題庫不足則取全部）
  shuffleArray(pool);
  const num = min(5, pool.length);
  quiz = pool.slice(0, num);
}

function draw() {
  background(30, 35, 48);

  if (!finished) {
    // 題目區域調整
    let item = quiz[current];
    fill(255);
    
    // 題號置中
    textSize(20);
    textAlign(CENTER, CENTER);
    text(`題目 ${current + 1} / ${quiz.length}`, width/2, height * 0.1);
    
    // 題目文字完全置中
    textSize(24);
    textAlign(CENTER, CENTER);
    textWrap(WORD);
    rectMode(CENTER);
    text(item.q, width/2, height * 0.2, width * 0.8, height * 0.15);
    rectMode(CORNER);  // 重設為預設值，避免影響其他元素

    // 選項區域調整至中間
    const optX = width * 0.2;
    const optWidth = width * 0.6;
    let optY = height * 0.35;
    let h = 60;
    
    for (let i = 0; i < item.choices.length; i++) {
      // 滑鼠懸停效果
      let isHover = mouseX > optX && mouseX < optX + optWidth && 
                    mouseY > optY && mouseY < optY + h;
      
      // 背景
      let boxColor = color(50, 60, 80);
      if (showAnswer) {
        const letter = String.fromCharCode(65 + i);
        if (letter === item.answer) boxColor = color(60, 140, 60);
        else if (i === selected && letter !== item.answer) boxColor = color(180, 60, 60);
      } else if (i === selected) {
        boxColor = color(80, 110, 160);
      } else if (isHover) {
        // 滑鼠懸停時的顏色
        boxColor = color(70, 80, 100);
      }
      
      // 繪製選項背景
      fill(boxColor);
      rect(optX, optY, optWidth, h, 12);

      // 繪製選項文字
      fill(255);
      textSize(18);
      textAlign(LEFT, CENTER);
      text(`${String.fromCharCode(65 + i)}. ${item.choices[i]}`, 
           optX + 20, optY + h/2);
      
      optY += h + 15;
    }

    // 提示/說明文字置中
    textAlign(CENTER, TOP);
    textSize(16);
    fill(200);
    if (showAnswer) {
      text(`說明: ${item.explain}`, width/2, height * 0.85, width * 0.8);
      drawButton('下一題', width/2 - 50, height * 0.92, 100, 40);
    } else {
      drawButton('提交答案', width/2 - 50, height * 0.92, 100, 40);
    }

  } else {
    // 結果畫面
    textAlign(CENTER, CENTER);
    
    // 高分時文字閃爍效果
    if (score >= 4) {
      isTextFlashing = true;
      colorMode(HSB);
      textFlashHue = (textFlashHue + 2) % 360;  // 讓顏色循環
      fill(textFlashHue, 80, 100);
      
      // 標題
      textSize(28);
      text(`測驗完成！`, width/2, height * 0.3);
      
      // 分數
      textSize(24);
      text(`分數：${score} / ${quiz.length}`, width/2, height * 0.4);
      
      // 回饋文字
      const pct = score / quiz.length;
      let feedback = '';
      if (pct === 1) feedback = '完美！你完全掌握了！';
      else if (pct >= 0.8) feedback = '表現優異！只差一點點！';
      else if (pct >= 0.6) feedback = '不錯的表現！';
      else feedback = '繼續加油！';
      
      textSize(20);
      text(feedback, width/2, height * 0.5);
      
      // 煙火特效
      updateFireworks();
      drawFireworks();
    } else {
      // 低分時使用白色文字
      colorMode(RGB);
      fill(255);
      
      // 標題
      textSize(28);
      text(`測驗完成！`, width/2, height * 0.3);
      
      // 分數
      textSize(24);
      text(`分數：${score} / ${quiz.length}`, width/2, height * 0.4);
      
      // 回饋文字
      const pct = score / quiz.length;
      let feedback = '';
      if (pct === 1) feedback = '完美！你完全掌握了！';
      else if (pct >= 0.8) feedback = '表現優異！只差一點點！';
      else if (pct >= 0.6) feedback = '不錯的表現！';
      else feedback = '繼續加油！';
      
      textSize(20);
      text(feedback, width/2, height * 0.5);
    }

    // 重設顏色模式回 RGB
    colorMode(RGB);
    // 重試按鈕永遠是白色文字
    fill(255);
    drawButton('重試', width/2 - 50, height * 0.8, 100, 40);
  }
}

// 按鈕繪製輔助
function drawButton(label, x, y, w, h) {
  fill(80, 130, 200);
  rect(x, y, w, h, 8);
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
}

function mousePressed() {
  if (quiz.length === 0) return;
  
  if (!finished) {
    const optX = width * 0.2;
    const optWidth = width * 0.6;
    let optY = height * 0.35;
    let h = 60;

    // 檢查是否點擊選項
    for (let i = 0; i < 4; i++) {
      if (mouseX > optX && mouseX < optX + optWidth && 
          mouseY > optY && mouseY < optY + h) {
        if (!showAnswer) {
          selected = i;
        }
        return; // 避免觸發其他按鈕
      }
      optY += h + 15;
    }

    // 修正提交/下一題按鈕的點擊區域
    const bx = width/2 - 50;
    const by = height * 0.92;
    const bw = 100;
    const bh = 40;
    
    if (mouseX > bx && mouseX < bx + bw && 
        mouseY > by && mouseY < by + bh) {
      if (!showAnswer) {
        if (selected === -1) {
          flashRed();
          return;
        }
        // 評分
        const chosenLetter = String.fromCharCode(65 + selected);
        if (chosenLetter === quiz[current].answer) score++;
        showAnswer = true;
      } else {
        // 下一題或結束
        current++;
        selected = -1;
        showAnswer = false;
        if (current >= quiz.length) {
          finished = true;
          if (score >= 4) {
            fireworks = [];
          }
          spawnConfetti(score);
        }
      }
    }
  } else {
    // 重試按鈕
    const bx = width/2 - 50;
    const by = height * 0.8;
    const bw = 100;
    const bh = 40;
    if (mouseX > bx && mouseX < bx + bw && 
        mouseY > by && mouseY < by + bh) {
      restartQuiz();
    }
  }
}

// 進度條重新配置
function drawProgress() {
  const px = width * 0.1;
  const py = height - 20;
  const pw = width * 0.8;
  const ph = 8;
  fill(70);
  rect(px, py, pw, ph, 6);
  fill(120, 200, 140);
  const prog = (current + (showAnswer ? 1 : 0)) / quiz.length;
  rect(px, py, pw * prog, ph, 6);
}

// 工具：亂序
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

// 短暫閃紅提示（簡單實作）
let flashTimer = 0;
function flashRed() {
  flashTimer = 20;
  const interval = setInterval(() => {
    flashTimer--;
    if (flashTimer <= 0) clearInterval(interval);
  }, 30);
}
function updateFlash() {
  if (flashTimer > 0) {
    push();
    fill(255, 0, 0, map(flashTimer, 20, 0, 80, 0));
    rect(0, 0, width, height);
    pop();
  }
}

// confetti 系統
class Confetti {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-2, 2), random(-6, -2));
    this.size = random(6, 12);
    this.col = col;
    this.life = 180;
    this.rot = random(TWO_PI);
    this.avel = random(-0.1, 0.1);
  }
  update() {
    this.vel.y += 0.08;
    this.pos.add(this.vel);
    this.rot += this.avel;
    this.life--;
  }
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rot);
    noStroke();
    fill(this.col);
    rect(0, 0, this.size, this.size * 0.6);
    pop();
  }
  isDead() {
    return this.life <= 0 || this.pos.y > height + 20;
  }
}

function spawnConfetti(score) {
  // 根據得分產生數量
  const count = map(score, 0, quiz.length, 20, 120);
  for (let i = 0; i < count; i++) {
    const x = random(width * 0.2, width * 0.8);
    const y = random(-100, -20);
    const c = color(random(100, 255), random(100, 255), random(100, 255));
    confetti.push(new Confetti(x, y, c));
  }
}

function updateConfetti() {
  for (let i = confetti.length - 1; i >= 0; i--) {
    confetti[i].update();
    if (confetti[i].isDead()) confetti.splice(i, 1);
  }
}

// 新增煙火特效系統
class Firework {
  constructor() {
    this.x = random(width * 0.2, width * 0.8);
    this.y = height;
    this.targetY = random(height * 0.2, height * 0.6);
    this.speed = random(8, 12);
    this.particles = [];
    this.exploded = false;
    this.hue = random(360);
  }

  update() {
    if (!this.exploded) {
      this.y -= this.speed;
      if (this.y <= this.targetY) {
        this.explode();
      }
    }
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].lifetime <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  explode() {
    this.exploded = true;
    for (let i = 0; i < 50; i++) {
      const angle = random(TWO_PI);
      const speed = random(2, 6);
      const vx = cos(angle) * speed;
      const vy = sin(angle) * speed;
      this.particles.push(new Particle(this.x, this.y, vx, vy, this.hue));
    }
  }

  draw() {
    if (!this.exploded) {
      stroke(255);
      strokeWeight(4);
      point(this.x, this.y);
    }
    
    for (let p of this.particles) {
      p.draw();
    }
  }

  isDead() {
    return this.exploded && this.particles.length === 0;
  }
}

class Particle {
  constructor(x, y, vx, vy, hue) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.lifetime = 100;
    this.hue = hue;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;
    this.lifetime -= 2;
  }

  draw() {
    // 修正：加上缺少的 if 左括號
    if (this.lifetime > 0) {  // 這裡原本少了一個左括號
      colorMode(HSB);
      stroke(this.hue, 100, 100, map(this.lifetime, 0, 100, 0, 1));
      strokeWeight(2);
      point(this.x, this.y);
      colorMode(RGB);
    }
  }
}

function updateFireworks() {
  if (random(1) < 0.05) {
    fireworks.push(new Firework());
  }

  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    if (fireworks[i].isDead()) {
      fireworks.splice(i, 1);
    }
  }
}

function drawFireworks() {
  for (let fw of fireworks) {
    fw.draw();
  }
}

// 重設測驗
function restartQuiz() {
  // 重設題目相關
  shuffleArray(pool);
  quiz = pool.slice(0, min(5, pool.length));
  current = 0;
  selected = -1;
  score = 0;
  finished = false;
  showAnswer = false;
  
  // 清除特效
  confetti = [];
  fireworks = [];
  
  // 重設文字效果
  isTextFlashing = false;
  textFlashHue = 0;
  
  // 重設顏色模式與樣式
  colorMode(RGB);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  noStroke();
  
  // 重設畫面閃爍
  flashTimer = 0;
  if (window.interval) {
    clearInterval(window.interval);
  }
}

// 把 updateFlash 放到預設 draw 後層
let _draw = draw;
draw = function() {
  _draw();
  updateFlash();
};

// 新增視窗調整響應
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
