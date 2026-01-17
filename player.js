/**
* @fileoverview 「player」に関する関数群
* @author Goto Yuto(Namai Takumi)
*/

/**
* アニメーションの更新速度(ms)の最大値
* @const {number}
*/
const MAX_SPEED = 10;
/**
* アニメーションの更新速度(ms)の最小値
* @const {number}
*/
const MIN_SPEED = 5000;
/**
* アニメーション中に表示できる要素の最大数
* @const {number}
*/
const MAX_OBJECTS = 10000;
/**
* z-indexの基本値。z-indexが指定されなかった時はこの値にする
* @const {number}
*/
const INITIAL_Z_INDEX = 100;

// 時間計測用
const log_max = 100;// ログの出力数
let clock_count = 0;
let collision_count = 0;// collision関数呼び出し回数
let collision_L_count = 0;

// 要素数
let instance_length = 1;// インスタンス数(初期値)

// マイクロ秒計測用
let ActStartTime //action_phase の実行時間計測用
let ActEndTime// 終了時間 
let TransStartTime // 開始時間(transition_phase の実行時間計測用)
let TransEndTime // 終了時間
let RunTime

// 各種設定
if (window.opener) {
	// console.log("player: window mode");
	// data = window.opener.IslayTab.save_load_dialog.make_data();
	data = window.opener.convertedData; // 親windowから状態遷移図のデータを取得
	window.onresize = function () {// windowの大きさ
		window.resizeBy(Number(data["system"]["width"]) - window.innerWidth, Number(data["system"]["height"]) - window.innerHeight);
	}
	var event = document.createEvent("HTMLEvents");// イベント作成
	event.initEvent("resize", false, true);
	window.dispatchEvent(event);// windowの大きさを設定する為にresizeイベントを発火させる

	// window.onblur = function(){window.close();};// ウィンドウのフォーカスが外れたら閉じる。
} else {
	// data = window.parent.IslayTab.save_load_dialog.make_data();
	data = window.parent.convertedData; // 親windowから状態遷移図のデータを取得
}

var key_flag = new Array();// 押されたキーはここに記録し、離されたら消す
document.onkeydown = function (e) {
	if (e.keyCode == 27) {// esc
		try { window.parent.IslayTab.dialog.close(); } catch (e) { };
	}
	key_flag[e.keyCode] = true;
}
document.onkeyup = function (e) {
	key_flag[e.keyCode] = false;
}

var notice_list = new Array();// お知らせはここに詰め込まれていく。
// 各種設定ここまで

// 初期化?
if (data) {
	/*var num;
	alert(data["system"]["background_color"]);
	switch(data["system"]["background_color"]){
	case "white" : num = "#ffffff";
		break;
	case "red" : num = "#ff0000";
		break;
	case "green" : num = "#008000";
		break;
	case "blue" : num = "#0000ff";
		break;
	case "yellow" : num = "#ffff00";
		break;
	case "gray" : num = "#808080";
		break;
	}
	document.body.style.backgroundColor = num;
	alert(document.body.style.backgroundColor);
	*/

	if (data["system"]["background_color"] == "white") {// 初期設定
		document.body.style.backgroundColor = "#ffffff";// 背景設定
	}
	document.body.style.backgroundColor = data["system"]["background_color"];// 16進数表記で背景色を設定
	// console.log("background_color:" + data["system"]["background_color"]);// 背景色情報を表示

	spawn_group(0);// mainグループを生成
	var now_speed = Number(data["system"]["speed"]);// 1クロック当たりの描画速度指定
	if (now_speed < MAX_SPEED || MIN_SPEED < now_speed) {// アニメーション速度が不正な値だった場合
		alert("error:at setting speed");
		window.close();
	}
	// 指定時間ごとに割り込み、描画更新を行う
	var timer = setInterval(update, now_speed);
}

/** 1フレームにおける処理。これを一回実行すると1フレーム分進む */
/** action 			1フレームの動作(生成された子要素も動く)
 * -> transition 	遷移条件の判定、実行
 * -> end 			壁からはみ出たインスタンスを内側に戻す
 *   を実行 
 * */
