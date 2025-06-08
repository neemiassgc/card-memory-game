import { Gameplay } from './scenes/Gameplay';
import { AUTO, Game, Types } from "phaser";
import { Menu } from './scenes/Menu';
import { GameEnd } from './scenes/GameEnd';
import { colors } from '../tools';
import { Boot } from './scenes/Boot';
import { Room } from './scenes/Room';

const config: Types.Core.GameConfig = {
  type: AUTO,
  width: 1080,
  height: 720,
  parent: 'game-container',
  backgroundColor: colors["first"].hex as string,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 720,
  },
  scene: [
    Boot,
    Menu,
    Room,
    Gameplay,
    GameEnd,
  ]
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
}

export default StartGame;
