class Modal {
    constructor(parent) {
        this.parent = parent;
        this.createElement();
    }

    createElement() {
        this.element = this.parent.append("div");
        this.svg = this.element.append("svg");
        this.g = this.svg.append("g");
    }

    show() {
        this.parent.classed("show", true);
    }

    hide() {
        this.parent.classed("show", false);
    }

    abledPointer() {
        this.parent.classed("no-pointer", false);
    }

    disabledPointer() {
        this.parent.classed("no-pointer", true);
    }
}