import { colors, objectKeys, parseSerializedArray, toHexString, TPlayer } from '../tools';
import { EventBus } from './EventBus';
import { BurstPool } from './BurstPool';

interface CardInfo {
  cardLocationIndex: number,
  removingCardTween: () => void,
}

export class GameDynamic {
  CARD_SIZE = 96;

  #cardBacks: Phaser.GameObjects.Rectangle[] = [];
  #cardFrames: Phaser.GameObjects.Rectangle[] = [];
  #cards: Phaser.GameObjects.Image[] = [];
  #revealingCardAnimations: Phaser.Tweens.TweenChain[] = [];
  #hidingCardAnimations: Phaser.Tweens.TweenChain[] = [];
  #backgroundColorName = "first";
  #burstPool: BurstPool;
  #scene: Phaser.Scene;
  #gridSize: "sm" | "lg";
  #idle = false;
  #pairOfCards: CardInfo[] = [];
  #interactive = false;
  #matchedPairs = 0;
  #quantityOfCards = 0;
  #plays = 0;

  constructor(
    scene: Phaser.Scene,
    gridSize: "sm" | "lg",
    arrangementKeys: number[],
    objectKeyIndexes: number[],
    localPlayer: TPlayer
  ) {
    this.#scene = scene;
    this.#burstPool = new BurstPool(2, this.#scene, colors["dark-first"])
    this.#gridSize = gridSize;
    this.#quantityOfCards = gridSize === "sm" ? 20 : 40;

    this.#createBoard(arrangementKeys, objectKeyIndexes, localPlayer);
  }

  #createBoard(arrangementKeys: number[], objectKeyIndexes: number[], localPlayer: TPlayer) {
    const darkColor = colors["dark-first"];

    for (const keyIndex of objectKeyIndexes) {
      for (let j = 0; j < 2; j++) {
        const card = this.#scene.add.image(0, 0, objectKeys[keyIndex]);
        card.setScale(0, 1);
        card.setName(objectKeys[keyIndex]);
        card.setDepth(10)
        this.#cards.push(card);
      }
    }

    this.#cards = rearrangeGameObjects(this.#cards, arrangementKeys);

    for (let i = 0; i < this.#quantityOfCards; i++) {
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
      this.#revealingCardAnimations.push(revealingCard);

      const hidingCard = this.#scene.add.tweenchain({
        tweens: [
          {...tween, targets: [cardFrame, this.#cards[i]]},
          {...tween, targets: this.#cardBacks[i], scaleX: 1}
        ],
        ...tweenChain,
        onComplete: () => {
          this.#interactive = true;
        }
      })
      this.#hidingCardAnimations.push(hidingCard);

      cardBack.on("pointerup", () => {
        if (this.#interactive && !this.#idle)
          this.dispatchCardFlip(i, localPlayer);
      });
    }

    this.#gridAlign([this.#cardBacks, this.#cards, this.#cardFrames])
  }

  flipCard(locationIndex: number, by: TPlayer) {
    const destroyCardResource = () => {
      this.#cardBacks[locationIndex].off("pointerup");
      this.#revealingCardAnimations[locationIndex].destroy();
      this.#hidingCardAnimations[locationIndex].destroy();
      this.#cardBacks[locationIndex].destroy();
      this.#cardFrames[locationIndex].destroy();
      
      this.#burstPool.positionAndPLay(this.#cards[locationIndex].x, this.#cards[locationIndex].y);
      this.#cards[locationIndex].destroy();
    }

    this.#pairOfCards.push({
      cardLocationIndex: locationIndex,
      removingCardTween: destroyCardResource,
    })
    this.#revealingCardAnimations[locationIndex].restart();

    this.matchCards(by)
  }

  matchCards(by: TPlayer) {
    if (++this.#plays < 2) return;

    this.#idle = true;
    setTimeout(() => {
      if (this.#pairOfCards.length === 0) return;
      const cardA = this.#cards[this.#pairOfCards[0].cardLocationIndex];
      const cardB = this.#cards[this.#pairOfCards[1].cardLocationIndex];
      if (cardA.name === cardB.name) {
        this.#pairOfCards.forEach(it => it.removingCardTween());
        this.setBackgroundColorByMatchedPairs(++this.#matchedPairs);
        this.onMatch();
      }
      else {
        this.#pairOfCards.forEach(it => this.#hidingCardAnimations[it.cardLocationIndex].restart())
        this.onFailure(by);
      }
      this.#resetPlay();
    }, 1000)
  }

  releasePlay() {
    this.#pairOfCards.forEach(it => this.#hidingCardAnimations[it.cardLocationIndex].restart());
    this.#resetPlay();
  }

  #resetPlay() {
    this.#pairOfCards.splice(0, this.#pairOfCards.length);
    this.#idle = false;
    this.#plays = 0;
  }

  checkGameEnd() {
    if (this.#matchedPairs === this.#quantityOfCards / 2) {
      this.#scene.scene.start("GameEnd", { backgroundColorName: this.#backgroundColorName, winner: true });
    }
  }

  dispatchCardFlip(locationIndex: number, by: TPlayer) {}

  onFailure(by: TPlayer) {}

  onMatch() {}

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

  initAnimation(integrationObject: { tweenObject?: any, onComplete?: () => void }) {
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

    if (integrationObject.tweenObject)
      tweens.push(integrationObject.tweenObject);
    
    this.#scene.add.tweenchain({
      tweens: [...tweens],
      onComplete: () => {
        if (integrationObject.onComplete)
          integrationObject.onComplete();
      },
    })
  }

  setBackgroundColorByMatchedPairs(matchedPairs: number) {}

  setColor(colorName: string) {
    const darkColorName = `dark-${colorName}`;
    const darkColorNumber = colors[darkColorName];
    const colorHex = toHexString(colors[colorName]);
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

  setInteractive(value: boolean) {
    this.#interactive = value;
  }
}

function rearrangeGameObjects<A extends Phaser.GameObjects.GameObject>(
  itemsToRearrange: A[],
  rearrangementIndexes: number[]
): A[] {
  const output: A[] = [];
  for (const index of rearrangementIndexes)
    output.push(itemsToRearrange[index]);
  return output;
}