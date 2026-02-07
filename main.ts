import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  backgroundColor: "#0d0221",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  scene: [BootScene],
};

new Phaser.Game(config);