function update() {
	// console.log("phase start.");
	/* 時間計測部
	// 計測結果
	RunTime = TransEndTime - TransStartTime; // 状態遷移の詳細な経過時間
	//RunTime = ActEndTime - ActStartTime; // 描画の詳細な経過時間

	console.log

	// コンソールに実行時間、collision関数の呼び出し数(描画抜き)
	if (clock_count != 0 && clock_count < log_max) {
		console.log(`${("000" + (clock_count)).slice(-3)}:  1 frame tooks ${RunTime} milliseconds.\n      instance num: ${instance_length}\n    collision_call: ${collision_count}\n    Loop count    : ${collision_L_count}`,);
	} else if (clock_count == log_max) {
		console.log('It unconclde byouga.\n Stop Writing to the console.\n    collision call: ' + collision_count + '\n    Loop count    : ' + collision_L_count);
	}
	clock_count++;
	ここまで時間計測用*/
	action_phase();// 動作実行
	transition_phase();// 繊維実行
	end_phase();// 座標微調整(壁越えしたインスタンスを内側に戻す)
	console.log(" ");

}

/** 全ての要素のアクションを処理する */
/** 条件に従い、座標変更のみを実行 */
function action_phase() {
	//action phase の実行時間計測(開始)
	//ActStartTime = performance.now() // 詳細なミリ秒数(衝突判定Only)

	// console.log("start action_phase");
	/** @type {window.element}  */
	var states = document.getElementsByTagName("img");
	var delete_list = Array();// 「きえる」のアクションを行った状態をここに入れていく。そして、全ての要素のアクションを終えてから消す。

	for (var s = 0; s < states.length; s++) {// 要素の数だけ実施
		var id = states[s].getAttribute("maru_id");// 注目キャラインスタンスの状態取得
		states[s].setAttribute("loop_count", Number(states[s].getAttribute("loop_count")) + 1);

		// アクション1を行う
		var action1 = data["states"][id]["action1"].split(':');
		switch (action1[0]) {
			case "none": break;
			case "move":
				states[s].style.left = (parseInt(states[s].style.left) + Number(action1[1])) + "px";
				states[s].style.top = (parseInt(states[s].style.top) + Number(action1[2])) + "px";
				break;
			case "hurahuramove":
				var rx = Math.floor(Math.random() * 20 - 10);
				var ry = Math.floor(Math.random() * 20 - 10);
				states[s].style.left = (parseInt(states[s].style.left) + Number(action1[1])) + rx + "px";
				states[s].style.top = (parseInt(states[s].style.top) + Number(action1[2])) + ry + "px";
				break;
			case "jump":
				states[s].style.left = Number(action1[1]) + "px";
				states[s].style.top = Number(action1[2]) + "px";
				break;
			case "randomjump":
				var min_y = (action1[1] == 0) ? parseInt(states[s].style.top) : 0;
				var max_y = (action1[2] == 0) ? parseInt(states[s].style.top) : data["system"]["height"] - states[s].clientHeight;
				var min_x = (action1[3] == 0) ? parseInt(states[s].style.left) : 0;
				var max_x = (action1[4] == 0) ? parseInt(states[s].style.left) : data["system"]["width"] - states[s].clientWidth;
				states[s].style.left = Math.floor((Math.random() * ((max_x + 1) - min_x)) + min_x) + "px";
				states[s].style.top = Math.floor((Math.random() * ((max_y + 1) - min_y)) + min_y) + "px";
				break;
			case "follow":
				if (action1[1] == "parent") {// ついていく対象が親の場合
					var p = states[s].getAttribute("parent_id");
					if (p != "none" && p != "dead") {// 親が存在していれば
						p = document.getElementById(p);
					} else {
						p = null;
					}
				} else {// ついていく対象が特定のキャラクタの場合
					var p = data["character_tabs"][action1[1]]["states"];
					for (var q = 0; ; q++) {
						if (q == states.length) {// 全要素の中についていく対象がなければ
							p = null;
							break;
						}
						if (p.indexOf(states[q].getAttribute("id").substr('maru_'.length))) {
							p = states[q];
							break;
						}
					}
				}
				if (p != null) {
					var mx = (p.clientWidth / 2 + parseInt(p.style.left)) - (states[s].clientWidth / 2 + parseInt(states[s].style.left));
					var my = (p.clientHeight / 2 + parseInt(p.style.top)) - (states[s].clientHeight / 2 + parseInt(states[s].style.top));
					mx *= 0.1;
					my *= 0.1;
					var alice = p.getBoundingClientRect();// DOMRectオブジェが返る。
					var bob = states[s].getBoundingClientRect();// 対象が収まる最小の長方形
					if (alice.left > bob.right + mx ||
						alice.right < bob.left + mx ||
						alice.top > bob.bottom + my ||
						alice.bottom < bob.top + my) {// ぶつからないなら近づく
						states[s].style.left = parseInt(states[s].style.left) + mx + "px";
						states[s].style.top = parseInt(states[s].style.top) + my + "px";
					}
				}
				break;
		}// END Of switch(action1[0])

		// アクション2を行う
		var action2 = data["states"][id]["action2"].split(':');
		switch (action2[0]) {
			case "none": break;
			case "makecharacter":
				spawn_state(action2[2], states[s]);
				break;
			case "makegroup":
				spawn_group(action2[1], states[s]);
				break;
			case "notice":
				notice_list.push(action2[1]);
				break;
			case "message":
				if (window.opener) {
					document.title = action2[1];
				} else {
					window.parent.alert(action2[1]);
				}
				break;
			case "changespeed":
				switch (action2[1]) {
					case "up": now_speed -= Number(action2[2]); break;
					case "down": now_speed += Number(action2[2]); break;
					case "abs": now_speed = Number(action2[2]); break;
				}
				now_speed = now_speed > MAX_SPEED ? MAX_SPEED : now_speed;
				now_speed = now_speed < MIN_SPEED ? MIN_SPEED : now_speed;
				clearInterval(timer);
				timer = setInterval(update, now_speed);
				break;
			case "change":
				state_transition(states[s], action2[2]);
				break;
			case "deleted":
				delete_list.push(states[s]);
				break;
			case "exit":
				// window.close(); window.parent.IslayTab.dialog.close();
				window.parent.play.stopButton.dispatchEvent("click");
				break;
		}// END OF switch(action2[0])

		// アクション2で消されてなければ音楽の処理を行う
		if (action2[0] != "deleted")
			se_manager.start(states[s], data["states"][id]["se"]);

		// 注目中の要素の管理番号(添え字)、座標の表示
		// console.log("states[ " + s + " ]\n    left: " + states[s].style.left + "\n      top: " + states[s].style.top);
		
	}// END OF for(var s = 0; s < states.length; s++)

	// アクション2で「消える」が選ばれていた要素を削除
	for (var dels = 0; dels < delete_list.length; dels++) {// 消える要素の数だけ実施
		// 子供に親が死んだ事を伝える
		var childlen = document.querySelectorAll("img[parent_id='" + delete_list[dels].id + "']");
		for (var c = 0; c < childlen.length; c++) {
			childlen[c].setAttribute("parent_id", "dead");
		}

		if (delete_list[dels].dataset.se_charcter_loop)
			se_manager.end(delete_list[dels].dataset.se_charcter_loop);
		delete_list[dels].parentNode.removeChild(delete_list[dels]);
	}
	
	// console.log("finished action_phase");
	//action_phase の実行時間計測部(計測終了)
	//ActEndTime = performance.now() // 詳細なミリ秒数
	
	return 0;
}

