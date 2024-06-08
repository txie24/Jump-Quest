class Load extends Phaser.Scene {
  constructor() {
    super("loadScene");
  }

  preload() {
    this.load.setPath("./assets/");

    // Load characters spritesheet
    this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

    // Load tilemap information
    this.load.image("tilemap_tiles", "tilemap_packed.png");                         // Packed tilemap
    this.load.image("tilemap-backgrounds", "tilemap-backgrounds_packed.png");                         // Packed tilemap
    this.load.image("tilemap-food", "tilemap_packed_food.png");                         // Packed tilemap
    this.load.image('particle', 'yellow.png');
    this.load.spritesheet("sprite_tiles", "tilemap_packed.png", { frameWidth: 18, frameHeight: 18 });
    this.load.spritesheet("sprite_tiles_food", "tilemap_packed_food.png", { frameWidth: 18, frameHeight: 18 });

    this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");   // Tilemap in JSON
    this.load.tilemapTiledJSON("platformer-level-2", "3adesign.tmj");   // Tilemap in JSON
    this.load.tilemapTiledJSON("platformer-level-3", "3adesign1.tmj");   // Tilemap in JSON

    this.load.audio('diamondSound', 'audio/impactMetal_medium_001.ogg');
    this.load.audio('heartSound', 'audio/impactTin_medium_001.ogg');
    this.load.audio('keySound', 'audio/impactMining_000.ogg');
    this.load.audio('enemySound', 'audio/impactWood_light_000.ogg');
    this.load.audio('jumpSound', 'audio/phaserUp7.ogg');
    this.load.audio('movingSound', 'audio/powerUp1.ogg');

  }

  create() {
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNames('platformer_characters', {
        prefix: "tile_",
        start: 0,
        end: 1,
        suffix: ".png",
        zeroPad: 4
      }),
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: 'idle',
      defaultTextureKey: "platformer_characters",
      frames: [
        { frame: "tile_0000.png" }
      ],
      repeat: -1
    });

    this.anims.create({
      key: 'jump',
      defaultTextureKey: "platformer_characters",
      frames: [
        { frame: "tile_0001.png" }
      ],
    });

    this.anims.create({
      key: 'flies',
      frames: this.anims.generateFrameNames('platformer_characters', {
        prefix: "tile_",
        start: 24,
        end: 26,
        suffix: ".png",
        zeroPad: 4
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'bigBlueSquare',
      frames: this.anims.generateFrameNames('platformer_characters', {
        prefix: "tile_",
        start: 21,
        end: 23,
        suffix: ".png",
        zeroPad: 4
      }),
      frameRate: 6,
      repeat: -1
    })

    this.anims.create({
      key: 'littleBlueSquare',
      frames: this.anims.generateFrameNames('platformer_characters', {
        prefix: "tile_",
        start: 18,
        end: 20,
        suffix: ".png",
        zeroPad: 4
      }),
      frameRate: 6,
      repeat: -1
    })

    this.anims.create({
      key: 'face',
      frames: this.anims.generateFrameNames('platformer_characters', {
        prefix: "tile_",
        start: 11,
        end: 12,
        suffix: ".png",
        zeroPad: 4
      }),
      frameRate: 1,
      repeat: -1
    })

    this.anims.create({
      key: 'bounce',
      frames: this.anims.generateFrameNumbers("sprite_tiles", { start: 107, end: 108 }),
      frameRate: 1,
      repeat: -1
    })

    sounds.key = this.sound.add('keySound');
    sounds.heart = this.sound.add('heartSound');
    sounds.diamond = this.sound.add('diamondSound');
    sounds.enemy = this.sound.add('enemySound');
    sounds.jump = this.sound.add('jumpSound', { delay: 0 });
    sounds.moving = this.sound.add('movingSound');

    // ...and pass to the next Scene
    this.scene.start("platformerScene");
  }

  // Never get here since a new scene is started in create()
  update() {
  }
}
