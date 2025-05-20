import { colors } from "@/tools";
import { Scene } from "phaser";

export class GameEnd extends Scene {

  constructor() {
    super("GameEnd")
  }

  create(data: { backgroundColorName: string, winner: boolean }) {
    this.cameras.main.setBackgroundColor(colors[data.backgroundColorName].hex as string);
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    const text = this.add.text(0, 0, data.winner ? "Congratulations, You Won!" : "You Lost!", {
      color: "#ffff",
      fontStyle: "bold",
      fontSize: "60px",
    });
    text.setX(screenWidth / 2 - text.width / 2);
    text.setY(screenHeight / 2 - text.height / 2 - 100);

    const restartText = this.add.text(0, 0, "Click anywhere on the screen to restart", {
      color: colors["dark-"+data.backgroundColorName].hex as string,
      fontStyle: "bold",
      fontSize: "30px",
    });
    restartText.setX(screenWidth / 2 - restartText.width / 2);
    restartText.setY(screenHeight / 2 - restartText.height / 2 - 40);

    this.input.on ("pointerup", () => {
      this.scene.start("Menu")
    })
  }
}