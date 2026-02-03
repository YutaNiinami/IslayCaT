// 画像データマネージャー
class ImageManager {
    constructor(parentElement) {
        this.imageData = [];
        this.parentElement = parentElement;
    }

    async init() {
        await this.loadPresetImagesAsBase64();
        this.dialog = new ImageSelectionDialog(this);
    }

    // 画像をbase64形式に変換するメソッド
    async loadPresetImagesAsBase64() {
        const maxIndex = 235;

        const promises = Array.from({ length: maxIndex + 1 }, async (_, i) => {
            const response = await fetch(`./preset_img/${i}.png`);
            const blob = await response.blob();

            return await new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        });

        const images = await Promise.all(promises);
        this.imageData.push(...images);

        console.log("プリセット画像のデータ変換が完了しました。");
    }

    getImageData(id) {
        return this.imageData[id];
    }

    dialogShow() { this.dialog.show(); }

}

class ImageSelectionDialog {
    constructor(parent) {
        this.parent = parent;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.id = "image_selection_dialog";
        this.parent.parentElement.appendChild(this.element);
        this.element.addEventListener("click", () => { this.hide(); });

        const images = document.createElement("div");
        images.setAttribute("name", "images");
        this.element.appendChild(images);

        this.imgs = [];
        this.parent.imageData.forEach((image, i) => {
            const imgBox = document.createElement("div");
            imgBox.id = `preset_img_${i}`;
            imgBox.classList.add("img_box");
            imgBox.dataset.id = i;
            images.appendChild(imgBox);
            const img = document.createElement("img");
            img.src = image;
            imgBox.appendChild(img);
            this.imgs.push(imgBox);
        });
        this.setEvent();
    }

    setEvent() {
        this.imgs.forEach(img => {
            img.addEventListener("click", () => {
                dialogManager.target.data.img = this.parent.imageData[img.dataset.id];
                dialogManager.target.update();
                dialogManager.updateDialog();
            });
        });
    }

    show() {
        this.element.classList.add("show");
    }

    hide() {
        this.element.classList.remove("show");
    }
}