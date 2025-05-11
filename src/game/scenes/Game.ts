import { Scene } from 'phaser';

export class Game extends Scene {

  DEFAULT_COLOR = 0x496933;
  CARD_SIZE = 96;

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

    const groupOfCards = this.add.group();
    for (const key of this.keys) {
      const pair: Phaser.GameObjects.GameObject[] = groupOfCards.createMultiple({
        key: key,
        quantity: 2,
        setScale: {x: 0, y: 1},
        setXY: {x: 0, y: 0},
      })

      pair.forEach(p => p.setName(key));
    }

    groupOfCards.shuffle();

    const rectangles: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < quantityOfCards; i++)
      rectangles.push(this.add.rectangle(0, 0, this.CARD_SIZE, this.CARD_SIZE, this.DEFAULT_COLOR));

    for (let i = 0; i < quantityOfCards; i++) {
      const cards = groupOfCards.getChildren();
      cards[i].setInteractive();
      rectangles[i].setInteractive();

      const openingCard = this.add.tweenchain({
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
        persist: true
      })

      const closingCard = this.add.tweenchain({
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
        paused: true,
        persist: true
      })

      rectangles[i].on("pointerup", () => openingCard.restart());
      cards[i].on("pointerup", () => {
        closingCard.restart()
        console.log(cards[i].name);
      });
      setTimeout(() => openingCard.restart(), 3000)
    }

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

    Phaser.Actions.GridAlign(groupOfCards.getChildren(), {
      width: quantityOfColumns, height: quantityOfRows,
      cellHeight: this.CARD_SIZE + cellGap, cellWidth: this.CARD_SIZE + cellGap,
      x: this.scale.width / 2 - rowLength / 2, y: this.scale.height / 2 - columnLength / 2,
    })

  }
}
