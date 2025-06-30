import { colors, parseSerializedArray, TPlayer } from "@/tools";
import { GameDynamic } from "./GameDynamic";
import { firebaseDatabase } from "./firebase";
import { DataSnapshot, off, onValue, ref, set } from "firebase/database";
import { EventBus } from "./EventBus";
import { Button } from "./components/Button";
import { parse } from "path";

export class Multiplayer extends GameDynamic {

  #scene;
  #scoreDisplay: Phaser.GameObjects.Text;
  #player1Display: Phaser.GameObjects.Text;
  #player2Display: Phaser.GameObjects.Text;
  #player1: string;
  #player2: string;
  #timeBarPlaceholder: Phaser.GameObjects.Rectangle;
  #timeBar: Phaser.GameObjects.Rectangle;
  #timeBarRunner: Phaser.Tweens.Tween;
  #timeBarIncrement = 0;
  #score = [0, 0];
  #screenW;
  #screenH;
  #localPlayer: TPlayer;
  #nextTurn: TPlayer = "player1";
  #nodeId: string

  constructor(
    scene: Phaser.Scene,
    playerNames: { player1: string, player2: string },
    localPlayer: TPlayer,
    arrangementKeys: string,
    objectKeyIndexes: string,
    nodeId: string
  ) {
    super(scene, "lg", parseSerializedArray(arrangementKeys), parseSerializedArray(objectKeyIndexes), localPlayer);

    this.#scene = scene;
    this.#screenW = this.#scene.scale.width;
    this.#screenH = this.#scene.scale.height;
    this.#player1 = playerNames.player1;
    this.#player2 = playerNames.player2;
    this.#localPlayer = localPlayer;
    this.#nodeId = nodeId;

    EventBus.on("visibility-change", this.#pauseGame.bind(this))

    this.#createTextDisplay();
    this.#createTimeBar();
    this.#initAnimation();
    this.#update();
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
    this.#timeBarPlaceholder = this.#scene.add.rectangle(this.#screenW + barWidth / 2, this.#screenH - 50, barWidth, 24, colors["dark-first"]);
    this.#timeBar = this.#scene.add.rectangle(this.#screenW + barWidth / 2, this.#screenH - 50, barWidth, 24, 0xffffff);

    let stop = false;
    this.#timeBarRunner = this.#scene.add.tween({
      targets: this.#timeBar,
      width: 0,
      duration: 20_000,
      ease: "linear",
      paused: true,
      persist: true,
      onStart: () => {
        stop = false;
      },
      onUpdate: (tween) => {
        if (tween.elapsed >= tween.duration - 2000 && !stop) {
          stop = true;
          super.setInteractive(false);
        }
      },
      onComplete: () => {
        super.releasePlay();
        if (this.#localPlayer === "player1")
          this.onFailure(this.#nextTurn);
      }
    })
  }

  setBackgroundColorByMatchedPairs(matchedPairs: number) {
    switch(matchedPairs) {
      case 5: {
        this.#timeBarPlaceholder.setFillStyle(colors["dark-second"])
        this.#scene.events.emit("set-bg", "second")
        super.setColor("second");
        break;
      }
      case 10: {
        this.#timeBarPlaceholder.setFillStyle(colors["dark-third"])
        this.#scene.events.emit("set-bg", "third")
        super.setColor("third");
        break;
      }
      case 15: {
        this.#timeBarPlaceholder.setFillStyle(colors["dark-fourth"])
        this.#scene.events.emit("set-bg", "fourth")
        super.setColor("fourth");
        break;
      }
    }
  }

  onFailure(by: TPlayer) {
    if (by !== this.#nextTurn) return;
    const nodeRef = `game/table/${this.#nodeId}/turn`;
    set(ref(firebaseDatabase, nodeRef), `player${by === "player1" ? 2 : 1}`)
    this.#resetTimeBar();
  }

  onMatch() {
    if (this.#localPlayer !== this.#nextTurn) return;
    set(
      ref(firebaseDatabase, `game/table/${this.#nodeId}/${this.#nextTurn}/score`),
      (this.#nextTurn === "player1" ? this.#score[0] : this.#score[1]) + 1
    )
    this.#resetTimeBar();
  }

  dispatchCardFlip(locationIndex: number, by: TPlayer): void {
    if (by !== this.#nextTurn) return;
    const nodeRef = ref(firebaseDatabase, `game/table/${this.#nodeId}/cardFlip`);
    set(nodeRef, { location: locationIndex, by });
  }
  
  #initAnimation() {
    this.#scene.add.tweenchain({
      tweens: [{
        targets: [this.#player1Display, this.#player2Display, this.#scoreDisplay],
        y: 10,
        duration: 500,
        ease: "bounce",
      },
      {
        targets: [this.#timeBar, this.#timeBarPlaceholder],
        x: this.#screenW / 2,
        duration: 500,
        ease: "bounce",
        onComplete: () => super.initAnimation({
          onComplete: () => {
            set(ref(
              firebaseDatabase,
              `game/table/${this.#nodeId}/${this.#localPlayer}/ready`
            ), true)

            new Button({
              scene: this.#scene, x: 60,
              y: 0, key: "anticlockwise-rotation",
              onConfirmation: () => set(ref(firebaseDatabase, `game/table/${this.#nodeId}/exit`), true),
              onClick: this.#pauseGame.bind(this),
              onDecline: this.#pauseGame.bind(this, false)
            });
          }
        })
      }],
    })
  }

  #resetTimeBar() {
    set(ref(firebaseDatabase, `game/table/${this.#nodeId}/timeBarReset`), this.#timeBarIncrement++);
  }
  
  #update() {
    onValue(ref(firebaseDatabase, `game/table/${this.#nodeId}/paused`), snapshot => {
      const paused = snapshot.val() as boolean;
      this.#scene.cameras.main.setAlpha(paused ? 0.4 : 1)
      if (paused) this.#scene.scene.pause();
      else this.#scene.scene.resume();
    })

    const setScoreFromSnapshot = (index: number) => {
      return (snapshot: DataSnapshot) => {
        this.#score[index] = snapshot.val();
        this.#drawScoreDisplay();
        this.#checkGameEnd();
      }
    }

    onValue(ref(firebaseDatabase, `game/table/${this.#nodeId}/player1/score`), setScoreFromSnapshot(0))
    
    onValue(ref(firebaseDatabase, `game/table/${this.#nodeId}/player2/score`), setScoreFromSnapshot(1))

    onValue(ref(firebaseDatabase, `game/table/${this.#nodeId}/turn`), snapshot => {
      this.#nextTurn = snapshot.val();

      if (this.#nextTurn === "player1")
        this.#displayPlayer1Turn();
      else this.#displayPlayer2Turn();
    })

    onValue(ref(firebaseDatabase, `game/table/${this.#nodeId}/cardFlip`), snapshot => {
      const cardFlip = snapshot.val();
      if (cardFlip.location !== -1)
        this.flipCard(cardFlip.location, cardFlip.by);
    })

    onValue(ref(firebaseDatabase, `game/table/${this.#nodeId}/timeBarReset`), snapshot => {
      if (snapshot.val() !== -1) {
        super.setInteractive(true);
        this.#timeBarRunner[this.#timeBarRunner.isPaused() ? "play" : "restart"]()
      }
    });

    const startWhenReadyListener = onValue(ref(firebaseDatabase, `game/table/${this.#nodeId}`), snapshot => {
      const obj = snapshot.val();
      if (obj.player1.ready && obj.player2.ready) {
        super.setInteractive(true);
        this.#timeBarRunner[this.#timeBarRunner.isPaused() ? "play" : "restart"]()
        startWhenReadyListener();
      }
    });

    onValue(ref(firebaseDatabase, `game/table/${this.#nodeId}/exit`), snapshot => {
      const exit = snapshot.val() as boolean;
      if (exit) {
        this.#clearListeners();
        set(ref(firebaseDatabase, `game/table/${this.#nodeId}`), null)
          .then(() => {
            this.#scene.scene.start("Menu");
          })
          .catch(console.log)
      }
    });
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

  #checkGameEnd() {
    if (this.#score[0] + this.#score[1] === 20) {
      this.#clearListeners();
      const database = firebaseDatabase;
      set(ref(database, `game/table/${this.#nodeId}`), null)
        .then(() => {
          this.#scene.scene.start("GameEnd", {
            backgroundColorName: "fourth", winner: true,
            winnerPlayerName: this.#score[0] > this.#score[1] ? this.#player1 : this.#player2
          });
        })
    }
  }

  #clearListeners() {
    const keys = ["paused", "player1/score", "player2/score", "turn", "cardFlip", "timeBarReset", "exit"];
    keys.forEach(key => off(ref(firebaseDatabase, `game/table/${this.#nodeId}/${key}`), "value"));
    EventBus.off("visibility-change");
  }

  #pauseGame(value: boolean = true) {
    set(ref(firebaseDatabase, `game/table/${this.#nodeId}/paused`), value);
  }
}