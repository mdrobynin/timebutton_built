class PlayerState {
    constructor (id, name) {
        this.id = id;
        this.name = name;
        this.buttonPressed = false;
        this.order = null;
    }
}

module.exports = PlayerState;