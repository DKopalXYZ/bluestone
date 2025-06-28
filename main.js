/*
!!!READ THIS IF YOU ARE ADDONING!!!

Do not use the compression property.
*/

const keybinds = {}
function registerKeybind(key, func) {
    if (keybinds[key]) {
        keybinds[key].push(func)
    } else {
        keybinds[key] = [func]
    }
}
function onKeyPress(key) {
    if (keybinds[key]) {
        keybinds[key].forEach(func => {
            func()
        })
    }
}

const canv = document.getElementById('game');
canv.addEventListener('contextmenu', function (event) {
    event.preventDefault();
})
const ctx = canv.getContext('2d');

let width = 100;

let game = [];
for (let x = 0; x < width; x++) {
    game[x] = []
    for (let y = 0; y < 60; y++) {
        game[x][y] = undefined
    }
}

let version = '1.1.3';

let ticks = 0;

let translationLoaded = false;
let translationElements = null;

async function waitUntil(val, result) {
    while (val() != result) {
        await new Promise(resolve => setTimeout(resolve, 100))
    }
}

let gameLoaded = false

async function waitUntilMATLoaded(func) { // Yields until mods and translations are loaded
    while (!gameLoaded) {
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    func()
}

const runOnLoadedFuncs = []
function runOnLoad(func) {
    runOnLoadedFuncs.push(func)
}
const runBeforeUpdateFuncs = []
function runBeforeUpdate(func) {
    runBeforeUpdateFuncs.push(func)
}
const runAfterUpdateFuncs = []
function runAfterUpdate(func) {
    runAfterUpdateFuncs.push(func)
}

let addonsLoaded = 0
let addonsToLoad = 0

function saveSettings() {
    const Settings = {
        Translation: document.getElementById("TRANSLATION").value
    }
    localStorage.setItem("Settings", JSON.stringify(Settings));
}

function loadTranslation(translation) {
    if (translation != "en") {
        fetch("translations/" + translation + ".koml")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(parsed => {
                parsed = KOMLParse(parsed)
                translationElements = parsed.Elements;

                const idTable = Object.keys(parsed.Ids);
                idTable.forEach(id => {
                    if (document.getElementById(id)) {
                        document.getElementById(id).textContent = parsed.Ids[id];
                    }
                })

                translationLoaded = true;
            })
            .catch(error => {
                console.error('err while loading translation', translation, error);
            })
    } else {
        translationLoaded = true;
    }
}

let Settings = {}
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("Settings")) {
        const SData = JSON.parse(localStorage.getItem("Settings"));
        loadTranslation(SData.Translation)
        document.getElementById("TRANSLATION").value = SData.Translation;
    } else {
        loadTranslation("en")
    }
})

let brushSize = 1;

let addons = JSON.parse(localStorage.getItem('addons')) || [];

let selected = 'dust';

function OOB(x, y) { // Out of bounds check
    return x < 0 || x >= width || y < 0 || y >= 60
}

function Empty(x, y) {
    if (OOB(x, y)) {
        console.log(`Pixel (${x},${y}) is out of bounds!`);
        return false
    }
    return game[x][y] === undefined
}

function pixelNeighbors(x, y) {
    let neighbors = [];
    if (!OOB(x + 1, y) && !Empty(x + 1, y)) neighbors.push([x + 1, y])
    if (!OOB(x - 1, y) && !Empty(x - 1, y)) neighbors.push([x - 1, y])
    if (!OOB(x, y + 1) && !Empty(x, y + 1)) neighbors.push([x, y + 1])
    if (!OOB(x, y - 1) && !Empty(x, y - 1)) neighbors.push([x, y - 1])
    return neighbors
}

let dustColors = [
    "#000040", "#000048", "#000050", "#000058", "#000060", "#000068",
    "#000070", "#000078", "#000080", "#000088", "#000090", "#000098",
    "#0000A0", "#0000A8", "#0000B0", "#0000B8", "#0000C0", "#0000C8",
    "#0000D0", "#0000D8", "#0000E0", "#0000E8", "#0000F0", "#0000F8",
    "#0000FF", "#0808FF", "#1010FF", "#1818FF", "#2020FF", "#2828FF"
]

let gdustColors = [
    "#004000", "#004800", "#005000", "#005800", "#006000", "#006800",
    "#007000", "#007800", "#008000", "#008800", "#009000", "#009800",
    "#00A000", "#00A800", "#00B000", "#00B800", "#00C000", "#00C800",
    "#00D000", "#00D800", "#00E000", "#00E800", "#00F000", "#00F800",
    "#00FF00", "#08FF08", "#10FF10", "#18FF18", "#20FF20", "#28FF28"
]

