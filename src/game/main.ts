import { Gameplay } from './scenes/Gameplay';
import { AUTO, Game, Types } from "phaser";
import { Menu } from './scenes/Menu';
import { GameOver } from './scenes/GameOver';
import { colors } from '../tools';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
  type: AUTO,
  width: 1080,
  height: 720,
  parent: 'game-container',
  backgroundColor: colors["first"].hex as string,
  scene: [
    Menu,
    Gameplay,
    GameOver,
  ]
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
}

export default StartGame;