/** 全ての要素の遷移条件を判定して適宜遷移させる。 */
function transition_phase() {
	//transition_phase の実行時間計測(開始)
	//TransStartTime = performance.now() // 詳細なミリ秒数
	// console.log("start transition_phase");
	
	// インスタンス情報取得
	var states = document.getElementsByTagName("img");

	// sweep and prune 開始
	let array = [];

	// sweepand prune 用配列作成
	makeArray(array);

	///////////////////////////////
	// ソート
	array = merge_sort(array);

	// ソート後の array 確認
	/*
	for (let i = 0; i < array.length; i++) {
		// console.log("array["+i+"][0] : "+array[i][0]);
		console.log("array[" + i + "][2]~[3] : " + array[i][2] + " ~ " + array[i][3] + " (instance array[" + i + "][0] : " + array[i][0] + ", キャラクタ" + array[i][1] + " )");
		console.log("array[" + i + "][4]~[5] : " + array[i][4] + " ~ " + array[i][5]);
		// console.log("array[" + i + "] :"+array[i]);
	}*/
	// console.log("");


	// 各キャラインスタンスがどことぶつかっているかを表す配列
	let overlaps = sweep_and_prune(array);
	// overlaps[] の確認
	/*
	for (i = 0; i < overlaps.length; i++) {
		// console.log("array["+i+"][0] : "+arrayX[i][0]);
		// console.log("overlaps["+i+"] : " + overlaps[i]);
		console.log("overlaps[" + i + "] : ");
		overlaps[i].forEach(function (value) { console.log(value); })
	}*/

	// 遷移開始
	// 要素の数だけ実施
	for (var s = 0; s < states.length; s++) {
		var arrows = data["states"][states[s].getAttribute("maru_id")]["arrows"];
		var flag = false;

		// 矢印の数だけ実施
		for (var t = 0; t < Object.keys(arrows).length; t++) {
			var condition = arrows[t]["condition"].split(":");

			switch_condition(condition);

			// 遷移条件に1, 2 があった場合 (条件と、付随する情報がある場合)
			if (arrows[t]["condition1"] !== null) {
				var condition1 = arrows[t]["condition1"].split(":");// 増やした sava_load_dialogで取得
				switch_condition(condition1);
			}
			if (arrows[t]["condition2"] !== null) {
				var condition2 = arrows[t]["condition2"].split(":");// 増やした
				switch_condition(condition2);
			}


			function switch_condition(condition) {
				switch (condition[0]) {
					case "none": flag = arrows[t]["to_maru"]; break;
					case "loop":
						if (Number(condition[1]) < states[s].getAttribute("loop_count"))
							flag = true;
						break;
					case "clicked":
						if ((condition[1] == "1" && states[s].getAttribute("click_flag").indexOf("0") != -1) ||
							(condition[2] == "1" && states[s].getAttribute("click_flag").indexOf("1") != -1) ||
							(condition[3] == "1" && states[s].getAttribute("click_flag").indexOf("2") != -1)) {
							flag = true;
						}
						break;
					case "touched":
						if (states[s].getAttribute("touch_flag").indexOf("1") != -1) {
							flag = true;
						}
						break;
					case "bump":
						var c = collision(states[s]);
						// console.log("condition [6] : " + condition[6] + ", " + typeof (condition[6]) + "\n s : " + s + " (typeof(s) : " + typeof (s) + " )");
						if ((condition[1] == "1" && c[0]) ||// 壁にぶつかった時
							(condition[2] == "1" && c[1]) ||
							(condition[3] == "1" && c[2]) ||
							(condition[4] == "1" && c[3])) {
							flag = true;
							// console.log(`bump ${s} vs wall`);
						} else if (condition[5] == "1") {// キャラクタにぶつかった時
							if (condition[6] == "something") {// 条件が「なにか」の場合
								// overlaps[s]に (-1, -1) 以外が存在する = 衝突している 場合
								if (overlaps[s].length > 1) {
									flag = true;
									break;
								}

							} else {// 特定のキャラとの衝突が条件の場合
								// overlaps[s] から、指定のキャラクタid(condition[6])を持つ要素を探す
								if (1 == collided(overlaps, s, parseInt(condition[6]))) {
									flag = true;
									break;
								}
								
							}// END OF if (condition[6] == "something")
						}// END OF  if (condition[5] == "1")
						break;
					case "random":
						if (Math.floor(Math.random() * 100) < Number(condition[1]))
							flag = true;
						break;
					case "keydown":
						if (key_flag[condition[1]])
							flag = true;
						break;
					case "alone":
						if (states[s].getAttribute("parent_id") == "dead")
							flag = true;
						break;
					case "notice":
						if (notice_list.indexOf(condition[1]) != -1)
							flag = true;
						break;
				}// end of switch
			}// end of function

			// 衝突していたら、flagの中身を次のじょうたいのidに書き換える(変数ケチった？)
			if (flag === true) {
				flag = arrows[t]["to_maru"];
				break;
			}
		}// end of for(var t = 0; t < Object.keys(arrows).length; t++){
		if (flag !== false) {
			state_transition(states[s], flag);// 引数: 状態変化するインスタンス, 次のじょうたい(id)
		}
		states[s].setAttribute("click_flag", "");// クリックフラグを消す。
		states[s].setAttribute("touch_flag", "");// タッチフラグを消す。
	}// end of for
	TransEndTime = performance.now() // 詳細なミリ秒数
	return 0;
}// end of transition

