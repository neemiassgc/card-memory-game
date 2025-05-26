import { colors } from '../tools';
import { EventBus } from './EventBus';
import { BurstPool } from './BurstPool';

interface CardInfo {
  card: Phaser.GameObjects.Image,
  hidingCardTween: Phaser.Tweens.TweenChain,
  removingCardTween: () => void
}

export class GameDynamic {
  CARD_SIZE = 96;

  #interactive = false;
  #cardBacks: Phaser.GameObjects.Rectangle[];
  #cardFrames: Phaser.GameObjects.Rectangle[];
  #cards: Phaser.GameObjects.Image[];
  #backgroundColorName = "first";
  #burstPool: BurstPool;
  #scene: Phaser.Scene;
  #gridSize: "sm" | "lg";

  #keys = [
    "avocado", "barbarian", "carousel", "cash", "clubs",
    "comb", "console-controller", "cpu", "drill", "gingerbread-man",
    "goblin-camp", "honeypot", "moai", "orange", "processor",
    "robot", "sliced-bread", "spanner", "spectre", "tesla-turret"
  ]

  constructor(scene: Phaser.Scene, gridSize: "sm" | "lg") {
    this.#scene = scene;
    this.#burstPool = new BurstPool(2, this.#scene, colors["dark-first"].number as number)
    this.#gridSize = gridSize;

    this.#createBoard();
  }
      
  #createBoard() {
    let plays = 0, matchedPairs = 0;
    let idle = false;
    let pairOfCards: CardInfo[] = [];
    const quantityOfCards = this.#gridSize === "sm" ? 20 : 40;
    const darkColor = colors["dark-first"].number as number;

    this.#cards = [];
    this.#cardBacks = [];
    this.#cardFrames = [];

    for (let i = 0; i < quantityOfCards / 2; i++) {
      for (let j = 0; j < 2; j++) {
        const card = this.#scene.add.image(0, 0, this.#keys[i]); 
        card.setScale(0, 1);
        card.setName(this.#keys[i]);
        card.setDepth(10)
        this.#cards.push(card);
      }
    }

    Phaser.Actions.Shuffle(this.#cards);

    for (let i = 0; i < quantityOfCards; i++) {
      const cardBack = this.#scene.add.rectangle(0, 0, this.CARD_SIZE, this.CARD_SIZE, darkColor);
      cardBack.setScale(0, 0)
      this.#cardBacks.push(cardBack);

      const cardFrame = this.#scene.add.rectangle(0, 0, this.CARD_SIZE, this.CARD_SIZE, darkColor);
      cardFrame.setScale(0, 1);
      this.#cardFrames.push(cardFrame);

      cardFrame.setInteractive();
      cardBack.setInteractive();
      this.#cards[i].setInteractive();

      const tween = {
        scaleX: 0,
        duration: 250,
        ease: "linear",
      }
      const tweenChain = {
        paused: true,
        persist: true,
        onStart: () => {
          this.#interactive = false;
        },
        onComplete: () => {
          this.#interactive = true;
        },
      }
      const revealingCard = this.#scene.add.tweenchain({
        tweens: [
          {...tween, targets: this.#cardBacks[i]},
          {...tween, targets: [this.#cards[i], cardFrame], scaleX: 1}
        ],
        ...tweenChain
      })

      const hidingCard = this.#scene.add.tweenchain({
        tweens: [
          {...tween, targets: [cardFrame, this.#cards[i]]},
          {...tween, targets: this.#cardBacks[i], scaleX: 1}
        ],
        ...tweenChain
      })

      const removingCard = () => {
        cardBack.off("pointerup");
        revealingCard.destroy();
        hidingCard.destroy();
        cardBack.destroy();
        this.#cards[i].destroy();
        cardFrame.destroy();

        this.#burstPool.positionAndPLay(this.#cards[i].x, this.#cards[i].y);
      }

      cardBack.on("pointerup", () => {
        if (this.#interactive && !idle) {
          pairOfCards.push({
            card: this.#cards[i],
            hidingCardTween: hidingCard,
            removingCardTween: removingCard
          })
          if (plays++ < 1) {
            revealingCard.restart();
            return;
          }
          revealingCard.restart();
          idle = true
          this.#scene.events.emit("wait");
        }
      });
    }

    const cardMatching = this.#scene.add.timeline({
      at: 1000,
      run: () => {
        if (pairOfCards[0].card.name === pairOfCards[1].card.name) {
          pairOfCards.forEach(it => it.removingCardTween());
          this.setBackgroundColorByMatchedPairs(++matchedPairs);
          if (matchedPairs === quantityOfCards / 2) {
            this.#scene.scene.start("GameEnd", { backgroundColorName: this.#backgroundColorName, winner: true });
          }
          this.onMatched();
        }
        else {
          this.onFailure();
        }
        pairOfCards.forEach(it => it.hidingCardTween.restart())
        pairOfCards.splice(0, pairOfCards.length);

        idle = false;
        plays = 0;
      }
    })

    this.#scene.events.on("wait", () => cardMatching.play());

    this.#gridAlign([this.#cardBacks, this.#cards, this.#cardFrames])
  }

  onFailure() {}

  onMatched() {}

  #gridAlign(gameObjects: Phaser.GameObjects.GameObject[][]) {
    const cellGap = 10;
    const quantityOfColumns = this.#gridSize === "sm" ? 5 : 8;
    const quantityOfRows = this.#gridSize === "sm" ? 4 : 5;
    const rowLength = this.CARD_SIZE * quantityOfColumns + cellGap * quantityOfColumns
    const columnLength = this.CARD_SIZE * quantityOfRows + cellGap * quantityOfRows

    for (let i = 0; i < gameObjects.length; i++) {
      Phaser.Actions.GridAlign(gameObjects[i], {
        width: quantityOfColumns, height: quantityOfRows,
        cellHeight: this.CARD_SIZE + cellGap, cellWidth: this.CARD_SIZE + cellGap,
        x: this.#scene.scale.width / 2 - rowLength / 2,
        y: this.#scene.scale.height / 2 - columnLength / 2,
      })
    }
  }

  initAnimation(tweenObject?: any) {
    const steps = this.#gridSize === "lg" ?
    [
      [0, 8, 16, 24, 32],
      [1, 9, 17, 25, 33],
      [2, 10, 18, 26, 34],
      [3, 11, 19, 27, 35],
      [4, 12, 20, 28, 36],
      [5, 13, 21, 29, 37],
      [6, 14, 22, 30, 38],
      [7, 15, 23, 31, 39]
    ] :
    [
      [0, 5, 10, 15],
      [1, 6, 11, 16],
      [2, 7, 12, 17],
      [3, 8, 13, 18],
      [4, 9, 14, 19]
    ];

    const tweens = steps.map(set => ({
      targets: set.map(it => this.#cardBacks[it]), 
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: "back"
    }))

    if (tweenObject)
      tweens.push(tweenObject);
    
    this.#scene.add.tweenchain({
      tweens: [...tweens],
      onComplete: () => {
        this.#interactive = true;
      },
    })
  }

  setBackgroundColorByMatchedPairs(matchedPairs: number) {}

  setColor(colorName: string) {
    const darkColorName = `dark-${colorName}`;
    const darkColorNumber = colors[darkColorName].number as number;
    const colorHex = colors[colorName].hex as string
    this.#scene.cameras.main.setBackgroundColor(colorHex);
    this.#cardBacks.forEach(cardBack => cardBack.setFillStyle(darkColorNumber));
    this.#cardFrames.forEach(cardBack => cardBack.setFillStyle(darkColorNumber));
    this.#burstPool.tintAll(darkColorNumber);
    this.#backgroundColorName = colorName;
    EventBus.emit("change-background-color", colorHex);
  }

  getBackgroundColorName() {
    return this.#backgroundColorName;
  }

  setBackgroundColorName(colorName: string) {
    this.#backgroundColorName = colorName;
  }
}