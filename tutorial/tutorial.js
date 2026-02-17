// 初期設定は日本語
const LANG = new URLSearchParams(window.location.search).get("lang") || "jp";

/** チュートリアルプログラムを定義したクラス */
class Tutorial {
    /** @type {Number} 元のWebアプリよりも上位レイヤーとなるz-indexの値 */
    Z_INDEX = 1000;

    /** @type {string} 灰色レイヤーの色 */
    GRAY_LAYER_COLOR = "#333b";

    /**
     * @constructor - チュートリアルシナリオを読み込み、チュートリアル開始ボタンを生成
     */
    constructor() {
        /** チュートリアルシナリオが記述されている scenario.json を読み込む */
        fetch("./tutorial/scenario.json")
            .then(response => {
                if (!response.ok) { throw new Error("読み込みエラー"); }
                return response.json();
            })
            .then(json => {
                console.log("チュートリアルシナリオが正常に読み込まれました。\n", json);
                /** @type {Array} 読み込んだJSON形式(オブジェクトの配列)のチュートリアルシナリオ */
                this.scenario = json;

                /** @type {Number} チュートリアルシナリオの現在地 */
                this.scenarioNow = 0;

                /** チュートリアル開始ボタンを生成 */
                this.body = document.body;
                this.startButton = document.createElement("div");
                this.body.appendChild(this.startButton);
                this.startButton.id = "tutorial_start_button";
                this.startButton.style.position = "absolute";
                this.startButton.style.left = "10px";
                this.startButton.style.bottom = "10px";
                this.startButton.style.zIndex = this.Z_INDEX;
                this.startButton.addEventListener("pointerdown", this.start.bind(this));
                const img = document.createElement("img");
                this.startButton.appendChild(img);
                img.src = "./tutorial/image/start.png";
                img.style.width = "60px";
                img.style.borderRadius = "50%";
            })
            .catch(error => {
                console.error("JOSN読み込みエラー\n", error);
            });
    }

    /** チュートリアルシナリオを開始 */
    start() {
        console.log("チュートリアルが開始されました。");
        /** @type {boolean} チュートリアルの開始状態 */
        this.isPlaying = true;

        /** チュートリアル開始ボタンを非表示 */
        this.startButton.style.display = "none";

        /** 画面全体を灰色レイヤーで覆う */
        this.grayLayer = document.createElement("div");
        this.body.appendChild(this.grayLayer);
        this.grayLayer.id = "tutorial_gray_layer";
        this.grayLayer.style.position = "absolute";
        this.grayLayer.style.top = 0;
        this.grayLayer.style.left = 0;
        this.grayLayer.style.zIndex = this.Z_INDEX;
        this.grayLayer.style.width = "100%";
        this.grayLayer.style.height = "100%";
        this.grayLayer.style.backgroundColor = this.GRAY_LAYER_COLOR;

        /** 灰色レイヤーにイベントを設定 */
        this.grayLayer.addEventListener("click", () => { this.failure(); });

        /** svgコンテナを用意 */
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.style.position = "absolute";
        this.svg.style.display = "none";
        this.svg.style.zIndex = 2;
        this.svg.style.width = "100%";
        this.svg.style.height = "100%";
        this.grayLayer.appendChild(this.svg);

        /** ドロップエリアのインスタンスを生成 */
        this.droparea = new Droparea(this.grayLayer);

        /** 操作対象オブジェクトのクローンを生成 */
        this.createClone();
        /** ポインタと案内テキストを生成 */
        this.pointer = new Pointer(this.grayLayer, this.scenario[this.scenarioNow].text);
        this.updatePointer();
    }