let radios = [];

let gen = 0;
let channel = '';
let tunnel = "right";
let laserClr = ""
let tunnelInput = "right";
let beamDir = "right";
let pass_ = 0;
let cTime = 0;
let bluestones = {
    dust: {
        color: "#000040",
        description: "Like your everyday's wire.",
        compression: "$d",
        ignore: ["green_dust"]
    },
    green_dust: {
        color: "#004000",
        description: "Like your everyday's wire but green.",
        compression: "$gd",
        ignore: ["dust"]
    },
    generator: {
        color: "#FF0000",
        constantPower: 30,
        description: "Generates power out of air molecules.",
        compression: "$g"
    },
    constant_generator: {
        color: "#FF1256",
        ignorePoweredProperty: true,
        selected: () => {
            gen = Number(prompt("Constant signal for the generator?"));
        },
        placed: (pixel) => {
            pixel.gen = gen
        },
        behavior: (pixel) => {
            pixel.power = pixel.gen
        },
        description: "Generates a set power amount out of air molecules.",
        compression: "$c"
    },
    copper: {
        color: "#b87333",
        ignore: ['torch', 'copper', 'extender', 'switch'],
        description: "Used for manipulation with batteries, extenders, torches and more.",
        compression: "$m"
    },
    concrete: {
        color: "#ededed",
        constantPower: 0,
        ignorePoweredProperty: true,
        description: "Does nothing for the world, like a communist.",
        compression: "$o"
    },
    torch: {
        color: "#004000",
        colorActivated: "#00ff00",
        props: {
            disabled: false
        },
        behavior: (pixel) => {
            let foundCopper = false;
            let ns = pixelNeighbors(pixel.x, pixel.y);
            ns.forEach(n => {
                let neighbor = game[n[0]][n[1]];
                if (neighbor.type == 'copper') {
                    if (neighbor.power > 0) {
                        pixel.disabled = true
                        foundCopper = true;
                    } else {
                        if (!foundCopper) {
                            pixel.disabled = false
                        }
                    }
                }
            })

            if (!pixel.disabled) {
                pixel.power = 30
            } else {
                pixel.power = 0
            }
        },
        ignorePoweredProperty: true, // Doesn't set power to 0 even if !powered
        ignore: ['dust', 'copper'],
        description: "Generator which can be turned on/off with powered copper.",
        compression: "$t"
    },
    receiver: {
        color: '#ffbcbc',
        selected: () => {
            channel = prompt("Which channel to receive on?");
        },
        enter: (pixel) => {
            document.getElementById("channel").style.display = "block"
            document.getElementById("channel").textContent = "Channel: " + pixel.channel
        },
        leave: (pixel) => {
            document.getElementById("channel").style.display = "none"
        },
        placed: (pixel) => {
            pixel.channel = channel
            radios.push(pixel);
        },
        erased: (pixel) => {
            const index = radios.indexOf(pixel);

            if (index !== -1) {
                radios.splice(index, 1);
            }
        },
        description: "Recieves power from senders.",
        compression: "$r"
    },
    sender: {
        color: '#bcffbc',
        selected: () => {
            channel = prompt("Which channel to send to?");
        },
        placed: (pixel) => {
            pixel.channel = channel
        },
        enter: (pixel) => {
            document.getElementById("channel").style.display = "block"
            document.getElementById("channel").textContent = "Channel: " + pixel.channel
        },
        leave: (pixel) => {

            document.getElementById("channel").style.display = "none"
        },
        behavior: (pixel) => {
            if (pixel.power > 0) {
                radios.forEach(radio => {
                    if (radio.channel == pixel.channel) {
                        radio.power = pixel.power
                    }
                })
            }
        },
        description: "Sends power to receivers and radio lamps.",
        compression: "$s"
    },
    lamp: {
        color: '#404000',
        colorActivated: "#FFFF00",
        description: "Lights up when powered.",
        compression: "$l"
    },
    radio_lamp: {
        color: '#404000',
        colorActivated: "#FFFF00",
        selected: () => {
            channel = prompt("Which channel to receive on?");
        },
        placed: (pixel) => {
            pixel.channel = channel
            radios.push(pixel);
        },
        enter: (pixel) => {
            document.getElementById("channel").style.display = "block"
            document.getElementById("channel").textContent = "Channel: " + pixel.channel
            console.log("huh")
        },
        leave: (pixel) => {
            document.getElementById("channel").style.display = "none"
        },
        erased: (pixel) => {
            const index = radios.indexOf(pixel);

            if (index !== -1) {
                radios.splice(index, 1);
            }
        },
        ignore: ['radio_lamp'],
        description: "Lights up when recieving a signal.",
        compression: "$rl"
    },
    tunnel: {
        color: '#686868',
        selected: () => {
            tunnel = prompt("Which way? (right, left, up, down)");
        },
        placed: (pixel) => {
            pixel.way = tunnel.slice()
            if (!['right', 'left', 'up', 'down'].includes(pixel.way)) {
                game[pixel.x][pixel.y] = undefined
            }
        },
        behavior: (pixel) => {
            let trgX = pixel.x;
            let trgY = pixel.y;

            if (pixel.way == 'right') trgX++
            else if (pixel.way == 'left') trgX--
            else if (pixel.way == 'up') trgY--
            else if (pixel.way == 'down') trgY++

            if (!OOB(trgX, trgY) && !Empty(trgX, trgY)) {
                let neighbor = game[trgX][trgY];
                if (neighbor.power < pixel.power) {
                    neighbor.power = pixel.power - 1
                    if (neighbor.type == 'tunnel') {
                        bluestones[neighbor.type].behavior(neighbor)
                    } else if (neighbor.type == 'dust') {
                        neighbor.power = pixel.power - 1
                    }
                }
            }
        },
        description: "Redirects signals to go a specific way.",
        compression: "$tn"
    },
    pass: {
        color: '#ffb',
        colorActivated: '#FFAB00',
        ignorePoweredProperty: true,
        selected: () => {
            pass_ = prompt("Minimal power for passage)");
        },
        placed: (pixel) => {
            pixel.min = pass_.slice()
        },
        behavior: (pixel) => {
            let ns = pixelNeighbors(pixel.x, pixel.y);
            let ns2 = [];

            ns.forEach(n => {
                let neighbor = game[n[0]][n[1]];
                if (neighbor.power >= pixel.min) {
                    ns2.push(neighbor.power)
                }
            })

            if (ns2.length > 0) {
                pixel.power = Math.max(...ns2)
            } else {
                pixel.power = 0
            }
        },
        description: "Allows power to go through when it's equal to or higher than a set value.",
        compression: "$p"
    },
    rev_pass: {
        color: '#ffb',
        colorActivated: '#FFAB00',
        ignorePoweredProperty: true,
        selected: () => {
            pass_ = prompt("Maximum power for passage)");
        },
        placed: (pixel) => {
            pixel.max = pass_.slice()
        },
        behavior: (pixel) => {
            let ns = pixelNeighbors(pixel.x, pixel.y);
            let ns2 = [];

            ns.forEach(n => {
                let neighbor = game[n[0]][n[1]];
                if (neighbor.power <= pixel.max) {
                    ns2.push(neighbor.power)
                }
            })

            if (ns2.length > 0) {
                pixel.power = Math.max(...ns2)
            } else {
                pixel.power = 0
            }
        },
        description: "Allows power to go through when it's equal to or lower than a set value.",
        compression: "$rp"
    },
    extender: {
        color: '#b400b4',
        behavior: (pixel) => {
            let ns = pixelNeighbors(pixel.x, pixel.y);
            let powered = false;
            ns.forEach(n => {
                let neighbor = game[n[0]][n[1]];
                if (neighbor.type == 'copper' && neighbor.power > 0) {
                    powered = true;
                }

            })
            if (powered) {
                pixel.power = 30
            } else {
                pixel.power = 0
            }
        },
        ignorePoweredProperty: true,
        ignore: ['copper'],
        description: "Extends signal with powered copper.",
        compression: "$e"
    },
    battery: {
        color: '#bede00',
        behavior: (pixel) => {
            let ns = pixelNeighbors(pixel.x, pixel.y);
            let ns2 = [];
            let powered = false;
            ns.forEach(n => {
                let neighbor = game[n[0]][n[1]];
                if (neighbor.type !== 'copper') {
                    ns2.push(neighbor)
                }
                if (neighbor.type == 'copper' && neighbor.power > 0) {
                    powered = true;
                }
                if (powered) {
                    ns2.forEach(neighbor => {
                        if (neighbor.power < pixel.power) {
                            neighbor.power = pixel.power
                        }
                    })
                }

            })
        },
        ignorePoweredProperty: true,
        ignore: ['copper'],
        description: "Stores and releases energy when reacting with powered copper.",
        compression: "$b"
    },
    clock: {
        color: '#ffd700',
        colorActivated: '#ffa800',
        ignorePoweredProperty: true,
        selected: () => {
            let input = prompt("Time in ms");
            cTime = parseInt(input) || 1000;
        },
        placed: (pixel) => {
            pixel.time = cTime
            pixel.lUpdate = Date.now()
            pixel.activated = false
        },
        props: {
            activated: false,
        },
        behavior: (pixel) => {
            let now = Date.now();
            if (now - pixel.lUpdate >= pixel.time) {
                pixel.activated = !pixel.activated
                pixel.lUpdate = now
            }

            if (pixel.activated) {
                pixel.power = 30
            } else {
                pixel.power = 0
            }
        },
        description: "Sends out a signal repeatedly.",
        compression: "$cl"
    },
    switch: {
        color: '#a0a0a0',
        colorActivated: '#56ff56',
        ignorePoweredProperty: true,
        placed: (pixel) => {
            pixel.tState = false
            pixel.lcp = false
        },
        behavior: (pixel) => {
            let ns = pixelNeighbors(pixel.x, pixel.y);
            let medp = ns.some(n => {
                let neighbor = game[n[0]][n[1]];
                return neighbor.type === "copper" && neighbor.power > 0
            })

            if (medp && !pixel.lcp) {
                pixel.tState = !pixel.tState
            }

            pixel.lcp = medp

            if (pixel.tState) {
                pixel.power = 30
            } else {
                pixel.power = 0
            }
        },
        description: "Toggles on/off when a powered copper block is next to it.",
        compression: "$sw",
        ignore: ["copper"],
    },
    button: {
        color: '#a0a0a0',
        colorActivated: '#505050',
        ignorePoweredProperty: true,
        props: {
            clicked: 0
        },
        behavior: (pixel) => {
            if (pixel.clicked > 0) {
                pixel.clicked--
                pixel.power = 30
            } else {
                pixel.power = 0
            }
        },
        description: "Sents out a short signal when toggled.",
        compression: "$bt",
    },
    lever: {
        color: '#a0a0a0',
        colorActivated: '#505050',
        ignorePoweredProperty: true,
        props: {
            toggled: false
        },
        behavior: (pixel) => {
            if (pixel.toggled) {
                pixel.power = 30
            } else {
                pixel.power = 0
            }
        },
        description: "Turns on/off when toggled..",
        compression: "$bt",
    },
    toggle: {
        color: '#f00',
        tool: (pixel) => {
            if (pixel.type == "button" && pixel.clicked == 0) {
                pixel.clicked = 80
            } else if (pixel.type == "lever") {
                if (pixel.toggled == false) {
                    pixel.toggled = true
                } else {
                    pixel.toggled = false
                }
            }
        },
        description: "Toggles buttons and levers.",
    },
    bridge: {
        color: '#686868',
        behavior: (pixel) => {
            if (!Empty(pixel.x - 1, pixel.y) && !Empty(pixel.x + 1, pixel.y)) {
                let left = game[pixel.x - 1][pixel.y];
                let right = game[pixel.x + 1][pixel.y];
                if (left.type !== right.type) return;
                if (left.power > right.power) {
                    right.power = pixel.power - 1
                } else if (left.power < right.power) {
                    left.power = pixel.power - 1
                }
            }
            if (!Empty(pixel.x, pixel.y - 1) && !Empty(pixel.x, pixel.y + 1)) {
                let up = game[pixel.x][pixel.y - 1];
                let down = game[pixel.x][pixel.y + 1];
                if (up.type !== down.type) return;
                if (up.power > down.power) {
                    down.power = up.power - 1
                } else if (up.power < down.power) {
                    up.power = down.power - 1
                }
            }
        },
        description: "Allows signals to go straight through each other.",
        compression: "$tn",
        ignore: ["bridge", "multi_bridge"]
    },
    multi_bridge: {
        color: '#686868',
        behavior: (pixel) => {
            let ns = pixelNeighbors(pixel.x, pixel.y);
            ns.forEach(n => {
                let neighbor = game[n[0]][n[1]];
                ns.forEach(n2 => {
                    let neighbor2 = game[n2[0]][n2[1]];
                    if (neighbor !== neighbor2) {
                        if (neighbor.type !== neighbor2.type) return;
                        if (neighbor.power > neighbor2.power) {
                            neighbor2.power = neighbor.power - 1
                        } else if (neighbor.power < neighbor2.power) {
                            neighbor.power = neighbor2.power - 1
                        }
                    }
                })
            })
        },
        description: "Allows signals to go straight through each other.",
        compression: "$mm",
        ignore: ["bridge", "multi_bridge"]
    },
    laser_beam: {
        color: '#fff',
        hidden: true,
        props: {
            parent: null
        },
        behavior: (pixel) => {
            if (Empty(pixel.parent.x, pixel.parent.y) || game[pixel.parent.x][pixel.parent.y].power <= 0) {
                removeComponent(pixel.x, pixel.y);
                return;
            } else {
                pixel.color = game[pixel.parent.x][pixel.parent.y].beamclr
            }

            const ns = pixelNeighbors(pixel.x, pixel.y);
            ns.forEach(coords => {
                const n = game[coords[0]][coords[1]];
                if (n.type === "laser_sensor") {
                    n.power = 30;
                }
            });
        },
        description: "Just a laser beam",
        compression: "$lb",
        constantPower: 0
    },
    laser: {
        color: "#868686",
        selected: () => {
            beamDir = prompt("Which directions? (right, left, down, up)").toLowerCase();
            beamClr = prompt("What color for the beam? (HEX)").toLowerCase();
        },
        placed: (pixel) => {
            pixel.direction = beamDir;
            pixel.beamclr = beamClr;
        },
        behavior: (pixel) => {
            if (pixel.power > 0) {
                if (ticks % 2 === 0) {
                    for (let i = 0; i < game.length; i++) {
                        for (let j = 0; j < game[0].length; j++) {
                            const p = game[i][j];
                            if (p && p.type === "laser_beam" && p.parent.x === pixel.x && p.parent.y === pixel.y) {
                                removeComponent(i, j);
                            }
                        }
                    }

                    if (pixel.direction === "right") {
                        for (let i = pixel.x + 1; i < game.length; i++) {
                            if (Empty(i, pixel.y)) {
                                placeComponent("laser_beam", i, pixel.y);
                                game[i][pixel.y].parent = { x: pixel.x, y: pixel.y };
                            } else {
                                break;
                            }
                        }
                    } else if (pixel.direction === "left") {
                        for (let i = pixel.x - 1; i >= 0; i--) {
                            if (Empty(i, pixel.y)) {
                                placeComponent("laser_beam", i, pixel.y);
                                game[i][pixel.y].parent = { x: pixel.x, y: pixel.y };
                            } else {
                                break;
                            }
                        }
                    } else if (pixel.direction === "down") {
                        for (let j = pixel.y + 1; j < game[0].length; j++) {
                            if (Empty(pixel.x, j)) {
                                placeComponent("laser_beam", pixel.x, j);
                                game[pixel.x][j].parent = { x: pixel.x, y: pixel.y };
                            } else {
                                break;
                            }
                        }
                    } else if (pixel.direction === "up") {
                        for (let j = pixel.y - 1; j >= 0; j--) {
                            if (Empty(pixel.x, j)) {
                                placeComponent("laser_beam", pixel.x, j);
                                game[pixel.x][j].parent = { x: pixel.x, y: pixel.y };
                            } else {
                                break;
                            }
                        }
                    }
                }
            }
        },
        description: "Shoots out a laser beam.",
        compression: "$lp",
    },
    laser_sensor: {
        color: "#9b0000",
        description: "Powers up when hit with a laser beam.",
        compression: "$ls"
    },
    r_led: {
        color: "#550000",
        colorActivated: "#FF0000",
        description: "LED lightbulb but red."
    },
    b_led: {
        color: "#000055",
        colorActivated: "#0000FF",
        description: "LED lightbulb but blue."
    },
    g_led: {
        color: "#005500",
        colorActivated: "#00FF00",
        description: "LED lightbulb but green."
    }
}
bluestones.pass.ignore = Object.keys(bluestones)
bluestones.button.ignore = Object.keys(bluestones)