/** ターン終了時処理。壁からはみ出てる要素を内側に戻すとか */
function end_phase() {
	var states = document.getElementsByTagName("img");
	instance_length = states.length;

	for (var s = 0; s < states.length; s++) {// 壁の通り抜けが禁止ならば、全てのオブジェクトを壁の内側に直す。
		if (!data["system"]["wall"]) {
			var c = collision(states[s]);
			if (c[0]) states[s].style.top = "0px";
			if (c[1]) {
				var d = data["system"]["height"] - states[s].clientHeight;
				states[s].style.top = (d < 0 ? 0 : d) + "px";
			}
			if (c[2]) states[s].style.left = "0px";
			if (c[3]) {
				var d = data["system"]["width"] - states[s].clientWidth;
				states[s].style.left = (d < 0 ? 0 : d) + "px";
			}
		}
	}
	notice_list = new Array();// お知らせリストを消去
}

/**
* グループを生成
* @param {number} group_id 生成したいグループのID
* @param {element} parent_element 「親」がいる場合、その親要素を
*/
function spawn_group(group_id, parent_element) {
	for (var s = 0; s < Object.keys(data["group_tabs"][group_id]["states"]).length; s++) {
		spawn_state(data["group_tabs"][group_id]["states"][s][0], parent_element, data["group_tabs"][group_id]["states"][s][1]);
	}
}

