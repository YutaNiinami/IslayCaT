class DialogManager {
    constructor(root) {
        // プロパティを設定
        this.root = root;

        this.createElement();
    }

    createElement() {
        // 「状態」のダイアログを生成
        this.stateDialog = this.root.append("div")
            .attr("name", "state_dialog");

        // 「状態」の名前と画像を表示する列を追加
        const column0 = this.stateDialog.append("div")
            .attr("name", "column0");
        // 名前を表示する要素を追加
        const name = column0.append("input")
            .attr("type", "text")
            .attr("name", "state_name")
            .classed("text", true)
            .classed("dialog_input", true);
        name.on("change", () => {
            this.target.data.name = name.property("value");
            this.target.update();
            this.updateDialog();
        });
        // 画像を表示する要素を追加
        const img = column0.append("img")
            .attr("id", "dialog_img")
            .classed("dialog_img", true);
        img.on("click", () => { imageManager.dialogShow(); });

        // 「状態」のアクションとおんせいを表示する列を追加
        const column1 = this.stateDialog.append("div")
            .attr("name", "column1");
        // アクション1を表示する要素を追加
        const action1 = column1.append("div")
            .attr("name", "action1");
        // アクション1の動きを表示する要素を追加
        const action1Behavior = action1.append("div")
            .attr("id", "action1Behavior")
            .classed("behavior", true);
        action1Behavior.append("div")
            .classed("text", true)
            .text(language.action1[lang]);
        const action1Options = [
            { value: "none", text: language.state_none[lang] },
            { value: "move", text: language.move[lang] },
            { value: "random_move", text: language.random_move[lang] },
            { value: "jump", text: language.jump[lang] },
            { value: "random_jump", text: language.random_jump[lang] },
            { value: "follow", text: language.follow[lang] }
        ];
        const action1Select = action1Behavior.append("select")
            .classed("text", true)
            .attr("id", "action1_behavior");
        action1Select.selectAll("option")
            .data(action1Options)
            .enter()
            .append("option")
            .classed("text", true)
            .property("value", d => d.value)
            .property("selected", d => d.value === "none")
            .text(d => d.text);
        // イベントを追加
        action1Select.on("change", () => {
            let value;
            switch (action1Select.property("value")) {
                case "none": value = "none"; break;
                case "move": value = "move:left:0:up:0"; break;
                case "random_move": value = "random_move:left:0:up:0"; break;
                case "jump": value = "jump:0:0"; break;
                case "random_jump": value = "random_jump:false:false:false:false"; break;
                case "follow": value = "follow:parent"; break;
                default: console.log("error:action1Select.property('value')"); break;
            }
            this.target.data.action1.value = value;
            this.target.update();
            this.updateDialog();
        });
        // アクション1の詳細を表示する要素を追加
        const action1Detail = action1.append("div")
            .attr("id", "action1Detail")
            .classed("detail", true);
        const action1Details = action1Detail.selectAll("div")
            .data(action1Options)
            .enter()
            .append("div")
            .attr("value", d => d.value)
            .style("display", "none");
        action1Details.each((d) => {
            const div = d3.select("#action1Detail")
                .select(`div[value=${d.value}]`);
            switch (d.value) {
                case "none": break;
                case "move":
                case "random_move":
                    this.createInputRadio(div, "lr", d.value);
                    this.createInputNumber(div, `${d.value}_lr`, 9999, 0);
                    this.createInputRadio(div, "ud", d.value);
                    this.createInputNumber(div, `${d.value}_ud`, 9999, 0);
                    break;
                case "jump":
                    if (lang == "jp") {
                        div.append("span")
                            .classed("text", true)
                            .text(language.from_left[lang]);
                        this.createInputNumber(div, "left", 9999, 0);
                        div.append("span")
                            .classed("text", true)
                            .text(language.from_top[lang]);
                        this.createInputNumber(div, "top", 9999, 0);
                    } else {
                        this.createInputNumber(div, "left", 9999, 0);
                        div.append("span")
                            .classed("text", true)
                            .text(language.from_left[lang]);
                        this.createInputNumber(div, "top", 9999, 0);
                        div.append("span")
                            .classed("text", true)
                            .text(language.from_top[lang]);
                    }
                    break;
                case "random_jump":
                    const lrudData = [
                        { name: "left" },
                        { name: "right" },
                        { name: "up" },
                        { name: "down" },
                    ];
                    const labels = div.selectAll("span")
                        .data(lrudData)
                        .enter()
                        .append("span")
                        .attr("name", d => d.name)
                        .append("label")
                        .attr("id", d => `lrud_${d.name}`)
                        .attr("name", d => d.name);
                    labels.each(function (d) {
                        d3.select(this).append("input")
                            .attr("type", "checkbox")
                            .attr("name", d.name);
                        const span = d3.select(this).append("span")
                            .classed("text", true);
                        switch (d.name) {
                            case "left": span.text(language.left[lang]); break;
                            case "right": span.text(language.right[lang]); break;
                            case "up": span.text(language.up[lang]); break;
                            case "down": span.text(language.down[lang]); break;
                            default: console.log("error:d.type"); break;
                        }
                    });
                    break;
                case "follow": break;
                default: console.log("error:d.value"); break;
            }
        });
        // イベントを追加
        action1Detail.on("input", () => {
            const behavior = d3.select("#action1Behavior")
                .select("select")
                .property("value");
            const div = d3.select("#action1Detail")
                .select(`div[value=${behavior}]`);
            let value = behavior;
            switch (behavior) {
                case "none": break;
                case "move":
                case "random_move":
                    value += ":" + div.select(`span[name='lr_${behavior}']`)
                        .select("input:checked")
                        .node()
                        .parentNode
                        .getAttribute("name");
                    value += ":" + div.select(`span[name='${behavior}_lr_number']`)
                        .select("input[type='number']")
                        .property("value");
                    value += ":" + div.select(`span[name='ud_${behavior}']`)
                        .select("input:checked")
                        .node()
                        .parentNode
                        .getAttribute("name");
                    value += ":" + div.select(`span[name='${behavior}_ud_number']`)
                        .select("input[type='number']")
                        .property("value");
                    break;
                case "jump":
                    value += ":" + div.select("span[name='left_number']")
                        .select("input[type='number']")
                        .property("value");
                    value += ":" + div.select("span[name='top_number']")
                        .select("input[type='number']")
                        .property("value");
                    break;
                case "random_jump":
                    const lrud = ["left", "right", "up", "down"];
                    for (let i = 0; i < lrud.length; i++) {
                        if (div.select(`span[name='${lrud[i]}']`).select("input").property("checked")) {
                            value += ":" + "true";
                        } else {
                            value += ":" + "false";
                        }
                    }
                    break;
                case "follow":
                    const character = div.select("span[name='character']")
                        .select("select")
                        .property("value");
                    value += ":" + character;
                    break;
                default: console.log("error:behavior"); break;
            }
            this.target.data.action1.value = value;
            this.target.update();
            this.updateDialog();
        });
        // アクション2を表示する要素を追加
        const action2 = column1.append("div")
            .attr("name", "action2");
        // アクション2の動きを表示する要素を追加
        const action2Behavior = action2.append("div")
            .attr("id", "action2Behavior")
            .classed("behavior", true);
        action2Behavior.append("div")
            .classed("text", true)
            .text(language.action2[lang]);
        const action2Options = [
            { value: "none", text: language.state_none[lang] },
            { value: "make_character", text: language.make_character[lang] },
            { value: "make_group", text: language.make_group[lang] },
            { value: "notice", text: language.notice[lang] },
            { value: "message", text: language.message[lang] },
            { value: "change_speed", text: language.change_speed[lang] },
            { value: "change", text: language.change[lang] },
            { value: "deleted", text: language.deleted[lang] },
            { value: "exit", text: language.exit[lang] }
        ];
        const action2Select = action2Behavior.append("select")
            .classed("text", true)
            .attr("id", "action2_behavior");
        action2Select.selectAll("option")
            .data(action2Options)
            .enter()
            .append("option")
            .classed("text", true)
            .property("value", d => d.value)
            .text(d => d.text);
        action2Select.on("change", () => {
            let value;
            switch (action2Select.property("value")) {
                case "none": value = "none"; break;
                case "make_character": value = "make_character:0:0"; break;
                case "make_group": value = "make_group:0"; break;
                case "notice": value = "notice:"; break;
                case "message": value = "message:"; break;
                case "change_speed": value = "change_speed:0:fast"; break;
                case "change": value = "change:0:0"; break;
                case "deleted": value = "deleted"; break;
                case "exit": value = "exit"; break;
                default: console.log("error:action2Select.property('value')"); break;
            }
            this.target.data.action2.value = value;
            this.target.update();
            this.updateDialog();
        });
        // アクション2の詳細を表示する要素を追加
        const action2Detail = action2.append("div")
            .attr("id", "action2Detail")
            .classed("detail", true);
        const action2Details = action2Detail.selectAll("div")
            .data(action2Options)
            .enter()
            .append("div")
            .attr("value", d => d.value)
            .style("display", "none");
        action2Details.each((d) => {
            const div = d3.select("#action2Detail")
                .select(`div[value=${d.value}]`);
            switch (d.value) {
                case "none": break;
                case "make_character": break;
                case "make_group": break;
                case "notice":
                case "message":
                    div.append("span")
                        .attr("name", d.value)
                        .append("input")
                        .attr("type", "text")
                        .attr("id", d.value)
                        .attr("name", d.value)
                        .classed("text", true);
                    break;
                case "change_speed":
                    if (lang == "jp") {
                        this.createInputNumber(div, "fs", 999, 1);
                    }
                    const changeSpeedData = [
                        { value: "fast", text: language.fast[lang] },
                        { value: "slow", text: language.slow[lang] },
                        { value: "abs", text: language.abs[lang] },
                    ];
                    const changeSpeedSelect = div.append("span")
                        .attr("name", "change_speed")
                        .append("select")
                        .classed("text", true)
                        .attr("name", "change_speed");
                    changeSpeedSelect.selectAll("option")
                        .data(changeSpeedData)
                        .enter()
                        .append("option")
                        .classed("text", true)
                        .property("value", d => d.value)
                        .text(d => d.text);
                    if (lang == "en") {
                        this.createInputNumber(div, "fs", 999, 1);
                    }
                    break;
                case "change": break;
                case "deleted": break;
                case "exit": break;
                default: console.log("error:d.value"); break;
            }
        });
        // イベントを追加
        action2Detail.on("input", () => {
            const behavior = d3.select("#action2Behavior")
                .select("select")
                .property("value");
            const div = d3.select("#action2Detail")
                .select(`div[value=${behavior}]`);
            let value = behavior;
            switch (behavior) {
                case "none": break;
                case "make_character":
                    value += this.characterStateValue(div);
                    break;
                case "make_group":
                    value += ":" + div.select("span[name='group']")
                        .select("select")
                        .property("value");
                    break;
                case "notice":
                case "message":
                    value += ":" + div.select("span")
                        .select("input")
                        .property("value");
                    break;
                case "change_speed":
                    value += ":" + div.select("span[name='fs_number']")
                        .select("input[type='number']")
                        .property("value");
                    value += ":" + div.select("span[name='change_speed']")
                        .select("select")
                        .property("value");
                    break;
                case "change":
                    value += this.characterStateValue(div);
                    break;
                case "deleted": break;
                case "exit": break;
                default: console.log("error:behavior"); break;
            }
            this.target.data.action2.value = value;
            this.target.update();
            this.updateDialog();
        });
        // おんせいを表示する要素を追加
        const se = column1.append("div")
            .attr("name", "se");
        // おんせいの動きを表示する要素を追加
        const seBehavior = se.append("div")
            .attr("id", "seBehavior")
            .classed("behavior", true);
        seBehavior.append("div")
            .classed("text", true)
            .text(language.se[lang]);
        const seOptions = [
            { value: "none", text: language.state_none[lang] },
            { value: "once", text: language.once[lang] },
            { value: "loop", text: language.state_loop[lang] }
        ];
        const seSelect = seBehavior.append("select")
            .classed("text", true)
            .attr("name", "se_behavior");
        seSelect.selectAll("option")
            .data(seOptions)
            .enter()
            .append("option")
            .classed("text", true)
            .property("value", d => d.value)
            .text(d => d.text);
        seSelect.on("change", () => {
            let value;
            switch (seSelect.property("value")) {
                case "none": value = "none"; break;
                case "once": value = "once:0"; break;
                case "loop": value = "loop:state:0"; break;
                default: console.log("error:seSelect.property('value')"); break;
            }
            this.target.data.se.value = value;
            this.target.update();
            this.updateDialog();
        });
        // おんせいの詳細を表示する要素を追加
        const seDetail = se.append("div")
            .attr("id", "seDetail")
            .classed("detail", true);
        const seDetails = seDetail.selectAll("div")
            .data(seOptions)
            .enter()
            .append("div")
            .attr("value", d => d.value)
            .style("display", "none");
        seDetails.each((d) => {
            const div = d3.select("#seDetail")
                .select(`div[value=${d.value}]`);
            switch (d.value) {
                case "none": break;
                case "loop":
                    if (lang == "en") {
                        div.append("span")
                            .classed("text", true)
                            .text(language.loop_by[lang]);
                    }
                    const loopData = [
                        { value: "state", text: language.state[lang] },
                        { value: "character", text: language.character[lang] },
                    ];
                    const loopSelect = div.append("span")
                        .attr("name", "loop")
                        .append("select")
                        .classed("text", true)
                        .attr("name", "loop");
                    loopSelect.selectAll("option")
                        .data(loopData)
                        .enter()
                        .append("option")
                        .classed("text", true)
                        .property("value", d => d.value)
                        .text(d => d.text);
                    if (lang == "jp") {
                        div.append("span")
                            .classed("text", true)
                            .text(language.loop_by[lang]);
                    }
                case "once":
                    const seData = [
                        { value: "0", text: "sample0" },
                        { value: "1", text: "sample1" },
                        { value: "2", text: "sample2" },
                        { value: "3", text: "sample3" },
                        { value: "4", text: "sample4" },
                        { value: "5", text: "sample5" },
                        { value: "6", text: "sample6" }
                    ];
                    const seSelect = div.append("span")
                        .attr("name", "se")
                        .append("select")
                        .classed("text", true)
                        .attr("name", "se");
                    seSelect.selectAll("option")
                        .data(seData)
                        .enter()
                        .append("option")
                        .classed("text", true)
                        .property("value", d => d.value)
                        .text(d => d.text);
                    break;
                default: console.log("error:d.value"); break;
            }
        });
        // イベントを追加
        seDetail.on("input", () => {
            const behavior = d3.select("#seBehavior")
                .select("select")
                .property("value");
            const div = d3.select("#seDetail")
                .select(`div[value=${behavior}]`);
            let value = behavior;
            switch (behavior) {
                case "none": break;
                case "loop":
                    value += ":" + div.select("span[name='loop']")
                        .select("select")
                        .property("value");
                case "once":
                    value += ":" + div.select("span[name='se']")
                        .select("select")
                        .property("value");
                    break;
                default: console.log("error:behavior"); break;
            }
            this.target.data.se.value = value;
            this.target.update();
            this.updateDialog();
        });

        // 「せんたく」「けす」ボタン
        const column2 = this.stateDialog.append("div")
            .attr("name", "column2");
        this.createButton(column2, "select", language.select[lang]);
        this.createButton(column2, "delete", language.delete[lang]);

        // 「遷移」のダイアログを生成
        // 親要素を取得
        this.transDialog = this.root.append("div")
            .attr("name", "trans_dialog");

        // 「遷移」の情報を表示する列を追加
        const transColumn1 = this.transDialog.append("div")
            .attr("name", "column1");
        // 遷移条件を表示する要素を追加
        const transColumn1Data = [
            { value: "condition", text: language.condition[lang] },
            { value: "priority", text: language.priority[lang] }
        ];
        const transColumn1Contents = transColumn1.selectAll("div")
            .data(transColumn1Data)
            .enter()
            .append("div")
            .attr("name", d => d.value);
        transColumn1Contents.each((d) => {
            const transColumn1Content = this.transDialog.select(`div[name='${d.value}']`);
            const behavior = transColumn1Content.append("div")
                .attr("name", d.value + "_behavior")
                .classed("behavior", true);
            behavior.append("div")
                .classed("text", true)
                .text(d.text);
            if (d.value == "condition") {
                const conditionOptions = [
                    { value: "none", text: language.trans_none[lang] },
                    { value: "loop", text: language.trans_loop[lang] },
                    { value: "touched", text: language.touched[lang] },
                    { value: "bumped", text: language.bumped[lang] },
                    { value: "probability", text: language.probability[lang] },
                    { value: "alone", text: language.alone[lang] },
                    { value: "notice", text: language.notice[lang] }
                ];
                const conditionSelect = behavior.append("select")
                    .classed("text", true)
                    .attr("id", `${d.value}_behavior`)
                    .attr("name", d.value);
                conditionSelect.selectAll("option")
                    .data(conditionOptions)
                    .enter()
                    .append("option")
                    .classed("text", true)
                    .property("value", d => d.value)
                    .text(d => d.text);
                // イベントを追加
                conditionSelect.on("change", () => {
                    let value;
                    switch (conditionSelect.property("value")) {
                        case "none": value = "none"; break;
                        case "loop": value = "loop:1"; break;
                        case "touched": value = "touched"; break;
                        case "bumped": value = "bumped:false:false:false:false:false:something"; break;
                        case "probability": value = "probability:50"; break;
                        case "alone": value = "alone"; break;
                        case "notice": value = "notice:"; break;
                        default: console.log("error:conditionSelect.property('value')"); break;
                    }
                    this.target.data.condition.value = value;
                    this.target.update();
                    this.updateDialog();
                });
                const detail = transColumn1Content.append("div")
                    .attr("name", d.value + "_detail")
                    .classed("detail", true);
                const conditionDetails = detail.selectAll("div")
                    .data(conditionOptions)
                    .enter()
                    .append("div")
                    .attr("value", d => d.value)
                    .style("display", "none");
                conditionDetails.each((d) => {
                    const div = this.transDialog.select(`div[value=${d.value}]`);
                    switch (d.value) {
                        case "none": break;
                        case "loop":
                            this.createInputNumber(div, "loop", 9999, 1);
                            break;
                        case "touched": break;
                        case "bumped":
                            const lrudData = [
                                { name: "left" },
                                { name: "right" },
                                { name: "up" },
                                { name: "down" },
                                { name: "character" }
                            ];
                            const labels = div.selectAll("span")
                                .data(lrudData)
                                .enter()
                                .append("span")
                                .attr("name", d => d.name)
                                .append("label")
                                .attr("id", d => `bumped_${d.name}`)
                                .attr("name", d => d.name);
                            labels.each(function (d) {
                                d3.select(this).append("input")
                                    .attr("type", "checkbox")
                                    .attr("name", d.name);
                                const span = d3.select(this).append("span")
                                    .classed("text", true);
                                switch (d.name) {
                                    case "left": span.text(language.left_edge[lang]); break;
                                    case "right": span.text(language.right_edge[lang]); break;
                                    case "up": span.text(language.top_edge[lang]); break;
                                    case "down": span.text(language.bottom_edge[lang]); break;
                                    case "character": span.text(language.character[lang]); break;
                                    default: console.log("error:d.type"); break;
                                }
                            });
                            div.append("span")
                                .attr("name", "character_select")
                                .append("select")
                                .classed("text", true)
                                .attr("name", "character_select");
                            break;
                        case "probability":
                            this.createInputNumber(div, "probability", 100, 1);
                            break;
                        case "alone": break;
                        case "notice":
                            div.append("span")
                                .attr("name", d.value)
                                .append("input")
                                .attr("type", "text")
                                .attr("name", d.value)
                                .classed("text", true);
                            break;
                        default: console.log("error:d.value"); break;
                    }
                });
                // イベントを追加
                detail.on("input", () => {
                    const behavior = this.transDialog.select("div[name='condition_behavior']")
                        .select("select")
                        .property("value");
                    let value = behavior;
                    const div = this.transDialog.select("div[name='condition_detail']")
                        .select(`div[value=${behavior}]`);
                    switch (behavior) {
                        case "none": break;
                        case "loop":
                            value += ":" + div.select("span[name='loop_number']")
                                .select("input[type='number']")
                                .property("value");
                            break;
                        case "touched": break;
                        case "bumped":
                            const lrud = ["left", "right", "up", "down", "character"];
                            for (let i = 0; i < lrud.length; i++) {
                                if (div.select(`span[name='${lrud[i]}']`).select("input").property("checked")) {
                                    value += ":" + "true";
                                } else {
                                    value += ":" + "false";
                                }
                            }
                            value += ":" + div.select("span[name='character_select']")
                                .select("select")
                                .property("value");
                            break;
                        case "probability":
                            value += ":" + div.select("span[name='probability_number']")
                                .select("input[type='number']")
                                .property("value");
                            break;
                        case "alone": break;
                        case "notice":
                            value += ":" + div.select("span")
                                .select("input")
                                .property("value");
                            break;
                        default: console.log("error:behavior"); break;
                    }
                    this.target.data.condition.value = value;
                    this.target.update();
                    this.updateDialog();
                });
            } else if (d.value == "priority") {
                this.createInputNumber(behavior, "priority", 9999, 1);
                behavior.on("input", () => {
                    console.log("input");

                    // const oldPriority = Number(this.target.select("text.priority").select("textPath").text());
                    // const newPriority = Number(this.target.data.priority);
                    const oldPriority = this.target.data.priority;
                    const newPriority = behavior.select("input[type='number']")
                        .property("value");
                    if (oldPriority != newPriority) {
                        // 現在表示されているキャンバスのsvgコンテナのg要素を取得
                        const g = d3.select("#canvas_" + tabManager.tabContents.getCheckedCharacterId()).select("g");
                        // ターゲットと遷移元「状態」が同じで変更後の優先度を持つ要素の優先度を変更
                        const sub = g.select(`.from_state_${this.target.fromStateId}[priority='${newPriority}']`);
                        sub.attr("priority", oldPriority);
                        sub.select("text.priority")
                            .select("textPath")
                            .text(oldPriority);
                        // ターゲットの優先度を変更
                        this.target.data.property = newPriority;
                    }
                    this.target.update();
                    this.updateDialog();
                });
            } else {
                console.log("error:d.value");
            }
        });

        // 「せんたく」「けす」ボタン
        const transColumn2 = this.transDialog.append("div")
            .attr("name", "column2");
        this.createButton(transColumn2, "select", language.select[lang]);
        this.createButton(transColumn2, "delete", language.delete[lang]);
    }

    createInputRadio(parent, type, name) {
        let data = [];
        if (type == "lr") {
            data = [
                { name: "left" },
                { name: "right" }
            ];
        } else if (type == "ud") {
            data = [
                { name: "up" },
                { name: "down" }
            ];
        } else {
            console.log("error:type");
        }
        const span = parent.append("span")
            .attr("name", type + "_" + name);
        const labels = span.selectAll("label")
            .data(data)
            .enter()
            .append("label")
            .attr("id", d => `${type}_${name}_${d.name}`)
            .attr("name", d => d.name);
        labels.each(function (d) { // thisを動的に扱うためアロー関数は使わない
            const input = d3.select(this)
                .append("input")
                .attr("type", "radio")
                .attr("name", type + "_" + name);
            const span = d3.select(this)
                .append("span")
                .classed("text", true);
            switch (d.name) {
                case "left":
                    input.property("checked", true);
                    span.text(language.left[lang]);
                    break;
                case "right":
                    span.text(language.right[lang]);
                    break;
                case "up":
                    input.property("checked", true);
                    span.text(language.up[lang]);
                    break;
                case "down":
                    span.text(language.down[lang]);
                    break;
                default: console.log("error:d.type"); break;
            }
        });
    }

    createInputNumber(parent, name, max, min) {
        const span = parent.append("span")
            .attr("name", name + "_number");
        const minus = span.append("input")
            .attr("id", `${name}_number_minus`)
            .classed("minus", true)
            .classed("text", true)
            .attr("type", "button")
            .attr("value", "－");
        span.append("input")
            .attr("type", "number")
            .classed("text", true)
            .attr("name", name)
            .property("value", 0)
            .attr("max", max)
            .attr("min", min);
        const plus = span.append("input")
            .attr("id", `${name}_number_plus`)
            .classed("plus", true)
            .classed("text", true)
            .attr("type", "button")
            .attr("value", "＋");
        minus.node().addEventListener("click", function () {
            const input = this.parentNode.querySelector("input[type='number']");
            if (input && input.value > input.min) {
                input.value--;
                let dispatchElement;
                if (this.parentNode.parentNode.getAttribute("name") == "priority_behavior") {
                    dispatchElement = this.parentNode.parentNode;
                } else {
                    dispatchElement = this.parentNode.parentNode.parentNode;
                }
                dispatchElement.dispatchEvent(new Event("input"));
            }
        });
        plus.node().addEventListener("click", function () {
            const input = this.parentNode.querySelector("input[type='number']");
            if (input && input.value < input.max) {
                input.value++;
                let dispatchElement;
                if (this.parentNode.parentNode.getAttribute("name") == "priority_behavior") {
                    dispatchElement = this.parentNode.parentNode;
                } else {
                    dispatchElement = this.parentNode.parentNode.parentNode;
                }
                dispatchElement.dispatchEvent(new Event("input"));
            }
        });
    }

    createCharacterSelect(parent, value, parentFlag, stateFlag) {
        const valueSplit = value.split(":");
        // 選択肢を削除
        parent.text("");
        // 新たに選択肢を作成
        let characterData = tabManager.getTabData().character;
        if (parentFlag) {
            const parentData = [{ id: "parent", name: language.parent[lang] }];
            characterData = [...parentData, ...characterData];
        }

        const characterSelect = parent.append("span")
            .attr("name", "character")
            .append("select")
            .attr("id", "character_select")
            .classed("text", true)
            .attr("name", "character");
        characterSelect.selectAll("option")
            .data(characterData)
            .enter()
            .append("option")
            .classed("text", true)
            .property("value", d => d.id)
            .text(d => d.name);
        // 選択肢を「状態」の情報に設定
        parent.select("span[name='character']")
            .select(`option[value='${valueSplit[1]}']`)
            .property("selected", true);
        // キャラクタの選択肢が「おや」でなければ「状態」の選択肢を追加
        if (valueSplit[1] != "parent" && stateFlag) {
            const stateData = svgManager.getDiagramData().character[valueSplit[1]].states;
            const stateSelect = parent.append("span")
                .attr("name", "state")
                .append("select")
                .classed("text", true)
                .attr("name", "state");
            if (stateData.length !== 0) {
                stateSelect.selectAll("option")
                    .data(stateData)
                    .enter()
                    .append("option")
                    .classed("text", true)
                    .property("value", d => d.id)
                    .text(d => d.data.name);
                // 選択肢を「状態」の情報に設定
                parent.select("span[name='state']")
                    .select(`option[value='${valueSplit[2]}']`)
                    .property("selected", true);
            }
        }
    }

    // キャラクタと「状態」の選択肢に対応するvalueを返却するメソッド
    characterStateValue(parent) {
        const character = parent.select("span[name='character']")
            .select("select")
            .property("value");
        let value = ":" + character;
        console.log(character);

        if (character != "parent") {
            if (character != this.target.data.action1.value.split(":")[1]) {
                const stateData = svgManager.getDiagramData().character[character].states;
                if (stateData.length == 0) {
                    value += ":-1";
                } else {
                    value += ":" + stateData[0].value;
                }
            } else {
                value += ":" + parent.select("span[name='state']")
                    .select("select")
                    .property("value");
            }
        }
        return value;
    }

    createButton(parent, name, text) {
        // ボタンを作成
        const button = parent.append("div")
            .attr("name", name + "_button")
            .classed("text", true)
            .text(text);
        // イベントを追加
        button.call(
            d3.drag()
                .on("start", () => {
                    console.log(name + "_button start");
                })
        );
    }

    // ターゲットのデータからダイアログを更新するメソッド
    updateDialog(target) {
        // 全てのダイアログを非表示
        this.hidden();
        // ターゲットを設定
        if (target != undefined) {
            this.target = target;
        }

        // ターゲットが「状態」の場合
        if (this.target.constructor.name === "State") {
            // データを変換
            const splitData = {
                action1: this.target.data.action1.value.split(":"),
                action2: this.target.data.action2.value.split(":"),
                se: this.target.data.se.value.split(":")
            };

            // ダイアログに「状態」の情報を設定
            this.stateDialog.select("div[name='column0']")
                .select("input")
                .property("value", this.target.data.name);
            this.stateDialog.select("div[name='column0']")
                .select("img")
                .attr("src", this.target.data.img);
            this.stateDialog.select("#action1Behavior")
                .select(`option[value=${splitData.action1[0]}]`)
                .property("selected", true);
            this.stateDialog.select("#action2Behavior")
                .select(`option[value=${splitData.action2[0]}]`)
                .property("selected", true);
            this.stateDialog.select("#seBehavior")
                .select(`option[value=${splitData.se[0]}]`)
                .property("selected", true);
            // 詳細に情報を設定
            const action1Detail = d3.select("#action1Detail");
            const action1Div = action1Detail.select(`div[value=${splitData.action1[0]}]`);
            switch (splitData.action1[0]) {
                case "none": break;
                case "move":
                case "random_move":
                    action1Div.select(`span[name='lr_${splitData.action1[0]}']`)
                        .select(`label[name=${splitData.action1[1]}]`)
                        .select("input")
                        .property("checked", true);
                    action1Div.select(`span[name='${splitData.action1[0]}_lr_number']`)
                        .select("input[type='number']")
                        .property("value", splitData.action1[2]);
                    action1Div.select(`span[name='ud_${splitData.action1[0]}']`)
                        .select(`label[name=${splitData.action1[3]}]`)
                        .select("input")
                        .property("checked", true);
                    action1Div.select(`span[name='${splitData.action1[0]}_ud_number']`)
                        .select("input[type='number']")
                        .property("value", splitData.action1[4]);
                    break;
                case "jump":
                    action1Div.select("span[name='left_number']")
                        .select("input[type='number']")
                        .property("value", splitData.action1[1]);
                    action1Div.select("span[name='top_number']")
                        .select("input[type='number']")
                        .property("value", splitData.action1[2]);
                    break;
                case "random_jump":
                    const lrud = ["left", "right", "up", "down"];
                    for (let i = 0; i < lrud.length; i++) {
                        if (splitData.action1[i + 1] == "true") {
                            action1Div.select(`span[name=${lrud[i]}]`)
                                .select("input")
                                .property("checked", true);
                        } else if (splitData.action1[i + 1] == "false") {
                            action1Div.select(`span[name=${lrud[i]}]`)
                                .select("input")
                                .property("checked", false);
                        } else {
                            console.log("error:splitData.action1[i + 1]");
                        }
                    }
                    break;
                case "follow":
                    this.createCharacterSelect(action1Div, this.target.data.action1.value, true, false);
                    break;
                default: console.log("error:splitData.action1[0]"); break;
            }
            const action2Detail = d3.select("#action2Detail");
            const action2Div = action2Detail.select(`div[value=${splitData.action2[0]}]`);
            switch (splitData.action2[0]) {
                case "none": break;
                case "make_character":
                    this.createCharacterSelect(action2Div, this.target.data.action2.value, false, true);
                    break;
                case "make_group":
                    // 選択肢を削除
                    action2Div.text("");
                    // 新たに選択肢を作成
                    const groupData = tabManager.getTabData().group;
                    const groupSelect = action2Div.append("span")
                        .attr("name", "group")
                        .append("select")
                        .classed("text", true)
                        .attr("name", "group");
                    groupSelect.selectAll("option")
                        .data(groupData)
                        .enter()
                        .append("option")
                        .classed("text", true)
                        .property("value", d => d.id)
                        .text(d => d.name);
                    // 選択肢を「状態」の情報に設定
                    action2Div.select("span[name='group']")
                        .select(`option[value='${splitData.action2[1]}']`)
                        .property("selected", true);
                    break;
                case "notice":
                case "message":
                    action2Div.select(`span[name='${splitData.action2[0]}']`)
                        .select("input[type='text']")
                        .property("value", splitData.action2[1]);
                    break;
                case "change_speed":
                    action2Div.select(`span[name='fs_number']`)
                        .select("input[type='number']")
                        .property("value", splitData.action2[1]);
                    action2Div.select("span[name='change_speed']")
                        .select(`option[value=${splitData.action2[2]}]`)
                        .property("selected", true);
                    break;
                case "change":
                    this.createCharacterSelect(action2Div, this.target.data.action2.value, false, true);
                    break;
                case "deleted": break;
                case "exit": break;
                default: console.log("error:splitData.action2[0]"); break;
            }
            const seDetail = d3.select("#seDetail");
            const seDiv = seDetail.select(`div[value=${splitData.se[0]}]`);
            switch (splitData.se[0]) {
                case "none": break;
                case "once":
                    seDiv.select("span[name='se']")
                        .select(`option[value='${splitData.se[1]}']`)
                        .property("selected", true);
                    break;
                case "loop":
                    seDiv.select("span[name='loop']")
                        .select(`option[value='${splitData.se[1]}']`)
                        .property("selected", true);
                    seDiv.select("span[name='se']")
                        .select(`option[value='${splitData.se[2]}']`)
                        .property("selected", true);
                    break;
                default: console.log("error:splitData.se[0]"); break;
            }

            // 選択肢に対応する詳細を表示
            action1Detail.selectAll(":scope > *")
                .style("display", "none");
            action1Detail.select(`div[value=${splitData.action1[0]}]`)
                .style("display", "block");
            action2Detail.selectAll(":scope > *")
                .style("display", "none");
            action2Detail.select(`div[value=${splitData.action2[0]}]`)
                .style("display", "block");
            seDetail.selectAll(":scope > *")
                .style("display", "none");
            seDetail.select(`div[value=${splitData.se[0]}]`)
                .style("display", "block");

            // 「状態」のダイアログを表示
            this.stateDialog.style("display", "flex");
        }
        // ターゲットが「遷移」の場合
        else if (this.target.constructor.name === "Trans") {
            // データを変換
            const splitData = {
                condition: this.target.data.condition.value.split(":")
            };

            // 遷移条件を設定
            this.transDialog.select("div[name='condition_behavior']")
                .select(`option[value=${splitData.condition[0]}]`)
                .property("selected", true);
            // 優先度を設定
            const maxPriority = this.target.maxPriority();
            this.transDialog.select("div[name='priority_behavior']")
                .select("input[type='number']")
                .property("value", this.target.data.priority)
                .attr("max", maxPriority);
            // 詳細に情報を設定
            const conditionDetail = this.transDialog.select("div[name='condition_detail']");
            const div = conditionDetail.select(`div[value=${splitData.condition[0]}]`);
            switch (splitData.condition[0]) {
                case "none": break;
                case "loop":
                    div.select("span[name='loop_number']")
                        .select("input[type='number']")
                        .property("value", splitData.condition[1]);
                    break;
                case "touched": break;
                case "bumped":
                    const lrud = ["left", "right", "up", "down"];
                    for (let i = 0; i < lrud.length; i++) {
                        if (splitData.condition[i + 1] == "true") {
                            div.select(`span[name=${lrud[i]}]`)
                                .select("input")
                                .property("checked", true);
                        } else if (splitData.condition[i + 1] == "false") {
                            div.select(`span[name=${lrud[i]}]`)
                                .select("input")
                                .property("checked", false);
                        } else {
                            console.log("error:splitData.condition[i + 1]");
                        }
                    }
                    const select = div.select("span[name='character_select']")
                        .select("select");
                    // 選択肢を削除
                    select.text("");
                    // 選択肢を新たに作成
                    let characterData = tabManager.getTabData().character;
                    const somethingData = [{ id: "something", name: language.something[lang] }];
                    characterData = [...somethingData, ...characterData];
                    select.selectAll("option")
                        .data(characterData)
                        .enter()
                        .append("option")
                        .classed("text", true)
                        .attr("value", d => d.id)
                        .text(d => d.name);
                    // 選択肢を「状態」の情報に設定
                    select.select(`option[value='${splitData.condition[6]}']`)
                        .property("selected", true);
                    break;
                case "probability":
                    div.select("span[name='probability_number']")
                        .select("input[type='number']")
                        .property("value", splitData.condition[1]);
                    break;
                case "alone": break;
                case "notice":
                    div.select(`span[name='notice']`)
                        .select("input[type='text']")
                        .property("value", splitData.condition[1]);
                    break;
                default: console.log("error:splitData.condition[0]"); break;
            }
            // 選択肢に対応する詳細を表示
            conditionDetail.selectAll(":scope > *")
                .style("display", "none");
            conditionDetail.select(`div[value=${splitData.condition[0]}]`)
                .style("display", "block");

            // 「遷移」のダイアログを表示
            this.transDialog.style("display", "flex");
        } else {
            console.log("error:this.target.constructor.name");
        }
        // ダイアログを表示
        this.root.style("display", "block");
    }

    // ダイアログを非表示にするメソッド
    hidden() {
        // ダイアログを非表示
        this.root.style("display", "none");
        this.root.select("div[name='state_dialog']").style("display", "none");
        this.root.select("div[name='trans_dialog']").style("display", "none");

        // ドロワーのコンテンツを更新
        drawerManager.updateContent();
    }
}
