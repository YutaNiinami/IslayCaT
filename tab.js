// タブデータ
const TabsData = {
    tabs: ["character", "group"]
};

// タブマネージャー
class TabManager {
    // コンストラクタ
    constructor(parent) {
        // プロパティを設定
        this.element = parent;

        // タブを生成
        this.tabs = new Tabs(this);
        // タブコンテンツを生成
        this.tabContents = new TabContents(this);

        // 追加ボタンを生成
        this.addButton = this.element.append("div")
            .attr("id", "add_button");
        this.addButton.append("img")
            .property("src", "img/add_button.png")
    }

    // 初期化
    init() {
        this.changeTab();
        // イベントを設定
        this.tabs.element.on("change", () => this.changeTab());
        TabsData.tabs.forEach(tab => {
            this.tabContents.createTab(tab);
        });
        this.addButton.call(
            d3.drag()
                .on("start", () => {
                    const checkedTab = this.tabs.getCheckedTab();
                    this.tabContents.createTab(checkedTab);
                })
        );
    }

    // タブを変更するメソッド
    changeTab() {
        // 現在選択されているタブのコンテンツを表示
        const checkedTab = this.tabs.getCheckedTab();
        this.tabContents.changeTab(checkedTab);
        // ダイアログを非表示
        d3.select(".dialog_view").classed("dialog_view", false);
        dialogManager.hidden();
    }

    // タブデータを返却するメソッド
    getTabData() {
        return this.tabContents.getData();
    }

    // 現在選択されているタブを返却するメソッド
    getCheckedTab() {
        return this.tabs.getCheckedTab();
    };

    // 「状態」を追加するメソッド
    addState(state) {
        this.tabContents.addState(state);
    }
}

// キャラクタとグループを切り替えるタブ
class Tabs {
    // コンストラクタ
    constructor(parent) {
        // プロパティを設定
        this.parent = parent;

        // 要素を生成
        this.element = this.parent.element.append("div")
            .attr("id", "tab");
        // 各タブを生成
        this.tabs = [];
        TabsData.tabs.forEach(tab => {
            const newTab = new Tab(this, { name: tab, text: language[tab][lang] });
            this.tabs.push(newTab);
        })

        // 初期化
        this.tabs[0].check();
    }

    // 現在選択されているタブを返却するメソッド
    getCheckedTab() {
        const checkedTab = this.tabs
            .find((tab) => tab.getChecked())
            .getName();
        return checkedTab;
    }
}

// キャラクタまたはグループのタブ
class Tab {
    // コンストラクタ
    constructor(parent, data) {
        // プロパティを設定
        this.parent = parent;
        this.data = data;

        // 要素を作成
        this.element = this.parent.element.append("div")
            .attr("id", `${this.parent.element.attr("id")}_${this.data.name}`)
            .classed(this.parent.element.attr("id"), true);
        // label要素を追加
        const label = this.element.append("label");
        // input要素を追加
        this.input = label.append("input")
            .property("type", "radio")
            .attr("name", this.parent.element.attr("id"));
        // テキスト用div要素を追加
        label.append("div")
            .classed("text", true)
            .text(this.data.text);
    }

    // チェックするメソッド
    check() {
        this.input.property("checked", true);
    }
    // nameを返却するメソッド
    getName() {
        return this.data.name;
    }
    // チェック状態を返却するメソッド
    getChecked() {
        return this.input.property("checked");
    }
}

// タブコンテンツ
class TabContents {
    // コンストラクタ
    constructor(parent) {
        // プロパティを設定
        this.parent = parent;
        this.contents = Array.from({ length: TabsData.tabs.length }, () => ({ contents: [] }));

        // 要素を生成
        this.element = this.parent.element.append("div")
            .attr("id", "tab_contents");
        TabsData.tabs.forEach((tab, i) => {
            const content = this.element.append("div")
                .attr("id", `tab_content_${tab}`)
                .classed("tab_content", true);
            this.contents[i].element = content;
        });

        // イベントを設定
        this.contents[0].element
            .on("change", () => {
                const id = this.getCheckedCharacterId();
                canvasManager.change(id);
                // ダイアログを非表示
                d3.select(".dialog_view").classed("dialog_view", false);
                dialogManager.hidden();
            });
        // // グループコンテキストメニューを生成
        // this.groupContentMenu = new GroupContentMenu(this, this.contents[1]);
    }

    // タブを生成するメソッド
    createTab(tab) {
        const index = TabsData.tabs.indexOf(tab);
        let newContent;
        if (index === 0) {
            newContent = new CharacterContent(this, this.contents[index].element);
            canvasManager.create(newContent.id);
        } else {
            newContent = new GroupContent(this, this.contents[index].element);
        }
        this.contents[index].contents.push(newContent);
    }

    // タブを切り替えるメソッド
    changeTab(tab) {
        const index = TabsData.tabs.indexOf(tab);
        this.contents[index].element.style("display", "block");
        this.contents[1 - index].element.style("display", "none");
    }

