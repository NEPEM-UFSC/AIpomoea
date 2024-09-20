ipcRenderer.send('request-version');
ipcRenderer.on('version-response', (_event, version) => {
    document.getElementById('app-version').textContent = version;
    window.version = version;
  });

  const fetchLatestVersion = async () => {
    try {
      const response = await fetch('https://nepemufsc.com/.netlify/functions/verser?project=AIpomoea');
      const data = await response.json();
      return data.latest_version;
    } catch (error) {
      console.error('Error fetching the latest version:', error);
      return null;
    }
  };
  
  // Function to update the version badge based on the comparison
  const updateVersionBadge = async () => {
    try {
      const latestVersion = await fetchLatestVersion();
      console.log('Latest version:', latestVersion);
      if (latestVersion) {
        let currentVersion = await window.version;
        currentVersion = currentVersion.replace('Versao: ', '');
        const status = latestVersion === currentVersion ? 'atualizada' : 'desatualizada';
        const color = latestVersion === currentVersion ? 'brightgreen' : 'red';
  
        const badgeElement = document.getElementById('version-badge');
        badgeElement.src = `https://img.shields.io/badge/Vers%C3%A3o_${status}-${color}?style=plastic`;
        
        document.getElementById('app-version').textContent = `${currentVersion}`;
  
        const statusText = document.getElementById('update-status');
        const updateButton = document.getElementById('update-button');
        const updateInfo = document.getElementById('update-info');
        const latestVersionSpan = document.getElementById('latest-version');
        const latestVersionPC = document.getElementById('latest-version-pc');
  
        if (status === 'desatualizada') {
          statusText.textContent = 'Sua versão está desatualizada.';
          latestVersionSpan.textContent = latestVersion;
          latestVersionSpan.classList.remove('hidden');
          updateButton.classList.remove('hidden');
          updateInfo.classList.remove('hidden');
  
          updateButton.addEventListener('click', () => {
            window.open('https://github.com/NEPEM-UFSC/AIpomoea/releases', '_blank');
          });
        } else {
          statusText.textContent = 'Você está usando a versão mais recente.';
          updateButton.classList.add('hidden');
          updateInfo.classList.add('hidden');
          latestVersionPC.classList.add('hidden');
        }
      } else {
        console.error('Latest version is null');
        document.getElementById('update-status').textContent = 'Erro ao verificar a versão.';
      }
    } catch (error) {
      console.error('Error updating the version badge:', error);
      document.getElementById('update-status').textContent = 'Erro ao verificar a versão.';
    }
  };
  
  // Call the update function when the window loads
  window.onload = updateVersionBadge;
  
  