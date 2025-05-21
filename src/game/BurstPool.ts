import { colors } from "@/tools";

export class BurstPool {

  #pool: Phaser.GameObjects.Sprite[] = [];
  #index: number = 0;

  constructor(poolSize: number, scene: Phaser.Scene, color: number) {
    for (let i = 0; i < poolSize; i++) {
      const sprite = scene.add.sprite(0, 0, "burst", 0);
      sprite.setTintFill(color);
      sprite.setVisible(false);
      sprite.anims.create({
        key: "explosion",
        frames: sprite.anims.generateFrameNumbers("burst", {
          start: 0, end: 39
        }),
        frameRate: 24,
        showOnStart: true,
        hideOnComplete: true,
      })
      this.#pool.push(sprite);
    }
  }

  tintAll(color: number) {
    this.#pool.forEach(it => it.setTintFill(color));
  }

  positionAndPLay(x: number, y: number): void {
    this.#resetPool();

    const sprite = this.#pool[this.#index++];
    sprite.setX(x);
    sprite.setY(y);
    sprite.anims.play("explosion");
  }

  #resetPool() {
    if (this.#index === this.#pool.length)
      this.#index = 0;
  }
}