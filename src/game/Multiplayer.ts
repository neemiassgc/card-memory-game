import { colors } from "@/tools";
import { GameDynamic } from "./GameDynamic";

export class Multiplayer extends GameDynamic {

  #scene;
  #score: Phaser.GameObjects.Text;
  #player1: Phaser.GameObjects.Text;
  #player2: Phaser.GameObjects.Text;
  #timeBarPlaceholder: Phaser.GameObjects.Rectangle;
  #timeBar: Phaser.GameObjects.Rectangle;
  #pairOfPlayers = [0, 0];
  #screenW;
  #screenH;

  constructor(scene: Phaser.Scene) {
    super(scene, "lg");
    this.#scene = scene;
    this.#screenW = this.#scene.scale.width;
    this.#screenH = this.#scene.scale.height;

    this.#createTextDisplay();
    this.#createTimeBar();
    this.#initAnimation();
  }

  #createTextDisplay() {
    this.#player1 = this.#scene.add.text(0, this.#screenH, "Thomas", { color: "#ffff", strokeThickness: 2, fontSize: 50 });

    this.#score = this.#scene.add.text(0, this.#screenH, "0 | 0", { color: "#ffff", strokeThickness: 2, fontSize: 50 });
    this.#score.setX(this.#screenW / 2 - this.#score.width / 2 );
    
    this.#player2 = this.#scene.add.text(0, this.#screenH, "Richard", { color: "#ffff", strokeThickness: 2, fontSize: 50 });
    this.#player2.setX(this.#screenW - this.#player2.width);
  }

  #createTimeBar() {
    const barWidth = 620;
    this.#timeBarPlaceholder = this.#scene.add.rectangle(this.#screenW + barWidth / 2, this.#screenH - 50, barWidth, 24, colors["dark-first"].number as number);
    this.#timeBar = this.#scene.add.rectangle(this.#screenW + barWidth / 2, this.#screenH - 50, barWidth, 24, 0xffffff);
  }

  setBackgroundColorByMatchedPairs(matchedPairs: number) {
    // switch(matchedPairs) {
    //   case this.#difficulty === "EASY" ? 3 : 5: {
    //     super.setColor("second");
    //     break;
    //   }
    //   case this.#difficulty === "EASY" ? 6 : 10: {
    //     super.setColor("third");
    //     break;
    //   }
    //   case 15: {
    //     super.setColor("fourth");
    //     break;
    //   }
    // }
  }

  onFailure() {
    
  }

  #initAnimation() {
    const textTweens: {
      targets: Phaser.GameObjects.Text,
      y: number,
      duration: number,
      ease: string
    }[] = [this.#player1, this.#player2, this.#score].map(it => ({
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
      }],
    })
  }
}