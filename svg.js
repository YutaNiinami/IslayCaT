// // 画像をBase64形式で読み込む
// const loadImageAsBase64 = async (imgPath) =>
//     await fetch(imgPath)
//         .then(response => response.blob())
//         .then(blob => new Promise(resolve => {
//             const fr = new FileReader();
//             fr.onloadend = () => resolve(fr.result);
//             fr.readAsDataURL(blob);
//         }));

// svgマネージャー
class SvgManager {
    constructor() {
        this.svgs = [];
    }

    // svgを作成するメソッド
    create(canvas) {
        const svg = new Svg(this, canvas);
        this.svgs.push(svg);
    }

    // 状態遷移図のデータを返却するメソッド
    getDiagramData() {
        // タブの情報を取得
        const tabData = tabManager.getTabData();
        // 状態遷移図のデータを用意
        const diagramData = {
            character: [],
            group: tabData.group
        };
        // 各svgに対して処理
        this.svgs.forEach((svg, i) => {
            // 「状態」群の配列を用意
            const statesData = [];
            // 「状態」のデータを格納
            svg.states.forEach(state => {
                const stateData = {
                    id: state.id,
                    data: state.data,
                    transes: [],
                    dialog: state.isDialogView
                }
                statesData.push(stateData);
            });
            // 「遷移」のデータを格納
            svg.transes.forEach(trans => {
                const transData = {
                    id: trans.id,
                    fromStateId: trans.fromStateId,
                    toStateId: trans.toStateId,
                    data: trans.data,
                    dialog: trans.isDialogView
                };
                // 遷移元となっている「状態」のデータに格納
                statesData.find(stateData => stateData.id === transData.fromStateId).transes.push(transData);
            });
            // 優先度で「遷移」をソート
            statesData.forEach(stateData => {
                stateData.transes.sort((a, b) => a.data.priority - b.data.priority);
            });
            // キャラクタと全ての「状態」のデータを格納
            diagramData.character.push({
                id: tabData.character[i].id,
                name: tabData.character[i].name,
                states: statesData
            });
        });

        // 状態遷移図のデータを返却
        return diagramData;
    }

    // 状態作成用の角丸四角を動かすメソッド
    moveCreateStateRect() {
        this.svgs.forEach((svg) => {
            svg.moveCreateStateRect();
        });
    }

    /**
     * 「状態」または「遷移」を取得するメソッド
     * @param {"state"|"trans"} type - 取得対象の種類
     * @param {number} id - オブジェクトのID
     * @returns {State|Trans|null} 見つかったオブジェクト。
     */
    getObject(type, id) {
        const key = type === "state" ? "states" : "transes";
        for (const svg of this.svgs) {
            const object = svg[key].find(obj => obj.id === id);
            if (object) return object;
        }
        return null;
    }
}

// svgコンテナ
class Svg {
    constructor(parent, canvas) {
        this.parent = parent;
        this.canvas = canvas;
        this.states = [];
        this.transes = [];
        this.createElement();
    }

    // 要素を作成するメソッド
    createElement() {
        // svgコンテナを追加
        this.element = this.canvas.element.append("svg");
        // 背景を追加
        const background = this.element.append("rect")
            .classed("background", true)
            .style("fill", "#dfdfdf");
        // 状態遷移図移動用のグループ要素を追加
        this.diagram = this.element.append("g")
            .classed("diagram", true)
            .attr("transform", "translate(0,0) scale(1)");
        // イベントを設定
        background.call(
            d3.zoom()
                .on("start", () => {
                    // ダイアログを非表示
                    this.diagram.select(".dialog_view").classed("dialog_view", false);
                    dialogManager.hidden();
                })
                .scaleExtent([0.5, 1])
                .on("zoom", () => {
                    // 状態遷移図を移動、拡大縮小
                    this.diagram.attr("transform", d3.event.transform);
                    modal.g.attr("transform", d3.event.transform);
                })
        );
        // 状態作成用のオブジェクトを作成
        this.createStateRect = new CreateStateRect(this);
    }

