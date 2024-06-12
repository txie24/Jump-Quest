class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
        this.crouchStartTime = 0;
        this.isCrouching = false;
        this.MIN_JUMP_VELOCITY = 200; // minimum jumping force
        this.MAX_JUMP_VELOCITY = 700; // Maximum jumping force
        this.MAX_CROUCH_TIME = 1000;  // Maximum power-up Time (milliseconds)
        this.jumpDirection = 0; // Direction to jump (0 = no direction, -1 = left, 1 = right)
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.audio('coinSound', 'Coinsound.wav');  
        this.load.audio('jumpSound', 'jumpsound.mp3');  
        this.load.audio('keySound', 'Keysound.wav');  
    }

    init() {
        this.ACCELERATION = 200;
        this.DRAG = 2000;
        this.physics.world.gravity.y = 1500;
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
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

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

        // Creating a power-up progress bar
        this.jumpProgressBar = this.add.graphics();
        this.jumpProgressBar.setDepth(20);  // Set the depth higher than the other elements to make sure it's in front of the
    }

    update() {
        let speed = this.ACCELERATION;
    
        if (this.spaceKey.isDown && my.sprite.player.body.blocked.down) {
            speed = this.CROUCH_SPEED;
            my.sprite.player.setScale(1, 0.7);
    
            // Start counting
            if (!this.isCrouching) {
                this.crouchStartTime = this.time.now;
                this.isCrouching = true;
            }
    
            // Updated power-up progress bar
            let crouchDuration = this.time.now - this.crouchStartTime;
            crouchDuration = Phaser.Math.Clamp(crouchDuration, 0, this.MAX_CROUCH_TIME);
            let progress = crouchDuration / this.MAX_CROUCH_TIME;
    
            this.updateJumpProgressBar(progress);
    
            // Determine the direction to jump
            if (cursors.left.isDown) {
                this.jumpDirection = -1; // left
            } else if (cursors.right.isDown) {
                this.jumpDirection = 1; // right
            } else {
                this.jumpDirection = 0; // no direction
            }
        } else if (this.spaceKey.isUp && this.isCrouching) {
            my.sprite.player.setScale(1);
    
            // Calculation of power-up time
            let crouchDuration = this.time.now - this.crouchStartTime;
            crouchDuration = Phaser.Math.Clamp(crouchDuration, 0, this.MAX_CROUCH_TIME);
    
            // Calculating jump force
            let jumpForce = Phaser.Math.Linear(this.MIN_JUMP_VELOCITY, this.MAX_JUMP_VELOCITY, crouchDuration / this.MAX_CROUCH_TIME);
    
            // Jump
            my.sprite.player.body.setVelocityY(-jumpForce);
            this.sound.play('jumpSound');  
    
            // Apply the stored jump direction
            if (this.jumpDirection !== 0) {
                my.sprite.player.body.setVelocityX(this.jumpDirection * speed);
            }
    
            // Reset power state
            this.isCrouching = false;
    
            // Hide the progress bar
            this.updateJumpProgressBar(0);
        } else if (this.spaceKey.isUp) {
            my.sprite.player.setScale(1);
            this.isCrouching = false;
    
            // Hide the progress bar
            this.updateJumpProgressBar(0);
        }
    
        if (my.sprite.player.body.blocked.down) {
            if (this.spaceKey.isDown) {
                // Prevent sliding when space is held down while on the ground
                my.sprite.player.setVelocityX(0);
            } else if (!this.isCrouching) {
                if (cursors.left.isDown) {
                    if (my.sprite.player.body.velocity.x > 0) {
                        my.sprite.player.setVelocityX(0); // Stop horizontal movement instantly when changing direction
                    }
                    my.sprite.player.setAccelerationX(-speed);
                    my.sprite.player.setDragX(this.DRAG); // Apply drag to slow down the character when stopping
                    my.sprite.player.resetFlip();
                    my.sprite.player.anims.play('walk', true);
                    my.vfx.walking.startFollow(my.sprite.player, -my.sprite.player.displayWidth / 2 + 10, my.sprite.player.displayHeight / 2 - 5, false);
                    my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
                    my.vfx.walking.start();
                } else if (cursors.right.isDown) {
                    if (my.sprite.player.body.velocity.x < 0) {
                        my.sprite.player.setVelocityX(0); // Stop horizontal movement instantly when changing direction
                    }
                    my.sprite.player.setAccelerationX(speed);
                    my.sprite.player.setDragX(this.DRAG); // Apply drag to slow down the character when stopping
                    my.sprite.player.setFlipX(true); 
                    my.sprite.player.anims.play('walk', true);
                    my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
                    my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
                    my.vfx.walking.start();
                } else {
                    my.sprite.player.setAccelerationX(0);
                    my.sprite.player.setVelocityX(0);
                    my.sprite.player.anims.play('idle');
                    my.vfx.walking.stop();
                }
            }
        } else {
            my.sprite.player.setDragX(100);
            my.sprite.player.anims.play('jump');
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
    
    updateJumpProgressBar(progress) {
        // Clear the previous progress bar
        this.jumpProgressBar.clear();
    
        // Setting the color and position of the progress bar
        this.jumpProgressBar.fillStyle(0x00ff00, 1);  // green
        this.jumpProgressBar.fillRect(my.sprite.player.x - 25, my.sprite.player.y - 40, 50 * progress, 5);  // Progress bar position and size
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
    