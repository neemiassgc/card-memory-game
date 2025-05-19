import { Scene } from "phaser";
import { colors } from "../../tools";
import { EventBus } from "../EventBus";

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
    singlePlayerOption.setY(screenHeight);
    
    const multiplayerOption = this.add.text(0, 0, "MULTIPLAYER ONLINE", textProps);
    multiplayerOption.setX(screenWidth / 2 - multiplayerOption.width / 2);
    multiplayerOption.setY(screenHeight);

    const hardOption = this.add.text(0, 0, "HARD", textProps);
    hardOption.setX(screenWidth / 2 - hardOption.width / 2);
    hardOption.setY(screenHeight);

    const easyOption = this.add.text(0, 0, "EASY", textProps);
    easyOption.setX(screenWidth / 2 - easyOption.width / 2);
    easyOption.setY(screenHeight);

    for (const gameObject of this.children.getAll() as Phaser.GameObjects.Text[]) {
      gameObject.setInteractive();
      
      gameObject.on("pointerover", () => {
        gameObject.setColor("#ffff");
      })

      gameObject.on("pointerout", () => {
        gameObject.setColor(textProps.color);
      })
    }

    const tween = {
      paused: true,
      y: this.scale.height,
      duration: 500,
      ease: "back",
      delay: 100,
    }

    const revealDifficultyOptions = [
      this.add.tween({
        ...tween,
        targets: hardOption,
        y: this.scale.height / 2 - hardOption.height / 2 - 100,
      }),
      this.add.tween({
        ...tween,
        targets: easyOption,
        y: this.scale.height / 2 - easyOption.height / 2 - 30
      }),
    ]

    singlePlayerOption.on("pointerup", () => {
      this.add.tween({
        ...tween,
        paused: false,
        targets: [singlePlayerOption, multiplayerOption],
        onComplete: () => {
          revealDifficultyOptions.forEach(it => it.play());
        }
      })
    })

    const startGame = (difficulty: string) => {
      this.add.tween({
        ...tween,
        paused: false,
        targets: [hardOption, easyOption],
        onComplete: () => {
          this.scene.start("Gameplay", { mode: difficulty })
        }
      })
    }

    hardOption.on("pointerup", () => startGame("HARD"));
    easyOption.on("pointerup", () => startGame("EASY"));

    this.add.tween({
      ...tween,
      paused: false,
      targets: singlePlayerOption,
      y: screenHeight / 2 - singlePlayerOption.height / 2 - 100
    })  
        
    this.add.tween({
      ...tween,
      paused: false,
      targets: multiplayerOption,
      y: screenHeight / 2 - multiplayerOption.height / 2 - 30
    })

    EventBus.emit("change-background-color", colors["first"].hex as string);
  }
}