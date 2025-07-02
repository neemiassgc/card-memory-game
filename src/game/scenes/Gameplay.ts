import { Scene } from 'phaser';
import { SinglePlayer } from '../SinglePlayer';
import { Multiplayer } from '../Multiplayer';
import { MultiplayerData, TPlayer } from '@/tools';

type GameMode = "SinglePlayer" | "Multiplayer";
type Difficulty = "HARD" | "EASY";

export class Gameplay extends Scene {

  constructor() {
    super('Gameplay');
  }

  create(config: { gameMode: GameMode, data: Difficulty | MultiplayerData }) {
    if (config.gameMode === "SinglePlayer")
      new SinglePlayer(this, config.data as Difficulty);
    else new Multiplayer(this, config.data as MultiplayerData);
  }
}