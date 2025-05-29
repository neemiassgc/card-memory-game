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

    const hideOption = (onComplete: () =>  void) => {
      this.add.tween({
        y: this.scale.height,
        duration: 500,
        ease: "back",
        delay: 100,
        paused: false,
        targets: [this.singlePlayerOption, this.multiplayerOption],
        onComplete,
      })
    }
    
    this.singlePlayerOption.on("pointerup", () => {
      hideOption(() => this.handleSinglePlayer(textProps));
    })

    this.multiplayerOption.on("pointerup", () => {
      hideOption(() => this.handleMultiplayer());
    })

    EventBus.emit("change-background-color", colors["first"].hex as string);

    EventBus.on("close-modal", () => {
      this.add.tween({
        y: this.scale.height / 2,
        duration: 500,
        ease: "back",
        delay: 100,
        paused: false,
        targets: [this.singlePlayerOption, this.multiplayerOption],
      })
    })
  }

  initAnimation() {
    const tween = {
      paused: false,
      y: this.scale.height,
      duration: 500,
      ease: "back",
      delay: 100,
    }

    this.add.tween({
      ...tween,
      targets: this.singlePlayerOption,
      y: this.screenHeight / 2 - this.singlePlayerOption.height / 2 - 100
    })  
        
    this.add.tween({
      ...tween,
      targets: this.multiplayerOption,
      y: this.screenHeight / 2 - this.multiplayerOption.height / 2 - 30
    })
  }

  handleSinglePlayer(textProps: any) {
    const hardOption = this.add.text(0, 0, "HARD", textProps);
    hardOption.setX(this.screenWidth / 2 - hardOption.width / 2);
    hardOption.setY(this.screenHeight);

    const easyOption = this.add.text(0, 0, "EASY", textProps);
    easyOption.setX(this.screenWidth / 2 - easyOption.width / 2);
    easyOption.setY(this.screenHeight);
    
    const tween = {
      paused: false,
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

    revealDifficultyOptions.forEach(it => it.play());

    const startGame = (onComplete: () => void) => {
      this.add.tween({
        ...tween,
        targets: [hardOption, easyOption],
        onComplete,
      })
    }

    this.makeInteractiveAndColorful([easyOption, hardOption]);

    hardOption.on("pointerup", () => {
      startGame(() => this.scene.start("Gameplay", { gameMode: "SinglePlayer", data: "HARD" }))});
    easyOption.on("pointerup", () =>
      startGame(() => this.scene.start("Gameplay", { gameMode: "SinglePlayer", data: "EASY" })));
  }

  handleMultiplayer() {
    EventBus.on("set-nickname", (nickname: string) => {
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