    /** 操作対象オブジェクトを灰色レイヤーの手前へ移動する */
    createClone() {
        try {
            /** ターゲットを取得 */
            this.target = document.getElementById(this.scenario[this.scenarioNow].target.id);
            console.log("ターゲットが指定されました。\ntarget:", this.target);
            /** ターゲットのクローンを生成 */
            this.clone = this.target.cloneNode(true);
            /** idを変更 */
            this.uniquifyId(this.clone);
            /** スタイルをコピー */
            this.copyComputedStyles(this.target, this.clone);
            /** クローンのmarginを削除 */
            this.clone.style.margin = "";
            this.clone.style.marginBlock = "";
            /** ターゲットと重なる位置に移動 */
            this.moveClone();
            /** ターゲットごとに処理 */
            switch (this.scenario[this.scenarioNow].target.type) {
                case "svg":
                    /** イベントを設定 */
                    this.setEvent(this.scenario[this.scenarioNow].event);
                    /** ドラックならドロップエリアを生成 */
                    if (this.scenario[this.scenarioNow].event.name === "drag") {
                        this.droparea.changeArea(this.scenario[this.scenarioNow].event.dropArea);
                        this.droparea.append();
                    }
                    /** svgにクローンを追加 */
                    this.svg.appendChild(this.clone);
                    this.svg.style.display = "initial";
                    break;
                case "select":
                    // 選択肢を制限
                    let matchCount = 0;
                    const options = this.clone.querySelectorAll("option");
                    options.forEach(option => {
                        if (option.value === this.scenario[this.scenarioNow].target.option.value) {
                            option.disabled = false;
                            matchCount++;
                        } else {
                            option.disabled = true;
                        }
                    });
                    if (matchCount !== 1) {
                        console.warn("選択肢の制限に失敗しました。\nmatchCount:", matchCount);
                    }
                    // 選択されている選択肢をコピー
                    [...options].find(option => option.value === this.target.value).selected = true;
                    // イベントを設定
                    this.clone.addEventListener("change", (event) => {
                        console.log("clone:change");
                        if (this.clone.value === this.scenario[this.scenarioNow].target.option.value) {
                            this.target.querySelector(`option[value="${this.clone.value}"]`).selected = true;
                            const change = new event.constructor(event.type, event);
                            this.target.dispatchEvent(change);
                            this.success();
                        } else {
                            this.failure();
                        }
                    });
                    /** 灰色レイヤーに追加 */
                    this.grayLayer.appendChild(this.clone);
                    break;
                case "button":
                    // イベントを設定
                    this.clone.addEventListener("click", (event) => {
                        console.log("clone:click");
                        const click = new event.constructor(event.type, event);
                        this.target.dispatchEvent(click);
                        this.success();
                    });
                    /** 灰色レイヤーに追加 */
                    this.grayLayer.appendChild(this.clone);
                    break;
                case "label":
                    // イベントを設定
                    this.clone.addEventListener("click", (event) => {
                        if (event.target.tagName === "INPUT") { // イベントの送信を1回に制限するため
                            console.log("clone:click");
                            const click = new event.constructor(event.type, event);
                            this.target.dispatchEvent(click);
                            this.success();
                        }
                    });
                    /** 灰色レイヤーに追加 */
                    this.grayLayer.appendChild(this.clone);
                    break;
                // input[type="text"] には対応しない
                // case "text":
                //     // イベントを設定
                //     this.clone.addEventListener("change", (event) => {
                //         console.log("clone:change");
                //         if (this.clone.value === this.scenario[this.scenarioNow].target.option.value) {
                //             this.target.value = this.clone.value;
                //             this.target.dispatchEvent(new Event("input"));
                //             // const change = new event.constructor(event.type, event);
                //             // this.target.dispatchEvent(change);
                //             this.success();
                //         } else {
                //             this.failure();
                //         }
                //     });
                //     /** 灰色レイヤーに追加 */
                //     this.grayLayer.appendChild(this.clone);
                //     break;
                default:
                    break;
            }
            console.log("クローンが生成されました。\nclone:", this.clone);
        } catch (error) {
            console.error("クローンの生成に失敗しました。\n", error);
        }
    }

