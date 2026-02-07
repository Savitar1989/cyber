import Phaser from "phaser";
import { MenuScene } from "./MenuScene";
import { SlotScene } from "./SlotScene";
this.scene.start("SlotScene");


export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // ide jönnek assetek később
  }

  create() {
    this.scene.start("MenuScene");
  }
}
