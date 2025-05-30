import { Scene } from 'phaser';
import { SinglePlayer } from '../SinglePlayer';
import { Multiplayer } from '../Multiplayer';

type GameMode = "SinglePlayer" | "Multiplayer";
type Difficult = "HARD" | "EASY";
type MultiplayerData = {
  player1: string,
  player2: string,
  thisPlayer: "Player1" | "Player2",
  cardsPlacement: number[]
}

export class Gameplay extends Scene {

  constructor() {
      super('Gameplay');
  }

  create(config: { gameMode: GameMode, data: Difficult | MultiplayerData }) {
    if (config.gameMode === "SinglePlayer")
      new SinglePlayer(this, config.data as Difficult);
    else {
      const data = config.data as MultiplayerData;
      new Multiplayer(this, { player1: data.player1, player2: data.player2 }, data.thisPlayer, data.cardsPlacement);
    }
  }
}