    /** クローンのIDをユニークなものに変更 */
    uniquifyId(element, suffix = "_clone") {
        if (element.id) { element.id += suffix; }

        for (const child of element.children) {
            this.uniquifyId(child, suffix);
        }
    }

    /** 子要素を含むターゲットのスタイルをクローンにコピー */
    copyComputedStyles(target, clone) {
        const style = window.getComputedStyle(target);
        for (const prop of style) {
            clone.style[prop] = style.getPropertyValue(prop);
        }

        const targetChildren = target.children;
        const cloneChildren = clone.children;
        for (let i = 0; i < targetChildren.length; i++) {
            this.copyComputedStyles(targetChildren[i], cloneChildren[i]);
        }
    }

    /** ターゲットと重なる位置にクローンを移動 */
    moveClone() {
        if (this.scenario[this.scenarioNow].target.type === "svg") {
            /** cssのtransformを削除 */
            this.clone.style.transform = "";
            const DOMMatrix = this.target.getScreenCTM();
            this.clone.setAttribute("transform", `matrix(${DOMMatrix.a},${DOMMatrix.b},${DOMMatrix.c},${DOMMatrix.d},${DOMMatrix.e},${DOMMatrix.f})`);
        } else {
            const rect = this.target.getBoundingClientRect();
            this.clone.style.position = "absolute";
            this.clone.style.left = `${rect.left}px`;
            this.clone.style.top = `${rect.top}px`;
        }
    }

