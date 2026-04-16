import Phaser from 'phaser';

const SPEED = 180;
const PLAYER_SIZE = 60;
const HALF = PLAYER_SIZE / 2;
const BOUNDS = 1080;
// Inner edges of the 10px border bars at x=5 and x=1075
const PLAYER_X_MIN = 10 + HALF;         // 40
const PLAYER_X_MAX = 1070 - HALF;       // 1040

const BOSS_RADIUS = 55;
const BOSS_SPEED = 80;
const ARENA_SIZE = 400;
const ARENA_X = (BOUNDS - ARENA_SIZE) / 2; // 340
const ARENA_Y = (BOUNDS - ARENA_SIZE) / 2; // 340
// Clamp boss center so the circle stays fully inside the arena
const BOSS_MIN_X = ARENA_X + BOSS_RADIUS;               // 380
const BOSS_MAX_X = ARENA_X + ARENA_SIZE - BOSS_RADIUS;  // 700
const BOSS_MIN_Y = ARENA_Y + BOSS_RADIUS;               // 380
const BOSS_MAX_Y = ARENA_Y + ARENA_SIZE - BOSS_RADIUS;  // 700
// Random nudge applied to the perpendicular axis on each wall bounce
const BOUNCE_NUDGE = 24;

const BULLET_RADIUS = 5;
const BULLET_SPEED = 500;
const FIRE_COOLDOWN = 200; // ms

const BOSS_BULLET_RADIUS = 12;
const BOSS_BULLET_SPEED = 200;
const BOSS_BASE_HP = 25;
const BOSS_BASE_FIRE_INTERVAL = 800; // ms
const BOSS_RESPAWN_DELAY = 2000;     // ms

