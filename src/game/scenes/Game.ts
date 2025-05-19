import { Scene } from 'phaser';
import { colors } from '../../tools';
import { EventBus } from '../EventBus';

interface CardInfo {
  card: Phaser.GameObjects.Image,
  hidingCardTween: Phaser.Tweens.TweenChain,
  removingCardTween: () => void
}

export class Game extends Scene {
  CARD_SIZE = 96;
  MAX_TRIES = 100;

  textDisplay: Phaser.GameObjects.Text;
  interactive = false;
  cardBacks: Phaser.GameObjects.Rectangle[];
  cardFrames: Phaser.GameObjects.Rectangle[];
  burstSprites: Phaser.GameObjects.Sprite[];
  cards: Phaser.GameObjects.Image[];

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
    this.load.spritesheet("burst", "assets/burst.png", { frameWidth: 192, frameHeight: 192, startFrame: 0, endFrame: 39});

    for (const key of this.keys)
      this.load.svg(key, `assets/${key}.svg`, {width: this.CARD_SIZE, height: this.CARD_SIZE}) 
  }

  create() {
    this.createTextDisplay();
    this.createBoard();
  }

  createTextDisplay() {
    this.textDisplay = this.add.text(this.scale.width / 2, this.CARD_SIZE / 3, `TRIES 0/${this.MAX_TRIES}`, {
      color: "#ffff",
      fontSize: "50px"
    });
    this.textDisplay.setX(this.scale.width);
  }

  setRemainingTries(value: number) {
    this.textDisplay.setText(`TRIES ${value}/${this.MAX_TRIES}`)
  }
      
  createBoard() {
    let plays = 0, tries = 0, matchedPairs = 0;
    let idle = false;
    let pairOfCards: CardInfo[] = [];
    const quantityOfCards = 40;
    const darkColor = colors["dark-first"].number as number;

    this.cards = [];
    this.cardBacks = [];
    this.cardFrames = [];
    this.burstSprites = [];

    for (const key of this.keys) {
      for (let i = 0; i < 2; i++) {
        const card = this.add.image(0, 0, key); 
        card.setScale(0, 1);
        card.setName(key);
        card.setDepth(10)
        this.cards.push(card);
      }
    }

    Phaser.Actions.Shuffle(this.cards);

    for (let i = 0; i < quantityOfCards; i++) {
      const sprite = this.add.sprite(0, 0, "burst", 0);
      sprite.setTintFill(darkColor);
      sprite.setVisible(false);
      sprite.anims.create({
        key: "explosion",
        frames: sprite.anims.generateFrameNumbers("burst", {
          start: 0, end: 39
        }),
        frameRate: 24,
        showOnStart: true,
        hideOnComplete: true,
      })
      this.burstSprites.push(sprite);

      const cardBack = this.add.rectangle(0, 0, this.CARD_SIZE, this.CARD_SIZE, darkColor);
      cardBack.setScale(0, 0)
      this.cardBacks.push(cardBack);

      const cardFrame = this.add.rectangle(0, 0, this.CARD_SIZE, this.CARD_SIZE, darkColor);
      cardFrame.setScale(0, 1);
      this.cardFrames.push(cardFrame);

      cardFrame.setInteractive();
      cardBack.setInteractive();
      this.cards[i].setInteractive();

      const tween = {
        scaleX: 0,
        duration: 250,
        ease: "Linear",
      }
      const tweenChain = {
        paused: true,
        persist: true,
        onStart: () => {
          this.interactive = false;
        },
        onComplete: () => {
          this.interactive = true;
        },
      }
      const revealingCard = this.add.tweenchain({
        tweens: [
          {...tween, targets: this.cardBacks[i]},
          {...tween, targets: [this.cards[i], cardFrame], scaleX: 1}
        ],
        ...tweenChain
      })

      const hidingCard = this.add.tweenchain({
        tweens: [
          {...tween, targets: [cardFrame, this.cards[i]]},
          {...tween, targets: this.cardBacks[i], scaleX: 1}
        ],
        ...tweenChain
      })

      const removingCard = () => {
        cardBack.off("pointerup");
        revealingCard.destroy();
        hidingCard.destroy();
        cardBack.destroy();
        this.cards[i].destroy();
        cardFrame.destroy();

        this.burstSprites[i].anims.play("explosion");
      }

      cardBack.on("pointerup", () => {
        if (this.interactive && !idle) {
          pairOfCards.push({
            card: this.cards[i],
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
    }

    const cardMatching = this.add.timeline({
      at: 1000,
      run: () => {
        if (pairOfCards[0].card.name === pairOfCards[1].card.name) {
          pairOfCards.forEach(it => it.removingCardTween());
          this.setBackgroundColorByMatchedPairs(++matchedPairs);
        }
        else {
          if (++tries === this.MAX_TRIES) {
            this.scene.start("gameOver");
          }
          pairOfCards.forEach(it => it.hidingCardTween.restart())
          this.setRemainingTries(tries);
        }
        pairOfCards.splice(0, pairOfCards.length);

        idle = false;
        plays = 0;
      }
    })

    this.events.on("wait", () => {
      cardMatching.play()
    });

    this.gridAlign([this.cardBacks, this.cards, this.cardFrames, this.burstSprites], [0, 0, 0, this.CARD_SIZE])

    this.initAnimation();
  }

  gridAlign(gameObjects: Phaser.GameObjects.GameObject[][], offsetSize: number[]) {
    const cellGap = 10;
    const quantityOfColumns = 8;
    const quantityOfRows = 5;
    const rowLength = this.CARD_SIZE * quantityOfColumns + cellGap * quantityOfColumns
    const columnLength = this.CARD_SIZE * quantityOfRows + cellGap * quantityOfRows

    for (let i = 0; i < gameObjects.length; i++) {
      Phaser.Actions.GridAlign(gameObjects[i], {
        width: quantityOfColumns, height: quantityOfRows,
        cellHeight: this.CARD_SIZE + cellGap, cellWidth: this.CARD_SIZE + cellGap,
        x: this.scale.width / 2 - rowLength / 2 - offsetSize[i] / 2,
        y: this.scale.height / 2 - columnLength / 2 - offsetSize[i] / 2,
      })
    }
  }

  initAnimation() {
    const steps = [
      [0, 8, 16, 24, 32],
      [1, 9, 17, 25, 33],
      [2, 10, 18, 26, 34],
      [3, 11, 19, 27, 35],
      [4, 12, 20, 28, 36],
      [5, 13, 21, 29, 37],
      [6, 14, 22, 30, 38],
      [7, 15, 23, 31, 39]
    ];

    const boardTweens = steps.map(set => ({
      targets: set.map(it => this.cardBacks[it]), 
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: "back"
    }))

    const displayTextTween = {
      targets: this.textDisplay, 
      x: this.scale.width / 2 - this.textDisplay.width / 2,
      duration: 500,
      ease: "Bounce"
    }

    this.add.tweenchain({
      tweens: [...boardTweens, displayTextTween],
      onComplete: () => {
        this.interactive = true;
      },
    })
  }

  setBackgroundColorByMatchedPairs(matchedPairs: number) {
    const setColor = (color: string, darkColor: number) => {
      this.cameras.main.setBackgroundColor(color);
      this.cardBacks.forEach(cardBack => cardBack.setFillStyle(darkColor));
      this.cardFrames.forEach(cardBack => cardBack.setFillStyle(darkColor));
      this.burstSprites.forEach(cardBack => cardBack.setTintFill(darkColor));
      EventBus.emit("change-background-color", color);
    }

    switch(matchedPairs) {
      case 5: {
        setColor(colors["second"].hex as string, colors["dark-second"].number as number);
        break;
      }
      case 10: {
        setColor(colors["third"].hex as string, colors["dark-third"].number as number);
        break;
      }
      case 15: {
        setColor(colors["fourth"].hex as string, colors["dark-fourth"].number as number);
        break;
      }
    }
  }
}