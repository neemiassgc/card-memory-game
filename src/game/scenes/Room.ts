import { initializeApp } from "@firebase/app";
import { Loading } from "../Loading";
import { getDatabase, onValue, ref, set } from "@firebase/database";
import { dbUrl } from "../temp"

export class Room extends Phaser.Scene {

  nickname: string;

  constructor() {
    super("Room")
  }

  create(data: { nickname: string }) {
    this.nickname = data.nickname;

    this.createDisplayText(this.nickname, "up");

    new Loading(this);

    this.createRealtimeDatabase();
  }

  createDisplayText(text: string, direction: "up" | "down") {
    const displayText = this.add.text(0, 0, text, { color: "#ffffff", fontSize: 100});
    displayText.setX(this.scale.width / 2 - displayText.width / 2);
    if (direction === "up")
      displayText.setY(this.scale.height / 2 - displayText.height * 1.5);
    else displayText.setY(this.scale.height / 2 + displayText.height * 0.5);
  }

  createRealtimeDatabase() {
    const config = {
      databaseURL: dbUrl
    }
    const app = initializeApp(config);
    const database = getDatabase(app);
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
            this.#startGame(node.player1, node.player2);
            return;
          }
          else return;
        }
      }

      for (let i = 0; i < table.length; i++) {
        if (table[i].player1 && !table[i].player2) {
          this.createDisplayText(table[i].player1, "down");
          block = true;
          set(ref(database, "game/table/"+i), {...table[i], "player2": this.nickname});
          this.#startGame(table[i].player1, this.nickname);
          return;
        }
      }

      set(dbRef, [...table, {"player1": this.nickname}]);
    })
  }

  #startGame(player1: string, player2: string) {
    setTimeout(() => {
      this.scene.start("Gameplay", {
        gameMode: "Multiplayer",
        data: { player1: player1, player2: player2 }
      })
    }, 1000)
  }
}