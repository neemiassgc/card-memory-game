import { AUTO, Game, Types } from "phaser";
import { Menu } from './scenes/Menu';
import { GameEnd } from './scenes/GameEnd';
import { colors, toHexString } from '../tools';
import { Boot } from './scenes/Boot';
import { Room } from './scenes/Room';
import { SinglePlayer } from './scenes/SinglePlayer';
import { Multiplayer } from './scenes/Multiplayer';

const config: Types.Core.GameConfig = {
  type: AUTO,
  width: 1080,
  height: 720,
  parent: 'game-container',
  backgroundColor: toHexString(colors.first),
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
    SinglePlayer,
    Multiplayer,
    GameEnd,
  ]
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
}

export default StartGame;
