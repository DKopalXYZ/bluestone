let textToShow = ""
let fontSize = 0

runOnLoad(() => {
    const Capy = new CAPI()

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
            Capy.drawText(pixel.text,pixel.x,pixel.y,"#fff",pixel.size)
        }
    }

    componentSetup("comment")
})
