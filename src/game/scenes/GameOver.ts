import { Scene } from "phaser";

export class GameOver extends Scene {

  constructor() {
    super("gameOver")
  }

  create() {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    const text = this.add.text(0, 0, "You Lost!", {
      color: "#ffff",
      fontStyle: "bold",
      fontSize: "60px",
    });
    text.setX(screenWidth / 2 - text.width / 2);
    text.setY(screenHeight / 2 - text.height / 2 - 100);

    const restartText = this.add.text(0, 0, "Click anywhere on the screen to restart", {
      color: "#496933",
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