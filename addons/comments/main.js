let textToShow = ""
let fontSize = 0

waitUntilMATLoaded().then(() => {
    const capi = new CAPI()

    bluestones.comment = {
        color: "#222222",
        description: "Useful for documenting stuff.",
        selected: () => {
            textToShow = prompt("What should the comment say?")
            fontSize = Number(prompt("Size of font?"))
        },
        placed: (pixel) => {
            pixel.text = textToShow
            pixel.size = fontSize
        },
        behavior: (pixel) => {
            capi.drawText(pixel.text,pixel.x,pixel.y,"#fff",pixel.size)
        }
    }

    componentSetup("comment")
})