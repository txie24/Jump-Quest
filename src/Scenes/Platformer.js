class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
        this.crouchStartTime = 0;
        this.isCrouching = false;
        this.MIN_JUMP_VELOCITY = 200; // minimum jumping force
        this.MAX_JUMP_VELOCITY = 700; // Maximum jumping force
        this.MAX_CROUCH_TIME = 1000;  // Maximum power-up Time (milliseconds)
        this.jumpDirection = 0; // Direction to jump (0 = no direction, -1 = left, 1 = right)
        this.savedPosition = null; // Save point position
        this.currentScore = 0; // Current score
        this.highestScore = localStorage.getItem('highestScore') || 0; // Highest score
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.audio('coinSound', 'Coinsound.wav');  
        this.load.audio('jumpSound', 'jumpsound.mp3');  
        this.load.audio('keySound', 'Keysound.wav');  
        this.load.audio('shootSound', 'phaserDown2.ogg');
        this.load.audio('hurtSound', 'lowRandom.ogg');
    }

    init() {
        this.ACCELERATION = 200;
        this.DRAG = 1000;
        this.physics.world.gravity.y = 1500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.LIVES = 3;
        this.keyCount = 3;
        this.CROUCH_SPEED = 50;  
        this.isPlayerFacingRight = true;
    }

    create() {
        this.map = this.add.tilemap("platformer-level-1");
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.tilesetBg = this.map.addTilesetImage("tilemap-backgrounds", "tilemap-backgrounds");

        this.backGroundLayer = this.map.createLayer("BG", this.tilesetBg, 0, 0);
        this.overlayLayer = this.map.createLayer("Overlays", this.tileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.killableLayer = this.map.createLayer("Killables", this.tileset, 0, 0);
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

        this.enemies = this.map.createFromObjects("enemy", {
            name: "snowman",
            key: "tilemap_sheet",
            frame: 145
        });

        this.flag = this.map.createFromObjects("Flag", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 131
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.keys, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.enemies, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.flag, Phaser.Physics.Arcade.STATIC_BODY);

        this.coinGroup = this.add.group(this.coins);
        this.keyGroup = this.add.group(this.keys);
        this.enemyGroup = this.add.group(this.enemies);
        this.bullets = this.physics.add.group({
            defaultKey: 'sprite_tiles',
            defaultFrame: '157',
            maxSize: 10
        });

        this.bullets.children.iterate((bullet) => {
            bullet.body.allowGravity = false;
        });

        this.enemy = this.physics.add.sprite(130, 870, 'sprite_tiles', 145);
        this.enemy.setCollideWorldBounds(true);
        this.enemy.setVelocityX(100);
        this.enemy.body.allowGravity = false;
        this.enemyMinX = 130;
        this.enemyMaxX = 280;

        my.sprite.player = this.physics.add.sprite(130, 2600, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        this.physics.add.collider(my.sprite.player, this.groundLayer);

        this.physics.add.collider(this.bullets, this.groundLayer, this.bulletHit, null, this);

        this.physics.add.collider(this.bullets, this.killableLayer, this.bulletHit, null, this);

        this.physics.add.collider(this.bullets, this.enemy, this.enemyHit, null, this);

        this.physics.add.collider(my.sprite.player, this.enemy, this.playerHitEnemy, null, this);

        this.physics.add.collider(this.bullets, this.enemyGroup, this.enemyHit, null, this);

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy();
            this.sound.play('coinSound');
            this.updateScore(10);
        });

        this.physics.add.overlap(my.sprite.player, this.keyGroup, (obj1, obj2) => {
            obj2.destroy();
            this.sound.play('keySound');
            this.keyCount++;
            this.updateStats();
        });

        this.physics.add.overlap(my.sprite.player, this.enemyGroup, (obj1, obj2) => {
            obj2.destroy();
            this.loseLife();
        });

        this.physics.add.overlap(my.sprite.player, this.flag, () => {
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
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S); // Save key
        this.lKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L); // Load key
        this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

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
            { x: 0, y: 1835, minX: 0, maxX: 310 },
            
        ];

        platformProperties.forEach(props => {
            let container = this.add.container(props.x, props.y);
            const platform1 = this.add.image(9, 9, "sprite_tiles", "153").setScale(1);
            const platform2 = this.add.image(27, 9, "sprite_tiles", "154").setScale(1);
            const platform3 = this.add.image(45, 9, "sprite_tiles", "154").setScale(1);
            const platform4 = this.add.image(63, 9, "sprite_tiles", "155").setScale(1);


            container.add([platform1, platform2, platform3, platform4]);
            this.physics.world.enable(container);
            container.body.setImmovable(true);
            container.body.allowGravity = false;
            container.body.setVelocityX(100);
            container.body.setSize(72, 18);
            this.physics.add.collider(my.sprite.player, container);

            this.movingPlatforms.push({
                container: container,
                minX: props.minX,
                maxX: props.maxX
            });
        });

        this.movingPlatforms2 = [];
        const platformProperties2 = [
            { x: 0, y: 380, minX: 0, maxX: 310 },
            
        ];

        platformProperties2.forEach(props => {
            let container = this.add.container(props.x, props.y);
            const platform1 = this.add.image(9, 9, "sprite_tiles", "1").setScale(1);
            const platform2 = this.add.image(27, 9, "sprite_tiles", "2").setScale(1);
            const platform3 = this.add.image(45, 9, "sprite_tiles", "3").setScale(1);

            container.add([platform1, platform2, platform3]);
            this.physics.world.enable(container);
            container.body.setImmovable(true);
            container.body.allowGravity = false;
            container.body.setVelocityX(50);
            container.body.setSize(54, 18);
            this.physics.add.collider(my.sprite.player, container);

            this.movingPlatforms2.push({
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

        this.scoreText = this.add.text(16, 80, `Score: ${this.currentScore}`, { fontSize: '32px', fill: '#fff' });
        this.scoreText.setScrollFactor(0);
        this.scoreText.setDepth(10);

        this.highestScoreText = this.add.text(16, 112, `Highest Score: ${this.highestScore}`, { fontSize: '32px', fill: '#fff' });
        this.highestScoreText.setScrollFactor(0);
        this.highestScoreText.setDepth(10);

        this.livesElement = document.getElementById('lives');
        this.keysElement = document.getElementById('keys');
        this.scoreElement = document.getElementById('score');
        this.highestScoreElement = document.getElementById('highestScore');

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
                    this.isPlayerFacingRight = false;
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
                    this.isPlayerFacingRight = true;
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
    
        // Handle saving and loading positions
        if (Phaser.Input.Keyboard.JustDown(this.sKey)) {
            this.savePosition();
        }
        if (Phaser.Input.Keyboard.JustDown(this.lKey)) {
            this.loadPosition();
        }

        if (Phaser.Input.Keyboard.JustDown(this.fKey)) {
            this.shootBullet();
        }

        if (this.enemy.x >= this.enemyMaxX) {
            this.enemy.setVelocityX(-100);
        } else if (this.enemy.x <= this.enemyMinX) {
            this.enemy.setVelocityX(100);
        }
    
        
        this.bullets.children.each(bullet => {
            if (bullet.active) {
                if (bullet.x > this.cameras.main.width || bullet.x < 0) {
                    bullet.destroy();
                }
            }
        });

        this.movingPlatforms.forEach(platform => {
            if (platform.container.x >= platform.maxX) {
                platform.container.body.setVelocityX(-40);
            } else if (platform.container.x <= platform.minX) {
                platform.container.body.setVelocityX(40);
            }
        });

        this.movingPlatforms2.forEach(platform => {
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

    savePosition() {
        this.savedPosition = { x: my.sprite.player.x, y: my.sprite.player.y };
        console.log("Position saved:", this.savedPosition);
    }

    loadPosition() {
        if (this.savedPosition) {
            my.sprite.player.setPosition(this.savedPosition.x, this.savedPosition.y);
            console.log("Position loaded:", this.savedPosition);
        } else {
            console.log("No saved position to load.");
        }
    }
    
    loseLife() {
        this.LIVES--;
        this.updateStats();
        if (this.LIVES <= 0) {
            this.scene.start("SceneGameOver");
        } 
        this.sound.play('hurtSound');
    }

    shootBullet() {
        const bullet = this.bullets.get(my.sprite.player.x, my.sprite.player.y);
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.allowGravity = false;
            if (this.isPlayerFacingRight) {
                bullet.body.velocity.x = 500;
            } else {
                bullet.body.velocity.x = -500;
            }
            this.sound.play('shootSound');
        }
    }
    
    bulletHit(bullet, enemy) {
        bullet.destroy(); 
    }

    enemyHit(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
    }

    playerHitEnemy(player, enemy) {
        this.loseLife();
        enemy.destroy();
    }
    

    updateScore(amount) {
        this.currentScore += amount;
        if (this.currentScore > this.highestScore) {
            this.highestScore = this.currentScore;
            localStorage.setItem('highestScore', this.highestScore);
        }
        this.updateStats();
    }
    
    updateStats() {
        this.livesText.setText(`Lives: ${this.LIVES}`);
        this.keysText.setText(`Keys: ${this.keyCount}`);
        this.scoreText.setText(`Score: ${this.currentScore}`);
        this.highestScoreText.setText(`High Score: ${this.highestScore}`);
        this.livesElement.textContent = `Lives: ${this.LIVES}`;
        this.keysElement.textContent = `Keys: ${this.keyCount}`;
        this.scoreElement.textContent = `Score: ${this.currentScore}`;
        this.highestScoreElement.textContent = `Highest Score: ${this.highestScore}`;
    }
}
