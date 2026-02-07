import Phaser from "phaser";

export class SlotScene extends Phaser.Scene {
  private spins = 50;

  private tickets = 0;
  private dice = 0;
  private boosts = 0;

  private spinText!: Phaser.GameObjects.Text;
  private inventoryText!: Phaser.GameObjects.Text;
  private spinButton!: Phaser.GameObjects.Container;
  private arenaButton!: Phaser.GameObjects.Container;

  private reels: Phaser.GameObjects.Text[] = [];
  private reelFrames: Phaser.GameObjects.Rectangle[] = [];

  private pityCounter = 0;
  private pityMax = 10;
  private overloadBar!: Phaser.GameObjects.Rectangle;

  private isSpinning = false;

  private symbols = ["T", "D", "⚡", "C", "B"];

  constructor() {
    super("SlotScene");
  }

  create() {
    this.createBackground();
    this.createTopPanel();
    this.createReelWindow();
    this.createOverloadMeter();
    this.createSpinButton();
    this.createArenaButton();
  }

  private createBackground() {
    this.add.rectangle(180, 320, 360, 640, 0x090016);

    const glow = this.add.circle(180, 220, 180, 0x6a00ff, 0.15);
    this.tweens.add({
      targets: glow,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: 2000,
    });
  }

  private createTopPanel() {
    this.add.rectangle(180, 60, 320, 80, 0x1a0033, 0.8)
      .setStrokeStyle(2, 0x00ffff);

    this.spinText = this.add.text(40, 40, `Spins: ${this.spins}`, {
      fontSize: "16px",
      color: "#00ffff",
    });

    this.inventoryText = this.add.text(40, 65, this.getInventoryText(), {
      fontSize: "14px",
      color: "#ffffff",
    });
  }

  private getInventoryText() {
    return `T:${this.tickets}  D:${this.dice}  B:${this.boosts}`;
  }

  private updateInventoryUI() {
    this.inventoryText.setText(this.getInventoryText());
  }

  private createReelWindow() {
    this.add.rectangle(180, 320, 300, 200, 0x140028)
      .setStrokeStyle(3, 0xff00ff);

    for (let i = 0; i < 3; i++) {
      const frame = this.add.rectangle(
        110 + i * 70,
        320,
        60,
        120,
        0x000000,
        0.6
      ).setStrokeStyle(2, 0x00ffff);

      const reel = this.add.text(
        110 + i * 70,
        320,
        Phaser.Utils.Array.GetRandom(this.symbols),
        {
          fontSize: "36px",
          color: "#00ffff",
        }
      ).setOrigin(0.5);

      this.reelFrames.push(frame);
      this.reels.push(reel);
    }
  }

  private createOverloadMeter() {
    this.add.text(180, 440, "OVERLOAD", {
      fontSize: "14px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.add.rectangle(180, 460, 200, 10, 0x333333);

    this.overloadBar = this.add.rectangle(80, 460, 0, 10, 0xff00ff)
      .setOrigin(0, 0.5);
  }

  private updateOverloadMeter() {
    const progress = this.pityCounter / this.pityMax;
    this.overloadBar.width = 200 * progress;
  }

  private createSpinButton() {
    const bg = this.add.rectangle(0, 0, 180, 50, 0x00ffff)
      .setStrokeStyle(3, 0xffffff);

    const text = this.add.text(0, 0, "SPIN", {
      fontSize: "22px",
      color: "#000000",
    }).setOrigin(0.5);

    this.spinButton = this.add.container(180, 520, [bg, text])
      .setSize(180, 50)
      .setInteractive();

    this.spinButton.on("pointerdown", () => this.handleSpin());
  }

  private createArenaButton() {
    const bg = this.add.rectangle(0, 0, 180, 50, 0xff00ff)
      .setStrokeStyle(3, 0xffffff);

    const text = this.add.text(0, 0, "ENTER ARENA", {
      fontSize: "18px",
      color: "#000000",
    }).setOrigin(0.5);

    this.arenaButton = this.add.container(180, 590, [bg, text])
      .setSize(180, 50)
      .setInteractive();

    this.arenaButton.on("pointerdown", () => {
      this.scene.start("DuelScene");
    });
  }

  private handleSpin() {
    if (this.spins <= 0 || this.isSpinning) return;

    this.isSpinning = true;
    this.spins--;
    this.spinText.setText(`Spins: ${this.spins}`);

    this.reels.forEach((reel, index) => {
      this.tweens.add({
        targets: reel,
        y: 320 + 10,
        duration: 50,
        yoyo: true,
        repeat: 15 + index * 5,
        onRepeat: () => {
          reel.setText(
            Phaser.Utils.Array.GetRandom(this.symbols)
          );
        },
      });
    });

    this.time.delayedCall(1000, () => {
      this.resolveReward();
      this.isSpinning = false;
    });
  }

  private resolveReward() {
    const chance = Phaser.Math.Between(1, 100);
    let reward = "nothing";

    if (chance <= 8) reward = "ticket";
    else if (chance <= 20) reward = "dice";
    else if (chance <= 30) reward = "boost";

    if (this.pityCounter >= this.pityMax) {
      reward = "jackpot";
      this.pityCounter = 0;
    }

    if (reward === "nothing") {
      this.pityCounter++;
    } else {
      this.pityCounter = 0;
      this.applyReward(reward);
    }

    this.updateOverloadMeter();
  }

  private applyReward(reward: string) {
    if (reward === "ticket") this.tickets++;
    if (reward === "dice") this.dice++;
    if (reward === "boost") this.boosts++;
    if (reward === "jackpot") this.tickets += 3;

    this.updateInventoryUI();
  }
}
