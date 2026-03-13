const uploadArea = document.getElementById("uploadArea")
const fileInput = document.getElementById("fileInput")
const previewContainer = document.getElementById("previewContainer")
const selectFile = document.getElementById("selectFile")

const viewer = document.getElementById("fileViewer")
const viewerBody = document.getElementById("viewerBody")
const closeViewer = document.getElementById("closeViewer")

let files = []

// abrir seletor
uploadArea.addEventListener("click", (e) => {
    if (e.target === uploadArea) {
        fileInput.click()
    }
})

selectFile.addEventListener("click", e => {
    e.stopPropagation()
    fileInput.click()
})

// drag
uploadArea.addEventListener("dragover", e => {
    e.preventDefault()
    uploadArea.classList.add("dragover")
})

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover")
})

uploadArea.addEventListener("drop", e => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")
    handleFiles(e.dataTransfer.files)
})

// seleção normal
fileInput.addEventListener("change", () => {
    handleFiles(fileInput.files)
})

// fechar viewer
closeViewer.onclick = () => {
    viewer.classList.add("hidden")
    viewerBody.innerHTML = ""
}

// fechar clicando fora
viewer.addEventListener("click", e => {
    if (e.target === viewer) {
        viewer.classList.add("hidden")
        viewerBody.innerHTML = ""
    }
})

// processar arquivos
function handleFiles(newFiles) {

    Array.from(newFiles).forEach(file => {

        if (file.size > 20 * 1024 * 1024) {
            alert("Arquivo maior que 20MB")
            return
        }

        files.push(file)
        createPreview(file)

    })

}

// criar preview
function createPreview(file) {

    const item = document.createElement("div")
    item.classList.add("preview-item")

    const url = URL.createObjectURL(file)

    let preview

    if (file.type.startsWith("image")) {

        preview = document.createElement("img")
        preview.src = url

    }
    else if (file.type.startsWith("video")) {

        preview = document.createElement("video")
        preview.src = url
        preview.muted = true
        preview.preload = "metadata"

    }
    else if (file.type === "application/pdf") {

        preview = document.createElement("div")
        preview.classList.add("file-icon")
        preview.textContent = "📕"

    }
    else {

        preview = document.createElement("div")
        preview.classList.add("file-icon")
        preview.textContent = "📄"

    }

    const name = document.createElement("div")
    name.classList.add("file-name")
    name.textContent = file.name

    const removeBtn = document.createElement("button")
    removeBtn.classList.add("remove-btn")
    removeBtn.textContent = "×"

    removeBtn.addEventListener("click",(e)=>{

    e.preventDefault()
    e.stopPropagation()

    files = files.filter(f => f !== file)

    item.remove()

})

    const progressBar = document.createElement("div")
    progressBar.classList.add("progress-bar")

    const progress = document.createElement("div")
    progress.classList.add("progress")

    progressBar.appendChild(progress)

    item.appendChild(removeBtn)
    item.appendChild(preview)
    item.appendChild(name)
    item.appendChild(progressBar)

    previewContainer.appendChild(item)

    simulateUpload(progress, progressBar)

    // abrir viewer
    item.addEventListener("click", (e) => {

    if (e.target.closest(".remove-btn")) return

    viewer.classList.remove("hidden")
    viewerBody.innerHTML = ""

    const url = URL.createObjectURL(file)

    let element

    if(file.type.startsWith("image")){

        element = document.createElement("img")
        element.src = url
        viewerBody.appendChild(element)

    }
    else if(file.type.startsWith("video")){

        element = document.createElement("video")
        element.src = url
        element.controls = true
        element.autoplay = true
        viewerBody.appendChild(element)

    }
    else if(file.type === "application/pdf"){

        element = document.createElement("iframe")
        element.src = url
        viewerBody.appendChild(element)

    }
    else if(file.name.endsWith(".docx")){

        const reader = new FileReader()

        reader.onload = function(event){

            mammoth.convertToHtml({arrayBuffer:event.target.result})
            .then(result => {

                const div = document.createElement("div")
                div.classList.add("docx-preview")
                div.innerHTML = result.value

                viewerBody.appendChild(div)

            })

        }

        reader.readAsArrayBuffer(file)

    }
    else{

        element = document.createElement("a")
        element.href = url
        element.textContent = "Abrir arquivo"
        element.target = "_blank"
        viewerBody.appendChild(element)

    }

})

}

// simulação progresso
function simulateUpload(progress, progressBar){

  let value = 0

  const interval = setInterval(()=>{

    value += 10

    progress.style.width = value + "%"

    if(value >= 100){

      clearInterval(interval)

      setTimeout(()=>{
        progressBar.style.display = "none"
      },500)

    }

  },200)

}