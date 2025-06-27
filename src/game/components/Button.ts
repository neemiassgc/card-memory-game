import { colors } from "@/tools";
import { EventBus } from "../EventBus";

export class Button {

  constructor(initData: {
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    onConfirmation?: () => void,
    onDecline?: () => void,
    onClick?: () => void,
  }) {
    const empty = () => {};
    const { scene, x, y, key, onConfirmation = empty, onClick = empty, onDecline = empty } = initData;

    const circle = scene.add.circle(x, scene.scale.height / 2 + y, 20, colors["dark-first"].number as number).setOrigin(0.5, 0.5);
    const icon = scene.add.image(x, scene.scale.height / 2 + y, key)
      .setOrigin(0.5, 0.5)
      .setDepth(10);

    circle.setInteractive();
    icon.setInteractive();

    const click = () => {
      onClick();
      EventBus.emit("exit", onConfirmation, onDecline);
    }

    circle.on("pointerup", click);
    icon.on("pointerup", click);

    scene.events.on("set-bg", (color: string) => circle.setFillStyle(colors[`dark-${color}`].number as number))
  }
}