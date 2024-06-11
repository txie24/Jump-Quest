class SceneWin extends Phaser.Scene {
    constructor() {
        super({ key: "SceneWin" });
    }

    create() {
        this.title = this.add.text(this.game.config.width * 0.5, 200, "Congratulations", {
            fontFamily: 'monospace',
            fontSize: 48,
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.sfx = {
            btnOver: this.sound.add("sndBtnOver",{volume: 0.1}),
            btnDown: this.sound.add("sndBtnDown",{volume: 0.1})
        };

        this.btnRestart = this.add.sprite(
            this.game.config.width * 0.5,
            this.game.config.height * 0.5,
            "sprBtnRestart"
        ).setInteractive();

        this.btnRestart.on("pointerover", () => {
            this.btnRestart.setTexture("sprBtnRestartHover");
            this.sfx.btnOver.play();
        });

        this.btnRestart.on("pointerout", () => {
            this.btnRestart.setTexture("sprBtnRestart");
        });

        this.btnRestart.on("pointerdown", () => {
            this.btnRestart.setTexture("sprBtnRestartDown");
            this.sfx.btnDown.play();
        });

        this.btnRestart.on("pointerup", () => {
            this.btnRestart.setTexture("sprBtnRestart");
            this.scene.start("SceneMainMenu")
            ;
        });
    }
}