let drawing = false;
let erasing = false;

canv.addEventListener('mousedown', (event) => {
    const rect = canv.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const gameX = Math.floor(mouseX / 10);
    const gameY = Math.floor(mouseY / 10);

    if (!OOB(gameX, gameY)) {
        if (Empty(gameX, gameY)) {
            drawing = true;
            erasing = false;
            placeMouseComponent(gameX, gameY);
        } else {
            drawing = false;
            erasing = true;
            removeMouseComponent(gameX, gameY);
        }
    }
})

canv.addEventListener('mouseup', () => {
    drawing = false;
    erasing = false;
})

let mX = 0;
let mY = 0;

let enteredPixel = null
canv.addEventListener('mousemove', (event) => {
    const rect = canv.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const gameX = Math.floor(mouseX / 10);
    const gameY = Math.floor(mouseY / 10);

    mX = gameX * 10;
    mY = gameY * 10;

    if (!OOB(gameX, gameY)) {
        document.getElementById('coords').textContent = `${gameX}, ${gameY}`;
        document.getElementById('power').textContent = `Power: ${Empty(gameX, gameY) ? 0 : game[gameX][gameY].power}`;
        if (!Empty(gameX, gameY)) {
            document.getElementById('elem').textContent = `Elem: ${game[gameX][gameY].type}`;
            if (bluestones[game[gameX][gameY].type].enter) { bluestones[game[gameX][gameY].type].enter(game[gameX][gameY]); enteredPixel = game[gameX][gameY] };
        } else {
            document.getElementById('elem').textContent = "Elem: none";
            if (enteredPixel) {
                if (bluestones[enteredPixel.type].leave) { bluestones[enteredPixel.type].leave(enteredPixel); enteredPixel = null };
            }
        }
    }

    if (drawing) {
        placeMouseComponent(gameX, gameY);
    } else if (erasing) {
        removeMouseComponent(gameX, gameY);
    }
})

