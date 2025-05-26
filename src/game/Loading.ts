import { colors } from "@/tools";

export class Loading {
  #scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.#scene = scene;

    this.#createLoadingAnimation();
  }

  #createLoadingAnimation() {
    const screenWidth = this.#scene.scale.width;
    const screenHeight = this.#scene.scale.height;
    const dots = [];

    for (let i = 0; i < 3; i++) {
      const cl = this.#scene.add.circle(screenWidth / 2, screenHeight / 2, 15, colors["dark-first"].number as number);
      dots.push(cl);
    }

    dots[1].setScale(2, 2);
  
    this.#scene.add.tween({
      targets: dots[0],
      duration: 500,
      ease: "linear",
      x: dots[0].x - 40,
      yoyo: true,
      loop: -1,
    });

    this.#scene.add.tween({
      targets: dots[1],
      duration: 500,
      ease: "linear",
      scaleX: 1,
      scaleY: 1,
      yoyo: true,
      loop: -1
    });

    this.#scene.add.tween({
      targets: dots[2],
      duration: 500,
      ease: "linear",
      x: dots[2].x + 40,
      yoyo: true,
      loop: -1
    })
  }
}