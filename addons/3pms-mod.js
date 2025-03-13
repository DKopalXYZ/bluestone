// HEEEEEEEEEEEEEEEEEEEEEEEEEEEEEELP HELP MEEEEEEEE HEEEEEEEEEEEEEEEEEEEEEEEEEEELP
// mod by 3pm (github: 3pm-on-github)

const threepmsmodversion = "0.0.3"
const threepmsmodsubversion = "0.0.3"
const threepmsmodversionname = "The logic update"
const threepmsmodsubversionname = "The logic update"

console.log("3pms mod exists")
console.log("v"+threepmsmodversion+": "+threepmsmodversionname)
console.log("sv"+threepmsmodsubversion+": "+threepmsmodsubversionname)

// note: red dust doesnt have any color change. why? im lazy rn
bluestones.red_dust = {
    color: "#800000",
    description: "Like your everyday's wire but red.",
    ignore: ["green_dust", "dust"]
}
bluestones.green_dust.ignore.push("red_dust")
bluestones.dust.ignore.push("red_dust")

bluestones.not_gate = {
    color: "#DFAC",
    description: "Your average NOT gate. (dust: input, green_dust: output)",
    placed: (pixel) => {
        pixel.guh = false;
    },
    behavior: (pixel) => {
        let ns = pixelNeighbors(pixel.x, pixel.y);
        let inputPowered = false;
        for (let n of ns) {
            let neighbor = game[n[0]][n[1]];
            if (neighbor?.type === "dust" && neighbor.power > 0) {
                inputPowered = true;
                break;
            }
        }
        pixel.guh = !inputPowered;
        for (let n of ns) {
            let neighbor = game[n[0]][n[1]];
            if (neighbor?.type === "green_dust") {
                neighbor.power = pixel.guh ? 30 : 0;
                pixel.power = 0
            }
        }
    },
    ignorePoweredProperty: true
};

bluestones.or_gate = {
    color: "#0DFAC0",
    description: "Your average OR gate. (dust/red_dust: inputs, green_dust: output)",
    placed: (pixel) => {
        pixel.guh = false;
    },
    behavior: (pixel) => {
        let ns = pixelNeighbors(pixel.x, pixel.y);
        let inputPowered = false;
        for (let n of ns) {
            let neighbor = game[n[0]][n[1]];
            if ((neighbor?.type === "dust" || neighbor?.type === "red_dust") && neighbor.power > 0) {
                inputPowered = true;
                break;
            }
        }
        pixel.guh = inputPowered;
        for (let n of ns) {
            let neighbor = game[n[0]][n[1]];
            if (neighbor?.type === "green_dust") {
                neighbor.power = pixel.guh ? 30 : 0;
                pixel.power = 0;
            }
        }
    },
    ignorePoweredProperty: true
};

bluestones.and_gate = {
    color: "#000DFA",
    description: "Your average AND gate. (dust/red_dust: inputs, green_dust: output)",
    placed: (pixel) => {
        pixel.guh = false;
    },
    behavior: (pixel) => {
        let ns = pixelNeighbors(pixel.x, pixel.y);
        let dustPowered = false;
        let redDustPowered = false;

        for (let n of ns) {
            let neighbor = game[n[0]][n[1]];
            if (neighbor?.type === "dust" && neighbor.power > 0) {
                dustPowered = true;
            }
            if (neighbor?.type === "red_dust" && neighbor.power > 0) {
                redDustPowered = true;
            }
        }

        pixel.guh = dustPowered && redDustPowered;

        for (let n of ns) {
            let neighbor = game[n[0]][n[1]];
            if (neighbor?.type === "green_dust") {
                neighbor.power = pixel.guh ? 30 : 0;
                pixel.power = 0;
            }
        }
    },
    ignorePoweredProperty: true
};

bluestones.xor_gate = {
    color: "#F0FF0F",
    description: "Your average XOR gate. (dust/red_dust: inputs, green_dust: output)",
    placed: (pixel) => {
        pixel.guh = false;
    },
    behavior: (pixel) => {
        let ns = pixelNeighbors(pixel.x, pixel.y);
        let dustPowered = false;
        let redDustPowered = false;

        for (let n of ns) {
            let neighbor = game[n[0]][n[1]];
            if (neighbor?.type === "dust" && neighbor.power > 0) {
                dustPowered = true;
            }
            if (neighbor?.type === "red_dust" && neighbor.power > 0) {
                redDustPowered = true;
            }
        }

        pixel.guh = (dustPowered !== redDustPowered);

        for (let n of ns) {
            let neighbor = game[n[0]][n[1]];
            if (neighbor?.type === "green_dust") {
                neighbor.power = pixel.guh ? 30 : 0;
                pixel.power = 0;
            }
        }
    },
    ignorePoweredProperty: true
};

addonButton("xor_gate")
addonButton("and_gate")
addonButton("or_gate")
addonButton("not_gate")
addonButton("red_dust")