function placeComponent(type, x, y) {
    const component = bluestones[type];
    game[x][y] = {
        type: type,
        x: x,
        y: y,
        start: ticks,
        power: bluestones[type].constantPower || 0
    }
    if (component.props) {
        let array = Object.keys(component.props);
        array.forEach(key => {
            game[x][y][key] = component.props[key]
        })
    }
    if (component.placed) {
        component.placed(game[x][y])
    }
}

function placeMouseComponent(x, y) {
    let hBrush = Math.floor(brushSize / 2);

    let offset = (brushSize % 2 === 0) ? 0 : 1;

    for (let i = -hBrush; i < hBrush + offset; i++) {
        for (let j = -hBrush; j < hBrush + offset; j++) {
            let bx = x + i;
            let by = y + j;
            if (!OOB(bx, by)) {
                if (bluestones[selected].tool) {
                    if (!Empty(bx, by)) {
                        bluestones[selected].tool(game[bx][by])
                    }
                } else {
                    placeComponent(selected, bx, by);
                }
            }
        }
    }
}

function removeComponent(x, y) {
    if (!OOB(x, y) && !Empty(x, y)) {
        if (game[x][y] !== undefined) {
            if (game[x][y].erased) {
                game[x][y].erased(game[bx][by])
            }
            game[x][y] = undefined
        }
    }
}