    // 状態を作成するメソッド
    createState(x, y) {
        const newState = new State(this, x, y);
        this.states.push(newState);
        // ダイアログを表示
        this.viewDialog(newState);
    }

    // 遷移を作成するメソッド
    createTrans(fromStateId, toStateId) {
        const newTrans = new Trans(this, fromStateId, toStateId);
        this.transes.push(newTrans);
        // ダイアログを表示
        this.viewDialog(newTrans);
    }

    // 状態作成用の角丸四角を動かすメソッド
    moveCreateStateRect() {
        this.createStateRect.move();
    }

    // 指定したオブジェクトのダイアログを表示するメソッド
    viewDialog(object) {
        // ダイアログを非表示
        this.states.forEach(state => state.setDialogView(false));
        this.transes.forEach(trans => trans.setDialogView(false));
        // 指定されたオブジェクトがあればそれのダイアログを表示
        if (object) {
            object.setDialogView(true);
            dialogManager.updateDialog(object);
        }
    }
}

// 状態作成用の角丸四角
class CreateStateRect {
    constructor(svg) {
        this.svg = svg;
        this.createElement();
        this.move();
    }
    // 要素を作成するメソッド
    createElement() {
        this.createStateRect = this.svg.element.append("rect")
            .classed("create_state_rect", true)
            .attr("x", window.innerWidth - 95)
            .attr("y", 8)
            .attr("width", 60)
            .attr("height", 60)
            .attr("rx", 10)
            .attr("ry", 10)
            .style("fill", "#Bfff7f")
            .style("stroke", "#3fdf00")
            .style("stroke-width", "3px");
        this.dummyState = this.svg.element.append("image")
            .attr("id", "dummy_state")
            .attr("href", "img/dummy_state(100,167).png")
            .attr("x", window.innerWidth - 90)
            .attr("y", 23)
            .attr("width", 50)
            .attr("transform", "translate(0,0)")
            .style("opacity", 0.5);
        // イベントを設定
        let pointerdown = false;
        let startX, startY;
        this.dummyState
            .on("pointerdown", () => {
                pointerdown = true;
                // 初期座標を格納
                startX = d3.event.clientX;
                startY = d3.event.clientY;
                // ダミーを拡大
                this.dummyState.attr("width", 150)
                    .attr("transform", "translate(-50,-20)");
            })
            .on("pointermove", () => {
                if (pointerdown) {
                    // ダミーを移動
                    this.dummyState.attr("transform", `translate(${-50 + d3.event.clientX - startX},${-20 + d3.event.clientY - startY})`);
                }
            })
            .on("pointerup", () => {
                // 状態作成用の角丸四角の座標を取得
                const left = this.createStateRect.attr("x");
                const bottom = this.createStateRect.attr("y") + this.createStateRect.attr("height");
                // 状態作成用の角丸四角から外れていたら「状態」を作成
                if ((d3.event.x < left && d3.event.y > 0) || d3.event.y > bottom) {
                    this.svg.createState(d3.event.offsetX, d3.event.offsetY);
                }
                // 初期化
                this.dummyState.attr("width", 50)
                    .attr("transform", "translate(0,0)");
                pointerdown = false;
            });
    }
    // 状態作成用の角丸四角とダミーの状態を移動させるメソッド
    move() {
        if (d3.select("#drawer").classed("open")) {
            this.createStateRect.transition()
                .duration(500)
                .attr("x", window.innerWidth - 295);
            this.dummyState.transition()
                .duration(500)
                .attr("x", window.innerWidth - 290);
        } else {
            this.createStateRect.transition()
                .duration(500)
                .attr("x", window.innerWidth - 95);
            this.dummyState.transition()
                .duration(500)
                .attr("x", window.innerWidth - 90);
        }
    }
}

// 状態のサイズ
const height = 180;
const width = height * (1 + Math.sqrt(5)) / 2; // 黄金比
// 画像のサイズ
const imgSize = 60;

// 状態
class State {
    static id = 0;

