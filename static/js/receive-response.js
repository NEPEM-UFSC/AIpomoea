/**
 * Handles script factory response and shows appropriate popup.
 * @example
 * handleFactoryResponse(event, response)
 * "Recebendo resposta do script Factory."
 * @param {Object} event - The event object.
 * @param {string} response - The response status ('success', 'failure', or other).
 * @returns {void} No return value.
 * @description
 *   - Logs response status and any errors encountered while showing popups.
 *   - Displays popups based on the success or failure of the operation.
 *   - Logs unknown response states.
 */
ipcRenderer.on('factory-response', (event, response) => {
    console.log('Recebendo resposta do script Factory.' , response);
    if (response === 'sucess') {
        console.log('Operação bem-sucedida.');
        try {
            showPopup('sucess-popup');
        }
        catch (error) {
            console.error('Erro ao exibir popup:', error);
        }

    } else if (response === 'failure') {
        console.log('Falha na operação.');
        try {
            showPopup('failure-popup');
        }
        catch (error) {
            console.error('Erro ao exibir popup:', error);
        }
    } else {
      console.log('Estado desconhecido:', response);
    }
  });

/**
 * Displays a specified popup and shows the popup overlay.
 * @example
 * showPopup('examplePopupId')
 * 
 * @param {string} popupId - The ID of the popup to display.
 * @returns {void} Does not return anything.
 * @description 
 *   - Hides the 'loading-popup'.
 *   - Shows the popup overlay by setting display to 'flex'.
 *   - Adds the 'active' class to the popup overlay element.
 */
function isErrorPopupActive() {
    const errorPopup = document.querySelector('.failure-popup');
    return errorPopup && errorPopup.style.display === 'flex';
}


function showPopup(popupId) {
    if (isErrorPopupActive() && popupId !== 'error-popup') {
        console.log('Não é possível exibir o popup de sucesso enquanto o popup de erro estiver ativo.');
        return;
    }

    document.getElementById('loading-popup').style.display = 'none';
    document.getElementById('popup-overlay').style.display = 'flex';
    document.querySelector('.popup-overlay').classList.add('active');
    document.getElementById(popupId).style.display = 'flex';
}
/**
* Closes the specified overlay and any popups.
* @example
* closePopup('overlay1')
* // overlays and popups are hidden
* @param {string} overlayId - ID of the overlay to be closed.
* @returns {void} No return value.
* @description
*   - Hides the element with the given ID and all elements with the 'popup' class.
*/
function closePopup(overlayId) {
document.getElementById(overlayId).style.display = 'none';
document.querySelectorAll('.popup').forEach(popup => {
    popup.style.display = 'none';
});
}