/**
* 状態を生成
* @param {number} id 生成したい状態のID
* @param {element} parent_element 「親」がいる場合、その親要素を
* @param {number} z_index 生成する状態z-indexを指定できる
*/
function spawn_state(id, parent_element, z_index) {// 状態を生成
	if (document.getElementsByTagName("img").length > MAX_OBJECTS) {
		alert("too many objects");
		spawn_state = function () { };
		return;
	}
	var count = 0;
	while (count < 10000) {// 10000:万一予防な
		if (!document.getElementById(count)) break;
		count++;
	}
	var state = data["states"][id];
	// console.log(state);
	var e = document.createElement("img");
	e.setAttribute("src", data["imgs"][state["img"]]);
	e.setAttribute("maru_id", id);// このオブジェクトがどの状態stateのものかを示す。
	e.setAttribute("id", count);// このオブジェクトを一意に識別するためのid
	e.setAttribute("style", "left:0px;top:0px;z-index:" + (z_index || INITIAL_Z_INDEX));// 初期位置は左上
	e.setAttribute("click_flag", "");// 左中央右クリックされたらそれぞれ0,1,2の文字が追加される。
	e.setAttribute("onmousedown", "this.setAttribute('click_flag', this.getAttribute('click_flag') + event.button);");
	e.setAttribute("touch_flag", "");// タッチされたら追加される。
	e.setAttribute("ontouchend", "this.setAttribute('touch_flag', this.getAttribute('touch_flag') + event.changedTouches.length);");
	/*e.ontouchend = function(){
		// console.log(event);
		e.setAttribute("event", event);
		console.log(event.changedTouches.length);
		console.log(`touchend:${event.targetTouches.length}`);
	};*/
	e.setAttribute("loop_count", 0);// 「同じ状態を繰り返した」用カウンタ
	e.setAttribute("draggable", false);
	e.setAttribute("ondragstart", 'return false;');
	if (typeof parent_element === "undefined") {
		e.setAttribute("parent_id", "none");// これは親のidかnoneかdeadのいずれか
	} else {
		e.style.left = parent_element.style.left;
		e.style.top = parent_element.style.top;
		e.setAttribute("parent_id", parent_element.id);
	}
	e.setAttribute("charcter", state["charcter"]);// 追加、自身の「キャラクタ」を指すid (0,1,2,...)
	document.body.appendChild(e);
}

