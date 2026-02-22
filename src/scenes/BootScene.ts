import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Left and right border bars
    this.add.rectangle(5, 540, 10, 1080, 0x00ff00);
    this.add.rectangle(1075, 540, 10, 1080, 0x00ff00);

    this.add
      .text(540, 420, 'CHIMPY', {
        fontSize: '96px',
        color: '#00ff00',
      })
      .setOrigin(0.5);

    this.add
      .text(540, 580, 'Press ENTER to Play', {
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.enterKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.scene.start('GameScene');
    }
  }
}
