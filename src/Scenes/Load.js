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
      this.load.spritesheet("sprite_tiles", "tilemap_packed.png", { frameWidth: 18, frameHeight: 18 });
      this.load.spritesheet("sprite_tiles_food", "tilemap_packed_food.png", { frameWidth: 18, frameHeight: 18 });
      this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");   // Tilemap in JSON
      this.load.multiatlas("kenny-particles", "kenny-particles.json");

      // Load the tilemap as a spritesheet
      this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
          frameWidth: 18,
          frameHeight: 18
      });


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
  
      // ...and pass to the next Scene
      this.scene.start("SceneMainMenu");
    }
  
    // Never get here since a new scene is started in create()
    update() {
    }
  }