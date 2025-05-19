import { Scene } from "phaser";
import { colors } from "../../tools";

export class Menu extends Scene {

  constructor() {
    super("Menu");
  }

  create() {
    const screenWidth = this.scale.width, screenHeight = this.scale.height;
    const textProps = {
      color: colors["dark-first"].hex as string,
      fontSize: 78,
      stroke: "#000000",
      strokeThickness: 2
    }
  
    const singlePlayerOption = this.add.text(0, 0, "SINGLE PLAYER", textProps);
    singlePlayerOption.setX(screenWidth / 2 - singlePlayerOption.width / 2);
    singlePlayerOption.setY(screenHeight / 2 - singlePlayerOption.height / 2 - 100);
    
    const multiplayerOption = this.add.text(0, 0, "MULTIPLAYER ONLINE", textProps);
    
    Phaser.Actions.AlignTo(
      [singlePlayerOption, multiplayerOption],
      Phaser.Display.Align.BOTTOM_CENTER,
      0, 10
    );

    for (const gameObject of this.children.getAll() as Phaser.GameObjects.Text[]) {
      gameObject.setInteractive();
      
      gameObject.on("pointerover", () => {
        gameObject.setColor("#ffff");
      })

      gameObject.on("pointerout", () => {
        gameObject.setColor(textProps.color);
      })

      singlePlayerOption.on("pointerup", () => {
        this.add.tween({
          targets: [singlePlayerOption, multiplayerOption],
          y: this.scale.height,
          duration: 500,
          ease: "back",
          delay: 100,
          onComplete: () => {
            this.scene.start("Game")
          }
        })
      })
    }
  }
}