(function () {
    if (!window.electronAPI || !window.electronAPI.isDebug) return;

    console.log("🛠️ DevMenu Active");

    const views = window.electronAPI.getAvailableViews();

    // Estilos do Menu
    const style = document.createElement('style');
    style.textContent = `
        #ai-dev-menu {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            background: #222;
            color: #fff;
            padding: 10px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            opacity: 0.3;
            transition: opacity 0.3s, transform 0.3s;
            max-height: 40px;
            overflow: hidden;
            border: 1px solid #444;
        }
        #ai-dev-menu:hover {
            opacity: 1;
            max-height: 500px;
            transform: scale(1.05);
        }
        #ai-dev-menu h4 {
            margin: 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #444;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #ai-dev-menu .view-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow-y: auto;
        }
        #ai-dev-menu button {
            background: #333;
            color: #ccc;
            border: none;
            padding: 5px 10px;
            text-align: left;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        #ai-dev-menu button:hover {
            background: #555;
            color: #fff;
        }
        #ai-dev-menu .active-view {
            color: #00ff00 !important;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);

    // Estrutura do Menu
    const menu = document.createElement('div');
    menu.id = 'ai-dev-menu';

    const currentFile = window.location.pathname.split('/').pop() || 'index.html';

    let buttonsHtml = '';
    views.forEach(view => {
        const isActive = view === currentFile ? 'class="active-view"' : '';
        buttonsHtml += `<button ${isActive} onclick="window.location.href='${view}'">${view}</button>`;
    });

    menu.innerHTML = `
        <h4><span>🛠️ DEV NAV</span> <span style="font-size:8px; color:#888;">DEBUG ON</span></h4>
        <div class="view-list">
            ${buttonsHtml}
        </div>
    `;

    document.body.appendChild(menu);
})();
