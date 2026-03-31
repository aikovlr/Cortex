
const uploadArea = document.getElementById("uploadArea")
const fileInput = document.getElementById("fileInput")
const previewContainer = document.getElementById("previewContainer")
const selectFile = document.getElementById("selectFile")

const viewer = document.getElementById("uploadViewer")
const viewerBody = document.getElementById("uploadViewerBody")
const closeViewer = document.getElementById("closeUploadViewer")

let files = []

// abrir seletor
if (uploadArea) {
    uploadArea.addEventListener("click", (e) => {
        if (e.target === uploadArea) {
            fileInput?.click()
        }
    })
}

if (selectFile) {
    selectFile.addEventListener("click", e => {
        e.stopPropagation()
        fileInput?.click()
    })
}

// drag
if (uploadArea) {
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
}

// seleção normal
fileInput?.addEventListener("change", () => {
    handleFiles(fileInput.files)
})

// 🔥 botão fechar (SÓ upload)
if (closeViewer) {
    closeViewer.onclick = () => {
        viewer.classList.add("hidden")
        viewerBody.innerHTML = ""
    }
}

// clicar fora fecha
viewer?.addEventListener("click", e => {
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
        createPreview(file, previewContainer)

    })

}

// criar preview
function createPreview(file, target) {

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

    preview.innerHTML = `
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#E53935">
        <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
    </svg>`

}
else {

    preview = document.createElement("div")
    preview.classList.add("file-icon")

    preview.innerHTML = `
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#5C6BC0">
        <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6z"/>
    </svg>`

}

    const name = document.createElement("div")
    name.classList.add("file-name")
    name.textContent = file.name

    const removeBtn = document.createElement("button")
    removeBtn.classList.add("remove-btn")
    removeBtn.textContent = "×"

    removeBtn.addEventListener("click", (e) => {

        e.preventDefault()
        e.stopPropagation()

        files = files.filter(f => f !== file)
        item.remove()

        URL.revokeObjectURL(url)
    })

    item.appendChild(removeBtn)
    item.appendChild(preview)
    item.appendChild(name)

    target.appendChild(item)

    // abrir viewer
    item.addEventListener("click", (e) => {

        if (e.target.closest(".remove-btn")) return
        if (!viewer || !viewerBody) return

        viewer.classList.remove("hidden")
        viewerBody.innerHTML = ""

        let element

        if (file.type.startsWith("image")) {

            element = document.createElement("img")
            element.src = url

        }
        else if (file.type.startsWith("video")) {

            element = document.createElement("video")
            element.src = url
            element.controls = true
            element.autoplay = true

        }
        else if (file.type === "application/pdf") {

            element = document.createElement("iframe")
            element.src = url

        }
        else if (file.name.endsWith(".docx")) {

            const reader = new FileReader()

            reader.onload = function (event) {

                mammoth.convertToHtml({ arrayBuffer: event.target.result })
                    .then(result => {

                        const div = document.createElement("div")
                        div.classList.add("docx-preview")
                        div.innerHTML = result.value

                        viewerBody.appendChild(div)
                    })
            }

            reader.readAsArrayBuffer(file)
            return
        }
        else {

            element = document.createElement("a")
            element.href = url
            element.textContent = "Abrir arquivo"
            element.target = "_blank"

        }

        viewerBody.appendChild(element)
    })
}

function renderAnexosTarefa(anexos) {
    const container = document.getElementById("anexosContainer");

    container.innerHTML = "";

    anexos.forEach(anexo => {

        const item = document.createElement("div");
        item.classList.add("anexo-item");

        const nomeArquivo = anexo.url_caminho.split("/").pop();

        const icon = document.createElement("div");
        icon.classList.add("anexo-icon");

        if (anexo.mime_type.includes("pdf")) {
            icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#E53935">
      <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
    </svg>`;
        }
        else if (anexo.mime_type.includes("image")) {
            icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#43A047">
      <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14"/>
      <circle cx="8" cy="8" r="2"/>
      <path d="M21 15l-5-5L5 21h14z"/>
    </svg>`;
        }
        else if (anexo.mime_type.includes("zip")) {
            icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FB8C00">
      <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6z"/>
      <rect x="10" y="7" width="2" height="2"/>
      <rect x="10" y="11" width="2" height="2"/>
      <rect x="10" y="15" width="2" height="2"/>
    </svg>`;
        }
        else {
            icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#5C6BC0">
      <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6z"/>
    </svg>`;
        }

        const name = document.createElement("div");
        name.classList.add("anexo-nome");
        name.textContent = anexo.nome_original;

        const download = document.createElement("a");
        download.href = `${API_BASE}/anexo/download/${nomeArquivo}`;
        download.classList.add("anexo-download");
        download.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="svg">
              <path d="M.5 9.9v2.6A1.5 1.5 0 0 0 2 14h12a1.5 1.5 0 0 0 1.5-1.5V9.9h-1v2.6a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V9.9h-1z"/>
              <path d="M7.646 10.854a.5.5 0 0 0 .708 0l3-3-.708-.708L8.5 9.293V1.5h-1v7.793L5.354 7.146l-.708.708 3 3z"/>
            </svg>
        `;

        // IMPORTANTE: enviar token
        download.addEventListener("click", (e) => {
            e.preventDefault();

            fetch(download.href, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
                .then(res => res.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = anexo.nome_original;
                    a.click();
                    window.URL.revokeObjectURL(url);
                });
        });

        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(download);

        container.appendChild(item);
    });
}