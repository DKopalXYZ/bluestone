class CAPI {
    randint(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    rand(min, max) {
        return Math.random() * (max - min + 1) + min;
    }

    choice(array) {
        return array[this.randint(0, array.length - 1)];
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.randint(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    chance(chance) {
        return Math.random() <= chance;
    }

    pchance(chance) {
        return (Math.random() * 100) <= chance;
    }

    randchance() {
        return this.chance(Math.random());
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

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    repeat(times, func) {
        for (let i = 0; i < times; i++) {
            func(i)
        }
    }

    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    drawPixel(x,y,color) {
        if (!Empty(x,y)) {
            const old = ctx.fillStyle
            ctx.fillStyle = color
            ctx.fillRect(x*10,y*10,10,10)
            ctx.fillStyle = old
        }
    }

    drawText(text,x,y,color,fontsize) {
        if (!Empty(x,y)) {
            ctx.font = `${fontsize}px ps2p`
            const old = ctx.fillStyle
            ctx.fillStyle = color
            ctx.fillText(text,x*10,y*10)
            ctx.fillStyle = old
        }
    }
}
