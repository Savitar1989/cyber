import Phaser from "phaser";
import { SlotScene } from "./game/scenes/SlotScene";
import { DuelScene } from "./game/scenes/DuelScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  parent: "app",
  backgroundColor: "#0d0221",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },
  scene: [SlotScene, DuelScene],
};

new Phaser.Game(config);
