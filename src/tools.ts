export const colors: {[prop: string]: number } = {
  "first": 0x009966,
  "dark-first": 0x006045,
  "second": 0xffba00,
  "dark-second": 0xd08700,
  "third": 0x0084d1,
  "dark-third": 0x193cb8,
  "fourth": 0xe7000b,
  "dark-fourth": 0x9f0712,
}

export const objectKeys = [
  "avocado", "barbarian", "carousel", "cash", "clubs",
  "comb", "console-controller", "cpu", "drill", "gingerbread-man",
  "goblin-camp", "honeypot", "moai", "orange", "processor",
  "robot", "sliced-bread", "spanner", "spectre", "tesla-turret",
  "acorn", "button-finger", "famas", "fizzing-flask", "gem-pendant",
  "guitar", "helicopter", "jeep", "key", "light-bulb",
  "mushroom-cloud", "plague-doctor-profile", "pumpkin-mask", "revolver",
  "round-straw-bale", "rupee", "satellite", "space-suit", "tank",
  "trombone", "twister", "ufo", "whistle",
]

export function toHexString(n: number) {
  const hex = n.toString(16);
  return "#" + "0".repeat(6 - hex.length) + hex;
}

export function generateArrayOfRandomNumbers(size: number, max: number): number[] {
  const setOfNumbers: number[] = [];
  for (let i = 0; i < max; i++) setOfNumbers.push(i);

  const output = [];
  for (let i = 0; i < size; i++) {
    const randomIndex = Math.floor(Math.random() * setOfNumbers.length);
    const number = setOfNumbers[randomIndex];
    output.push(number);
    setOfNumbers.splice(randomIndex, 1);
  }

  return output;
}

export function generateArrayOfNumbers(size: number): number[] {
  const output = [];
  for (let i = 0; i < size; i++) output.push(i);
  return output;
}

export function serialize(numbers: number[]): string {
  return numbers.join(";");
}

export function parseSerializedArray(serializedArray: string): number[] {
  const slicedString = serializedArray.split(";");
  return slicedString.map(Number);
}

export type TPlayer = "player1" | "player2";

export interface MultiplayerData {
  playerNames: {
    player1: string,
    player2: string,
  },
  localPlayer: TPlayer
  cardsPlacement: string,
  objectKeyIndexes: string,
  nodeId: string
}