    /** クローンにイベントを設定 */
    setEvent(eventObj) {
        let isPointerDown = false;
        let isPointerMove = false;
        let isLongPress = false;
        let isMiss = false;
        let pressTimer = null;
        let startX = 0;
        let startY = 0;
        let cloneX = 0;
        let cloneY = 0;
        let transform;
        switch (eventObj.name) {
            case "click":
                this.clone.addEventListener("pointerdown", (event) => {
                    isPointerDown = true;
                    isPointerMove = false;
                    isLongPress = false;
                    console.log("clone:pointerdown");
                    startX = event.clientX;
                    startY = event.clientY;
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        console.log("clone:longPress");
                        this.failure();
                    }, 500);
                });
                this.clone.addEventListener("pointermove", () => {
                    if (isPointerDown && !isLongPress && !isPointerMove) {
                        isPointerMove = true;
                        console.log("clone:pointermove");
                        clearTimeout(pressTimer);
                        this.failure();
                    }
                });
                this.clone.addEventListener("pointerup", (event) => {
                    console.log("clone:pointerup");
                    if (isPointerDown && !isLongPress && !isPointerMove) {
                        clearTimeout(pressTimer);
                        const pointerdown = new PointerEvent("pointerdown", {
                            bubbles: true,
                            cancelable: true,
                            clientX: startX,
                            clientY: startY,
                            button: 0
                        });
                        this.target.dispatchEvent(pointerdown);
                        const pointerup = new event.constructor(event.type, event);
                        this.target.dispatchEvent(pointerup);
                        this.success();
                    } else {
                        this.failure();
                    }
                    isPointerDown = false;
                    isPointerMove = false;
                    isLongPress = false;
                });
                break;
            case "longPress":
                this.clone.addEventListener("pointerdown", (event) => {
                    isPointerDown = true;
                    isPointerMove = false;
                    isLongPress = false;
                    console.log("clone:pointerdown");
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        console.log("clone:longPress");
                        const pointerdown = new event.constructor(event.type, event);
                        this.target.dispatchEvent(pointerdown);
                        this.copyComputedStyles(this.target, this.clone);
                        this.moveClone();
                        setTimeout(() => {
                            const pointerup = new MouseEvent("pointerup", {
                                bubbles: true,
                                cancelable: true,
                                clientX: event.clientX,
                                clientY: event.clientY,
                            });
                            this.target.dispatchEvent(pointerup);
                            this.success();
                        }, eventObj.pressTime);
                    }, eventObj.pressTime);
                });
                this.clone.addEventListener("pointermove", () => {
                    if (isPointerDown && !isLongPress && !isPointerMove) {
                        isPointerMove = true;
                        console.log("clone:pointermove");
                        clearTimeout(pressTimer);
                        this.failure();
                    }
                });
                this.clone.addEventListener("pointerup", () => {
                    console.log("clone:pointerup");
                    if (isPointerDown && !isLongPress && !isPointerMove) {
                        clearTimeout(pressTimer);
                        this.failure();
                    }
                    isPointerDown = false;
                    isPointerMove = false;
                    isLongPress = false;
                });
                break;
            case "drag":
                this.clone.addEventListener("pointerdown", (event) => {
                    isPointerDown = true;
                    isPointerMove = false;
                    isLongPress = false;
                    isMiss = false;
                    console.log("clone:pointerdown");
                    startX = event.clientX;
                    startY = event.clientY;
                    if (this.scenario[this.scenarioNow].target.type !== "svg") {
                        cloneX = this.clone.offsetLeft;
                        cloneY = this.clone.offsetTop;
                    }

                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        console.log("clone:longPress");
                        this.failure();
                        isMiss = true;
                    }, 500);
                });
                this.clone.addEventListener("pointermove", (event) => {
                    console.log("clone:pointermove");
                    if (isPointerDown && !isLongPress) {
                        if (!isPointerMove) {
                            isPointerMove = true;
                            clearTimeout(pressTimer);
                            const pointerdown = new MouseEvent("pointerdown", {
                                bubbles: true,
                                cancelable: true,
                                clientX: startX,
                                clientY: startY,
                                button: 0
                            });
                            this.target.dispatchEvent(pointerdown);
                            this.copyComputedStyles(this.target, this.clone);
                            if (this.scenario[this.scenarioNow].target.type === "svg") {
                                this.moveClone();
                                transform = this.clone.getAttribute("transform")
                                    .match(/matrix\(([^)]+)\)/)[1].split(",").map(Number);
                            }
                        }
                        const newEvent = new event.constructor(event.type, event);
                        this.target.dispatchEvent(newEvent);
                        if (this.scenario[this.scenarioNow].target.type !== "svg") {
                            this.clone.style.left = cloneX + event.clientX - startX + "px";
                            this.clone.style.top = cloneY + event.clientY - startY + "px";
                        } else {
                            const newTransform = `matrix(${transform.slice(0, 4).join(",")},${transform[4] + event.clientX - startX},${transform[5] + event.clientY - startY})`;
                            this.clone.setAttribute("transform", newTransform);
                        }
                    }
                });
                this.clone.addEventListener("pointerup", (event) => {
                    console.log("clone:pointerup");
                    if (isPointerDown && !isLongPress && !isPointerMove) {
                        this.copyComputedStyles(this.target, this.clone);
                        clearTimeout(pressTimer);
                        this.failure();
                    } else if (!isMiss) {
                        if ((eventObj.dropArea.x - event.offsetX) ** 2 + (eventObj.dropArea.y - event.offsetY) ** 2 <= eventObj.dropArea.r ** 2) {
                            const pointerup = new event.constructor(event.type, event);
                            this.target.dispatchEvent(pointerup);
                            this.success();
                        } else {
                            this.copyComputedStyles(this.target, this.clone);
                            clearTimeout(pressTimer);
                            this.failure();
                        }
                    }
                    isPointerDown = false;
                    isPointerMove = false;
                    isLongPress = false;
                    isMiss = false;
                });
                break;
            default:
                throw new Error("イベントの設定に失敗しました。");
        }
    }

    /** ユーザ操作が正常 */
    success() {
        console.log("ユーザ操作が正常でした。");
        /** クローンを削除 */
        this.clone.remove();
        /** svgを非表示 */
        this.svg.style.display = "none";
        /** ドロップエリアを削除 */
        this.droparea.remove();
        /** シナリオを進行 */
        if (this.scenarioNow < this.scenario.length - 1) {
            console.log("シナリオを進行します。");
            this.scenarioNow++;
            this.createClone();
            this.updatePointer();
        } else {
            console.log("チュートリアルを終了します。");
            this.grayLayer.remove();
        }
    }

    /** ユーザ操作が正常でない */
    failure() {
        console.warn("ユーザ操作が正常ではありません。");
        /** 案内テキストを変更 */
        if (!this.isMiss) {
            this.pointer.changeText(this.scenario[this.scenarioNow].text.miss[LANG]);
            this.isMiss = true;
        }
    }

    /** ポインタと案内テキストを更新するメソッド */
    updatePointer() {
        this.pointer.changeText(this.scenario[this.scenarioNow].text.init[LANG]);
        if (this.scenario[this.scenarioNow].event.name === "drag") {
            this.pointer.show(false);
            this.pointer.move(this.clone);
            // 始点と終点を計算
            const cloneRect = this.clone.getBoundingClientRect();
            const startPoint = {
                x: cloneRect.left + cloneRect.width / 2,
                y: cloneRect.top + cloneRect.height / 2
            }
            const endPoint = {
                x: this.scenario[this.scenarioNow].event.dropArea.x,
                y: this.scenario[this.scenarioNow].event.dropArea.y
            };
            this.pointer.startAnimation("drag", { start: startPoint, end: endPoint });
        } else {
            this.pointer.show(true);
            this.pointer.move(this.clone);
        }
    }
}

