import Phaser from 'phaser';
import { supabase } from '../lib/supabase';

const MENU_ITEMS = ['Play Again', 'Main Menu'] as const;
type MenuItem = typeof MENU_ITEMS[number];

const SCENES: Record<MenuItem, string> = {
  'Play Again': 'GameScene',
  'Main Menu': 'BootScene',
};

export class GameOverScene extends Phaser.Scene {
  private score = 1;
  private playerName = '';
  private phase: 'entering' | 'submitting' | 'gameover' = 'entering';
  private selectedIndex = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private nameInputText!: Phaser.GameObjects.Text;
  private nameEntryLabel!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score?: number }): void {
    this.score = data.score ?? 1;
    this.playerName = '';
    this.phase = 'entering';
    this.selectedIndex = 0;
    this.menuTexts = [];
  }

  create(): void {
    // Left and right border bars
    this.add.rectangle(5, 540, 10, 1080, 0x00ff00);
    this.add.rectangle(1075, 540, 10, 1080, 0x00ff00);

    this.add
      .text(540, 170, 'GAME OVER', { fontSize: '96px', color: '#00ff00' })
      .setOrigin(0.5);

    this.add
      .text(540, 320, `Level ${this.score} reached`, { fontSize: '40px', color: '#00ff00' })
      .setOrigin(0.5);

    this.nameEntryLabel = this.add
      .text(540, 460, 'Enter your name:', { fontSize: '32px', color: '#00ff00' })
      .setOrigin(0.5);

    this.nameInputText = this.add
      .text(540, 545, '_', { fontSize: '40px', color: '#00ff00' })
      .setOrigin(0.5);

    this.hintText = this.add
      .text(540, 630, 'Press ENTER to submit', { fontSize: '24px', color: '#00ff00' })
      .setOrigin(0.5);

    const kb = this.input.keyboard!;
    this.upKey    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.enterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    kb.on('keydown', this.handleKeyInput, this);
  }

  private handleKeyInput(event: KeyboardEvent): void {
    if (this.phase !== 'entering') return;

    if (event.key === 'Enter') {
      const trimmed = this.playerName.trim();
      if (trimmed.length === 0) return;
      this.phase = 'submitting';
      this.hintText.setText('Saving...');
      this.submitScore(trimmed);
    } else if (event.key === 'Backspace') {
      this.playerName = this.playerName.slice(0, -1);
      this.nameInputText.setText(this.playerName + '_');
    } else if (event.key.length === 1 && this.playerName.length < 20) {
      this.playerName += event.key;
      this.nameInputText.setText(this.playerName + '_');
    }
  }

  private async submitScore(name: string): Promise<void> {
    const { error } = await supabase
      .from('high_scores')
      .insert({ name, score: this.score });

    if (error) console.error('[GameOverScene] insert error:', error);

    this.showMenu(error ? 'Error saving score.' : 'Score saved!');
  }

  private showMenu(statusMessage: string): void {
    this.nameEntryLabel.setVisible(false);
    this.nameInputText.setVisible(false);
    this.hintText.setVisible(false);

    this.add
      .text(540, 460, statusMessage, { fontSize: '32px', color: '#00ff00' })
      .setOrigin(0.5);

    MENU_ITEMS.forEach((label, i) => {
      const y = 580 + i * 100;
      const text = this.add
        .text(540, y, label, { fontSize: '40px', color: '#00ff00' })
        .setOrigin(0.5);
      this.menuTexts.push(text);
    });

    this.updateSelection();
    this.phase = 'gameover';
  }

  private updateSelection(): void {
    MENU_ITEMS.forEach((label, i) => {
      this.menuTexts[i].setText(i === this.selectedIndex ? `- ${label} -` : label);
    });
  }

  update(): void {
    if (this.phase !== 'gameover') return;

    if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.selectedIndex = (this.selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
      this.updateSelection();
    }
    if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
      this.selectedIndex = (this.selectedIndex + 1) % MENU_ITEMS.length;
      this.updateSelection();
    }
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.scene.start(SCENES[MENU_ITEMS[this.selectedIndex]]);
    }
  }
}
