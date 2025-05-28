import { Loading } from "../Loading";
import { onValue, ref, set } from "@firebase/database";
import { getFirebaseDatabase } from "../temp"

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

      const table = snapshot.val() as {[prop: string]: string}[];

      for (const node of table) {
        if (node.player1 === this.nickname) {
          if (node.player2) {
            this.createDisplayText(node.player2, "down");
            block = true;
            this.#startGame(node.player1, node.player2, "Player1");
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
            .then(() => this.#startGame(table[i].player1, this.nickname, "Player2"))
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

     onValue(nodeRef, snapshot => {
        const obj = snapshot.val();
        set(nodeRef, {
          ...obj,
          turn: "Player1",
          player1Score: 0,
          player2Score: 0,
          flipCard: -1
        });
      })();
  }

  #checkState(indexNode: number) {
    return new Promise((res, rej) => {
      const database = getFirebaseDatabase();
      const nodeRef = ref(database, "game/table/" + indexNode);

      onValue(nodeRef, snapshot => {
        const obj = snapshot.val();
        const remoteProps = Object.keys(obj);

        const keysToCheck = ["turn", "player1", "player2", "player1Score", "player2Score", "flipCard"];
        for (const key of keysToCheck) {
          if (!remoteProps.includes(key)) rej("Invalid state");
        }
        res("Ok");
      })();
    })
  }

  #startGame(player1: string, player2: string, thisPlayer: string) {
    setTimeout(() => {
      this.scene.start("Gameplay", {
        gameMode: "Multiplayer",
        data: { player1, player2, thisPlayer }
      })
    }, 1000)
  }
}