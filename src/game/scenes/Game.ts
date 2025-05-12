import { Scene } from 'phaser';

interface CardInfo {
  card: Phaser.GameObjects.Image,
  hidingCardTween: Phaser.Tweens.TweenChain,
  removingCardTween: Phaser.Tweens.Tween
}

export class Game extends Scene {

  DEFAULT_COLOR = 0x496933;
  CARD_SIZE = 96;
  MAX_TRIES = 10;

  textDisplay: Phaser.GameObjects.Text;

  keys = [
    "avocado", "barbarian", "carousel", "cash", "clubs",
    "comb", "console-controller", "cpu", "drill", "gingerbread-man",
    "goblin-camp", "honeypot", "moai", "orange", "processor",
    "robot", "sliced-bread", "spanner", "spectre", "tesla-turret"
  ]

  constructor() {
      super('Game');
  }

  preload() {
    for (const key of this.keys)
      this.load.svg(key, `assets/${key}.svg`, {width: this.CARD_SIZE, height: this.CARD_SIZE}) 
  }

  create() {
    this.createBoard();

    this.createTextDisplay();
  }

  createTextDisplay() {
    this.textDisplay = this.add.text(this.scale.width / 2, this.CARD_SIZE / 3, `TRIES 00/${this.MAX_TRIES}`, {
      color: "#ffff",
      fontSize: "50px"
    });
    this.textDisplay.setX(this.scale.width / 2 - this.textDisplay.width / 2);
  }

  setRemainingTries(value: number) {
    const remainingTries = this.MAX_TRIES - value;
    this.textDisplay.setText(`TRIES ${(remainingTries <= 9 ? "0" : "") + remainingTries}/${this.MAX_TRIES}`)
  }
      
  createBoard() {
    const quantityOfCards = 40;
    let plays = 0;
    let tries = this.MAX_TRIES;
    let interactive = true, idle = false;
    let pairOfCards: CardInfo[] = [];

    const cards: Phaser.GameObjects.Image[] = []
    const rectangles: Phaser.GameObjects.Rectangle[] = [];

    for (const key of this.keys) {
      const cardA = this.add.image(0, 0, key);
      const cardB = this.add.image(0, 0, key);
      cardA.setScale(0, 1);
      cardB.setScale(0, 1);
      cardA.setName(key);
      cardB.setName(key);
      cards.push(cardA, cardB);
    }

    Phaser.Actions.Shuffle(cards);

    for (let i = 0; i < quantityOfCards; i++) {
      const rectangle = this.add.rectangle(0, 0, this.CARD_SIZE, this.CARD_SIZE, this.DEFAULT_COLOR);
      rectangles.push(rectangle);

      rectangle.setInteractive();
      cards[i].setInteractive();

      const tween = {
        scaleX: 0,
        duration: 250,
        ease: "Linear",
      }
      const tweenChain = {
        paused: true,
        persist: true,
        onStart: () => {
          interactive = false;
        },
        onComplete: () => {
          interactive = true;
        },
      }
      const revealingCard = this.add.tweenchain({
        tweens: [
          {...tween, targets: rectangles[i]},
          {...tween, targets: cards[i], scaleX: 1}
        ],
        ...tweenChain
      })

      const hidingCard = this.add.tweenchain({
        tweens: [
          {...tween, targets: cards[i]},
          {...tween, targets: rectangles[i], scaleX: 1}
        ],
        ...tweenChain
      })

      const removingCard = this.add.tween({
        paused: true,
        targets: cards[i],
        scaleX: 0,
        scaleY: 0,
        duration: 500,
        ease: "Linear",
        onComplete: () => {
          revealingCard.destroy();
          hidingCard.destroy();
          rectangles[i].destroy();
          cards[i].destroy();
        }
      })

      rectangles[i].on("pointerup", () => {
        if (interactive && !idle) {
          pairOfCards.push({
            card: cards[i],
            hidingCardTween: hidingCard,
            removingCardTween: removingCard
          })
          if (plays++ < 1) {
            revealingCard.restart();
            return;
          }
          revealingCard.restart();
          idle = true
          this.events.emit("wait");
        }
      });

      cards[i].on("pointerup", () => {
        if (interactive && !idle) {
          hidingCard.restart();
        }
      })
    }

    const allowInteraction = this.add.timeline({
      at: 1000,
      run: () => {
        if (pairOfCards[0].card.name === pairOfCards[1].card.name) {
          pairOfCards.forEach(it => it.removingCardTween.play())
        }
        else {
          pairOfCards.forEach(it => it.hidingCardTween.restart())
          this.setRemainingTries(--tries);
        }
        pairOfCards.splice(0, pairOfCards.length);

        idle = false;
        plays = 0;
      }
    })

    this.events.on("wait", () => {
      allowInteraction.play()
    });

    const cellGap = 10;
    const quantityOfColumns = 8;
    const quantityOfRows = 5;
    const rowLength = this.CARD_SIZE * quantityOfColumns + cellGap * quantityOfColumns
    const columnLength = this.CARD_SIZE * quantityOfRows + cellGap * quantityOfRows
  
    Phaser.Actions.GridAlign(rectangles, {
      width: quantityOfColumns, height: quantityOfRows,
      cellHeight: this.CARD_SIZE + cellGap, cellWidth: this.CARD_SIZE + cellGap,
      x: this.scale.width / 2 - rowLength / 2, y: this.scale.height / 2 - columnLength / 2,
    })

    Phaser.Actions.GridAlign(cards, {
      width: quantityOfColumns, height: quantityOfRows,
      cellHeight: this.CARD_SIZE + cellGap, cellWidth: this.CARD_SIZE + cellGap,
      x: this.scale.width / 2 - rowLength / 2, y: this.scale.height / 2 - columnLength / 2,
    })
  }
}
