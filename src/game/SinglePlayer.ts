import { generateArrayOfNumbers } from "@/tools";
import { GameDynamic } from "./GameDynamic";

type Difficulty = "EASY" | "HARD";

export class SinglePlayer extends GameDynamic {

  #tries = 0;
  #difficulty;
  #maxTries;
  #scene;
  #textDisplay: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, difficulty: Difficulty) {
    super(
      scene,
      difficulty === "HARD" ? "lg" : "sm",
      Phaser.Utils.Array.Shuffle(generateArrayOfNumbers(difficulty === "HARD" ? 40 : 20))
    );
    this.#difficulty = difficulty;
    this.#scene = scene;
    this.#maxTries = difficulty === "EASY" ? 20 : 60; 

    this.#createTextDisplay();
    this.#initAnimation();
  }

  #createTextDisplay() {
    this.#textDisplay = this.#scene.add.text(this.#scene.scale.width / 2, this.CARD_SIZE / 3, `TRIES 0/${this.#maxTries}`, {
      color: "#ffff",
      fontSize: "50px"
    });
    this.#textDisplay.setX(this.#scene.scale.width);
  }

  #setRemainingTries(value: number) {
    this.#textDisplay.setText(`TRIES ${value}/${this.#maxTries}`)
  }

  setBackgroundColorByMatchedPairs(matchedPairs: number) {
    switch(matchedPairs) {
      case this.#difficulty === "EASY" ? 3 : 5: {
        super.setColor("second");
        break;
      }
      case this.#difficulty === "EASY" ? 6 : 10: {
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
    if (++this.#tries === this.#maxTries) {
        this.#scene.scene.start("GameEnd", { backgroundColorName: this.getBackgroundColorName(), winner: false });
      }
    this.#setRemainingTries(this.#tries);
  }

  onFlipCard(locationIndex: number): void {
    super.flipCard(locationIndex);
  }

  #initAnimation() {
    const displayTextTween = {
      targets: this.#textDisplay, 
      x: this.#scene.scale.width / 2 - this.#textDisplay.width / 2,
      duration: 500,
      ease: "Bounce"
    }

    super.initAnimation(displayTextTween);
  }
}