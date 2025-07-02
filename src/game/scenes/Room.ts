import { Loading } from "../Loading";
import { DatabaseReference, off, onValue, ref, set } from "@firebase/database";
import { firebaseDatabase } from "../firebase"
import { generateArrayOfNumbers, generateArrayOfRandomNumbers, objectKeys, parseSerializedArray, serialize } from "@/tools";
import { Button } from "../components/Button";

export class Room extends Phaser.Scene {

  nickname: string;
  nodeId: string = Phaser.Utils.String.UUID();

  constructor() {
    super("Room")
  }

  create(data: { nickname: string }) {
    this.nickname = data.nickname;

    this.createDisplayText(this.nickname, "up");

    new Loading(this);

    const tableRef = ref(firebaseDatabase, "game/table");

    this.#createRealtimeDatabase(tableRef);

    new Button({
      scene: this,
      x: 320,
      y: 0, key: "anticlockwise-rotation",
      onConfirmation: () => {
        off(tableRef, "value")
        set(ref(firebaseDatabase, `game/table/${this.nodeId}`), null)
          .then(() => this.scene.start("Menu"))
      }
    });

  }

  createDisplayText(text: string, direction: "up" | "down") {
    const displayText = this.add.text(0, 0, text, { color: "#ffffff", fontSize: 100});
    displayText.setX(this.scale.width / 2 - displayText.width / 2);
    if (direction === "up")
      displayText.setY(this.scale.height / 2 - displayText.height * 1.5);
    else displayText.setY(this.scale.height / 2 + displayText.height * 0.5);
  }

  #createRealtimeDatabase(tableRef: DatabaseReference) {
    let block = false;
    onValue(tableRef, snapshot => {
      if (block) return;

      const table = snapshot.val();

      // verify to join as player1
      for (const node in table) {
        if (table[node].player1?.nickname === this.nickname) {
          if (table[node].player2?.nickname) {
            this.createDisplayText(table[node].player2.nickname, "down");
            block = true;
            this.#startGame({
              playerNames: {
                player1: table[node].player1.nickname,
                player2: table[node].player2.nickname,
              },
              localPlayer: "player1",
              cardsPlacement: table[node].cardsPlacement,
              objectKeyIndexes: table[node].objectKeyIndexes,
              nodeId: node
            });
          }
          return;
        }
      }

      // verify to join as player2
      for (const node in table) {
        if (table[node].player1?.nickname && !table[node].player2?.nickname) {
          this.createDisplayText(table[node].player1.nickname, "down");
          block = true;
          set(ref(firebaseDatabase, `game/table/${node}/player2/nickname`), this.nickname)
            .then(() => this.#checkState(node))
            .then(([cardsPlacement, objectKeyIndexes]) => this.#startGame({
              playerNames: {
                player1: table[node].player1.nickname,
                player2: this.nickname,
              },
              localPlayer: "player2",
              cardsPlacement,
              objectKeyIndexes,
              nodeId: node
            }))
            .catch(console.log);
          return;
        }
      }

      set(ref(firebaseDatabase, `game/table/${this.nodeId}/player1/nickname`), this.nickname)
        .then(() => this.#createInitialState())
        .catch(console.log);
    })
  }

  #createInitialState() {
    const nodeRef = ref(firebaseDatabase, "game/table/" + this.nodeId);

    const cardsPlacement = serialize(Phaser.Utils.Array.Shuffle(generateArrayOfNumbers(40)));
    const objectKeyIndexes = serialize(generateArrayOfRandomNumbers(20, objectKeys.length));
    set(nodeRef, {
      turn: "player1",
      player1: {
        nickname: this.nickname,
        score: 0,
        ready: false
      },
      player2: {
        score: 0,
        ready: false
      },
      cardFlip: {
        location: -1,
        by: "player1"
      },
      paused: false,
      timeBarReset: -1,
      exit: false,
      cardsPlacement,
      objectKeyIndexes
    });
  }

  #checkState(nodeId: string) {
    return new Promise<string[]>((res, rej) => {
      const nodeRef = ref(firebaseDatabase, "game/table/" + nodeId);

      onValue(nodeRef, snapshot => {
        const obj = snapshot.val()

        const keysToCheck = [
          "turn", "player1", "player2", "timeBarReset",
          "cardFlip", "cardsPlacement", "paused", "exit", "objectKeyIndexes"
        ];
        if (keysToCheck.some(it => !(it in obj))) rej(["invalid state"])
        res([obj["cardsPlacement"], obj["objectKeyIndexes"]])
      })();
    });
  }

  #startGame(data: {
    playerNames: {
      player1: string,
      player2: string,
    },
    localPlayer: string,
    cardsPlacement: string,
    objectKeyIndexes: string,
    nodeId: string
  }) {
    off(ref(firebaseDatabase, "game/table"), "value");
    setTimeout(() => {
      this.scene.start("Gameplay", { gameMode: "multiplayer", data })
    }, 1000)
  }
}