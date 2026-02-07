import Phaser from "phaser";

export abstract class EnemyBase extends Phaser.GameObjects.Container {

  protected head!: Phaser.GameObjects.Circle;
  protected body!: Phaser.GameObjects.Rectangle;

  public isAlive = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    scene.add.existing(this);

    this.createBody();
  }

  protected abstract createBody(): void;

  public moveForward(speed: number) {
    this.y += speed;

    // Scale for depth
    const scale = Phaser.Math.Clamp(this.y / 500, 0.5, 1.2);
    this.setScale(scale);
  }

  public hit(type: "head" | "body") {
    this.isAlive = false;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }

  public getHeadBounds() {
    return this.head.getBounds();
  }

  public getBodyBounds() {
    return this.body.getBounds();
  }
}