/** ドロップエリアのクラス */
class Droparea {
    constructor(parentElement) {
        this.parentElement = parentElement;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.style.position = "absolute";
        this.element.style.zIndex = 0;
        this.element.style.backgroundColor = "#fffb";
    }

    changeArea(area) {
        this.element.style.left = `${area.x - area.r}px`;
        this.element.style.top = `${area.y - area.r}px`;
        this.element.style.width = `${area.r * 2}px`;
        this.element.style.height = `${area.r * 2}px`;
        this.element.style.borderRadius = `${area.r}px`;
    }

    append() {
        this.parentElement.appendChild(this.element);
    }

    remove() {
        this.element.remove();
    }
}

/**
 * ポインタと案内テキストを管理するクラス
 */
class Pointer {
    /**
     * ポインタと案内テキストを生成し、非表示にする
     * @param {HTMLElement} parentElement - 親要素
     */
    constructor(parentElement) {
        this.parentElement = parentElement;

        /** ポインタと案内テキストを格納する要素 */
        this.element = document.createElement("div");
        this.element.style.position = "absolute";
        this.element.style.zIndex = 1;
        this.element.style.display = "flex";
        this.element.style.flexDirection = "column";

        /** ポインタを生成 */
        // ポインタのサイズ
        this.pointerSize = {
            width: 100,
            height: 100
        }
        // ポインタの明滅周期(sec)
        this.period = 1.5;
        // ポインタの移動周期(sec)
        this.speed = 2;
        // ポインタ要素を生成
        this.pointer = document.createElement("img");
        this.pointer.src = "./tutorial/image/pointer.png";
        this.pointer.style.zIndex = 0;
        this.pointer.style.width = `${this.pointerSize.width}px`;
        this.pointer.style.height = `${this.pointerSize.height}px`;
        this.element.appendChild(this.pointer);

        /** 案内テキストを生成 */
        this.naviText = document.createElement("div");
        this.naviText.style.zIndex = 1;
        this.naviText.style.fontSize = "16px";
        this.naviText.style.lineHeight = "20px";
        this.naviText.style.fontWeight = "bold";
        this.naviText.style.backgroundColor = "#fe0";
        this.naviText.style.padding = "4px";
        this.naviText.style.border = "solid 2px #ca0";
        this.naviText.style.borderRadius = "4px";
        this.element.appendChild(this.naviText);

        /** 要素を非表示 */
        this.hide();

        /** 親要素に追加 */
        parentElement.appendChild(this.element);
    }

