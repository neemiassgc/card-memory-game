import { Scene } from 'phaser';
import { SinglePlayer } from '../SinglePlayer';

type GameMode = "SinglePlayer" | "Multiplayer";

export class Gameplay extends Scene {

  constructor() {
      super('Gameplay');
  }

  create(config: {gameMode: GameMode, data: "HARD" | "EASY"}) {
    if (config.gameMode === "SinglePlayer")
      new SinglePlayer(this, config.data);
  }
}