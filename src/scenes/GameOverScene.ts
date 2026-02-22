import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    // Left and right border bars
    this.add.rectangle(5, 540, 10, 1080, 0x00ff00);
    this.add.rectangle(1075, 540, 10, 1080, 0x00ff00);

    this.add
      .text(540, 540, 'GAME OVER', {
        fontSize: '96px',
        color: '#00ff00',
      })
      .setOrigin(0.5);
  }
}