    constructor(svg, x, y) {
        // プロパティを設定
        this.svg = svg;
        this.id = State.generateId();
        this.data = {
            name: language.state[lang] + this.id,
            img: "img/neko.png",
            action1: { value: "none", text: language.action1[lang] + ":" + language.state_none[lang] },
            action2: { value: "none", text: language.action2[lang] + ":" + language.state_none[lang] },
            se: { value: "none", text: language.se[lang] + ":" + language.state_none[lang] }
        };
        // 要素を作成
        this.createElement(x, y);
    }

    // idを生成する静的メソッド
    static generateId() {
        return State.id++;
    }

    // 要素を作成するメソッド
    createElement(x, y) {
        // 状態遷移図の座標から状態のx, y座標を計算
        const transform = this.svg.diagram.attr("transform").match(/translate\(([^,]+),([^)]+)\) scale\(([^)]+)\)/);
        this.x = (x - Number(transform[1])) / Number(transform[3]) - width / 2;
        this.y = (y - Number(transform[2])) / Number(transform[3]) - height / 2;
        // 状態となるg要素を追加
        this.state = this.svg.diagram.append("g")
            .attr("id", "state_" + this.id)
            .classed("state", true)
            .attr("transform", `translate(${this.x},${this.y})`);
        // 角丸四角を追加
        this.state.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("rx", 20)
            .attr("ry", 20)
            .style("fill", "white")
            .style("stroke-width", 3);
        // 画像を追加
        this.state.append("image")
            .attr("x", width / 2 - imgSize / 2)
            .attr("y", 35)
            .attr("width", 60)
            .attr("height", 60)
        .attr("href", this.data.img);
        // // 画像をロード
        // const imgPromise = (async () => {
        //     return await loadImageAsBase64(this.data.img);
        // })();
        // imgPromise.then(img => {
        //     this.state.property("src", img);
        //     this.state.attr("src", img);
        //     console.log(this.state.attr("src"));            
        // });
        // テキストと座標データを設定
        const textData = [
            { class: "name", y: 25, text: this.data.name },
            { class: "action1", y: 120, text: this.data.action1.text },
            { class: "action2", y: 145, text: this.data.action2.text },
            { class: "se", y: 170, text: this.data.se.text },
        ];
        // テキストを追加
        this.state.selectAll("text")
            .data(textData)
            .enter()
            .append("text")
            .attr("class", d => `text ${d.class}`)
            .attr("x", width / 2)
            .attr("y", d => d.y)
            .style("text-anchor", "middle")
            .text(d => d.text);

        // イベントを設定
        let timer;
        let currentTab;
        let prevX;
        let prevY;
        let isPointerDown = false;
        let isPointerMove = false;
        let isLongPress = false;
        this.state
            .on("pointerdown", () => {
                isPointerDown = true;

                // 初期位置を格納
                prevX = d3.event.clientX;
                prevY = d3.event.clientY;

                // 「状態」を最前面に移動
                this.state.raise();

                // 現在のタブの状態を取得
                currentTab = tabManager.getCheckedTab();
                if (currentTab === "character") {
                    // ダイアログを表示
                    if (!this.state.isDialogView) { this.svg.viewDialog(this); }
                    // 遷移元「状態」の取得
                    const fromState = this.svg.states.find(state => state.checkFromState());
                    if (fromState) { // 遷移元「状態」が存在する
                        if (fromState !== this) { // 自分以外の「状態」が遷移元「状態」
                            // 遷移を作成
                            this.svg.createTrans(fromState.id, this.id);
                        }
                        // 遷移元としての指定を解除
                        fromState.setFromState(false);
                    } else { // 遷移元「状態」が存在しない
                        // 0.5sの長押しで遷移元として指定
                        timer = setTimeout(() => {
                            this.setFromState(true);
                            isLongPress = true;
                        }, 500);
                    }
                } else if (currentTab === "group") {
                    // クローンを生成
                    const clone = this.state.node().cloneNode(true);
                    clone.id = "clone";
                    // モーダルに追加
                    modal.g.node().appendChild(clone);
                    modal.show();
                    modal.disabledPointer();
                    // ウィンドウ全体にイベントを設定
                    const pointermove = (event) => {
                        // 移動量を計算
                        const dx = event.clientX - prevX;
                        const dy = event.clientY - prevY;
                        prevX = event.clientX;
                        prevY = event.clientY;

                        // クローンの現在の座標を取得
                        const dclone = d3.select("#clone");
                        const transform = dclone.attr("transform").match(/translate\(([^,]+),([^)]+)\)/);
                        // クローンを移動
                        dclone.attr("transform", `translate(${Number(transform[1]) + dx},${Number(transform[2]) + dy})`);

                        // グループを強調表示
                        if (document.querySelector(".hover")) {
                            document.querySelector(".hover").classList.remove("hover");
                        }
                        const groupContent = document.elementFromPoint(event.clientX, event.clientY + 100); // header分の差分
                        if (groupContent.classList.contains("group_content")) {
                            groupContent.classList.add("hover");
                        }
                    };
                    const pointerup = () => {
                        // グループに「状態」を追加
                        tabManager.addState(clone);
                        // クローンを削除
                        const dclone = d3.select("#clone");
                        dclone.remove();
                        modal.hide();
                        modal.abledPointer();
                        // グループの強調表示を解除
                        if (document.querySelector(".hover")) {
                            document.querySelector(".hover").classList.remove("hover");
                        }
                        document.removeEventListener("pointermove", pointermove);
                        document.removeEventListener("pointerup", pointerup);
                    };
                    document.addEventListener("pointermove", pointermove);
                    document.addEventListener("pointerup", pointerup);
                } else {
                    console.log("error:currentTab");
                }
            })
            .on("pointermove", () => {
                if (isPointerDown) {
                    if (!isPointerMove && !isLongPress) {
                        isPointerMove = true;
                        // タイマーをクリア
                        clearTimeout(timer);
                    }

                    if (currentTab === "character") {
                        // 移動量を計算
                        const dx = d3.event.clientX - prevX;
                        const dy = d3.event.clientY - prevY;
                        prevX = d3.event.clientX;
                        prevY = d3.event.clientY;

                        // 「状態」を移動
                        this.x += dx;
                        this.y += dy;
                        this.state.attr("transform", `translate(${this.x},${this.y})`);

                        // 「状態」が遷移元または遷移先となっている「遷移」を移動
                        const stateCenter = { x: this.x + width / 2, y: this.y + height / 2 };
                        const fromTranses = this.svg.transes.filter(trans => trans.fromStateId === this.id);
                        fromTranses.forEach(fromTrans => fromTrans.move(stateCenter, undefined, undefined));
                        const toTranses = this.svg.transes.filter(trans => trans.toStateId === this.id);
                        toTranses.forEach(toTrans => toTrans.move(undefined, undefined, stateCenter));
                    } else if (currentTab === "group") {
                        // 初期化
                        isPointerDown = false;
                        isPointerMove = false;
                        isLongPress = false;
                    }
                    else {
                        console.log("error:currentTab");
                    }
                }
            })
            .on("pointerup", () => {
                // タイマーをクリア
                if (currentTab === "character" && !isPointerMove && !isLongPress) {
                    clearTimeout(timer);
                }
                // 初期化
                isPointerDown = false;
                isPointerMove = false;
                isLongPress = false;
            });
    }

    // 遷移元「状態」の指定を変更するメソッド
    setFromState(bool) {
        this.isFromState = bool;
        this.state.classed("from_state", bool);
    }

    // 遷移元「状態」の指定状態を返却するメソッド
    checkFromState() {
        return this.isFromState;
    }

    // ダイアログの表示状態を変更するメソッド
    setDialogView(bool) {
        this.isDialogView = bool;
        this.state.classed("dialog_view", bool);
    }

    // setData(property, value) {
    //     switch(property) {
    //         case "name":
    //             this.data.name = value;
    //             this.state.select("data-text='name'").text(value);
    //             break;
    //     }
    // }

    // 設定されているデータからテキスト表示を更新するメソッド
    update() {
        // name
        this.state.select("text.name").text(this.data.name);

        // img
        this.state.select("image").attr("href", this.data.img);

        // action1
        let text;
        const action1Split = this.data.action1.value.split(":");
        switch (action1Split[0]) {
            case "none":
                text = language.action1[lang] + ":" + language.state_none[lang];
                break;
            case "move":
                text = language.move[lang] + ":";
                if (action1Split[1] == "left") {
                    text += language.left[lang] + action1Split[2] + ",";
                } else if (action1Split[1] == "right") {
                    text += language.right[lang] + action1Split[2] + ",";
                } else {
                    console.log("error:action1Split[1]");
                }
                if (action1Split[3] == "up") {
                    text += language.up[lang] + action1Split[4];
                } else if (action1Split[3] == "down") {
                    text += language.down[lang] + action1Split[4];
                } else {
                    console.log("error:action1Split[3]");
                }
                break;
            case "random_move":
                text = language.random_move[lang] + ":";
                if (action1Split[1] == "left") {
                    text += language.left[lang] + action1Split[2] + ",";
                } else if (action1Split[1] == "right") {
                    text += language.right[lang] + action1Split[2] + ",";
                } else {
                    console.log("error:action1Split[1]");
                }
                if (action1Split[3] == "up") {
                    text += language.up[lang] + action1Split[4];
                } else if (action1Split[3] == "down") {
                    text += language.down[lang] + action1Split[4];
                } else {
                    console.log("error:action1Split[3]");
                }
                break;
            case "jump":
                if (lang == "jp") {
                    text = language.jump[lang] + ":" + language.from_left[lang] + action1Split[1]
                        + "," + language.from_top[lang] + action1Split[2];
                } else {
                    text = language.jump[lang] + ":" + action1Split[1] + language.from_left[lang]
                        + "," + action1Split[2] + language.from_top[lang];
                }
                break;
            case "random_jump":
                text = language.random_jump[lang] + ":";
                const directions = [];
                if (action1Split[1] == "true") { directions.push(language.left[lang]); }
                if (action1Split[2] == "true") { directions.push(language.right[lang]); }
                if (action1Split[3] == "true") { directions.push(language.up[lang]); }
                if (action1Split[4] == "true") { directions.push(language.down[lang]); }
                if (directions.length > 0) {
                    text += directions.join(",");
                } else if (directions.length != 0) {
                    console.log("error:directions");
                }
                break;
            case "follow":
                text = language.follow[lang] + ":";
                if (action1Split[1] == "parent") {
                    text += language.parent[lang];
                } else {
                    text += d3.select("#character_" + action1Split[1])
                        .select("div")
                        .text();
                }
                break;
            default: console.log("error:action1Split[0]"); break;
        }
        this.state.select("text.action1").text(text);
        this.data.action1.text = text;

        // action2
        const action2Split = this.data.action2.value.split(":");
        switch (action2Split[0]) {
            case "none": text = language.action2[lang] + ":" + language.state_none[lang]; break;
            case "make_character":
                text = language.make_character[lang] + ":";
                text += d3.select("#character_" + action2Split[1])
                    .select("div")
                    .text() + ">";
                if (action2Split[2] != "-1") {
                    text += this.svg.parent.getObject("state", Number(action2Split[2])).data.name;
                }
                break;
            case "make_group":
                text = language.make_group[lang] + ":";
                text += tabManager.getTabData().group.find(group => group.id === Number(action2Split[1])).name;
                break;
            case "notice": text = language.notice[lang] + ":" + action2Split[1]; break;
            case "message": text = language.message[lang] + ":" + action2Split[1]; break;
            case "change_speed":
                text = language.change_speed[lang] + ":";
                if (lang == "jp") {
                    text += action2Split[1];
                }
                switch (action2Split[2]) {
                    case "fast":
                        text += language.fast[lang];
                        break;
                    case "slow":
                        text += language.slow[lang];
                        break;
                    case "abs":
                        text += language.abs[lang];
                        break;
                    default: console.log("error:action2Split[1]"); break;
                }
                if (lang == "en") {
                    text += action2Split[1];
                }
                break;
            case "change":
                text = language.change[lang] + ":";
                text += d3.select("#character_" + action2Split[1])
                    .select("div")
                    .text() + ">";
                if (action2Split[2] != "-1") {
                    text += this.svg.parent.getObject("state", Number(action2Split[2])).data.name;
                }
                break;
            case "deleted": text = language.deleted[lang]; break;
            case "exit": text = language.exit[lang]; break;
            default: console.log("error:action2Split[0]"); break;
        }
        this.state.select("text.action2").text(text);
        this.data.action2.text = text;

        // se
        const seSplit = this.data.se.value.split(":");
        switch (seSplit[0]) {
            case "none": text = language.se[lang] + ":" + language.state_none[lang]; break;
            case "once": text = language.once[lang] + ":sample" + seSplit[1]; break;
            case "loop":
                if (lang == "en") {
                    text = language.loop_by[lang];
                } else {
                    text = "";
                }
                if (seSplit[1] == "state") {
                    text += language.state[lang];
                } else if (seSplit[1] == "character") {
                    text += language.character[lang];
                }
                if (lang == "jp") {
                    text += language.loop_by[lang];
                }
                text += ":sample" + seSplit[2];
                break;
            default: console.log("error:seSplit[0]"); break;
        }
        this.state.select("text.se").text(text);
        this.data.se.text = text;
    }
}

