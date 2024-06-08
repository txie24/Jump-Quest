/**
 *
 * @param {Phaser.Tilemaps.TilemapLayer} layer
 * @param {*} x
 * @param {*} y
 */
const removeTile = (layer, x, y) => {
  const tile = layer.getTileAt(x, y)
  const worldX = tile.getCenterX()
  const worldY = tile.getCenterY()
  layer.removeTileAt(x, y)
  return [worldX, worldY]
}
/**
 *
 * @param {Phaser.Scene} scene
 * @param {number} row
 * @param {number} col
 */
const createFlies = (scene, row, col) => {
  const tileLen = 18;
  const scale = 2
  const x = col * tileLen;
  const y = row * tileLen;
  const sprite = scene.physics.add.sprite(x, y, 'platformer_characters', 'tile_0024.png');
  sprite.body.allowGravity = false;
  sprite.anims.play("flies", true);
  sprite.setScale(scale);
  return sprite;

}
/**
 *
 * @param {Phaser.Scene} scene
 * @param {number} tileIndex
 * @returns
 */
const createSprite = (scene, tileIndex, x, y) => {

  const sprite = scene.physics.add.sprite(x, y, 'sprite_tiles', tileIndex)
  sprite.setScale(2);

  return sprite;
}

/**
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Sprite} player
 * @param {number} x
 * @param {number} y
 */
const createFloorGroup = (scene, player, x, y) => {
  const sprite1 = createSprite(scene, 48, x, y)
  const sprite2 = createSprite(scene, 49, x + 18 * 2, y)
  const sprite3 = createSprite(scene, 50, x + 18 * 4, y)

  const group = scene.physics.add.group();
  group.add(sprite1);
  group.add(sprite2);
  group.add(sprite3);


  group.children.iterate(child => {
    child.body.allowGravity = false
    child.setImmovable(true)
    scene.physics.add.collider(child, player)
    scene.physics.add.existing(child, true);
  });

  scene.tweens.add({
    targets: group.getChildren(),
    x: '+=200',
    ease: 'Linear',
    duration: 1000,
    yoyo: true,
    repeat: -1
  });

  return group;

};

const createSecretLevel = (scene, layer, player) => {

  const [worldX, worldY] = removeTile(layer, 21, 7);
  const sprite = createSprite(scene, 48, worldX, worldY);

  sprite.body.allowGravity = false
  sprite.setImmovable(true)
  scene.physics.add.collider(player, sprite, () => {
    scene.inSecret = true
    console.log('collide')
  })
}

