import Phaser from "phaser";
import { EnemyBase } from "./EnemyBase";

export class SoldierEnemy extends EnemyBase {

  protected createBody(): void {
    this.body = this.scene.add.rectangle(0, 20, 30, 50, 0x4444ff)
      .setOrigin(0.5);

    this.head = this.scene.add.circle(0, -15, 12, 0xffaaaa);

    const glow = this.scene.add.rectangle(0, 20, 30, 50, 0x00ffff, 0.2);

    this.add([this.body, this.head, glow]);
  }
}