interface Bullet {
  circle: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private boss!: Phaser.GameObjects.Sprite;
  // Non-45° starting angle so the trajectory doesn't repeat corner-to-corner
  private bossVx = BOSS_SPEED;
  private bossVy = BOSS_SPEED * 0.6; // ~48 px/s
  // Per-level stats, scaled up on each respawn
  private bossMaxHp = BOSS_BASE_HP;
  private bossHp = BOSS_BASE_HP;
  private bossFireInterval = BOSS_BASE_FIRE_INTERVAL;
  private bossDefeatedAt = 0; // non-zero while boss is in the respawn delay
  private level = 1;
  private levelText!: Phaser.GameObjects.Text;
  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };
  private bullets: Bullet[] = [];
  private bossBullets: Bullet[] = [];
  private lastFiredAt = 0;
  private lastBossFiredAt = 0;
  private invincible = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(): void {
    // Reset all mutable state so a restart from GameOverScene starts clean.
    // Bullet circle game objects are already destroyed by Phaser's scene shutdown,
    // so we only need to clear the arrays.
    this.bullets = [];
    this.bossBullets = [];
    this.bossMaxHp = BOSS_BASE_HP;
    this.bossHp = BOSS_BASE_HP;
    this.bossFireInterval = BOSS_BASE_FIRE_INTERVAL;
    this.bossDefeatedAt = 0;
    this.level = 1;
    this.bossVx = BOSS_SPEED;
    this.bossVy = BOSS_SPEED * 0.6;
    this.lastFiredAt = 0;
    this.lastBossFiredAt = 0;
    this.invincible = false;
  }

  preload(): void {
    this.load.image('player', 'sprites/player.jpg');
    this.load.image('boss', 'sprites/boss.jpg');
  }

  create(): void {
    // Left and right border bars
    this.add.rectangle(5, 540, 10, 1080, 0x00ff00);
    this.add.rectangle(1075, 540, 10, 1080, 0x00ff00);

    this.player = this.add.sprite(BOUNDS / 2, BOUNDS / 2, 'player')
      .setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);

    this.boss = this.add.sprite(BOUNDS / 2, BOUNDS / 2, 'boss')
      .setDisplaySize(110, 110)
      .setVisible(false);

    this.levelText = this.add
      .text(1060, 20, 'Level 1', { fontSize: '32px', color: '#00ff00' })
      .setOrigin(1, 0)
      .setDepth(10);

    const kb = this.input.keyboard!;
    this.keys = {
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.tryFireBullet(pointer);
    });

    this.invincible = true;
    this.time.delayedCall(5000, () => { this.invincible = false; });
    // Sync so the first boss shot fires 800ms after it appears, not instantly
    this.lastBossFiredAt = this.time.now;
  }

  private tryFireBullet(pointer: Phaser.Input.Pointer): void {
    const now = this.time.now;
    if (now - this.lastFiredAt < FIRE_COOLDOWN) return;
    this.lastFiredAt = now;

    const dx = pointer.x - this.player.x;
    const dy = pointer.y - this.player.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const vx = (dx / len) * BULLET_SPEED;
    const vy = (dy / len) * BULLET_SPEED;

    const circle = this.add.circle(this.player.x, this.player.y, BULLET_RADIUS, 0x00ff00);
    this.bullets.push({ circle, vx, vy });
  }

  private defeatBoss(): void {
    this.boss.setVisible(false);
    for (const b of this.bossBullets) b.circle.destroy();
    this.bossBullets = [];
    this.bossDefeatedAt = this.time.now;

    this.level += 1;
    this.levelText.setText(`Level ${this.level}`);

    // Scale up for next round
    this.bossMaxHp = Math.round(this.bossMaxHp * 1.1);
    this.bossFireInterval *= 0.9;
  }

  private respawnBoss(): void {
    this.bossHp = this.bossMaxHp;
    this.bossDefeatedAt = 0;
    this.boss.setPosition(BOUNDS / 2, BOUNDS / 2);
    this.boss.setVisible(true);
    this.lastBossFiredAt = this.time.now;
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // Player movement
    const step = SPEED * dt;
    if (this.keys.w.isDown) {
      this.player.y = Math.max(HALF, this.player.y - step);
    }
    if (this.keys.s.isDown) {
      this.player.y = Math.min(BOUNDS - HALF, this.player.y + step);
    }
    if (this.keys.a.isDown) {
      this.player.x = Math.max(PLAYER_X_MIN, this.player.x - step);
    }
    if (this.keys.d.isDown) {
      this.player.x = Math.min(PLAYER_X_MAX, this.player.x + step);
    }

    // Boss movement — frozen while hidden
    if (this.boss.visible) {
      this.boss.x += this.bossVx * dt;
      this.boss.y += this.bossVy * dt;

      // Bounce off left/right walls — nudge vy for variation
      if (this.boss.x <= BOSS_MIN_X) {
        this.boss.x = BOSS_MIN_X;
        this.bossVx = Math.abs(this.bossVx);
        this.bossVy += (Math.random() - 0.5) * BOUNCE_NUDGE;
      } else if (this.boss.x >= BOSS_MAX_X) {
        this.boss.x = BOSS_MAX_X;
        this.bossVx = -Math.abs(this.bossVx);
        this.bossVy += (Math.random() - 0.5) * BOUNCE_NUDGE;
      }

      // Bounce off top/bottom walls — nudge vx for variation
      if (this.boss.y <= BOSS_MIN_Y) {
        this.boss.y = BOSS_MIN_Y;
        this.bossVy = Math.abs(this.bossVy);
        this.bossVx += (Math.random() - 0.5) * BOUNCE_NUDGE;
      } else if (this.boss.y >= BOSS_MAX_Y) {
        this.boss.y = BOSS_MAX_Y;
        this.bossVy = -Math.abs(this.bossVy);
        this.bossVx += (Math.random() - 0.5) * BOUNCE_NUDGE;
      }
    }

    // Player-boss body collision
    if (this.boss.visible && !this.invincible) {
      const overlapX = Math.abs(this.player.x - this.boss.x) < HALF + BOSS_RADIUS;
      const overlapY = Math.abs(this.player.y - this.boss.y) < HALF + BOSS_RADIUS;
      if (overlapX && overlapY) {
        this.scene.start('GameOverScene', { score: this.level });
        return;
      }
    }

    // Player bullet movement, out-of-bounds cleanup, and boss hit detection
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.circle.x += b.vx * dt;
      b.circle.y += b.vy * dt;

      if (
        b.circle.x < 0 || b.circle.x > BOUNDS ||
        b.circle.y < 0 || b.circle.y > BOUNDS
      ) {
        b.circle.destroy();
        this.bullets.splice(i, 1);
        continue;
      }

      // Circle-circle hit: bullet vs boss (only while boss is visible)
      if (this.boss.visible) {
        const dx = b.circle.x - this.boss.x;
        const dy = b.circle.y - this.boss.y;
        const hitRadius = BOSS_RADIUS + BULLET_RADIUS;
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          b.circle.destroy();
          this.bullets.splice(i, 1);
          this.bossHp -= 1;
          if (this.bossHp <= 0) this.defeatBoss();
          continue;
        }
      }
    }

    // Initial reveal after spawn delay
    if (!this.invincible && !this.boss.visible && this.bossDefeatedAt === 0) {
      this.boss.setVisible(true);
      this.lastBossFiredAt = this.time.now;
    }

    // Respawn after defeat delay
    if (this.bossDefeatedAt > 0 && this.time.now - this.bossDefeatedAt >= BOSS_RESPAWN_DELAY) {
      this.respawnBoss();
    }

    // Boss firing — suppressed during invincibility and while hidden
    if (this.boss.visible && !this.invincible &&
        this.time.now - this.lastBossFiredAt >= this.bossFireInterval) {
      this.lastBossFiredAt = this.time.now;
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * BOSS_BULLET_SPEED;
      const vy = Math.sin(angle) * BOSS_BULLET_SPEED;
      const circle = this.add.circle(this.boss.x, this.boss.y, BOSS_BULLET_RADIUS, 0xff0000);
      this.bossBullets.push({ circle, vx, vy });
    }

    // Boss bullet movement, cleanup, and player hit detection
    for (let i = this.bossBullets.length - 1; i >= 0; i--) {
      const b = this.bossBullets[i];
      b.circle.x += b.vx * dt;
      b.circle.y += b.vy * dt;

      if (
        b.circle.x < 0 || b.circle.x > BOUNDS ||
        b.circle.y < 0 || b.circle.y > BOUNDS
      ) {
        b.circle.destroy();
        this.bossBullets.splice(i, 1);
        continue;
      }

      // Collision detection suppressed during invincibility
      if (this.invincible) continue;

      // Circle-to-rectangle overlap: clamp bullet center to player rect, measure distance
      const nearX = Phaser.Math.Clamp(b.circle.x, this.player.x - HALF, this.player.x + HALF);
      const nearY = Phaser.Math.Clamp(b.circle.y, this.player.y - HALF, this.player.y + HALF);
      const distSq = (b.circle.x - nearX) ** 2 + (b.circle.y - nearY) ** 2;
      if (distSq <= BOSS_BULLET_RADIUS * BOSS_BULLET_RADIUS) {
        this.scene.start('GameOverScene', { score: this.level });
        return;
      }
    }
  }
}
