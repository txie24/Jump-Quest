
class Platformer2 extends Phaser.Scene {
  constructor() {
    super("platformerScene2");
  }

  init() {
    // variables and settings
    this.ACCELERATION = 500;
    this.DRAG = 700;    // DRAG < ACCELERATION = icy slide
    this.physics.world.gravity.y = 1500;
    this.JUMP_VELOCITY = -900;
  }

  create() {
    // Create a new tilemap game object which uses 18x18 pixel tiles, and is
    // 45 tiles wide and 25 tiles tall.
    this.map = this.add.tilemap("platformer-level-2", 18, 18, 45, 25);

    // Add a tileset to the map
    // First parameter: name we gave the tileset in Tiled
    // Second parameter: key for the tilesheet (from this.load.image in Load.js)
    this.tileset = this.map.addTilesetImage("3adesign", "tilemap_tiles");
    this.tilesetBg = this.map.addTilesetImage("tilemap-backgrounds", "tilemap-backgrounds")

    // Create a layer
    this.background = this.map.createLayer("Tile Layer 4", this.tilesetBg, 0, 0);
    this.background2 = this.map.createLayer("back", this.tileset, 0, 0);
    this.groundLayer = this.map.createLayer("Tile Layer 1", this.tileset, 0, 0);

    this.groundLayer.setScale(2.0);
    this.groundLayer.setDepth(1);
    this.background.setScale(2.0);
    this.background.setDepth(0);
    this.background2.setScale(2.0);
    this.background2.setDepth(1);



    // Make it collidable
    this.groundLayer.setCollisionByProperty({
      collides: true
    });
    this.background2.setCollisionByProperty({
      collides: true
    })


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
    };

    this.keys = {};
    this.keys.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // debug key listener (assigned to D key)
    this.input.keyboard.on('keydown-D', () => {
      this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
      this.physics.world.debugGraphic.clear()
    }, this);

    this.jumpCount = 0

    const replaceTile = (pos, index) => {
      const [x, y] = pos
      const [worldX, worldY] = removeTile(this.groundLayer, x, y)
      const sprite = createSprite(this, index, worldX, worldY)
      return sprite
    }

    this.enemies = [];

    this.enemies.push(createFlies(this, 6 * 2, 22 * 2));
    this.enemies.push(createFlies(this, 14 * 2, 17 * 2));

    const bigSquare = this.physics.add.sprite(9 * 18 * 2, 15 * 18 * 2, 'platformer_characters', 'tile_0021.png').setScale(2)
    bigSquare.anims.play('bigBlueSquare');
    this.physics.add.collider(bigSquare, this.groundLayer)

    const replaceEnemy = (index) => (pos) => {
      const sprite = replaceTile(pos, index)
      sprite.body.allowGravity = false
      this.enemies.push(sprite)
      return sprite
    };


    [[5, 12], [6, 12], [7, 12]].forEach(replaceEnemy(13));

    // [[18, 17], [23, 17]].forEach(replaceEnemy(127));
    [[18, 8], [30, 2]].forEach((pos) => {
      const sprite = replaceEnemy(68)(pos)
      this.tweens.add({
        targets: [sprite],
        y: '+=36',
        ease: 'Linear',
        duration: 1000,
        yoyo: true,
        repeat: -1
      });


    });
    [[9, 3], [9, 4], [9, 5]].forEach((pos) => {
      const sprite = replaceEnemy(68)(pos);
      sprite.setRotation(Math.PI / 2)
      sprite.setDepth(0)
    });
    [[32, 17], [29, 17]].forEach((pos) => {
      const [x, y] = pos;
      const tile = this.groundLayer.getTileAt(x, y);
      const worldX = tile.getCenterX();
      const worldY = tile.getCenterY();

      const sprite = this.physics.add.sprite(worldX, worldY, "platformer_characters", "tile_0011.png").setScale(2);
      sprite.setDepth(2);
      sprite.body.allowGravity = false
      sprite.anims.play('face');
    });