function removeMouseComponent(x, y) {
    let hBrush = Math.floor(brushSize / 2);
    let offset = (brushSize % 2 === 0) ? 0 : 1;

    for (let i = -hBrush; i < hBrush + offset; i++) {
        for (let j = -hBrush; j < hBrush + offset; j++) {
            let bx = x + i;
            let by = y + j;
            if (bluestones[selected].tool && !Empty(bx, by)) {
                bluestones[selected].tool(game[bx][by])
            } else {
                removeComponent(bx, by);
            }
        }
    }
}

function resetGame() {
    game = [];
    for (let x = 0; x < width; x++) {
        game[x] = []
        for (let y = 0; y < 60; y++) {
            game[x][y] = undefined
        }
    }
}

let xWidth = 0;

function extraWidth() {
    width = 150;
    document.getElementById('game').width = 1500;
    xWidth = 1;
    resetGame()
}

async function update() {
    let loadedBU = 0
    runBeforeUpdateFuncs.forEach(func => {
        func()
        loadedBU++
    })
    await waitUntil(() => loadedBU == runBeforeUpdateFuncs.length,true)
    ticks++
    ctx.clearRect(0, 0, canv.width, canv.height);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < 60; y++) {
            if (!Empty(x, y)) {
                let pixel = game[x][y];
                if (bluestones[pixel.type].behavior) {
                    bluestones[pixel.type].behavior(pixel)
                }
            }
        }
    }

    let prePower = [];
    for (let x = 0; x < width; x++) {
        prePower[x] = []
        for (let y = 0; y < 60; y++) {
            if (!Empty(x, y)) {
                prePower[x][y] = game[x][y].power
            }
        }
    }

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < 60; y++) {
            if (!Empty(x, y)) {
                let pixel = game[x][y];
                if (pixel.type == 'dust') {
                    ctx.fillStyle = dustColors[pixel.power];
                } else if (pixel.type == "green_dust") {
                    ctx.fillStyle = gdustColors[pixel.power];
                } else if (pixel.power > 0 && bluestones[pixel.type].colorActivated) {
                    ctx.fillStyle = bluestones[pixel.type].colorActivated;
                } else if (pixel.color !== undefined) {
                    ctx.fillStyle = pixel.color;
                } else {
                    ctx.fillStyle = bluestones[pixel.type].color;
                }
                if (bluestones[pixel.type].constantPower !== undefined) {
                    pixel.power = bluestones[pixel.type].constantPower
                } else {
                    let maxnp = 0 // max neighbor power;
                    let powered = false;
                    let ns = pixelNeighbors(pixel.x, pixel.y);

                    ns.forEach(n => {
                        let nx = n[0], ny = n[1];
                        if (prePower[nx] && prePower[nx][ny] !== undefined) {
                            let neighborPower = prePower[nx][ny];
                            if (!bluestones[pixel.type].ignore || (!bluestones[pixel.type].ignore.includes(game[nx][ny].type))) {
                                if (neighborPower > maxnp) {
                                    maxnp = neighborPower;
                                    powered = true;
                                }
                            }
                        }
                    })

                    if (powered) {
                        pixel.power = maxnp - 1
                    } else if (!bluestones[pixel.type].ignorePoweredProperty) {
                        pixel.power = 0
                    }
                }

                ctx.fillRect(x * 10, y * 10, 10, 10);
            }
        }
    }

    let hBrush = (brushSize % 2 === 0) ? (brushSize / 2) : Math.floor(brushSize / 2);
    let size = brushSize * 10;

    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(Math.floor(mX / 10 - hBrush) * 10, Math.floor(mY / 10 - hBrush) * 10, size, size);

    let loadedAU = 0
    runAfterUpdateFuncs.forEach(func => {
        func()
        loadedAU++
    })
    await waitUntil(() => loadedAU == runAfterUpdateFuncs.length,true)

    requestAnimationFrame(update);
}