// 鏃のサイズ
const triangleSize = 20;

// 遷移
class Trans {
    static id = 0;

    constructor(svg, fromStateId, toStateId) {
        // プロパティを設定
        this.svg = svg;
        this.id = Trans.generateId();
        this.fromStateId = fromStateId;
        this.toStateId = toStateId;
        this.data = {
            condition: { value: "none", text: language.trans_none[lang] },
            priority: this.svg.transes.filter(trans => trans.fromStateId === this.fromStateId).length
        };
        // 要素を作成
        this.createElement();
    }

    // idを生成する静的メソッド
    static generateId() {
        return Trans.id++;
    }

    createElement() {
        // 遷移となるg要素を追加
        this.trans = this.svg.diagram.insert("g", ":first-child")
            .attr("id", `trans_${this.id}`)
            .classed("trans", true)
            .classed(`from_state_${this.fromStateId}`, true)
            .classed(`to_state_${this.toStateId}`, true);
        // 2次ベジェ曲線の影を追加
        this.trans.append("path")
            .classed("curveShadow", true)
            .attr("stroke-width", 16)
            .attr("fill", "none");
        // 鏃の影を追加
        this.trans.append("path")
            .classed("triangleShadow", true)
            .attr("stroke-width", 6);
        // 2次ベジェ曲線を追加
        this.trans.append("path")
            .attr("id", `path_${this.id}`)
            .classed("curve", true)
            .attr("stroke", "black")
            .attr("stroke-width", 10)
            .attr("fill", "none")
        // 鏃を追加
        this.trans.append("path")
            .attr("id", `trans_${this.id}_triangle`)
            .classed("triangle", true)
            .attr("fill", "black")
        // 遷移条件を追加
        this.trans.append("text")
            .classed("condition", true)
            .classed("text", true)
            .append("textPath")
            .attr("href", "#" + `path_${this.id}`)
            .attr("text-anchor", "middle")
            .text(this.data.condition.text);
        // 優先度を追加
        this.trans.append("text")
            .classed("priority", true)
            .classed("text", true)
            .append("textPath")
            .attr("href", "#" + `path_${this.id}`)
            .attr("text-anchor", "middle")
            .text(this.data.priority);

        // 遷移元と遷移先の「状態」の座標を取得
        const fromState = this.svg.states.find(state => state.id === this.fromStateId);
        const toState = this.svg.states.find(state => state.id === this.toStateId);

        // 各点を計算
        this.startPoint = { x: fromState.x + width / 2, y: fromState.y + height / 2 }; // 始点
        this.endPoint = { x: toState.x + width / 2, y: toState.y + height / 2 }; // 終点
        this.controlPoint = { x: (this.startPoint.x + this.endPoint.x) / 2, y: (this.startPoint.y + this.endPoint.y) / 2 }; // 制御点

        // 位置を調整
        const newControlPoint = this.adjust(this.fromStateId, this.toStateId, this.startPoint, this.controlPoint, this.endPoint);

        // 「遷移」を移動
        this.move(this.startPoint, newControlPoint, this.endPoint);

        // イベントを設定
        let prevX;
        let prevY;
        let isPointerDown = false;
        this.trans
            .on("pointerdown", () => {
                isPointerDown = true;
                // 初期位置を格納
                prevX = d3.event.clientX;
                prevY = d3.event.clientY;
                // ダイアログを表示
                if (!this.trans.isDialogView) {
                    this.svg.viewDialog(this);
                }
            })
            .on("pointermove", () => {
                if (isPointerDown) {
                    // 移動量を計算
                    const dx = d3.event.clientX - prevX;
                    const dy = d3.event.clientY - prevY;
                    prevX = d3.event.clientX;
                    prevY = d3.event.clientY;

                    // 制御点の座標を計算
                    this.controlPoint = { x: this.controlPoint.x + dx * 2, y: this.controlPoint.y + dy * 2 };
                    // 「遷移」を移動
                    this.move();
                }
            })
            .on("pointerup", () => {
                isPointerDown = false;
            });
    }
    // 遷移を移動するメソッド
    move(startPoint, controlPoint, endPoint) {
        this.startPoint = startPoint ?? this.startPoint;
        this.controlPoint = controlPoint ?? this.controlPoint;
        this.endPoint = endPoint ?? this.endPoint;

        // ベジェ曲線を移動
        const bezierPath = `M${this.startPoint.x},${this.startPoint.y} Q${this.controlPoint.x},${this.controlPoint.y} ${this.endPoint.x},${this.endPoint.y}`;
        this.trans.select(".curve").attr("d", bezierPath);
        this.trans.select(".curveShadow").attr("d", bezierPath);

        // 鏃を移動
        const midPoint = { // 始点と制御点の中点と制御点と終点の中点の中点の座標を計算
            x: ((this.startPoint.x + this.controlPoint.x) / 2 + (this.controlPoint.x + this.endPoint.x) / 2) / 2,
            y: ((this.startPoint.y + this.controlPoint.y) / 2 + (this.controlPoint.y + this.endPoint.y) / 2) / 2
        };
        const trianglePath = `M${midPoint.x + triangleSize},${midPoint.y} L${midPoint.x - triangleSize},${midPoint.y - triangleSize} V${midPoint.y + triangleSize} Z`;
        let angle; // 回転角度を計算
        if (this.endPoint.x - this.startPoint.x == 0) {
            angle = this.endPoint.y - this.startPoint.y >= 0 ? 90 : 270;
        } else {
            const m = (this.endPoint.y - this.startPoint.y) / (this.endPoint.x - this.startPoint.x);
            angle = this.endPoint.x - this.startPoint.x >= 0
                ? Math.atan(m) / Math.PI * 180
                : Math.atan(m) / Math.PI * 180 + 180;
        }
        this.trans.select(".triangle")
            .attr("d", trianglePath)
            .attr("transform", `rotate(${angle} ${midPoint.x} ${midPoint.y})`);
        this.trans.select(".triangleShadow")
            .attr("d", trianglePath)
            .attr("transform", `rotate(${angle} ${midPoint.x} ${midPoint.y})`);

        // 遷移条件と優先度を移動
        const bezierHalfLength = this.bezierHalfLength(this.startPoint, this.controlPoint, this.endPoint, 0.01);
        this.trans.select(".condition")
            .attr("dx", bezierHalfLength)
            .attr("dy", -25);
        this.trans.select(".priority")
            .attr("dx", bezierHalfLength)
            .attr("dy", 35);
    }
    // ベジェ曲線の半分の長さを返却するメソッド
    bezierHalfLength(startPoint, controlPoint, endPoint, accuracy) {
        let length = 0;
        let prevX = startPoint.x;
        let prevY = startPoint.y;

        for (let t = 0; t < 0.5; t += accuracy) {
            const cx = (1 - t) ** 2 * startPoint.x + 2 * (1 - t) * t * controlPoint.x + t ** 2 * endPoint.x;
            const cy = (1 - t) ** 2 * startPoint.y + 2 * (1 - t) * t * controlPoint.y + t ** 2 * endPoint.y;
            length += Math.sqrt((cx - prevX) ** 2 + (cy - prevY) ** 2);
            prevX = cx;
            prevY = cy;
        }

        return length;
    }
    // 「遷移」の数に応じてずらした制御点を返却するメソッド
    adjust(fromStateId, toStateId, startPoint, controlPoint, endPoint) {
        // 遷移元と遷移先の組み合わせが同じ「遷移」の数を計算
        const transNum = this.svg.transes.filter(trans =>
            (trans.fromStateId === fromStateId && trans.toStateId === toStateId) ||
            (trans.fromStateId === toStateId && trans.toStateId === fromStateId)
        ).length;
        // 「遷移」の数に応じてずらした制御点を計算
        let m;
        switch (transNum) {
            case 2:
                if (endPoint.y - startPoint.y == 0) {
                    controlPoint.y += 200;
                } else {
                    m = -(endPoint.x - startPoint.x) / (endPoint.y - startPoint.y);
                    controlPoint.x += 200 / Math.sqrt(1 + m ** 2);
                    controlPoint.y += 200 / Math.sqrt(1 + m ** 2) * m;
                }
                break;
            case 3:
                if (endPoint.y - startPoint.y == 0) {
                    controlPoint.y -= 200;
                } else {
                    m = -(endPoint.x - startPoint.x) / (endPoint.y - startPoint.y);
                    controlPoint.x -= 200 / Math.sqrt(1 + m ** 2);
                    controlPoint.y -= 200 / Math.sqrt(1 + m ** 2) * m;
                }
                break;
            default:
                break;
        }
        return controlPoint;
    }
    // idを返却するメソッド
    getId() {
        return this.id;
    }