    [[36, 17]].forEach((pos) => {
      const [x, y] = pos;
      const tile = this.background.getTileAt(x, y);
      const worldX = tile.getCenterX();
      const worldY = tile.getCenterY();

      const sprite = this.physics.add.sprite(worldX, worldY, "platformer_characters", "tile_0008.png").setScale(2);
      sprite.setDepth(2);
      sprite.body.allowGravity = false;
    });


    const bounce = replaceTile([2, 18], 107);
    bounce.body.allowGravity = false;
    bounce.setImmovable(true);
    bounce.pushed = false;
    this.bounce = bounce;
    bounce.anims.play("bounce");

    bounce.anims.stop();
    bounce.setFrame(108);
    this.physics.add.collider(my.sprite.player, bounce, (player, sprite) => {
      if (!bounce.pushed) {
        bounce.pushed = true
        bounce.setFrame(107);
      }
      bounce.collideWithPlayer = true
    });

    this.enemies.forEach((enemy) => {
      this.physics.add.overlap(enemy, my.sprite.player, () => {
        this.shouldFailed();
        sounds.enemy.play();
      })
    });


    const collectables = []
    this.collectables = collectables

    const createCollectable = (pos, index, type) => {
      const sprite = replaceTile(pos, index);
      sprite.customType = type;
      sprite.body.allowGravity = false;
      collectables.push(sprite);
    }
    // replace key tile with sprite
    [[22, 4], [38, 2], [6, 11]].forEach((pos) => {
      createCollectable(pos, 27, 'keys')
    });
    [[3, 1], [20, 17]].forEach((pos) => {
      createCollectable(pos, 67, 'diamonds')
    });
    [[32, 6], [25, 13]].forEach((pos) => {
      createCollectable(pos, 44, 'heart')
    });


    collectables.forEach((c) => {
      this.physics.add.overlap(c, my.sprite.player, this.collect.bind(this))
    });

    [[0, 18], [0, 17], [0, 16]].forEach((pos) => {
      const [x, y] = pos
      const [worldX, worldY] = removeTile(this.groundLayer, x, y)
      const lock = createSprite(this, 28, worldX, worldY)
      lock.body.allowGravity = false
      this.physics.add.overlap(lock, my.sprite.player, this.canPass.bind(this))
    });

    this.health = this.add.group().setDepth(10);

  }
  collect(item, player) {
    const type = item.customType || ''
    if (type in this.collection) {
      this.collection[type]++
    }

    if (item.customType === 'heart') {
      sounds.heart.play();
    } else if (item.customType === 'diamonds') {
      sounds.diamond.play();
    } else if (item.customType === 'keys') {
      sounds.key.play();
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
      this.scene.start("platformerScene3")
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
        this.scene.start('platformerScene2');
      }, 1000);
      return
    }
    this.failed()
  }
  failed() {
    if (this.scene.isPaused()) return;
    this.scene.pause()
    setTimeout(() => {
      this.scene.start('platformerScene');
    }, 1000)
  }

  updateHealth() {
    const hearts = this.collection.heart || 0
    this.health.clear();
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
    if (cursors.left.isDown) {
      // TODO: have the player accelerate to the left
      sounds.moving.play();
      my.sprite.player.body.setAccelerationX(-this.ACCELERATION);

      my.sprite.player.resetFlip();
      my.sprite.player.anims.play('walk', true);

    } else if (cursors.right.isDown) {
      // TODO: have the player accelerate to the right
      sounds.moving.play();
      my.sprite.player.body.setAccelerationX(this.ACCELERATION);

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
        my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY / 2);
        this.jumpCount = 2
      }
    } else {
      this.jumpCount = 0
    }
    if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.keys.space)) {

      sounds.jump.play();
      // detect player overlap with bounce
      if (this.bounce.collideWithPlayer) {
        my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY * 1.2);
        this.bounce.collideWithPlayer = false
        this.bounce.setFrame(108)
        this.bounce.pushed = false
      } else {
        my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
      }

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