    // 現在選択されているキャラクタのidを返却するメソッド
    getCheckedCharacterId() {
        const checkedCharacterId = this.contents[0].contents
            .find((character) => character.getChecked()).id;
        
        return checkedCharacterId;
    }

    // グループに「状態」を追加するメソッド
    addState(state) {
        const selectedGroup = this.contents[1].contents.find(groupContent =>
            groupContent.element.node().classList.contains("hover"));
        if (selectedGroup) { selectedGroup.addState(state); }
    }

    // タブのデータを返却するメソッド
    getData() {
        const data = Object.fromEntries(TabsData.tabs.map(tab => [tab, []]));
        this.contents.forEach((tab, i) => {
            tab.contents.forEach(content => {
                const contentData = {
                    id: content.id,
                    name: content.name
                };
                if (content instanceof GroupContent) {
                    contentData.states = content.states;
                }
                data[TabsData.tabs[i]].push(contentData);
            });
        });
        return data;
    }
}

// コンテンツ共通の継承クラス
class Content {
    #id
    #name

    set id(value) {
        this.#id = value;
    }

    get id() {
        return this.#id;
    }

    set name(value) {
        this.#name = value;
    }

    get name() {
        return this.#name;
    }
}

// キャラクタタブコンテンツ
class CharacterContent extends Content {
    static id = 0;

    // コンストラクタ
    constructor(parent, parentElement) {
        super();
        // プロパティを設定
        this.parent = parent;
        this.parentElement = parentElement;
        this.id = CharacterContent.generateId();

        // 要素を作成
        this.element = this.parentElement.append("div")
            .property("id", "character_" + this.id);
        // label要素を追加
        const label = this.element.append("label");
        // input要素を追加
        label.append("input")
            .property("type", "radio")
            .attr("name", "character");
        // テキスト用div要素を追加
        label.append("div")
            .classed("text", true);
        // nameを設定
        this.name = language.character[lang] + this.id;
        // このキャラクタを選択
        this.check();
    }

    // idを生成する静的メソッド
    static generateId() {
        return CharacterContent.id++;
    }

    // テキストを設定するメソッド
    set name(value) {
        super.name = value;
        this.element.select(".text").text(super.name);
    }

    get name() {
        return super.name;
    }

    // チェックするメソッド
    check() {
        this.element.select("input")
            .property("checked", true);
    }

    // チェック状態を返却するメソッド
    getChecked() {
        return this.element.select("input")
            .property("checked");
    }
}

// グループタブコンテンツ
class GroupContent extends Content {
    static id = 0;

    // コンストラクタ
    constructor(parent, parentElement) {
        super();
        // プロパティを設定
        this.parent = parent;
        this.parentElement = parentElement;
        this.id = GroupContent.generateId();
        this.states = [];
        // 要素を作成
        this.createElement();
    }

    // idを生成する静的メソッド
    static generateId() {
        return GroupContent.id++;
    }

    // 要素を作成するメソッド
    createElement() {
        // テキスト用div要素を追加
        this.element = this.parentElement.append("div")
            .property("id", "group_" + this.id)
            .classed("group_content", true)
            .classed("text", true);
        this.name = language.group[lang] + this.id;

        // コンテキストメニューの表示
        // // イベントを設定
        // let timer;
        // this.element.call(
        //     d3.drag()
        //         .on("start", () => {
        //             const y = d3.event.y;
        //             // タイマーをセット
        //             timer = setTimeout(() => {
        //                 // コンテキストメニューを表示
        //                 this.parent.groupContentMenu.show(y + 48); // +48(tabs)
        //             }, 500);
        //         })
        //         .on("drag", () => {
        //             // タイマーをクリア
        //             clearTimeout(timer);
        //         })
        //         .on("end", () => {
        //             // タイマーをクリア
        //             clearTimeout(timer);
        //         })
        // );
    }

    // テキストを設定するメソッド
    set name(value) {
        super.name = value;
        this.element.text(super.name);
    }

    get name() {
        return super.name;
    }

    // 「状態」を追加するメソッド
    addState(state) {
        this.states.push(state);
    }

    // グループに追加されている「状態」を返却するメソッド
    getStates() {
        return this.states;
    }
}

// // グループコンテキストメニュー
// class GroupContentMenu {
//     // コンストラクタ
//     constructor(parent, parentElement) {
//         // プロパティを設定
//         this.parent = parent;
//         this.parent.element = parentElement;

//         // 要素を生成
//         this.createElement();
//     }

//     // 要素を生成するメソッド
//     createElement() {
//         this.element = this.parent.element.append("div")
//             .attr("id", "group_context_menu")
//             .text("グループコンテキストメニュー");
//     }

//     // 指定位置に表示するメソッド
//     show(y) {
//         this.element
//             .style("top", `${y}px`)
//             .classed("is_visible", true);
//     }

//     // 非表示にするメソッド
//     hide() {
//         this.element.classed("is_visible", false);
//     }
// }