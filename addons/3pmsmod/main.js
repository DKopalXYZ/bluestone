// mod by 3pm

const threepmsmodversion = "0.0.3"
const threepmsmodsubversion = "0.0.3.1"
const threepmsmodversionname = "The Logic Update"
const threepmsmodsubversionname = "The Adaptation Update"

console.log("3pms mod exists")
console.log("v"+threepmsmodversion+": "+threepmsmodversionname)
console.log("sv"+threepmsmodsubversion+": "+threepmsmodsubversionname)

// other elements

// note: ill add the red dust coloring system later
let rdustColors = [
    "#400000", "#480000", "#500000", "#580000", "#600000", "#680000",
    "#700000", "#780000", "#800000", "#880000", "#900000", "#980000",
    "#A00000", "#A80000", "#B00000", "#B80000", "#C00000", "#C80000",
    "#D00000", "#D80000", "#E00000", "#E80000", "#F00000", "#F80000",
    "#FF0000", "#FF0808", "#FF1010", "#FF1818", "#FF2020", "#FF2828"
];
if (localStorage.getItem('addons')) {
    addons = JSON.parse(localStorage.getItem('addons'))
    if (addons.includes("better-generator")) {
        rdustColors = [
            "#400000", "#480000", "#500000", "#580000", "#600000", "#680000",
            "#700000", "#780000", "#800000", "#880000", "#900000", "#980000",
            "#A00000", "#A80000", "#B00000", "#B80000", "#C00000", "#C80000",
            "#D00000", "#D80000", "#E00000", "#E80000", "#F00000", "#F80000",
            "#FF0000", "#FF0808", "#FF1010", "#FF1818", "#FF2020", "#FF2828",
            "#FF3636", "#FF4444", "#FF5252", "#FF6060", "#FF6868", "#FF7676",
            "#FF8484", "#FF9494", "#FFA2A2", "#FFB0B0", "#FFB8B8", "#FFC2C2",
            "#FFD0D0", "#FFD8D8", "#FFE6E6", "#FFF4F4", "#FFEEEE", "#FFFFFF"
        ];
    } else {
        console.log("aw dang it")
    }
} else {
    console.log("aw dang it")
}
bluestones.red_dust = {
    color: "#800000",
    description: "Like your everyday's wire but red.",
    ignore: ["green_dust", "dust"]
}
bluestones.green_dust.ignore.push("red_dust")
bluestones.dust.ignore.push("red_dust")

// logic gates

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
