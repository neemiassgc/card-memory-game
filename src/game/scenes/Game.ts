import { Scene } from 'phaser';

interface CardInfo {
  name: string,
  hidingCardTween: Phaser.Tweens.TweenChain 
}

export class Game extends Scene {

  DEFAULT_COLOR = 0x496933;
  CARD_SIZE = 96;
  PLAYS_PER_CYCLE = 2;

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
    const quantityOfCards = 40;
    let plays = 0;
    let interactive = true, idle = false;

    const cards: Phaser.GameObjects.Image[] = []
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

    const rectangles: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < quantityOfCards; i++)
      rectangles.push(this.add.rectangle(0, 0, this.CARD_SIZE, this.CARD_SIZE, this.DEFAULT_COLOR));

    for (let i = 0; i < quantityOfCards; i++) {
      cards[i].setInteractive();
      rectangles[i].setInteractive();

      const revealingCard = this.add.tweenchain({
        tweens: [{
          targets: rectangles[i],
          scaleX: 0,
          duration: 250,
          ease: "Linear",
        },
        {
          targets: cards[i],
          scaleX: 1,
          duration: 250,
          ease: "Linear",
        }],
        paused: true,
        persist: true,
        onStart: () => {
          interactive = false;
        },
        onComplete: () => {
          interactive = true;
        },
      })

      const hidingCard = this.add.tweenchain({
        tweens: [{
          targets: cards[i],
          scaleX: 0,
          duration: 250,
          ease: "Linear",
        },
        {
          targets: rectangles[i],
          scaleX: 1,
          duration: 250,
          ease: "Linear",
        }],
        onStart: () => {
          interactive = false;
        },
        onComplete: () => {
          interactive = true;
        },
        paused: true,
        persist: true
      })

      rectangles[i].on("pointerup", () => {
        if (interactive && !idle) {
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
