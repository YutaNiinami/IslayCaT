// ドロワーマネージャー
class DrawerManager {
    constructor(root) {
        // ドロワーのルート要素を取得
        this.root = root;

        // ボタンとコンテンツを追加
        this.button = this.root.append("div")
            .attr("name", "button")
            .classed("text", true)
            .text("<");
        this.root.append("div")
            .attr("name", "content");

        // ボタンにイベントを追加
        this.button.call(
            d3.drag()
                .on("start", this.switch.bind(this))
        );
    }

    // ドロワーを開閉するメソッド
    switch() {
        if (this.root.classed("open")) {
            // ドロワーを閉じる
            this.button.text("<");
            this.root.classed("open", false);
            // ダイアログと状態作成用の角丸四角を移動
            dialogManager.root.classed("drawer_open", false);
            svgManager.moveCreateStateRect();
        } else {
            // コンテンツを更新
            this.updateContent();
            // ドロワーを開く
            this.button.text(">");
            this.root.classed("open", true);
            // ダイアログと状態作成用の角丸四角を移動
            dialogManager.root.classed("drawer_open", true);
            svgManager.moveCreateStateRect();
        }
    }

    // コンテンツを更新するメソッド
    updateContent() {
        // コンテンツを取得
        const content = this.root.select("div[name='content']");
        // コンテンツを初期化
        content.text("");
        // 状態遷移図のデータを取得
        const diagramData = svgManager.getDiagramData();
        // 各キャラクタについて処理
        for (let i = 0; i < diagramData.character.length; i++) {
            // キャラクタのデータを追加
            const character = content.append("div")
                .classed("drawer_character", true)
                .classed("open", true);
            this.appendText(character, diagramData.character[i].name);
            character.call(
                d3.drag()
                    .on("start", () => {
                        if (character.classed("open")) {
                            character.classed("open", false);
                        } else {
                            character.classed("open", true);
                        }
                    })
            );
            // 各「状態」について処理
            for (let j = 0; j < diagramData.character[i].states.length; j++) {
                // 「状態」のデータを追加
                const state = character.append("div")
                    .classed("drawer_state", true)
                    .classed("drawer_dialog", diagramData.character[i].states[j].dialog);
                this.appendText(state, `【${diagramData.character[i].states[j].data.name}】`);
                this.appendText(state, `　〇${diagramData.character[i].states[j].data.action1.text}`);
                this.appendText(state, `　〇${diagramData.character[i].states[j].data.action2.text}`);
                this.appendText(state, `　〇${diagramData.character[i].states[j].data.se.text}`);
                // 各「遷移」について処理
                for (let k = 0; k < diagramData.character[i].states[j].transes.length; k++) {
                    // 「遷移」のデータを追加
                    const trans = state.append("div")
                        .classed("drawer_trans", true)
                        .classed("drawer_dialog", diagramData.character[i].states[j].transes[k].dialog);
                    const toStateName = diagramData.character[i].states.find(state => state.id === diagramData.character[i].states[j].transes[k].toStateId).data.name;
                    this.appendText(trans, `　⇒${diagramData.character[i].states[j].transes[k].data.condition.text}【${toStateName}】`);
                }
            }
        }
    }

    // テキストを追加するメソッド
    appendText(parent, text) {
        parent.append("div")
            .classed("text", true)
            .text(text);
    }
}