const modRegistry = {};

function validConf(pconfig) {
    if (pconfig["config"] && pconfig.config["addon"] && pconfig.config["author"] && pconfig.config["version"]) { return true; }
    else { return false; };
};

async function fetchKOML(name) {
    try {
        let resp = await fetch(`addons/${name}/config.koml`);
        if (!resp.ok) { console.error(`oopsie woopsie while loading: ${name}`); return };
        let text = await resp.text();
        return text
    } catch {
        return null;
    }
}

async function registerAddon(addon, seen = new Set()) {
    if (seen.has(addon)) return;
    seen.add(addon);

    const pconfig = KOMLParse(await fetchKOML(addon));

    if (!validConf(pconfig)) throw new Error(`invalid config.koml: ${addon}`);

    const deps = pconfig.dependencies || [];
    addonsToLoad += deps.length
    for (const dep of deps) {
        if (!addons.includes(dep)) {
            await registerAddon(dep, seen);
        } else {
            addonsToLoad--;
        };
    };

    modRegistry[pconfig.config.addon] = {
        author: pconfig.config.author,
        version: pconfig.config.version
    };

    return addon;
}

async function loadScr(addon) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `addons/${addon}/main.js`;
        script.onload = () => {
            addonsLoaded++;
            resolve();
        };
        script.onerror = () => reject(`invalid main.js: ${addon}`);
        document.body.appendChild(script);
    });
}

