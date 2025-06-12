import { colors } from "@/tools";
import { EventBus } from "../EventBus";

export class Button {

  constructor(initData: {
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    onClick?: () => void
  }) {
    const { scene, x, y, key, onClick = () => {} } = initData;

    const circle = scene.add.circle(x, scene.scale.height / 2 + y, 20, colors["dark-first"].number as number).setOrigin(0.5, 0.5);
    const icon = scene.add.image(x, scene.scale.height / 2 + y, key)
      .setOrigin(0.5, 0.5)
      .setDepth(10);

    circle.setInteractive();
    icon.setInteractive();

    const click = () => {
      EventBus.emit("exit", () => {
        onClick();
      })
    }

    circle.on("pointerup", click);
    icon.on("pointerup", click);
  }
}