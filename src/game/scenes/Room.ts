import { Loading } from "../Loading";
import { onValue, ref, set } from "@firebase/database";
import { getFirebaseDatabase } from "../temp"
import { generateArrayOfNumbers, parseSerializedArray, serialize } from "@/tools";

interface GameProps {
  [prop: string]: string | number | number[],
  turn: string,
  player1: string,
  player2: string,
  player2Score: number,
  player1Score: number,
  flipCard: number,
  cardsPlacement: string
}

export class Room extends Phaser.Scene {

  nickname: string;

  constructor() {
    super("Room")
  }

  create(data: { nickname: string }) {
    this.nickname = data.nickname;

    this.createDisplayText(this.nickname, "up");

    new Loading(this);

    this.#createRealtimeDatabase();
  }

  createDisplayText(text: string, direction: "up" | "down") {
    const displayText = this.add.text(0, 0, text, { color: "#ffffff", fontSize: 100});
    displayText.setX(this.scale.width / 2 - displayText.width / 2);
    if (direction === "up")
      displayText.setY(this.scale.height / 2 - displayText.height * 1.5);
    else displayText.setY(this.scale.height / 2 + displayText.height * 0.5);
  }

  async #createRealtimeDatabase() {
    const database = getFirebaseDatabase();
    const dbRef = ref(database, "game/table");

    let block = false;
    onValue(dbRef, snapshot => {
      if (block) return;

      const table = snapshot.val() as GameProps[];

      for (const node of table) {
        if (node.player1 === this.nickname) {
          if (node.player2) {
            this.createDisplayText(node.player2, "down");
            block = true;
            this.#startGame(node.player1, node.player2, "player1", parseSerializedArray(node.cardsPlacement));
            return;
          }
          else return;
        }
      }

      for (let i = 0; i < table.length; i++) {
        if (table[i].player1 && !table[i].player2) {
          this.createDisplayText(table[i].player1, "down");
          block = true;
          set(ref(database, "game/table/"+i), {...table[i], "player2": this.nickname})
            .then(() => this.#checkState(i))
            .then((cardPlacement) => this.#startGame(table[i].player1, this.nickname, "player2", cardPlacement as number[]))
            .catch(console.log);
          return;
        }
      }

      set(dbRef, [...table, {"player1": this.nickname}])
        .then(() => this.#createInitialState(table.length));
    })
  }

  #createInitialState(indexNode: number) {
    const database = getFirebaseDatabase();
    const nodeRef = ref(database, "game/table/" + indexNode);

    const cardsPlacement = serialize(generateArrayOfNumbers(40));    
    onValue(nodeRef, snapshot => {
      const obj = snapshot.val();
      set(nodeRef, {
        ...obj,
        turn: "player1",
        player1Score: 0,
        player2Score: 0,
        cardFlip: {
          location: -1,
          by: "player1"
        },
        timeBarReset: -1,
        cardsPlacement
      });
    })();
  }

  #checkState(indexNode: number) {
    return new Promise<number[] | string>((res, rej) => {
      const database = getFirebaseDatabase();
      const nodeRef = ref(database, "game/table/" + indexNode);

      onValue(nodeRef, snapshot => {
        const obj = snapshot.val() as GameProps;
        const remoteProps = Object.keys(obj);

        const keysToCheck = [
          "turn", "player1", "player2", "player1Score", "timeBarReset",
          "player2Score", "cardFlip", "cardsPlacement",
        ];
        for (const key of keysToCheck) {
          if (!remoteProps.includes(key)) rej("Invalid state");
        }
        res(parseSerializedArray(obj["cardsPlacement"]));
      })();
    })
  }

  #startGame(player1: string, player2: string, thisPlayer: string, cardsPlacement: number[]) {
    setTimeout(() => {
      this.scene.start("Gameplay", {
        gameMode: "Multiplayer",
        data: { player1, player2, thisPlayer, cardsPlacement }
      })
    }, 1000)
  }
}