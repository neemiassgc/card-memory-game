import { Loading } from "../Loading";
import { Database, DatabaseReference, off, onValue, ref, set, Unsubscribe } from "@firebase/database";
import { getFirebaseDatabase } from "../temp"
import { generateArrayOfNumbers, parseSerializedArray, serialize } from "@/tools";
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

    const database = getFirebaseDatabase();
    const tableRef = ref(database, "game/table");

    this.#createRealtimeDatabase(database, tableRef);

    new Button({
      scene: this,
      x: 320,
      y: 0, key: "anticlockwise-rotation",
      onClick: () => {
        off(tableRef, "value")
        set(ref(database, `game/table/${this.nodeId}`), null)
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

  #createRealtimeDatabase(database: Database, tableRef: DatabaseReference) {
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
              player1: table[node].player1.nickname,
              player2: table[node].player2.nickname,
              thisPlayer: "player1",
              cardsPlacement:  parseSerializedArray(table[node].cardsPlacement),
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
          set(ref(database, `game/table/${node}/player2/nickname`), this.nickname)
            .then(() => this.#checkState(database, node))
            .then(cardsPlacement => this.#startGame({
              player1: table[node].player1.nickname,
              player2: this.nickname,
              thisPlayer: "player2",
              cardsPlacement: cardsPlacement as number[],
              nodeId: node
            }))
            .catch(console.log);
          return;
        }
      }

      set(ref(database, `game/table/${this.nodeId}/player1/nickname`), this.nickname)
        .then(() => this.#createInitialState(database))
        .catch(console.log);
    })
  }

  #createInitialState(database: Database) {
    const nodeRef = ref(database, "game/table/" + this.nodeId);

    const cardsPlacement = serialize(Phaser.Utils.Array.Shuffle(generateArrayOfNumbers(40)));
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
      cardsPlacement
    });
  }

  #checkState(database: Database, nodeId: string) {
    return new Promise<number[] | string>((res, rej) => {
      const nodeRef = ref(database, "game/table/" + nodeId);

      onValue(nodeRef, snapshot => {
        const obj = snapshot.val()

        const keysToCheck = [
          "turn", "player1", "player2", "timeBarReset",
          "cardFlip", "cardsPlacement", "paused", "exit"
        ];
        if (keysToCheck.some(it => !(it in obj))) rej("invalid state")
        res(parseSerializedArray(obj["cardsPlacement"]));
      })();
    })
  }

  #startGame(data: {
    player1: string, player2: string, thisPlayer: string,
    cardsPlacement: number[], nodeId: string
  }) {
    off(ref(getFirebaseDatabase(), "game/table"), "value");
    setTimeout(() => {
      this.scene.start("Gameplay", {
        gameMode: "Multiplayer",
        data
      })
    }, 1000)
  }
}