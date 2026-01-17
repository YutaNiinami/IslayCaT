// キャンバスマネージャー
class CanvasManager {
    // コンストラクタ
    constructor(parent) {
        // プロパティを設定
        this.element = parent;
        this.canvases = [];
    }

    // キャンバスを作成するメソッド
    create(id) {
        // キャンバスを作成
        const canvas = new Canvas(this, id);
        this.canvases.push(canvas);
        // キャンバスを切替
        this.change(id);
    }

    // キャンバスを切り替えるメソッド
    change(id) {
        this.canvases.forEach((canvas) => {
            canvas.getId() === id
                ? canvas.show()
                : canvas.hidden();
        });
    }
}

// キャンバス
class Canvas {
    constructor(parent, id) {
        // プロパティを設定
        this.parent = parent;
        this.id = id;

        // 要素を作成
        this.element = this.parent.element.append("div")
            .attr("id", "canvas_" + this.id)
            .classed("canvas", true);
        // svgを生成
        svgManager.create(this);
    }

    // 表示するメソッド
    show() {
        this.element.style("display", "block");
    }
    // 非表示にするメソッド
    hidden() {
        this.element.style("display", "none");
    }
    // idを返却するメソッド
    getId() {
        return this.id;
    }
}
