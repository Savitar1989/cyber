import Phaser from "phaser";
import { SoldierEnemy } from "../entities/SoldierEnemy";
import { NinjaEnemy } from "../entities/NinjaEnemy";
import { EnemyBase } from "../entities/EnemyBase";

export class DuelScene extends Phaser.Scene {

  private enemies: EnemyBase[] = [];
  private isRanked = false;

  private score = 0;
  private combo = 0;
  private multiplier = 1;

  private shotsFired = 0;
  private hits = 0;
  private headshots = 0;
  private misses = 0;

  private highScore = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  private crosshair!: Phaser.GameObjects.Container;

  private matchDuration = 20;
  private timeLeft = 20;
  private matchActive = true;

  private vignette!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("DuelScene");
  }

  preload() {
    this.load.image("dojo_back", "assets/dojo_back.png");
    this.load.image("dojo_mid", "assets/dojo_mid.png");
    this.load.image("dojo_floor", "assets/dojo_floor.png");
  }

  create() {

    this.highScore = Number(localStorage.getItem("cyber_highscore") || 0);

    this.input.setDefaultCursor("crosshair");

    const { width, height } = this.scale;

    const back = this.add.image(width/2, height/2, "dojo_back")
      .setDisplaySize(width, height).setDepth(0);

    const mid = this.add.image(width/2, height/2, "dojo_mid")
      .setDisplaySize(width, height).setDepth(1);

    const floor = this.add.image(width/2, height/2, "dojo_floor")
      .setDisplaySize(width, height).setDepth(2);

    this.tweens.add({
      targets: mid,
      alpha: 0.8,
      yoyo: true,
      repeat: -1,
      duration: 1800
    });

    this.vignette = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.2)
      .setDepth(50);

    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "22px",
      color: "#00ffff"
    }).setDepth(100);

    this.comboText = this.add.text(width/2, 60, "COMBO x1", {
      fontSize: "22px",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(100);

    this.timerText = this.add.text(width-20, 20, "20", {
      fontSize: "22px",
      color: "#ff00ff"
    }).setOrigin(1,0).setDepth(100);

    this.createCrosshair();
    this.startMatchTimer();
    this.startSpawning();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.matchActive) return;
      this.shotsFired++;
      this.handleShot(pointer.x, pointer.y);
    });
  }

  // ================= TIMER =================

  private startMatchTimer() {
    this.timeLeft = this.matchDuration;

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {

        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}`);

        if (this.timeLeft <= 5) {
          this.timerText.setColor("#ff0000");
          this.vignette.setAlpha(0.35);
        }

        if (this.timeLeft <= 0) {
          this.endMatch();
        }
      }
    });
  }

  // ================= SPAWN =================

  private startSpawning() {
    this.scheduleNextSpawn();
  }

  private scheduleNextSpawn() {
    if (!this.matchActive) return;

    let delay = Phaser.Math.Between(600, 1000);

    if (this.timeLeft <= 10) delay = Phaser.Math.Between(350, 700);
    if (this.timeLeft <= 5) delay = Phaser.Math.Between(150, 350);

    this.time.delayedCall(delay, () => {
      this.spawnEnemy();
      this.scheduleNextSpawn();
    });
  }

  private spawnEnemy() {
    const x = Phaser.Math.Between(80, this.scale.width - 80);
    const y = 130;

    const enemy = this.isRanked
      ? new NinjaEnemy(this, x, y)
      : new SoldierEnemy(this, x, y);

    enemy.setDepth(10);

    (enemy as any).drift = Phaser.Math.FloatBetween(-0.6, 0.6);
    (enemy as any).willDash = Phaser.Math.Between(0,100) < 35;
    (enemy as any).dashCooldown = Phaser.Math.Between(600, 1200);

    this.enemies.push(enemy);
  }

  // ================= SHOOT =================

  private handleShot(x:number, y:number) {

    this.crosshair.setPosition(x,y);

    let hitSomething = false;

    for (let enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      const headBounds = enemy.getHeadBounds();
      const bodyBounds = enemy.getBodyBounds();

      if (Phaser.Geom.Rectangle.Contains(headBounds, x, y)) {
        this.registerHit(enemy,"head");
        hitSomething = true;
        break;
      }

      if (Phaser.Geom.Rectangle.Contains(bodyBounds, x, y)) {
        this.registerHit(enemy,"body");
        hitSomething = true;
        break;
      }
    }

    if (!hitSomething) {
      this.combo = 0;
      this.multiplier = 1;
      this.misses++;
      this.updateUI();
    }
  }

  private registerHit(enemy:EnemyBase, type:"head"|"body") {

    enemy.hit(type);

    this.hits++;
    if(type==="head") this.headshots++;

    this.combo++;
    this.multiplier = 1 + this.combo*0.05;

    this.score += type==="head"
      ? Math.floor(2*this.multiplier)
      : Math.floor(1*this.multiplier);

    this.updateUI();
  }

  private updateUI(){
    this.scoreText.setText(`Score: ${this.score}`);
    this.comboText.setText(`COMBO x${this.multiplier.toFixed(2)}`);
  }

  update(_,delta:number){
    if(!this.matchActive) return;

    this.enemies.forEach(enemy=>{
      if(!enemy.isAlive) return;
      enemy.moveForward(1.0);
      enemy.x += (enemy as any).drift;
    });
  }

  // ================= END SCREEN =================

  private endMatch(){

    this.matchActive=false;
    this.enemies.forEach(e=>e.destroy());

    const {width,height} = this.scale;

    const overlay = this.add.rectangle(width/2,height/2,width,height,0x000000,0.85)
      .setDepth(500);

    const accuracy = this.shotsFired>0
      ? Math.round((this.hits/this.shotsFired)*100)
      : 0;

    const hsRate = this.hits>0
      ? Math.round((this.headshots/this.hits)*100)
      : 0;

    if(this.score > this.highScore){
      this.highScore = this.score;
      localStorage.setItem("cyber_highscore",this.score.toString());
    }

    const diff = this.score - this.highScore;

    const grade = accuracy>85 ? "S"
      : accuracy>70 ? "A"
      : accuracy>50 ? "B"
      : "C";

    const panel = this.add.container(width/2,height/2).setDepth(600);

    const bg = this.add.rectangle(0,0,520,700,0x111122)
      .setStrokeStyle(3,0x00ffff);

    panel.add(bg);

    const textStyle = {fontSize:"22px",color:"#ffffff"};

    panel.add(this.add.text(0,-300,"MATCH RESULT",{fontSize:"28px",color:"#00ffff"}).setOrigin(0.5));

    panel.add(this.add.text(0,-240,`Grade: ${grade}`,{fontSize:"26px",color:"#ff00ff"}).setOrigin(0.5));
    panel.add(this.add.text(0,-190,`Score: ${this.score}`,textStyle).setOrigin(0.5));
    panel.add(this.add.text(0,-150,`Highscore: ${this.highScore}`,textStyle).setOrigin(0.5));
    panel.add(this.add.text(0,-110,`Accuracy: ${accuracy}%`,textStyle).setOrigin(0.5));
    panel.add(this.add.text(0,-70,`Headshot Rate: ${hsRate}%`,textStyle).setOrigin(0.5));
    panel.add(this.add.text(0,-30,`Misses: ${this.misses}`,textStyle).setOrigin(0.5));

    panel.add(this.add.text(0,20,`Vs Highscore: ${diff>=0?"+":""}${diff}`,textStyle).setOrigin(0.5));

    const replayBtn = this.add.text(0,120,"PLAY AGAIN",{fontSize:"24px",backgroundColor:"#00ffff",color:"#000"})
      .setOrigin(0.5).setPadding(15).setInteractive();

    const backBtn = this.add.text(0,190,"BACK TO SLOT",{fontSize:"22px",backgroundColor:"#ff00ff",color:"#000"})
      .setOrigin(0.5).setPadding(12).setInteractive();

    replayBtn.on("pointerdown",()=>{
      this.scene.restart();
    });

    backBtn.on("pointerdown",()=>{
      this.scene.start("SlotScene");
    });

    panel.add(replayBtn);
    panel.add(backBtn);

    panel.setScale(0);

    this.tweens.add({
      targets: panel,
      scale:1,
      duration:400,
      ease:"Back.Out"
    });
  }

  private createCrosshair(){
    const circle = this.add.circle(0,0,18,0x00ffff,0.2)
      .setStrokeStyle(2,0x00ffff);

    const hLine = this.add.line(0,0,-12,0,12,0,0xffffff);
    const vLine = this.add.line(0,0,0,-12,0,12,0xffffff);

    this.crosshair = this.add.container(300,400,[circle,hLine,vLine])
      .setDepth(1000);
  }
}
