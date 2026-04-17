import Phaser from 'phaser';

const MENU_ITEMS = ['Play', 'High Scores'] as const;
type MenuItem = typeof MENU_ITEMS[number];

const SCENES: Record<MenuItem, string> = {
  'Play': 'GameScene',
  'High Scores': 'HighScoresScene',
};

export class BootScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private wKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Reset state on every (re)start so the selection indicator is always correct
    this.selectedIndex = 0;
    this.menuTexts = [];

    // Left and right border bars
    this.add.rectangle(5, 540, 10, 1080, 0x00ff00);
    this.add.rectangle(1075, 540, 10, 1080, 0x00ff00);

    this.add
      .text(540, 380, 'CHIMPY', {
        fontSize: '96px',
        color: '#00ff00',
      })
      .setOrigin(0.5);

    MENU_ITEMS.forEach((label, i) => {
      const y = 560 + i * 80;
      const text = this.add
        .text(540, y, label, { fontSize: '40px', color: '#00ff00' })
        .setOrigin(0.5);
      this.menuTexts.push(text);
    });

    const kb = this.input.keyboard!;
    this.upKey    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.wKey     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.enterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this.updateSelection();
  }

  private updateSelection(): void {
    MENU_ITEMS.forEach((label, i) => {
      const isSelected = i === this.selectedIndex;
      this.menuTexts[i].setText(isSelected ? `- ${label} -` : label);
    });
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.wKey)) {
      this.selectedIndex = (this.selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
      this.updateSelection();
    }

    if (Phaser.Input.Keyboard.JustDown(this.downKey) || Phaser.Input.Keyboard.JustDown(this.sKey)) {
      this.selectedIndex = (this.selectedIndex + 1) % MENU_ITEMS.length;
      this.updateSelection();
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.scene.start(SCENES[MENU_ITEMS[this.selectedIndex]]);
    }
  }
}
