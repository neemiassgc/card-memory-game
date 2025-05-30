export const colors: {[prop: string]: {[prop: string]: number | string}} = {
  "first": {
    number: 0x009966,
    hex: "#009966"
  },
  "dark-first": {
    number: 0x006045,
    hex: "#006045"
  },
  "second": {
    number: 0xffba00,
    hex: "#ffba00"
  },
  "dark-second": {
    number: 0xd08700,
    hex: "#d08700"
  },
  "third": {
    number: 0x0084d1,
    hex: "#0084d1"
  },
  "dark-third": {
    number: 0x193cb8,
    hex: "#193cb8"
  },
  "fourth": {
    number: 0xe7000b,
    hex: "#e7000b"
  },
  "dark-fourth": {
    number: 0x9f0712,
    hex: "#9f0712"
  },
}

export function generateArrayOfNumbers(size: number): number[] {
  const outcome: number[] = [];
  for (let i = 0; i < size; i++)
    outcome.push(i);
  return outcome;
}

export function serialize(numbers: number[]): string {
  return numbers.join(";");
}

export function parseSerializedArray(serializedArray: string): number[] {
  const slicedString = serializedArray.split(";");
  return slicedString.map(Number);
}