    /**
     *  ポインタと案内テキストを表示するメソッド
     * @param {Boolean} blinking - 明滅の指定 (true:明滅させる, false:明滅させない)
     */
    show(blinking) {
        this.element.style.display = "flex";
        if (blinking) {
            if (this.animationId) { this.stopAnimation(); }
            this.startAnimation("blinking");
        }
    }

    /** ポインタと案内テキストを非表示にするメソッド */
    hide() {
        this.element.style.display = "none";
        this.stopAnimation();
    }

    /** 
     * ポインタと案内テキストをターゲットの付近に移動するメソッド
     * @param {HTMLElement} clone - ターゲットとなる要素のクローン 
     */
    move(clone) {
        /** クローンのサイズと位置を取得 */
        const cloneRect = clone.getBoundingClientRect();

        /** ポインタと案内テキストのサイズを取得 */
        const elementRect = this.element.getBoundingClientRect();

        /** 配置できる場所を探索し、ポインタと案内テキストを移動 */
        // x方向
        const spaceX = cloneRect.right + elementRect.width < window.innerWidth;
        this.x = spaceX ? cloneRect.right : cloneRect.left - elementRect.width;
        this.element.style.alignItems = spaceX ? "flex-start" : "flex-end";
        const scaleX = spaceX ? 1 : -1;
        // y方向
        const spaceY = cloneRect.top + elementRect.height < window.innerHeight;
        this.y = spaceY ? cloneRect.top : cloneRect.bottom - elementRect.height;
        const scaleY = spaceY ? 1 : -1;
        // ポインタと案内テキストを移動
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        // ポインタを反転
        this.pointer.style.position = "initial";
        this.pointer.style.opacity = 1;
        this.pointer.style.transform = `scale(${scaleX}, ${scaleY})`;
    }

    /** 
     * テキストを変更するメソッド
     * @param {String} text - 表示するテキスト
     */
    changeText(text) {
        this.naviText.innerText = text;
    }

    /**
     * アニメーションを開始するメソッド
     * @param {String} type - アニメーションの種類 (blinking:その場で明滅, drag:指定座標間を移動)
     * @param {Object} points - ドラッグの始点と終点の座標 { start: { x: Number, y: Number }, end: { x: Number, y: Number } }
     */
    startAnimation(type, points) {
        const frame = (now) => {
            if (!this.startTime) { this.startTime = now; }
            const t = (now - this.startTime) / 1000;

            switch (type) {
                case "blinking":
                    this.pointer.style.opacity = ((Math.sin(t * 2 * Math.PI / this.period) + 1) / 2).toFixed(2);
                    break;
                case "drag":
                    // 移動距離を計算
                    const dx = points.end.x - points.start.x;
                    const dy = points.end.y - points.start.y;
                    // 時間当たりの移動量から座標を計算
                    const prog = (t % this.speed) / this.speed;
                    const x = points.start.x + dx * prog;
                    const y = points.start.y + dy * prog;
                    this.pointer.style.position = "absolute";
                    // 親要素分の差分を計算
                    this.pointer.style.left = `${x - this.x - this.pointerSize.width / 2}px`;
                    this.pointer.style.top = `${y - this.y - this.pointerSize.height / 2}px`;
                    break;
                default: console.error(type); break;
            }

            this.animationId = requestAnimationFrame(frame);
        };
        if (this.animationId) { this.stopAnimation(); }
        this.animationId = requestAnimationFrame(frame);
    }

    /** 明滅を停止するメソッド */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.startTime = null;
    }
}

/** ページの読み込み完了後、チュートリアルプログラムを読み込む */
window.addEventListener("load", () => { new Tutorial(); });

