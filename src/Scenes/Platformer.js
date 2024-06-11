class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.audio('coinSound', 'Coinsound.wav');  
        this.load.audio('jumpSound', 'jumpsound.mp3');  
        this.load.audio('keySound', 'Keysound.wav');  
    }

    init() {
        this.ACCELERATION = 200;
        this.DRAG = 1000;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.LIVES = 3;
        this.keyCount = 0;
        this.CROUCH_SPEED = 50;  
    }

    create() {
        this.map = this.add.tilemap("platformer-level-1");
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.tilesetBg = this.map.addTilesetImage("tilemap-backgrounds", "tilemap-backgrounds");

        this.backGroundLayer = this.map.createLayer("BG", this.tilesetBg, 0, 0);
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.killableLayer = this.map.createLayer("Killables", this.tileset, 0, 0);
        this.overlayLayer = this.map.createLayer("Overlays", this.tileset, 0, 0);
        this.waterLayer = this.map.createLayer("Water", this.tileset, 0, 0);
        this.Gate = this.map.createLayer("Gate", this.tileset, 0, 0);

        this.groundLayer.setCollisionByProperty({ collides: true });
        this.killableLayer.setCollisionByProperty({ collides: true });
        this.waterLayer.setCollisionByProperty({ collides: true });
        this.Gate.setCollisionByProperty({ collides: true });

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.keys = this.map.createFromObjects("Object 2", {
            name: "key",
            key: "tilemap_sheet",
            frame: 27
        });
        this.flag = this.map.createFromObjects("Flag", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 131
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.keys, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.flag, Phaser.Physics.Arcade.STATIC_BODY);

        this.coinGroup = this.add.group(this.coins);
        this.keyGroup = this.add.group(this.keys);

        my.sprite.player = this.physics.add.sprite(100, 1700, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy();
            this.sound.play('coinSound');
        });

        this.physics.add.overlap(my.sprite.player, this.keyGroup, (obj1, obj2) => {
            obj2.destroy();
            this.sound.play('keySound');
            this.keyCount++;
            this.updateStats();
        });

        this.physics.add.overlap(my.sprite.player, this.flag, (obj1, obj2) => {
            this.scene.start("SceneWin");
        });

        this.physics.add.collider(my.sprite.player, this.killableLayer, () => {
            this.scene.restart();
        });

        this.physics.add.collider(my.sprite.player, this.waterLayer, () => {
            this.loseLife();
        });

        this.physics.add.collider(my.sprite.player, this.Gate, () => {
            if (this.keyCount >= 3) {
                this.physics.world.removeCollider(this.physics.world.colliders.getActive().find(collider => collider.object1 === my.sprite.player && collider.object2 === this.Gate));
                this.Gate.setCollisionByProperty({ collides: false });
                this.Gate.visible = false;
            }
        });

        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');

        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;
            this.physics.world.debugGraphic.clear();
        }, this);

        my.vfx = {};
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_08.png', 'smoke_09.png'],
            scale: { start: 0.04, end: 0.01 },
            lifespan: 350,
            alpha: { start: 1, end: 0.1 },
            frequency: 100 
        });
        my.vfx.walking.stop();

        // Adjust camera bounds to match map dimensions
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // Adjust physics world bounds to match map dimensions
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        this.movingPlatforms = [];
        const platformProperties = [
            { x: 550, y: 297, minX: 440, maxX: 550 },
            { x: 800, y: 297, minX: 720, maxX: 885 },
            { x: 890, y: 297, minX: 890, maxX: 1050 },
        ];

        platformProperties.forEach(props => {
            let container = this.add.container(props.x, props.y);
            const platform1 = this.add.image(9, 9, "sprite_tiles", "48").setScale(1);
            const platform2 = this.add.image(27, 9, "sprite_tiles", "49").setScale(1);
            const platform3 = this.add.image(45, 9, "sprite_tiles", "50").setScale(1);

            container.add([platform1, platform2, platform3]);
            this.physics.world.enable(container);
            container.body.setImmovable(true);
            container.body.allowGravity = false;
            container.body.setVelocityX(100);
            container.body.setSize(54, 18);
            this.physics.add.collider(my.sprite.player, container);

            this.movingPlatforms.push({
                container: container,
                minX: props.minX,
                maxX: props.maxX
            });
        });

        this.livesText = this.add.text(16, 16, `Lives: ${this.LIVES}`, { fontSize: '32px', fill: '#fff' });
        this.livesText.setScrollFactor(0);
        this.livesText.setDepth(10);

        this.keysText = this.add.text(16, 48, `Keys: ${this.keyCount}`, { fontSize: '32px', fill: '#fff' });
        this.keysText.setScrollFactor(0);
        this.keysText.setDepth(10);

        this.livesElement = document.getElementById('lives');
        this.keysElement = document.getElementById('keys');
    }

    update() {
        let speed = this.ACCELERATION;

        if (cursors.down.isDown && my.sprite.player.body.blocked.down) {
            speed = this.CROUCH_SPEED;
            my.sprite.player.setScale(1, 0.7);
        } else if (cursors.down.isUp) {
            my.sprite.player.setScale(1);
        }

        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-speed);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, -my.sprite.player.displayWidth / 2 + 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(speed);
            my.sprite.player.setFlipX(true); 
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        } else {
            my.sprite.player.setAccelerationX(0);
            if (my.sprite.player.body.blocked.down) {
                my.sprite.player.setVelocityX(0);
                my.sprite.player.anims.play('idle');
            }
            my.vfx.walking.stop();
        }

        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.setDragX(100);
            my.sprite.player.anims.play('jump');
        } else {
            my.sprite.player.setDragX(this.DRAG);
        }

        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play('jumpSound');  
        }

        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        this.movingPlatforms.forEach(platform => {
            if (platform.container.x >= platform.maxX) {
                platform.container.body.setVelocityX(-40);
            } else if (platform.container.x <= platform.minX) {
                platform.container.body.setVelocityX(40);
            }
        });
    }

    loseLife() {
        this.LIVES--;
        this.updateStats();
        if (this.LIVES <= 0) {
            this.scene.start("SceneGameOver");
        } else {
            my.sprite.player.setPosition(90, 100);
        }
    }

    updateStats() {
        this.livesText.setText(`Lives: ${this.LIVES}`);
        this.keysText.setText(`Keys: ${this.keyCount}`);
        this.livesElement.textContent = `Lives: ${this.LIVES}`;
        this.keysElement.textContent = `Keys: ${this.keyCount}`;
    }
}
