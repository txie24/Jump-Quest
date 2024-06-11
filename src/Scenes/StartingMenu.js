// StartingMenu.js

class SceneMainMenu extends Phaser.Scene {
    constructor() {
        super({ key: "SceneMainMenu" });
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("sprBtnPlay", "sprBtnPlay.png");
        this.load.image("sprBtnPlayHover", "sprBtnPlayHover.png");
        this.load.image("sprBtnPlayDown", "sprBtnPlayDown.png");
        this.load.image("sprBtnRestart", "sprBtnRestart.png");
        this.load.image("sprBtnRestartHover", "sprBtnRestartHover.png");
        this.load.image("sprBtnRestartDown", "sprBtnRestartDown.png");
        this.load.image("sprBtnReset", "sprBtnReset.png");
        this.load.image("sprBtnResetHover", "sprBtnResetHover.png");
        this.load.image("sprBg0", "sprBg0.png");
        this.load.audio("sndBtnOver", "sndBtnOver.wav");
        this.load.audio("sndBtnDown", "sndBtnDown.wav");
    }

    create() {
        this.bg = this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'sprBg0')
            .setOrigin(0.5)
            .setDepth(1)
            .setScale(0.8); 
        this.sfx = {
            btnOver: this.sound.add("sndBtnOver", { volume: 0.1 }),
            btnDown: this.sound.add("sndBtnDown", { volume: 0.1 })
        };


        this.btnPlay = this.add.sprite(
            this.game.config.width * 0.517,
            this.game.config.height * 0.3,
            "sprBtnPlay"
        ).setInteractive();

        this.btnPlay.on("pointerover", () => {
            this.btnPlay.setTexture("sprBtnPlayHover");
            this.sfx.btnOver.play();
        });

        this.btnPlay.on("pointerout", () => {
            this.btnPlay.setTexture("sprBtnPlay");
        });

        this.btnPlay.on("pointerdown", () => {
            this.btnPlay.setTexture("sprBtnPlayDown");
            this.sfx.btnDown.play();
        });

        this.btnPlay.on("pointerup", () => {
            this.scene.start("platformerScene", { restart: true });
        });
    }
}
