document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
}, { passive: false });

const headerManager = new HeaderManager(d3.select("#header"));
const tabManager = new TabManager(d3.select("#tabs"));
const canvasManager = new CanvasManager(d3.select("#canvases"));
const modal = new Modal(d3.select("#modal"));
window.play = new Play(document.body);
const svgManager = new SvgManager();
const dialogManager = new DialogManager(d3.select("#dialog"));
const drawerManager = new DrawerManager(d3.select("#drawer"));

// 初期化
tabManager.init();
dialogManager.hidden();
