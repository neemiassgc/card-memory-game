import { colors, TPlayer } from "@/tools";
import { GameDynamic } from "./GameDynamic";
import { getFirebaseDatabase } from "./temp";
import { onValue, ref, set } from "firebase/database";

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
  #localPlayer: TPlayer;
  #nodeIndex = 0;
  #nextTurn: TPlayer = "player1";

  constructor(
    scene: Phaser.Scene,
    playerNames: { player1: string, player2: string },
    localPlayer: TPlayer,
    arrangementKeys: number[]
  ) {
    super(scene, "lg", arrangementKeys, localPlayer);

    this.#scene = scene;
    this.#screenW = this.#scene.scale.width;
    this.#screenH = this.#scene.scale.height;
    this.#player1 = playerNames.player1;
    this.#player2 = playerNames.player2;
    this.#localPlayer = localPlayer;

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

  onFailure(by: TPlayer) {
    if (by !== this.#nextTurn) return;
    const db = getFirebaseDatabase();
    const nodeRef = `game/table/${this.#nodeIndex}/turn`;
    set(ref(db, nodeRef), `player${by === "player1" ? 2 : 1}`)
  }

  onMatch() {
    if (this.#localPlayer !== this.#nextTurn) return;
    const db = getFirebaseDatabase();
    set(
      ref(db, `game/table/${this.#nodeIndex}/${this.#nextTurn+"Score"}`),
      (this.#nextTurn === "player1" ? this.#score[0] : this.#score[1]) + 1
    )
  }

  dispatchCardFlip(locationIndex: number, by: TPlayer): void {
    if (by !== this.#nextTurn) return;
    const db = getFirebaseDatabase();
    const nodeRef = ref(db, `game/table/${this.#nodeIndex}/cardFlip`);
    set(nodeRef, { location: locationIndex, by });
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
      this.#score[0] = snapshot.val();
      this.#drawScoreDisplay();
    })    
    onValue(ref(database, `game/table/${this.#nodeIndex}/player2Score`), snapshot => {
      this.#score[1] = snapshot.val();
      this.#drawScoreDisplay();
    })    
    onValue(ref(database, `game/table/${this.#nodeIndex}/turn`), snapshot => {
      this.#nextTurn = snapshot.val();

      if (this.#nextTurn === "player1")
        this.#displayPlayer1Turn();
      else this.#displayPlayer2Turn();
    })
    onValue(ref(database, `game/table/${this.#nodeIndex}/cardFlip`), snapshot => {
      const cardFlip = snapshot.val();
      if (cardFlip.location !== -1)
        this.flipCard(cardFlip.location, cardFlip.by);
    })
  }

  #displayPlayer2Turn() {
    this.#player1Display.setText(this.#player1);

    this.#player2Display.setText("> " + this.#player2);
    this.#player2Display.setX(this.#screenW - this.#player2Display.width)
  }

  #displayPlayer1Turn() {
    this.#player2Display.setText(this.#player2);
    this.#player2Display.setX(this.#screenW - this.#player2Display.width)

    this.#player1Display.setText(this.#player1 + " <");
  }
  
  #drawScoreDisplay() {
    this.#scoreDisplay.setText(`${this.#score[0]} | ${this.#score[1]}`);    
  }
}