async function loadAddons() {
    try {
        const loaded = new Set();
        for (const addon of addons) {
            await registerAddon(addon, loaded);
        }

        for (const addon of loaded) {
            await loadScr(addon);
        }

        setup();
    } catch (err) {
        console.error(err);
    }
}



function save() {
    let stringified = JSON.stringify(game);
    stringified = stringified.replaceAll('null,null,null,null,null', '&');
    stringified = stringified.replaceAll('[&,&,&,&,&,&,&,&,&,&,&,&]', 'Đ');
    stringified = stringified.replaceAll('null,null,null,null', '@');
    stringified = stringified.replaceAll('[&,&,&,@,', 'đ');
    stringified = stringified.replaceAll('null,null,null', 'Ł');
    stringified = stringified.replaceAll('null,null', '$');
    stringified = stringified.replaceAll('null', '€');
    stringified = stringified.replaceAll('type', '!t');
    stringified = stringified.replaceAll('power', '!p');
    const file = new Blob([xWidth + '<w>' + stringified + '-/-' + version], { type: 'text/plain' });
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
    a.href = url
    a.download = 'bluestonesave.bs1'
    document.body.appendChild(a);
    a.click()
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0)
}

document.getElementById("fileInput").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            xWidth = 0;
            radios = [];
            let stringified = e.target.result;
            stringified = stringified.replaceAll('Đ', '[&,&,&,&,&,&,&,&,&,&,&,&]');
            stringified = stringified.replaceAll('đ', '[&,&,&,@,');
            stringified = stringified.replaceAll('&', 'null,null,null,null,null');
            stringified = stringified.replaceAll('@', 'null,null,null,null');
            stringified = stringified.replaceAll('Ł', 'null,null,null');
            stringified = stringified.replaceAll('$', 'null,null');
            stringified = stringified.replaceAll('€', 'null');
            stringified = stringified.replaceAll('!t', 'type');
            stringified = stringified.replaceAll('!p', 'power');
            toparse = stringified.split('-/-');
            toparse2 = toparse[0].split('<w>');

            let parsed = JSON.parse(toparse2[1].trim());
            if (toparse2[0] == '1') {
                extraWidth()
            }
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < 60; y++) {
                    if (parsed[x][y] == null) {
                        parsed[x][y] = undefined
                    } else {
                        if (parsed[x][y].type == "radio_lamp" || parsed[x][y].type == "receiver") {
                            radios.push(parsed[x][y]);
                        }
                    }
                }
            }
            game = parsed;
        }
        reader.readAsText(file)
    }
})