/**
* 状態を次へと遷移させる。
* @param {element} e 遷移元
* @param {number} id 遷移先のstateのid
*/
function state_transition(e, id) {
	e.setAttribute("src", data["imgs"][data["states"][id]["img"]]);
	e.setAttribute("maru_id", id);
	e.setAttribute("click_flag", "");
	e.setAttribute("touch_flag", "");
	e.setAttribute("loop_count", 0);
	delete e.dataset.se_once;
	if (e.dataset.se_state_loop) {
		se_manager.end(e.dataset.se_state_loop);
		delete e.dataset.se_state_loop;
	}
}

/**
* 当たり判定。
* 第一引数と第二引数に指定された要素がぶつかっているかどうかを判定する。第二引数が省略された時は第一引数に指定された要素と壁との衝突を判定する
* @param {element} alice 当たり判定を調べたい要素
* @param {element} bob 当たり判定を調べたい要素。省略可能。省略時には第一引数と壁の当たり判定になる。
* @return {boolean | Array.<boolean>} 第一引数と第二引数に指定された要素がぶつかっていればtrue。壁との当たり判定時は、大きさ4の配列として返され上下左右の壁に当たっていた場合それぞれ配列の0,1,2,3にtrueが入っている。当たっていなかったらfalseが入る
* bump で判定要素数＋要素数×衝突先の数 だけ実行
* end_phase で　要素数分実行
* ⇒ n+n*(n-1)+n = n(n+2) 回実行
*/
function collision(alice, bob) {
	collision_count++;// collision関数呼び出し回数
	if (typeof bob === "undefined") {// 壁との当たり判定
		var c = Array();
		c[0] = (parseInt(alice.style.top) < 0);
		c[1] = (parseInt(alice.style.top) + alice.clientHeight > data["system"]["height"]);
		c[2] = (parseInt(alice.style.left) < 0);
		c[3] = (parseInt(alice.style.left) + alice.clientWidth > data["system"]["width"]);
		return c;
	} else {// 引数２つの当たり判定
		alice = alice.getBoundingClientRect();
		bob = bob.getBoundingClientRect();
		return !(alice.left > bob.right ||
			alice.right < bob.left ||
			alice.top > bob.bottom ||
			alice.bottom < bob.top);
	}
}

/** 音楽に関する関数群 */
var se_manager = new function () {
	/**
	* 現在流れている音楽が入っている。
	* @private {Array}
	*/
	this.se_list = Array();

	/**
	* 指定された要素に関して、音楽を流すかどうかの処理をする
	* @param {element} target 音楽を流す張本人
	* @param {string} se 音楽の流し方のタイプ
	*/
	this.start = function (target, se) {
		se = se.split(':');
		if (se[0] == "none") return;

		switch (se[1]) {
			case "once":
				if (!target.dataset.se_once) {
					target.dataset.se_once = this.play(se[0], se[3], "once");
				}
				break;
			case "state_loop":
				if (!target.dataset.se_state_loop) {
					target.dataset.se_state_loop = this.play(se[0], se[3], "loop");
				}
				break;
			case "charcter_loop":
				if (!target.dataset.se_charcter_loop) {
					target.dataset.se_charcter_loop = this.play(se[0], se[3], "loop");
				}
				break;
		}
	}

	/**
	* 音楽を再生する
	* @param {number} se_id 再生したい音楽のID
	* @param {number} volume 音量
	* @param {string} time 何回再生するか。今現在は"once"か"loop"の二択しかないからどっちかを選んで
	* @return {number} 再生ID。音楽をとめるときに使う
	*/
	this.play = function (se_id, volume, time) {
		var a = document.createElement("audio");
		a.src = data["se_list"][se_id];
		a.volume = volume;
		var play_id = this.se_list.push(a) - 1;
		if (time == "once") {
			a.onended = function () { se_manager.end(play_id); };
		} else if (time == "loop") {
			a.loop = true;
		}
		a.play();
		return play_id;
	}

	/**
	* 音楽を止める
	* @param {number} 止めたい音楽の再生ID
	*/
	this.end = function (play_id) {
		this.se_list[play_id].pause();
		this.se_list[play_id] = null;
	}
}

