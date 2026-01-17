// ヘッダーデータ
const HeaderData = [
    { category: "option", value: ["account", "load", "save", "setting"] },
    { category: "edit-mode", value: ["write", "delete", "select"] },
    { category: "shortcut", value: ["undo", "redo", "cut", "copy", "paste"] }
];

// ヘッダマネージャー
class HeaderManager {
    constructor(parent) {
        this.element = parent;

        // ボタン群を生成
        this.elements = {};
        HeaderData.forEach(array => {
            const element = this.element.append("div")
                .attr("id", `header_${array.category}`)
                .classed("header_category", true);
            this.elements[array.category] = { element: element };
            array.value.forEach(data => {
                this.elements[array.category][data] = new HeaderButton(element, array.category, data);
            });
        });

        // 初期化
        this.elements[HeaderData[1].category][HeaderData[1].value[0]].checked();
    }
}

// ヘッダーボタン
class HeaderButton {
    constructor(parent, category, data) {
        this.element = parent.append("div")
            .attr("id", `header_${category}_${data}`);

        let contentElement = null; // imgとdivを追加する要素
        // edit-modeはlabelとinputを追加
        if (category === HeaderData[1].category) {
            contentElement = this.element.append("label");
            this.input = contentElement.append("input")
                .attr("type", "radio")
                .attr("name", `header_${category}`);
        } else {
            contentElement = this.element;
        }
        contentElement.append("img")
            .attr("src", `img/${data}.jpg`)
            .attr("oncontextmenu", "return false;")
            .attr("draggable", "false");
        contentElement.append("div")
            .classed("text", true)
            .text(language[data][lang]);

        this.element.on("mousedown", () => {
            console.log(data);
        });
    }

    checked() {
        this.input?.property("checked", true);
    }
}