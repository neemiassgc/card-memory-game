import { colors } from "@/tools";
import { GameDynamic } from "./GameDynamic";
import { getFirebaseDatabase } from "./temp";
import { onValue, ref, set } from "firebase/database";

type TPlayer = "Player1" | "Player2";

interface GameData {
  player1: string,
  player2: string,
  player1Score: number,
  player2Score: number,
  turn: TPlayer,
  flipCard: number,
}

export class Multiplayer extends GameDynamic {

  #scene;
  #scoreDisplay: Phaser.GameObjects.Text;
  #player1Display: Phaser.GameObjects.Text;
  #player2Display: Phaser.GameObjects.Text;
  #player1: string;
  #player2: string;
  #timeBarPlaceholder: Phaser.GameObjects.Rectangle;
  #timeBar: Phaser.GameObjects.Rectangle;
  #score = [0, 0];
  #screenW;
  #screenH;
  #currentTurn: TPlayer = "Player2";
  #thisPlayer: TPlayer;
  #nodeIndex = 0;

  constructor(
    scene: Phaser.Scene,
    playerNames: { player1: string, player2: string },
    thisPlayer: TPlayer,
    arrangementKeys: number[]
  ) {
    super(scene, "lg", arrangementKeys);

    this.#scene = scene;
    this.#screenW = this.#scene.scale.width;
    this.#screenH = this.#scene.scale.height;
    this.#player1 = playerNames.player1;
    this.#player2 = playerNames.player2;
    this.#thisPlayer = thisPlayer;

    this.#createTextDisplay();
    this.#createTimeBar();
    this.#initAnimation();
    this.#initialSetup();
  }

  #createTextDisplay() {
    const textProps = {
      color: "#ffff",
      strokeThickness: 2,
      fontSize: 50
    }

    this.#player1Display = this.#scene.add.text(0, this.#screenH, this.#player1, textProps);

    this.#scoreDisplay = this.#scene.add.text(0, this.#screenH, "0 | 0", textProps);
    this.#scoreDisplay.setX(this.#screenW / 2 - this.#scoreDisplay.width / 2 );
    
    this.#player2Display = this.#scene.add.text(0, this.#screenH, this.#player2, textProps);
    this.#player2Display.setX(this.#screenW - this.#player2Display.width);
    this.#toggleCurrentTurn();
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
    this.#toggleCurrentTurn();
  }

  onMatched() {
    const db = getFirebaseDatabase();
    set(
      ref(db, `game/table/${this.#nodeIndex}/${this.#currentTurn.toLocaleLowerCase()+"Score"}`),
      (this.#currentTurn === "Player1" ? this.#score[0] : this.#score[1]) + 1
    )
  }

  onFlipCard(locationIndex: number): void {
    const db = getFirebaseDatabase();
    const nodeRef = ref(db, `game/table/${this.#nodeIndex}/flipCard`);
    set(nodeRef, locationIndex);
  }
  
  #initAnimation() {
    const textTweens: {
      targets: Phaser.GameObjects.Text,
      y: number,
      duration: number,
      ease: string
    }[] = [this.#player1Display, this.#player2Display, this.#scoreDisplay].map(it => ({
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

  #toggleCurrentTurn() {
    if (this.#currentTurn === "Player1")
      this.#displayPlayer2Turn();
    else this.#displayPlayer1Turn();
  }

  #displayPlayer2Turn() {
    this.#currentTurn = "Player2";
    this.#player1Display.setText(this.#player1);

    this.#player2Display.setText("> " + this.#player2);
    this.#player2Display.setX(this.#screenW - this.#player2Display.width)
  }

  #displayPlayer1Turn() {
    this.#currentTurn = "Player1";
    this.#player2Display.setText(this.#player2);
    this.#player2Display.setX(this.#screenW - this.#player2Display.width)

    this.#player1Display.setText(this.#player1 + " <");
  }

  #initialSetup() {
    const database = getFirebaseDatabase();
    const tableRef = ref(database, "game/table");
    onValue(tableRef, snapshot => {
      const nodes = snapshot.val() as {[prop: string]: string | number}[];
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].player1 === this.#player1) {
          this.#nodeIndex = i;
          return;
        }
      }
    })();

    this.#update()
  }

  #update() {
    const database = getFirebaseDatabase();

    onValue(ref(database, `game/table/${this.#nodeIndex}/player1Score`), snapshot => {
      this.#drawScoreDisplay();
      this.#score[0] = snapshot.val();
    })    
    onValue(ref(database, `game/table/${this.#nodeIndex}/player2Score`), snapshot => {
      this.#drawScoreDisplay();
      this.#score[1] = snapshot.val();
    })    
    onValue(ref(database, `game/table/${this.#nodeIndex}/turn`), snapshot => {
      this.#currentTurn = snapshot.val();
    })
    onValue(ref(database, `game/table/${this.#nodeIndex}/flipCard`), snapshot => {
      const flipCard = snapshot.val();
      if (flipCard !== -1)
        this.flipCard(flipCard);
    })
  }

  #drawScoreDisplay() {
    this.#scoreDisplay.setText(`${this.#score[0]} | ${this.#score[1]}`);    
  }
}