    // ダイアログの表示状態を変更するメソッド
    setDialogView(bool) {
        this.isDialogView = bool;
        this.trans.classed("dialog_view", bool);
    }

    // 設定できる優先度の最大値(自身と同じ遷移元状態を持つ遷移の数)を返すメソッド
    maxPriority() {
        return this.svg.transes.filter(trans => trans.fromStateId === this.fromStateId).length;
    }

    // 設定されているデータからテキスト表示を更新するメソッド
    update() {
        // condition
        let text;
        const conditionSplit = this.data.condition.value.split(":");
        switch (conditionSplit[0]) {
            case "none": text = language.trans_none[lang]; break;
            case "loop": text = language.trans_loop[lang] + ":" + conditionSplit[1] + language.times[lang]; break;
            case "touched": text = language.touched[lang]; break;
            case "bumped":
                text = language.bumped[lang] + ":";
                const targets = [];
                if (conditionSplit[1] == "true") { targets.push(language.left_edge[lang]); }
                if (conditionSplit[2] == "true") { targets.push(language.right_edge[lang]); }
                if (conditionSplit[3] == "true") { targets.push(language.top_edge[lang]); }
                if (conditionSplit[4] == "true") { targets.push(language.bottom_edge[lang]); }
                if (conditionSplit[5] == "true") {
                    if (conditionSplit[6] == "something") {
                        targets.push(language.something[lang]);
                    } else {
                        targets.push(
                            d3.select("#character_" + conditionSplit[6])
                                .select("div")
                                .text()
                        );
                    }
                }
                if (targets.length > 0) {
                    text += targets.join(",");
                } else if (targets.length != 0) {
                    console.log("error:directions");
                }
                break;
            case "probability": text = language.probability[lang] + ":" + conditionSplit[1] + "％"; break;
            case "alone": text = language.alone[lang]; break;
            case "notice": text = language.notice[lang] + ":" + conditionSplit[1]; break;
            default: console.log("error:conditionSplit[0]"); break;
        }
        this.trans.select("text.condition")
            .select("textPath")
            .text(text);
        this.data.condition.text = text;

        // property
        this.trans.select("text.priority")
            .select("textPath")
            .text(this.data.priority);
    }
}