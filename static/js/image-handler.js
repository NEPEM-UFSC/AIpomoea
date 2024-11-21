let currentImage = 0;

/**
* Handles file input and displays the image.
* @example
* functionName()
* Displays selected image in an HTML element with id 'imageDisplay'.
* @param {Event} this - The event object containing the file input.
* @returns {void} Does not return any value.
* @description
*   - Uses FileReader to read file as Data URL.
*   - Sets the src attribute of an HTML element with id 'imageDisplay' to the file data.
*   - Clears the alt attribute of the image element.
*/
document.getElementById('fileInput').addEventListener('change', function() {
    const file = this.files[0];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif']; // Lista de extensões permitidas

    if (file) {
        const fileExtension = file.name.split('.').pop().toLowerCase(); // Obtém a extensão do arquivo

        if (allowedExtensions.includes(fileExtension)) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById('imageDisplay');
                img.src = e.target.result;
                img.alt = '';
            };
            reader.readAsDataURL(file);
        } else {
            alert('Tipo de arquivo não permitido. Por favor, selecione um arquivo de imagem.');
        }
    }
});

/**
 * Displays an image in the 'imageDisplay' element.
 * @example
 * displayImage(fileInput.files[0])
 * // Image is shown in the element with ID 'imageDisplay'
 * @param {File} image - The image file to be displayed.
 * @returns {void} No return value.
 * @description
 *   - Ensures the 'imageDisplay' element exists before attempting to display the image.
 *   - Logs an error if the 'imageDisplay' element is not found.
 */
function displayImage(image) {
    let imageDisplay = document.getElementById('imageDisplay');
    if (imageDisplay) {
        imageDisplay.src = URL.createObjectURL(image);
    } else {
        console.error('Elemento com ID "imageDisplay" não encontrado');
    }
}

/**
 * Displays the previous image from the selected file input.
 * @example
 * prevImage()
 * Displays the previous image in the sequence.
 * @returns {void} No return value.
 * @description
 *   - Loops through file input to find the current image index.
 *   - Determines the previous image index, cycling to the end if at the start.
 *   - Updates and displays the previous image.
 */
function prevImage() {
    var fileInput = document.getElementById('fileInput');
    var files = fileInput.files;
    var currentIndex = 0;
    for (var i = 0; i < files.length; i++) {
        if (files[i].name === currentImage) {
            currentIndex = i;
            break;
        }
    }
    var prevIndex = (currentIndex > 0) ? currentIndex - 1 : files.length - 1;
    var prevImage = files[prevIndex];
    displayImage(prevImage);
    currentImage = prevImage.name;
}

/**
* Updates the display to show the next image in the file input sequence.
* @example
* nextImage()
* No specific returned value but updates the displayed image.
* @param {none} No parameters are required for this function.
* @returns {void} No value is returned; the function updates the displayed image.
* @description
*   - Cycles through images in a file input element and displays the next image.
*   - If the current image is the last in the sequence, it loops back to the first image.
*   - Uses a global `currentImage` variable to track the currently displayed image.
*/
function nextImage() {
    let fileInput = document.getElementById('fileInput');
    let {files} = fileInput;
    let currentIndex = 0;
    for (var i = 0; i < files.length; i++) {
        if (files[i].name === currentImage) {
            currentIndex = i;
            break;
        }
    }
    const nextIndex = (currentIndex < files.length - 1) ? currentIndex + 1 : 0;
    const nextImage = files[nextIndex];
    displayImage(nextImage);
    currentImage = nextImage.name;
}

/**
* Uploads an image file selected by the user to the server
* @example
* uploadImage()
* undefined
* @param {HTMLInputElement} fileInput - The file input element to select image files.
* @returns {void} No return value.
* @description
*   - Sends image files' paths to the server using ipcRenderer.
*   - Handles errors during the image upload process.
*   - Logs an error if no image is selected.
*/
async function uploadImage() {
    const fileInput = document.getElementById('fileInput');
    console.log('fileInput:', fileInput);
    const { files } = fileInput;
    console.log('files:', files);

    if (files.length === 0) {
        console.error('Nenhuma imagem selecionada');
        return;
    }

    try {
        // Usando webUtils.getPathForFile para obter o caminho do arquivo
        const filePaths = await Promise.all(
            Array.from(files).map(async (file) => {
                console.log('file:', file);
                const path = await webUtils.getPathForFile(file);
                console.log('file path:', path);
                return path || file.webkitRelativePath || file.name;
            })
        );

        if (filePaths.length === 0) {
            console.error('Nenhum caminho de arquivo encontrado');
        } else if (filePaths.length > 1) {
            console.warn('Enviando apenas a primeira imagem selecionada');
        }
        console.log('Enviando imagem para o servidor:', filePaths[0]);
        ipcRenderer.send('upload-image', filePaths);
    } catch (e) {
        console.error('Erro ao enviar imagem para o servidor:', e);
    }
}