/**
 * 端点座標群を表す配列を作成する
 * arrays = {(インスタンスid, キャラid, min_x, max_x, min_y, max_y), ...}
 * @param {Array} array 	作成する配列
 */
function makeArray(array) {
	// console.log("start makeArray");
	const states = document.getElementsByTagName("img");

	// console.log("states.length : " + states.length);

	for (let i = 0; i < states.length; i++) {
		// console.log("states.length : " + states.length + "\ni : " + i);
		// console.log(i + 1 + " / " + states.length * 2 + " 周目");
		array[i] = [];

		// インスタンス識別(整数固定)
		array[i][0] = Math.trunc(i);
		// キャラクタid を格納 
		array[i][1] = states[Math.trunc(i)].getAttribute("charcter");

		// 実データ(座標)
		// 奇数(左端, 上端)の場合と、偶数(右端, 下端)の場合で分ける
		array[i][2] = (parseInt(states[Math.trunc(i)].style.left));
		array[i][3] = (parseInt(states[Math.trunc(i)].style.left) + states[Math.trunc(i)].clientWidth);

		array[i][4] = (parseInt(states[Math.trunc(i)].style.top));
		array[i][5] = (parseInt(states[Math.trunc(i)].style.top) + states[Math.trunc(i)].clientHeight);
	}// end of for()
}

/**
 * マージソート, x_min について昇順ソート
 * @param {Array} array ソート配列, {(インスタンスid, キャラid, min_x, max_x, min_y, max_y), ...}
 * @return {Array} 受け取った配列のソート結果
 */
function merge_sort(array) {
	if (array.length < 2) {
		return array;
	}

	const mid = Math.trunc(array.length/2);
	const left = array.slice(0, mid);
	const right = array.slice(mid);

	return merge(merge_sort(left), merge_sort(right));
}

/**
 * マージ部
 * @param {Array} left 
 * @param {Array} right
 * @return {Array} left, right を合わせたソート済み配列
 */
function merge(left, right) {
	const sorted = [];

	while (left.length && right.length) {
		if (left[0][2] <= right[0][2]) {
			sorted.push(left.shift());
		} else {
			sorted.push(right.shift());
		}
	}

	return sorted.concat(left.slice()).concat(right.slice());
}

/**
 * バブルソート(ソート別 実行時間比較用)
 * @param {Array} array 端点座標群 {(インスタンスid, キャラid, min_x, max_x, min_y, max_y), ...}
/*
function buble_sort(array){
	for (let i = 0; i < array.length; i++) {
		for (let j = array.length - 1; j > i; j--) {
		  // 隣り合う要素を比較し、大小を入れ替える
		  if (array[j][2] < array[j - 1][2]) {
			let tmp = array[j];
			array[j] = array[j - 1];
			array[j - 1] = tmp;
		  }
		}
	  }
	  return array;
}
*/

/**
 * 渡された array に対して選択ソートを実施する。
 * @param {Array} array sweep and prune 用に用意した配列(arrayX or arrayY )
 */
