import { Scene } from "phaser";
import { colors } from "../../tools";
import { EventBus } from "../EventBus";

export class Menu extends Scene {

  singlePlayerOption: Phaser.GameObjects.Text;
  multiplayerOption: Phaser.GameObjects.Text;
  screenWidth: number;
  screenHeight: number;

  constructor() {
    super("Menu");
  }

  create() {
    this.screenWidth = this.scale.width;
    this.screenHeight = this.scale.height;

    const textProps = {
      color: colors["dark-first"].hex as string,
      fontSize: 78,
      stroke: "#000000",
      strokeThickness: 2
    }
  
    this.singlePlayerOption = this.add.text(0, 0, "SINGLE PLAYER", textProps);
    this.singlePlayerOption.setX(this.screenWidth / 2 - this.singlePlayerOption.width / 2);
    this.singlePlayerOption.setY(this.screenHeight);
    
    this.multiplayerOption = this.add.text(0, 0, "MULTIPLAYER ONLINE", textProps);
    this.multiplayerOption.setX(this.screenWidth / 2 - this.multiplayerOption.width / 2);
    this.multiplayerOption.setY(this.screenHeight);

    this.makeInteractiveAndColorful([this.multiplayerOption, this.singlePlayerOption]);
    
    this.initAnimation();
    
    this.singlePlayerOption.on("pointerup", () => {
      this.hideOptions([this.singlePlayerOption, this.multiplayerOption], () => this.handleSinglePlayer(textProps));
    })

    this.multiplayerOption.on("pointerup", () => {
      this.hideOptions([this.singlePlayerOption, this.multiplayerOption], () => this.handleMultiplayer());
    })

    EventBus.emit("change-background-color", colors["first"].hex as string);

    EventBus.on("close-modal", this.revealOptions.bind(this, [this.singlePlayerOption, this.multiplayerOption]))
  }

  initAnimation() {
    this.revealOptions([this.singlePlayerOption, this.multiplayerOption]);
  }

  handleSinglePlayer(textProps: any) {
    const hardOption = this.add.text(0, 0, "HARD", textProps);
    hardOption.setX(this.screenWidth / 2 - hardOption.width / 2);
    hardOption.setY(this.screenHeight);

    const easyOption = this.add.text(0, 0, "EASY", textProps);
    easyOption.setX(this.screenWidth / 2 - easyOption.width / 2);
    easyOption.setY(this.screenHeight);
    
    this.revealOptions([easyOption, hardOption]);

    const startGame = (onComplete: () => void) => this.hideOptions([easyOption, hardOption], onComplete);

    this.makeInteractiveAndColorful([easyOption, hardOption]);

    hardOption.on("pointerup", () => {
      startGame(() => this.scene.start("Gameplay", { gameMode: "SinglePlayer", data: "HARD" }))});
    easyOption.on("pointerup", () =>
      startGame(() => this.scene.start("Gameplay", { gameMode: "SinglePlayer", data: "EASY" })));
  }

  revealOptions(objects: Phaser.GameObjects.GameObject[]) {
     const tween = {
      paused: false,
      y: this.scale.height,
      duration: 500,
      ease: "back",
      delay: 100,
    }

    this.add.tween({
      ...tween,
      targets: objects[0],
      y: this.screenHeight / 2 - this.singlePlayerOption.height / 2 - 100
    })  
        
    this.add.tween({
      ...tween,
      targets: objects[1],
      y: this.screenHeight / 2 - this.multiplayerOption.height / 2 - 30
    })
  }

  hideOptions(objects: Phaser.GameObjects.GameObject[], onComplete: () => void) {
    this.add.tween({
      y: this.scale.height,
      duration: 500,
      ease: "back",
      delay: 100,
      paused: false,
      targets: objects,
      onComplete,
    })
  }

  handleMultiplayer() {
    EventBus.once("set-nickname", (nickname: string) => {
      this.scene.start("Room", { nickname })
    })
    EventBus.emit("open-modal");
  }

  makeInteractiveAndColorful(gameObjects: Phaser.GameObjects.Text[]) {
    for (const gameObject of gameObjects) {
      gameObject.setInteractive();
      
      gameObject.on("pointerover", () => {
        gameObject.setColor("#ffff");
      })

      gameObject.on("pointerout", () => {
        gameObject.setColor(colors["dark-first"].hex as string);
      })
    }
  }
}