class Platformer extends Phaser.Scene {
  constructor() {
    super("platformerScene");
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
    this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

    // Add a tileset to the map
    // First parameter: name we gave the tileset in Tiled
    // Second parameter: key for the tilesheet (from this.load.image in Load.js)
    this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

    // Create a layer
    this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
    this.background = this.map.createLayer("Background", this.tileset, 0, 0);

    this.groundLayer.setScale(2.0);
    this.groundLayer.setDepth(1);
    this.background.setScale(2.0);
    this.background.setDepth(0);

    // Make it collidable
    this.groundLayer.setCollisionByProperty({
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
    my.sprite.player = this.physics.add.sprite(game.config.width / 4, game.config.height / 10, "platformer_characters", "tile_0000.png").setScale(SCALE)
    my.sprite.player.setCollideWorldBounds(true);
    my.sprite.player.setDepth(9)

    // Enable collision handling
    this.physics.add.collider(my.sprite.player, this.groundLayer);
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


    let worldX = 0
    let worldY = 0
    const oldGroup = [
      [14, 10],
      [15, 10],
      [16, 10],
    ]
    oldGroup.forEach((pos) => {
      const x = pos[0]
      const y = pos[1]
      const worldPos = removeTile(this.groundLayer, x, y)
      if (!worldX && !worldY) {
        worldX = worldPos[0]
        worldY = worldPos[1]
      }
    })
    createFloorGroup(this, my.sprite.player, worldX, worldY)

    this.enemies = [];

    this.enemies.push(createFlies(this, 25, 50));
    this.enemies.push(createFlies(this, 15, 65));
    // replace duck tile with sprite
    [[16, 17], [24, 17]].forEach((pos) => {
      const [x, y] = pos;
      const [worldX, worldY] = removeTile(this.groundLayer, x, y);
      const duck = createSprite(this, 145, worldX, worldY);
      this.physics.add.collider(duck, this.groundLayer);
      this.tweens.add({
        targets: [duck],
        x: '-=50',
        ease: 'Linear',
        duration: 1000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000
      });
      this.enemies.push(duck);
    });

    const bigSquare = this.physics.add.sprite(7 * 18 * 2, 2 * 18 * 2, 'platformer_characters', 'tile_0021.png').setScale(2)
    bigSquare.anims.play('bigBlueSquare');
    this.physics.add.collider(bigSquare, this.groundLayer)
    const littleSquare = this.physics.add.sprite(6 * 18 * 2, 12 * 18 * 2, 'platformer_characters', 'tile_0018.png').setScale(2)
    littleSquare.anims.play('littleBlueSquare');
    this.physics.add.collider(littleSquare, this.groundLayer)

    this.enemies.push(bigSquare)
    this.enemies.push(littleSquare)

    this.enemies.forEach((enemy) => {
      this.physics.add.overlap(enemy, my.sprite.player, () => {
        this.shouldFailed();
        sounds.enemy.play();
      })
    });

    const collectables = [];
    const createCollectable = (pos, index, type) => {
      const [x, y] = pos
      const [worldX, worldY] = removeTile(this.groundLayer, x, y)
      const sprite = createSprite(this, index, worldX, worldY)
      sprite.customType = type
      sprite.body.allowGravity = false
      collectables.push(sprite)
    }
    // replace key tile with sprite
    [[3, 1], [4, 16], [34, 11]].forEach((pos) => {
      createCollectable(pos, 27, 'keys')
    });

    // replace diamond tile with sprite.
    // diamond can prevent player from enemies damage
    [[35, 2]].forEach((pos) => {
      createCollectable(pos, 67, 'diamonds')
    });

    [[38, 18]].forEach((pos) => {
      createCollectable(pos, 44, 'heart')
    });

    collectables.forEach((c) => {
      this.physics.add.overlap(c, my.sprite.player, this.collect.bind(this))
    });
    this.collectables = collectables;

    // Next level needs player to collect 3 keys
    [[39, 16], [39, 17], [39, 18]].forEach((pos) => {
      const [x, y] = pos
      const [worldX, worldY] = removeTile(this.groundLayer, x, y)
      const lock = createSprite(this, 28, worldX, worldY)
      lock.body.allowGravity = false
      this.physics.add.overlap(lock, my.sprite.player, this.canPass.bind(this))
    });


    this.health = this.add.group().setDepth(10);

    createSecretLevel(this, this.groundLayer, my.sprite.player);

    this.secretCount = 0
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
      this.scene.start("platformerScene2")
    }
  }
  shouldFailed() {
    if (this.collection['diamonds'] > 0) {
      return
    }

    if (this.collection.heart > 0) {
      this.collection.heart--;
    }
    this.failed()
  }

  failed() {
    this.scene.pause()
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
      // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
      sounds.jump.play();
      my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);

      this.jumpCount = 1

      if (this.inSecret) {
        clearTimeout(this.secretTimer);
        this.secretCount++
        if (this.secretCount > 3) {
          this.scene.start('platformerScene3')
        }
        this.inSecret = false;
        this.secretTimer = setTimeout(() => {
          this.secretCount = 0;
        }, 2000);
      }
    }


    if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.down)) {
      my.sprite.player.setScale(2, 1.5)
    }
    if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustUp(cursors.down)) {
      my.sprite.player.setScale(2)
    }
  }
}
