import Phaser from 'phaser';
import { supabase } from '../lib/supabase';

interface HighScoreRow {
  name: string;
  score: number;
}

export class HighScoresScene extends Phaser.Scene {
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'HighScoresScene' });
  }

  create(): void {
    // Left and right border bars
    this.add.rectangle(5, 540, 10, 1080, 0x00ff00);
    this.add.rectangle(1075, 540, 10, 1080, 0x00ff00);

    this.add
      .text(540, 110, 'High Scores', { fontSize: '72px', color: '#00ff00' })
      .setOrigin(0.5);

    const statusText = this.add
      .text(540, 540, 'Loading...', { fontSize: '32px', color: '#00ff00' })
      .setOrigin(0.5);

    this.add
      .text(540, 1020, 'Press ENTER to go back', { fontSize: '28px', color: '#00ff00' })
      .setOrigin(0.5);

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this.fetchAndDisplay(statusText);
  }

  private async fetchAndDisplay(statusText: Phaser.GameObjects.Text): Promise<void> {
    const { data, error } = await supabase
      .from('high_scores')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(10);

    statusText.destroy();

    if (error) console.error('[HighScoresScene] fetch error:', error);

    if (error || !data || data.length === 0) {
      this.add
        .text(540, 540, error ? 'Failed to load scores.' : 'No scores yet!', {
          fontSize: '32px',
          color: '#00ff00',
        })
        .setOrigin(0.5);
      return;
    }

    const startY = 240;
    const lineH = 68;
    (data as HighScoreRow[]).forEach((row, i) => {
      this.add
        .text(540, startY + i * lineH, `${i + 1}.  ${row.name}  —  ${row.score}`, {
          fontSize: '36px',
          color: '#00ff00',
        })
        .setOrigin(0.5);
    });
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.scene.start('BootScene');
    }
  }
}
