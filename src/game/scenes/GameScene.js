import Phaser from 'phaser';

// ─── Constants ────────────────────────────────────────────────────────────────
const FRAME_SIZE   = 128;   // All Shinobi sprites use 128×128 frames
const FLOOR_OFFSET = 0;     // Distance from viewport bottom to floor (px)
const MOVE_SPEED   = 200;   // Horizontal velocity (px/s)
const JUMP_VEL     = -600;  // Vertical impulse on jump (px/s, negative = up)
const GRAVITY      = 800;   // Pixels/s² — set in config but also used locally
const CHAR_SCALE   = 1;     // Native 128 px; smaller on mobile (see resize)

// Shinobi sprite frame counts (verified via sips)
const FRAMES = {
  idle:   6,
  run:    8,
  walk:   8,
  jump:   12,
  attack: 5,   // Attack_1.png = 640×128
  dead:   4,   // Dead.png      = 512×128
  hurt:   2,   // Hurt.png      = 256×128
};

// ─── Scene ────────────────────────────────────────────────────────────────────
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ── Preload ──────────────────────────────────────────────────────────────
  preload() {
    const base = `${import.meta.env.BASE_URL}assets/sprites/Shinobi`;
    const cfg  = { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE };

    this.load.spritesheet('idle',   `${base}/Idle.png`,     cfg);
    this.load.spritesheet('run',    `${base}/Run.png`,      cfg);
    this.load.spritesheet('walk',   `${base}/Walk.png`,     cfg);
    this.load.spritesheet('jump',   `${base}/Jump.png`,     cfg);
    this.load.spritesheet('attack', `${base}/Attack_1.png`, cfg);
    this.load.spritesheet('dead',   `${base}/Dead.png`,     cfg);
    this.load.spritesheet('hurt',   `${base}/Hurt.png`,     cfg);
  }

  // ── Create ───────────────────────────────────────────────────────────────
  create() {
    const { width, height } = this.scale;

    // ── Generate 1×1 pixel texture for invisible floor platform ─────────
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture('pixel', 1, 1);
    g.destroy();

    // ── Floor static body ────────────────────────────────────────────────
    const floorY = height - FLOOR_OFFSET;
    this.floorBody = this.physics.add.staticImage(width / 2, floorY, 'pixel');
    this.floorBody.setDisplaySize(width, 10);
    this.floorBody.setAlpha(0);
    this.floorBody.refreshBody();

    // ── Animations ───────────────────────────────────────────────────────
    const makeAnim = (key, sprite, frames, frameRate, repeat = -1) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(sprite, {
          start: 0,
          end: frames - 1,
        }),
        frameRate,
        repeat,
      });
    };

    makeAnim('anim-idle',   'idle',   FRAMES.idle,   8);
    makeAnim('anim-run',    'run',    FRAMES.run,    12);
    makeAnim('anim-walk',   'walk',   FRAMES.walk,   8);
    makeAnim('anim-jump',   'jump',   FRAMES.jump,   14, 0);
    makeAnim('anim-attack', 'attack', FRAMES.attack, 14, 0);
    makeAnim('anim-dead',   'dead',   FRAMES.dead,   8,  0);
    makeAnim('anim-hurt',   'hurt',   FRAMES.hurt,   8,  0);

    // ── Player ───────────────────────────────────────────────────────────
    // Spawn at horizontal center, high enough to fall to the floor
    this.player = this.physics.add.sprite(
      width / 2,
      height / 2,
      'idle',
    );
    this.player.setScale(CHAR_SCALE);

    // Trim physics body to character silhouette (inner ~40×80 of 128×128 frame)
    this.player.body.setSize(48, 80);
    this.player.body.setOffset(40, 44);

    // Prevent sliding off screen edges
    this.player.setCollideWorldBounds(true);

    // Let Phaser manage gravity on the player
    // (global gravity already set in config; no extra gravity needed here)

    // ── Collider ─────────────────────────────────────────────────────────
    this.physics.add.collider(this.player, this.floorBody);

    // ── Keyboard ─────────────────────────────────────────────────────────
    const KB = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left:   this.input.keyboard.addKey(KB.A),
      right:  this.input.keyboard.addKey(KB.D),
      jump:   this.input.keyboard.addKey(KB.W),
      attack: this.input.keyboard.addKey(KB.SPACE),
    };

    // ── Internal state ───────────────────────────────────────────────────
    this.isAttacking = false;
    this.facingRight = true;

    // Start idle
    this.player.play('anim-idle');

    // Make canvas non-interactive (keyboard still fires via window events)
    this.game.canvas.style.pointerEvents = 'none';

    // ── OpenPet bridge ───────────────────────────────────────────────────
    this.openPetAnimationHandler = (event) => {
      this.playOpenPetAnimation(event.detail?.animation);
    };
    window.addEventListener('codex-openpet:animate', this.openPetAnimationHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('codex-openpet:animate', this.openPetAnimationHandler);
    });

    // ── Resize handler ───────────────────────────────────────────────────
    this.scale.on('resize', this.onResize, this);
  }


  // ── OpenPet actions ───────────────────────────────────────────────────────
  playOpenPetAnimation(animation = 'idle') {
    if (!this.player?.body) return;

    const body = this.player.body;
    const onGround = body.blocked.down;

    if (animation === 'hurt' && this.anims.exists('anim-hurt')) {
      this.player.setVelocityX(0);
      this.player.play('anim-hurt', true);
      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.player.play('anim-idle', true);
      });
      return;
    }

    if (animation === 'attack' && this.anims.exists('anim-attack')) {
      this.isAttacking = true;
      this.player.setVelocityX(0);
      this.player.play('anim-attack', true);
      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
        this.player.play('anim-idle', true);
      });
      return;
    }

    if ((animation === 'jump' || animation === 'celebrate') && onGround) {
      this.player.setVelocityY(JUMP_VEL);
      this.player.play('anim-jump', true);
    }
  }

  // ── Resize ───────────────────────────────────────────────────────────────
  onResize(gameSize) {
    const { width, height } = gameSize;
    const newFloorY = height - FLOOR_OFFSET;

    // Reposition & rescale floor
    this.floorBody.setPosition(width / 2, newFloorY);
    this.floorBody.setDisplaySize(width, 10);
    this.floorBody.refreshBody();

    // Update world bounds so the player doesn't leave the screen
    this.physics.world.setBounds(0, 0, width, height);

    // Scale character down on small screens
    const scale = width < 640 ? 0.7 : 1;
    this.player.setScale(scale);
  }

  // ── Update (runs every frame) ─────────────────────────────────────────────
  update() {
    const { left, right, jump, attack } = this.keys;
    const body     = this.player.body;
    const onGround = body.blocked.down;

    // ── Attack (Space, only when grounded, not already attacking) ────────
    if (
      Phaser.Input.Keyboard.JustDown(attack) &&
      onGround &&
      !this.isAttacking
    ) {
      this.isAttacking = true;
      this.player.setVelocityX(0);
      this.player.play('anim-attack', true);
      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
      });
      return; // Skip movement while starting attack
    }

    // Lock movement while attack animation is still playing
    if (this.isAttacking) {
      this.player.setVelocityX(0);
      return;
    }

    // ── Horizontal movement ───────────────────────────────────────────────
    if (left.isDown) {
      this.player.setVelocityX(-MOVE_SPEED);
      this.player.setFlipX(true);
      this.facingRight = false;
      if (onGround) this.player.play('anim-run', true);

    } else if (right.isDown) {
      this.player.setVelocityX(MOVE_SPEED);
      this.player.setFlipX(false);
      this.facingRight = true;
      if (onGround) this.player.play('anim-run', true);

    } else {
      // Decelerate
      this.player.setVelocityX(0);
      if (onGround) this.player.play('anim-idle', true);
    }

    // ── Jump (W, only when grounded) ─────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(jump) && onGround) {
      this.player.setVelocityY(JUMP_VEL);
      this.player.play('anim-jump', true);
    }

    // ── Air animation (falling) ───────────────────────────────────────────
    if (!onGround && body.velocity.y > 0) {
      // Show the back half of jump frames while descending
      const currentAnim = this.player.anims.currentAnim;
      if (!currentAnim || currentAnim.key !== 'anim-jump') {
        this.player.play('anim-jump', true);
      }
    }

    // ── Publish player screen rect for React tooltip layer ──────────────
    // Canvas is pointer-events:none, so Phaser's pointer is always (0,0).
    // Instead we publish the player's current screen bounds each frame;
    // the React layer listens to window mousemove and does the hit-test.
    const b = this.player.getBounds();
    window.__shinobiRect = {
      left:   b.left,
      right:  b.right,
      top:    b.top,
      bottom: b.bottom,
    };
  }
}
