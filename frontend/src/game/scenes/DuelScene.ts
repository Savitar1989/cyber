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

  create() {
    this.createBackgroundLayers();
    this.createUI();
    this.createCrosshair();
    this.startMatchTimer();
    this.startSpawning();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.matchActive) {
        this.handleShot(pointer.x, pointer.y);
      }
    });
  }

  // ================= BACKGROUND =================

  private createBackgroundLayers() {

    // Base dark
    this.add.rectangle(180, 320, 360, 640, 0x080014);

    // Neon glow pulse
    const glow = this.add.circle(180, 180, 220, 0x6a00ff, 0.12);
    this.tweens.add({
      targets: glow,
      alpha: 0.25,
      yoyo: true,
      repeat: -1,
      duration: 2500
    });

    // Dojo wall panel
    const wall = this.add.rectangle(180, 220, 360, 220, 0x120022);
    wall.setStrokeStyle(3, 0xff00ff);

    // Floor gradient depth
    const floor = this.add.rectangle(180, 460, 360, 300, 0x000000, 0.4);

    // Neon floor lines
    for (let i = 0; i < 6; i++) {
      const line = this.add.line(
        180,
        380 + i * 25,
        0,
        0,
        360,
        0,
        0x00ffff
      );
      line.setAlpha(0.2 - i * 0.02);
    }

    // Vignette
    this.vignette = this.add.rectangle(180, 320, 360, 640, 0x000000, 0.2);
  }

  // ================= UI =================

  private createUI() {
    this.scoreText = this.add.text(20, 20, `Score: 0`, {
      fontSize: "18px",
      color: "#00ffff",
    });

    this.comboText = this.add.text(180, 60, `COMBO x1`, {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.timerText = this.add.text(300, 20, `20`, {
      fontSize: "18px",
      color: "#ff00ff",
    });
  }

  private updateUI() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.comboText.setText(`COMBO x${this.multiplier.toFixed(2)}`);
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

    const delay = Phaser.Math.Between(400, 1100);

    this.time.delayedCall(delay, () => {
      this.spawnEnemy();
      this.scheduleNextSpawn();
    });
  }

  private spawnEnemy() {
    const x = Phaser.Math.Between(80, 280);
    const y = 130;

    let enemy: EnemyBase;

    if (this.isRanked) {
      enemy = new NinjaEnemy(this, x, y);
    } else {
      enemy = new SoldierEnemy(this, x, y);
    }

    // Shadow
    const shadow = this.add.ellipse(x, 500, 40, 10, 0x000000, 0.4);
    (enemy as any).shadow = shadow;

    (enemy as any).drift = Phaser.Math.FloatBetween(-0.6, 0.6);
    (enemy as any).willDash = Phaser.Math.Between(0, 100) < 30;
    (enemy as any).dashCooldown = Phaser.Math.Between(800, 1500);

    this.enemies.push(enemy);
  }

  // ================= SHOOT =================

  private handleShot(x: number, y: number) {

    // Crosshair jump
    this.tweens.add({
      targets: this.crosshair,
      x,
      y,
      duration: 60,
      ease: "Power2"
    });

    let hitSomething = false;

    for (let enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      const headBounds = enemy.getHeadBounds();
      const bodyBounds = enemy.getBodyBounds();

      if (Phaser.Geom.Rectangle.Contains(headBounds, x, y)) {
        this.registerHit(enemy, "head", x, y);
        hitSomething = true;
        break;
      }

      if (Phaser.Geom.Rectangle.Contains(bodyBounds, x, y)) {
        this.registerHit(enemy, "body", x, y);
        hitSomething = true;
        break;
      }
    }

    if (!hitSomething) {
      this.combo = 0;
      this.multiplier = 1;
      this.updateUI();
    }
  }

  private registerHit(enemy: EnemyBase, type: "head" | "body", x: number, y: number) {

    enemy.hit(type);

    // Particle burst
    const burst = this.add.circle(x, y, 6, 0xffff00);
    this.tweens.add({
      targets: burst,
      scale: 3,
      alpha: 0,
      duration: 300,
      onComplete: () => burst.destroy()
    });

    this.combo++;
    this.multiplier = 1 + this.combo * 0.05;

    if (type === "head") {
      this.score += Math.floor(2 * this.multiplier);
      this.cameras.main.shake(120, 0.012);
    } else {
      this.score += Math.floor(1 * this.multiplier);
      this.cameras.main.shake(50, 0.006);
    }

    this.updateUI();
  }

  // ================= UPDATE =================

  update(_, delta: number) {
    if (!this.matchActive) return;

    this.enemies.forEach(enemy => {
      if (!enemy.isAlive) return;

      enemy.moveForward(0.9);
      enemy.x += (enemy as any).drift;

      // Shadow follow
      if ((enemy as any).shadow) {
        (enemy as any).shadow.x = enemy.x;
      }

      // Dash
      if ((enemy as any).willDash) {
        (enemy as any).dashCooldown -= delta;
        if ((enemy as any).dashCooldown <= 0) {
          const dash = Phaser.Math.Between(-60, 60);
          this.tweens.add({
            targets: enemy,
            x: enemy.x + dash,
            duration: 150,
            ease: "Power3"
          });
          (enemy as any).dashCooldown = Phaser.Math.Between(1200, 2000);
        }
      }

      if (enemy.y > 500) {
        enemy.destroy();
        enemy.isAlive = false;
      }
    });
  }

  // ================= END =================

  private endMatch() {
    this.matchActive = false;

    this.enemies.forEach(e => e.destroy());
    this.enemies = [];

    const overlay = this.add.rectangle(180, 320, 360, 640, 0x000000, 0.75);

    const title = this.add.text(180, 250, "MATCH OVER", {
      fontSize: "28px",
      color: "#ffffff",
    }).setOrigin(0.5);

    const scoreText = this.add.text(180, 310, `Score: ${this.score}`, {
      fontSize: "22px",
      color: "#00ffff",
    }).setOrigin(0.5);

    const backBtn = this.add.text(180, 380, "BACK TO SLOT", {
      fontSize: "20px",
      backgroundColor: "#ff00ff",
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive();

    backBtn.on("pointerdown", () => {
      this.scene.start("SlotScene");
    });
  }

  // ================= CROSSHAIR =================

  private createCrosshair() {
    const circle = this.add.circle(180, 350, 18, 0x00ffff, 0.2)
      .setStrokeStyle(2, 0x00ffff);

    const hLine = this.add.line(180, 350, -12, 0, 12, 0, 0xffffff);
    const vLine = this.add.line(180, 350, 0, -12, 0, 12, 0xffffff);

    this.crosshair = this.add.container(180, 350, [circle, hLine, vLine]);

    this.tweens.add({
      targets: circle,
      scale: 1.1,
      yoyo: true,
      repeat: -1,
      duration: 1000
    });
  }
}


