let textToShow = ""

runOnLoad(() => {
    const Capy = new CAPI()

    bluestones.comment = {
        color: "#222222",
        description: "Useful for documenting stuff.",
        selected: () => {
            textToShow = prompt("What should the comment say?")
        },
        placed: (pixel) => {
            pixel.text = textToShow
        },
        behavior: (pixel) => {
            Capy.drawText(pixel.text,pixel.x,pixel.y,"#fff",24)
        }
    }
})