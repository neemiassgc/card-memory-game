import { colors } from "@/tools";

export class Boot extends Phaser.Scene {

  constructor() {
    super("Boot");
  }

  preload() {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    const barWidth = 512;
    const textDisplay = this.add.text(0, 0, "0%", { color: "#ffffff", fontSize: 64});
    textDisplay.setX(screenWidth / 2 - textDisplay.width / 2);
    textDisplay.setY(screenHeight / 2 - textDisplay.height / 2 - 50);
    this.add.rectangle(screenWidth / 2, screenHeight / 2, barWidth, 32, colors["dark-first"].number as number);
    const bar = this.add.rectangle(screenWidth / 2 - barWidth / 2, screenHeight / 2, 0, 32, 0xffffff);

    this.load.on("progress", (progress: number) => {
      textDisplay.setText((progress * 100).toFixed(0)+"%");
      textDisplay.setX(screenWidth / 2 - textDisplay.width / 2);
      bar.width = parseInt((barWidth * progress).toFixed(0));
    });

    this.load.once("complete", () => this.scene.start("Menu"));

    this.loadAssets();
  }

  loadAssets() {
    this.load.spritesheet("burst", "assets/burst.png", { frameWidth: 192, frameHeight: 192, startFrame: 0, endFrame: 39});
    
    const keys = [
      "avocado", "barbarian", "carousel", "cash", "clubs",
      "comb", "console-controller", "cpu", "drill", "gingerbread-man",
      "goblin-camp", "honeypot", "moai", "orange", "processor",
      "robot", "sliced-bread", "spanner", "spectre", "tesla-turret"
    ]

    for (const key of keys)
      this.load.svg(key, `assets/${key}.svg`, {width: 96, height: 96}) 

    this.load.svg("anticlockwise-rotation", "assets/anticlockwise-rotation.svg", {width: 32, height: 32});
  }
}