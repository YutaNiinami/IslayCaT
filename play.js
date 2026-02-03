// 実行系を動かすクラス
class Play {
    constructor(parent) {
        this.parent = parent;
        this.playerData = {
            width: "600",
            height: "400"
        };
        this.createElement();
    }

    // 要素を生成するメソッド
    createElement() {
        // 要素の生成
        this.element = document.createElement("div");
        this.element.id = "play";
        this.parent.appendChild(this.element);
        // playボタンの生成
        this.playButton = document.createElement("img");
        this.playButton.id = "play_button";
        this.playButton.src = "./img/play_button.png";
        this.playButton.classList.add("isShow");
        this.element.appendChild(this.playButton);
        // stopボタンの生成
        this.stopButton = document.createElement("img");
        this.stopButton.id = "stop_button";
        this.stopButton.src = "./img/stop_button.png";
        this.element.appendChild(this.stopButton);

        // playボタンにイベントを設定
        this.playButton.addEventListener("click", async () => {
            // playButtonを非表示
            this.playButton.classList.remove("isShow");
            //ダイアログを閉じる
            dialogManager.hidden();
            //もしグループに「状態」が無ければ、「状態」を「メイン」グループに追加
            this.diagramData = svgManager.getDiagramData();
            if (this.diagramData.group[0].states.length === 0) {
                console.warn(`初期状態が見つかりませんでした。(${this.diagramData.group[0].states.length})`);
                let findState = false;
                for (let i = 0; i < this.diagramData.character.length; i++) {
                    if (this.diagramData.character[i].states.length > 0) {
                        findState = true;
                        this.diagramData.group[0].states.push(this.diagramData.character[i].states[0]);
                        console.warn(`${this.diagramData.character[i].states[0].data.name}を${this.diagramData.group[0].name}に追加して実行します。\nだたし、エディタのデータは変更されません。`);
                        break;
                    }
                }
            }

            // データ構造を変換
            await this.convertData();

            // playのサイズを変更
            this.element.classList.add("isPlaying");
            // playerの生成
            const player = document.createElement("iframe");
            player.width = this.playerData.width;
            player.height = this.playerData.height;
            this.element.appendChild(player);
            // stopボタンのイベントを設定
            this.stopButton.addEventListener("click", () => {
                // stopボタンを非表示
                this.stopButton.classList.remove("isShow");
                // playerを削除
                player.remove();
                // playのサイズを変更
                this.element.classList.remove("isPlaying");
                // playボタンを表示
                this.playButton.classList.add("isShow");
            });

            // stopボタンを表示
            this.stopButton.classList.add("isShow");
            // playerの読み込み開始
            player.src = "./player.html";
        });
    }

    // 実行系に合わせてデータ構造を変換するメソッド
    async convertData() {
        // windowの変数として用意
        window.convertedData = {
            imgs: {},
            states: {},
            character_tabs: {},
            group_tabs: {},
            se_list: [],
            system: {
                "speed": "100",
                "width": this.playerData.width,
                "height": this.playerData.height,
                "background_color": "#ffffff",
                "wall": false
            }
        };

        // キャラクタデータの変換
        for (const [i, character] of this.diagramData.character.entries()) {
            const characterData = { states: {} }
            // 「状態」データの変換
            for (const [j, state] of character.states.entries()) {
                characterData.states[j] = String(state.id);
                const stateData = {
                    se: state.data.se.value,
                    arrows: {}
                };
                // action1の変換
                let value = state.data.action1.value;
                const action1 = state.data.action1.value.split(":");
                switch (action1[0]) {
                    case "none":
                    case "jump":
                    case "follow":
                        break;
                    case "random_move":
                        action1[0] = "hurahuramove";
                    case "move":
                        if (action1[1] === "left") { action1[2] *= -1; }
                        if (action1[3] === "up") { action1[4] *= -1; }
                        value = [action1[0], action1[2], action1[4]].join(":");
                        break;
                    case "random_jump":
                        action1[0] = "randomjump";
                        for (let i = 1; i <= 4; i++) {
                            action1[i] = action1[i] === "true" ? 1 : 0;
                        }
                        value = action1.join(":");
                        break;
                    default:
                        console.error(`「状態」:${state.data.name}のaction1の変換に失敗しました。\n${action1}`);
                        break;
                }
                stateData.action1 = value;
                // action2の変換
                value = state.data.action2.value;
                let action2 = state.data.action2.value.split(":");
                switch (action2[0]) {
                    case "none":
                    case "notice":
                    case "message":
                    case "change":
                    case "deleted":
                    case "exit":
                        break;
                    case "make_character":
                        action2[0] = "makecharacter";
                    case "make_group":
                        action2[0] = "makegroup";
                        value = action2.join(":");
                        break;
                    case "change_speed":
                        action2[0] = "changespeed";
                        let tmp = action2[1];
                        switch (action2[2]) {
                            case "fast": action2[1] = "up"; break;
                            case "slow": action2[1] = "down"; break;
                            case "abs": action2[1] = "abs"; break;
                            default:
                                console.error(`「状態」:${state.data.name}のaction2の変換に失敗しました。\n${action2}`);
                                break;
                        }
                        action2[2] = tmp;
                        value = action2.join(":");
                        break;
                    default:
                        console.error(`「状態」:${state.data.name}のaction2の変換に失敗しました。\n${value}`);
                        break;
                }
                stateData.action2 = value;
                // 画像データの変換
                const findImgIdx = Object.values(convertedData.imgs).findIndex(img => img === state.data.img);
                if (findImgIdx === -1) {
                    const newKey = Object.keys(convertedData.imgs).length;
                    convertedData.imgs[newKey] = state.data.img;
                    stateData.img = newKey;
                } else {
                    stateData.img = findImgIdx;
                }

                // 「遷移」データの変換
                state.transes.forEach((trans, k) => {
                    const transData = {
                        condition: trans.data.condition.value,
                        condition1: null,
                        condition2: null,
                        to_maru: String(trans.toStateId)
                    }
                    // 遷移条件の変換
                    value = state.data.action2.value;
                    const condition = trans.data.condition.value.split(":");
                    switch (condition[0]) {
                        case "none":
                        case "loop":
                        case "touched":
                        case "alone":
                        case "notice":
                            break;
                        case "bumped":
                            condition[0] = "bump";
                            const tmp = [];
                            for (let l = 1; l <= 5; l++) {
                                tmp[l] = condition[l] === "true" ? 1 : 0;
                            }
                            condition[1] = tmp[3];
                            condition[2] = tmp[4];
                            condition[3] = tmp[1];
                            condition[4] = tmp[2];
                            condition[5] = tmp[5];
                            value = condition.join(":");
                            break;
                        case "probability":
                            condition[0] = "random";
                            value = condition.join(":");
                            break;
                    }
                    transData.condition = value;

                    stateData.arrows[k] = transData;
                });
                // seデータの変換

                convertedData.states[state.id] = stateData;
            }
            convertedData.character_tabs[i] = characterData;
        }

        // グループデータの変換
        this.diagramData.group.forEach((group, i) => {
            const groupData = { states: [] };
            group.states.forEach(state => {
                groupData.states.push([state.id, 100]);
            });
            convertedData.group_tabs[i] = groupData;
        });
        console.log(convertedData);
    }
}
