import { colors } from "@/tools";
import { GameDynamic } from "./GameDynamic";

type TPlayer = "Player1" | "Player2";

export class Multiplayer extends GameDynamic {

  #scene;
  #scoreDisplay: Phaser.GameObjects.Text;
  #player1: Phaser.GameObjects.Text;
  #player2: Phaser.GameObjects.Text;
  #timeBarPlaceholder: Phaser.GameObjects.Rectangle;
  #timeBar: Phaser.GameObjects.Rectangle;
  #score = [0, 0];
  #screenW;
  #screenH;
  #currentTurn: TPlayer = "Player2";

  constructor(scene: Phaser.Scene) {
    super(scene, "sm");
    this.#scene = scene;
    this.#screenW = this.#scene.scale.width;
    this.#screenH = this.#scene.scale.height;

    this.#createTextDisplay();
    this.#createTimeBar();
    this.#initAnimation();
  }

  #createTextDisplay() {
    this.#player1 = this.#scene.add.text(0, this.#screenH, "Thomas", { color: "#ffff", strokeThickness: 2, fontSize: 50 });

    this.#scoreDisplay = this.#scene.add.text(0, this.#screenH, "0 | 0", { color: "#ffff", strokeThickness: 2, fontSize: 50 });
    this.#scoreDisplay.setX(this.#screenW / 2 - this.#scoreDisplay.width / 2 );
    
    this.#player2 = this.#scene.add.text(0, this.#screenH, ">  Richard", { color: "#ffff", strokeThickness: 2, fontSize: 50 });
    this.#player2.setX(this.#screenW - this.#player2.width);
  }

  #createTimeBar() {
    const barWidth = 620;
    this.#timeBarPlaceholder = this.#scene.add.rectangle(this.#screenW + barWidth / 2, this.#screenH - 50, barWidth, 24, colors["dark-first"].number as number);
    this.#timeBar = this.#scene.add.rectangle(this.#screenW + barWidth / 2, this.#screenH - 50, barWidth, 24, 0xffffff);
  }

  setBackgroundColorByMatchedPairs(matchedPairs: number) {
    switch(matchedPairs) {
      case 5: {
        super.setColor("second");
        break;
      }
      case 10: {
        super.setColor("third");
        break;
      }
      case 15: {
        super.setColor("fourth");
        break;
      }
    }
  }

  onFailure() {
    this.toggleCurrentTurn();
  }

  onMatched() {
    if (this.#currentTurn === "Player1") {
      this.#score[0]++;
    }
    else this.#score[1]++;

    this.#scoreDisplay.setText(`${this.#score[0]} | ${this.#score[1]}`);
  }

  #initAnimation() {
    const textTweens: {
      targets: Phaser.GameObjects.Text,
      y: number,
      duration: number,
      ease: string
    }[] = [this.#player1, this.#player2, this.#scoreDisplay].map(it => ({
      targets: it,
      y: 10,
      duration: 500,
      ease: "bounce",
    }));

    this.#scene.add.tweenchain({
      tweens: [...textTweens,
      {
        targets: [this.#timeBar, this.#timeBarPlaceholder],
        x: this.#screenW / 2,
        duration: 500,
        ease: "bounce",
        onComplete: () => super.initAnimation()
      },
      {
        targets: this.#timeBar,
        width: 0,
        duration: 10 * 1000,
        ease: "Linear",
        paused: true
      }],
    })
  }

  toggleCurrentTurn() {
    if (this.#currentTurn === "Player1") {
      this.#currentTurn = "Player2";
      this.#player1.setText(this.#player1.text.replace(/[ <]+/g, ""));

      this.#player2.setText("> " + this.#player2.text);
      this.#player2.setX(this.#screenW - this.#player2.width)
    }
    else {
      this.#currentTurn = "Player1";

      this.#player2.setText(this.#player2.text.replace(/[\ >]+/g, ""));
      this.#player2.setX(this.#screenW - this.#player2.width)

      this.#player1.setText(this.#player1.text + " <");
    }
  }
}