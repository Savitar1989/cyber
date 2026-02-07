import Phaser from "phaser";
import { EnemyBase } from "./EnemyBase";

export class NinjaEnemy extends EnemyBase {

  protected createBody(): void {
    this.body = this.scene.add.rectangle(0, 20, 30, 50, 0x000000)
      .setStrokeStyle(2, 0xff00ff);

    this.head = this.scene.add.circle(0, -15, 12, 0x222222)
      .setStrokeStyle(2, 0xff00ff);

    const aura = this.scene.add.circle(0, 0, 40, 0xff00ff, 0.05);

    this.add([aura, this.body, this.head]);
  }
}