function selection_sort(array) {
	let tmp, min;
	const len = array.length;

	// console.log("length : " + len);

	// console.log("selection sort start");
	for (let i = 0; i < len - 1; i++) {
		min = i; // 配列の先頭を最小値の要素
		for (let j = i + 1; j < len; j++) {
			// console.log("compareing " + array[j][1] + " < " + array[min][1]);
			if (array[j][2] < array[min][2]) { // 暫定の最小値以下なら、最小値を更新
				min = j; // 最小値を更新
				// console.log("min update...");
			}
		} // min は最小値の要素

		// 入れ替え
		tmp = array[i];
		array[i] = array[min];
		array[min] = tmp;
		
	}
}

/**
 * 渡された配列に従って、2次元 sweep and prune を行う
 * @param {Array} array インスタンスの端点座標群(X軸方向にソート済み)
 * array[i] = {id, char_id, x_min, x_max, y_min, y_max}
 * @returns 衝突の疑いがある配列群を返す
 */
function sweep_and_prune(array) {
	let bump = [];// 返り値, 念のためoverlaps と名称をずらしている
	let i, j;
	let col_n;

	// 結果を格納する配列を作成
	for (i = 0; i < array.length; i++) {
		bump[i] = [];
	}

	// const stack = new Stack();
	let active_list = [];
	// console.log("l-970 has been running.");

	for (i = 0; i < array.length; i++) {
		for (j = 0; j < active_list.length; j++) {
			// 以降、明らかに衝突する可能性がなければ j番目を active_list から消す
			if (array[i][2] > active_list[j][3]) {
				// console.log("    " + array[i][2] + " > " + active_list[j][3] + " (array["+i+"][2] vs active_list["+j+"][3])");
				// console.log("Deleting array[" + j + "] from active_list");
				active_list.splice(j, 1);
				j--;
			} else {
				// console.log("    " + array[i][2] + " <= " + active_list[j][3]  + " (array["+i+"][2] vs active_list["+j+"][3])");
				// console.log("    NOT{ (" + array[i][4] + " >= " + active_list[j][5] + ") OR (" + active_list[j][4] + " >= " + array[i][5] + ")}   ("+array[i][0]+" vs "+active_list[j][0]+")");
				// if (0 == ((array[i][4] >= array[j][5]) || (array[j][4] >= array[i][5]))) {
				if ((array[i][4] >= active_list[j][5]) || (active_list[j][4] >= array[i][5])) {
					continue;
				}
					// console.log("push  overlaps[" + array[i][0] + "] <- [" + active_list[j][0] + ", " + active_list[j][1] + "]");
					bump[array[i][0]].push([active_list[j][0], active_list[j][1]]);
					// console.log("push  overlaps[" + active_list[j][0] + "] <- [" + array[i][0] + ", " + array[i][1] + "]");
					bump[active_list[j][0]].push([array[i][0], array[i][1]]);
			}
		}

		// active_listを更新し、次ループへ
		active_list.push(array[i]);
	}

	// 終端の証として、(-1, -1) を追加
	for (col_n=0;  col_n< bump.length; col_n++) {
		bump[col_n].push([-1, -1]);
	}

	return bump;
}

/**
 * 新規衝突判定関数, 衝突ならば １, 非衝突ならば 0 を返す
 * @param {Array} overlaps_list overlaps[i] 
 * @param {number} self_ins_id 判定対象となるキャラクタインスタンスのid 
 * @param {number} Hit_char 衝突しているキャラ番号、"something" の場合は -1
 */
function collided(overlaps_list, self_ins_id, Hit_char) {
	// console.log("Hit_char : "+ Hit_char +" \noverlaps_list[self_ins_id][0] : "+overlaps_list[self_ins_id][0])

	if (Hit_char == -1) {// "something" の場合
		if (overlaps_list[self_ins_id].length > 1) {// 最低長１を超えてれば衝突　<-(-1, -1)が終端に挿入されているため
			return 1;
		}
	} else {// 指定キャラとの衝突の場合
		// 終端は (-1, -1) 、この目印まで回す
		let i = 0;
		while (overlaps_list[self_ins_id][i][0] != -1) {
			if (overlaps_list[self_ins_id][i][1] == Hit_char) {
				// console.log("Hit states[" + self_ins_id + "] with character" + Hit_char);
				return 1;
			}
			i++;
		}
	}
	return 0;
}