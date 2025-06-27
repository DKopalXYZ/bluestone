class BSAPI {
    randint(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    rand(min, max) {
        return Math.random() * (max - min + 1) + min
    }

    choice(array) {
        return array[this.randint(0, array.length - 1)]
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.randint(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    chance(chance) {
        return Math.random() <= chance
    }

    pchance(chance) {
        return (Math.random() * 100) <= chance
    }

    randchance() {
        return this.chance(Math.random())
    }

    randstr(length = 8, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(this.randint(0, chars.length - 1));
        }
        return result;
    }

    randclr() {
        const hex = () => this.randint(0, 255).toString(16).padStart(2, '0');
        return `#${hex()}${hex()}${hex()}`;
    }


}