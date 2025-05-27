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

    const tweenConfig = {
      duration: 500,
      ease: "linear",
      yoyo: true,
      loop: -1,
    }
  
    this.#scene.add.tween({
      ...tweenConfig,
      targets: dots[0],
      x: dots[0].x - 40,
    });

    this.#scene.add.tween({
      ...tweenConfig,
      targets: dots[1],
      scaleX: 1,
      scaleY: 1,
    });

    this.#scene.add.tween({
      ...tweenConfig,
      targets: dots[2],
      x: dots[2].x + 40,
    })
  }
}