let allIgnore = ["tunnel", "battery", "bridge", "multi_bridge"];

function componentSetup(component) {
    if (document.getElementById('elem-' + component)) return;
    let button = document.createElement('button');
    if (translationElements) {
        if (translationElements[component]) { button.textContent = translationElements[component].name }
    } else { button.textContent = component.replaceAll('_', ' ') }
    button.id = 'elem-' + component
    button.onclick = () => {
        if (translationElements) {
            if (translationElements[component]) { document.getElementById("description").textContent = translationElements[component].description }
        } else {
            document.getElementById("description").textContent = bluestones[component].description;
        }
        document.getElementById('elem-' + selected).classList.remove('component-selected');
        document.getElementById('elem-' + selected).classList.add('component-unselected');

        selected = component;

        button.classList.add('component-selected')
        button.classList.remove('component-unselected')

        if (bluestones[component].selected) {
            bluestones[component].selected()
        }

        button.classList.add('stoneselected')
    }

    button.className = 'component'
    button.style.backgroundColor = bluestones[component].color

    if (bluestones[component].colorActivated) {
        button.style.background = `linear-gradient(to right, ${bluestones[component].color}, ${bluestones[component].colorActivated})`
    }

    if (bluestones[component].tool) {
        document.getElementById('tools').appendChild(button);
    } else {
        document.getElementById('buttons').appendChild(button);
    }
}

async function setup() {
    console.time("gameload")
    console.time("modsload")
    await waitUntil(() => addonsLoaded >= addonsToLoad, true)
    console.timeEnd("modsload")
    console.time("translationsload")
    await waitUntil(() => translationLoaded, true)
    console.timeEnd("translationsload")
    gameLoaded = true
    console.timeEnd("gameload")
    let bluestoneArray = Object.keys(bluestones);
    bluestoneArray.forEach(component => {
        allIgnore.forEach(ignored => {
            if (!bluestones[component].ignore) {
                bluestones[component].ignore = [ignored]
            } else {
                if (!bluestones[component].ignore.includes(ignored)) {
                    bluestones[component].ignore.push(ignored)
                }
            }
        })
        if (document.getElementById('elem-' + component)) return;
        if (!bluestones[component].hidden) componentSetup(component);
    })

    let loadedFuncs = 0
    runOnLoadedFuncs.forEach(func => {
        func()
        loadedFuncs++
    })
    await waitUntil(() => loadedFuncs == runOnLoadedFuncs.length,true)

    update()
}

registerKeybind("s", () => { save() })
registerKeybind("", () => { save() })

loadAddons()
