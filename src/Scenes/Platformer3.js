class Platformer3 extends Phaser.Scene {
  constructor() {
    super("platformerScene3");
  }

  init() {
    // variables and settings
    this.ACCELERATION = 200;
    this.DRAG = 800;    // DRAG < ACCELERATION = icy slide
    this.physics.world.gravity.y = 1500;
    this.JUMP_VELOCITY = -900;
  }

  create() {
    // Create a new tilemap game object which uses 18x18 pixel tiles, and is
    // 45 tiles wide and 25 tiles tall.
    this.map = this.add.tilemap("platformer-level-3", 18, 18, 45, 25);

    // Add a tileset to the map
    // First parameter: name we gave the tileset in Tiled
    // Second parameter: key for the tilesheet (from this.load.image in Load.js)
    this.tileset = this.map.addTilesetImage("3adesighn1", "tilemap_tiles");
    this.tilesetFood = this.map.addTilesetImage("3adesign2", "tilemap-food");
    this.tilesetBg = this.map.addTilesetImage("tilemap-backgrounds", "tilemap-backgrounds");

    // Create a layer
    this.groundLayer = this.map.createLayer("Tile Layer 1", [this.tilesetFood, this.tileset], 0, 0);
    this.background = this.map.createLayer("Tile Layer 3", this.tilesetBg, 0, 0);
    this.background2 = this.map.createLayer("add", [this.tilesetFood, this.tileset], 0, 0);

    this.groundLayer.setScale(2.0);
    this.groundLayer.setDepth(1);
    this.background.setScale(2.0);
    this.background.setDepth(0);
    this.background2.setScale(2.0);
    this.background2.setDepth(0);

    // Make it collidable
    this.groundLayer.setCollisionByProperty({
      collides: true
    });
    this.background2.setCollisionByProperty({
      collides: true
    });

    // const spriteGroup = this.physics.add.group()

    // const tile = this.groundLayer.getTileAt(14, 10)
    // console.log(tile, tile.index)
    // const sprite = this.physics.add.sprite(100, 100, 'sprite_tiles', 49)
    // sprite.setScale(2)
    // sprite.body.allowGravity = false


    // set up player avatar
    // my.sprite.player = this.physics.add.sprite(game.config.width / 4, game.config.height / 2, "platformer_characters", "tile_0000.png").setScale(SCALE)
    my.sprite.player = this.physics.add.sprite(game.config.width / 10, game.config.height / 10, "platformer_characters", "tile_0000.png").setScale(SCALE)
    my.sprite.player.setCollideWorldBounds(true);
    my.sprite.player.setDepth(9)

    // Enable collision handling
    this.physics.add.collider(my.sprite.player, this.groundLayer);
    this.physics.add.collider(my.sprite.player, this.background2);
    // bound player on horizontal direction

    this.physics.world.setBounds(0, 0, 1440, this.sys.game.config.height, true, true, false, false)

    this.camera = this.cameras.main;
    this.camera.startFollow(my.sprite.player, true, 0.05, 0.05);
    this.camera.setBounds(0, 0, 1440, 720)

    // set up Phaser-provided cursor key input
    cursors = this.input.keyboard.createCursorKeys();

    this.collection = {
      keys: 0,
      diamonds: 0,
      heart: 0,
      hamburger: 0
    };

    this.keys = {};
    this.keys.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // debug key listener (assigned to D key)
    this.input.keyboard.on('keydown-D', () => {
      this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
      this.physics.world.debugGraphic.clear()
    }, this);
    this.jumpCount = 0;
    const createSpriteFood = (scene, tileIndex, x, y) => {

      const sprite = scene.physics.add.sprite(x, y, 'sprite_tiles_food', tileIndex)
      sprite.setScale(2);

      return sprite;
    }

    const replaceTile = (pos, index) => {
      const [x, y] = pos
      const [worldX, worldY] = removeTile(this.background2, x, y)
      const sprite = createSprite(this, index, worldX, worldY)
      return sprite
    }

    const replaceEnemy = (index) => (pos) => {
      const sprite = replaceTile(pos, index)
      sprite.body.allowGravity = false
      this.enemies.push(sprite)
      return sprite
    };



    const collectables = [];
    this.collectables = collectables;

    const createCollectable = (pos, index, type, action = createSpriteFood) => {
      const [x, y] = pos
      const [worldX, worldY] = removeTile(this.background2, x, y)
      const sprite = action(this, index, worldX, worldY)

      sprite.customType = type
      sprite.body.allowGravity = false
      collectables.push(sprite)
      return sprite
    }

    [[13, 3], [25, 9], [20, 13]].forEach((pos) => {
      createCollectable(pos, 92, 'hamburger')
    });

    [[9, 17], [26, 17]].forEach((pos) => {
      createCollectable(pos, 44, 'heart', createSprite);
    });

    collectables.forEach((c) => {
      this.physics.add.overlap(c, my.sprite.player, this.collect.bind(this))
    });

    this.enemies = [];

    [[6, 0], [15, 0], [25, 0], [32, 0]].forEach((pos) => {
      const sprite = replaceEnemy(68)(pos);
      sprite.setRotation(Math.PI);
    });

    this.enemies.forEach((enemy) => {
      this.physics.add.overlap(enemy, my.sprite.player, () => {
        this.shouldFailed();
        sounds.enemy.play();
      })
    });

    this.wing = this.physics.add.group();
    const topEnd = replaceTile([36, 3], 69);
    const bottomEnd = replaceTile([36, 9], 109);
    this.wing.add(topEnd);
    this.wing.add(bottomEnd);
    [[36, 4], [36, 5], [36, 6], [36, 7], [36, 8]].forEach((pos) => {
      const sprite = replaceTile(pos, 89);
      this.wing.add(sprite);
    });
    this.wing.children.iterate((sprite) => {
      sprite.body.allowGravity = false;
      this.physics.add.overlap(my.sprite.player, sprite, this.climb.bind(this));
    });

    const flag = this.physics.add.group();
    const flag1 = replaceTile([38, 1], 111);
    const flag2 = replaceTile([38, 2], 131);
    flag.add(flag1);
    flag.add(flag2);
    flag.children.iterate((sprite) => {
      sprite.body.allowGravity = false
      this.physics.add.overlap(my.sprite.player, sprite, this.success.bind(this))
    });

    this.health = this.add.group().setDepth(10);

    this.particles = this.add.particles(400, 300, 'particle', {
      speed: { min: -800, max: 800 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      active: true,
      lifespan: 600,
      gravityY: 800
    }).stop();
  }
  success() {
    console.log('success')
  }
  climb(player) {
    player.body.allowGravity = false;
    player.justVerticalMoving = true;
    player.body.setAccelerationY(0);
    player.body.setVelocityY(0);

  }
  collect(item, player) {
    const type = item.customType || ''
    if (type in this.collection) {
      this.collection[type]++
    }

    if (item.customType === 'heart') {
      sounds.heart.play();
    } else if (item.customType === 'diamonds' || item.customType === 'hamburger') {
      sounds.diamond.play();
    } else if (item.customType === 'keys') {
      sounds.key.play();
    }

    if (item.customType === 'hamburger') {
      console.log(item)
      const x = item.x;
      const y = item.y;
      this.particles.setPosition(x, y).start();
      this.time.delayedCall(100, () => {
        this.particles.stop();
      })
    }

    if (type === 'diamonds') {
      setTimeout(() => {
        this.collection[type]--
        tween.destroy()
        my.sprite.player.setAlpha(1)
      }, 5000)
      const tween = this.tweens.add({
        targets: [my.sprite.player],
        alpha: 0.5,
        ease: 'Linear',
        duration: 1000,
        yoyo: true,
        repeat: -1
      })
    }
    item.disableBody(true, true)
    const index = this.collectables.indexOf(item)
    index > -1 && this.collectables.splice(index, 1)
  }

  canPass() {
    if (this.collection.keys > 2) {
      this.scene.start("next")
    }
  }
  shouldFailed() {
    if (this.collection['diamonds'] > 0) {
      return
    }
    if (this.collection.heart > 0) {
      this.collection.heart--;
      this.scene.pause();
      setTimeout(() => {
        this.scene.start('platformerScene3');
      }, 1000);
      return
    }
    this.failed();

  }
  failed() {
    if (this.scene.isPaused()) return
    this.scene.pause();
    setTimeout(() => {
      this.scene.start('platformerScene');
    }, 1000)
  }
  updateHealth() {
    const hearts = this.collection.heart || 0
    for (let i = 0; i < hearts; i++) {
      const sprite = this.add.sprite(20 + i * 18, 20, 'sprite_tiles', 44)
        .setOrigin(0.5).setDepth(10);
      this.health.add(sprite);
      sprite.setScrollFactor(0);
    }
  }

  update() {
    this.updateHealth();
    if (my.sprite.player.y > this.sys.game.config.height + 18) {
      this.failed();
      return;
    }
    // after eaten hamburgers player can jump father
    const factor = Phaser.Math.Clamp(this.collection.hamburger, 1, 3) / 10 + 0.7;

    if (my.sprite.player.justVerticalMoving) {
      if (cursors.up.isDown) {
        my.sprite.player.y -= 1;
      } else if (cursors.down.isDown) {
        my.sprite.player.y += 1
      }

      my.sprite.player.body.allowGravity = true;
      my.sprite.player.justVerticalMoving = undefined
      return
    }

    if (cursors.left.isDown) {
      sounds.moving.play();
      // TODO: have the player accelerate to the left
      my.sprite.player.body.setAccelerationX(-this.ACCELERATION * factor);

      my.sprite.player.resetFlip();
      my.sprite.player.anims.play('walk', true);

    } else if (cursors.right.isDown) {
      // TODO: have the player accelerate to the right
      sounds.moving.play();
      my.sprite.player.body.setAccelerationX(this.ACCELERATION * factor);

      my.sprite.player.setFlip(true, false);
      my.sprite.player.anims.play('walk', true);

    } else {
      // TODO: set acceleration to 0 and have DRAG take over
      my.sprite.player.body.setAccelerationX(0);
      my.sprite.player.body.setDragX(this.DRAG);
      my.sprite.player.anims.play('idle');
    }

    // player jump
    // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
    if (!my.sprite.player.body.blocked.down) {
      my.sprite.player.anims.play('jump');
      if (this.jumpCount <= 1 && Phaser.Input.Keyboard.JustDown(this.keys.space)) {
        my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY / 2 * factor);
        this.jumpCount = 2
      }
    } else {
      this.jumpCount = 0
    }
    if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      sounds.jump.play();
      // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
      my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY * factor);

      this.jumpCount = 1
    }

    if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.down)) {
      my.sprite.player.setScale(2, 1.5)
    }
    if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustUp(cursors.down)) {
      my.sprite.player.setScale(2)
    }
  }
}
