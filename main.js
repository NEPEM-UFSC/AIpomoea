const { app, BrowserWindow, ipcRenderer, dialog } = require('electron')
const path = require('path')
const fs = require('fs');
const { execFile } = require('child_process');
const { ipcMain } = require('electron');
const logger = require('./tools/logger');
logger.level = 'info';

if (process.env.debug) {
  DEBUG = true;
  logger.level = 'debug';
  logger.log({ level: 'debug', message: 'Modo de depuracao ativado.' });
} else DEBUG = false;

const appVersion = app.getVersion();
const microversion = "beta";

const childProcess = require('child_process');
const { log, error } = require('node:console');
const { Logger } = require('winston');
const configPath = path.join(__dirname, 'config.json');
var firstSession = false;

// Inicializar o logger
logger.log({ level: 'info', message: 'Iniciando app.' });
if (fs.existsSync(configPath)) {
  logger.log({ level: 'info', message: 'Dir de configuracao:', path: configPath });
} else {
  let retries = 0;
  const maxRetries = 3;
  while (!fs.existsSync(configPath) && retries < maxRetries) {
    logger.log({ level: 'error', message: 'Arquivo de configuracao nao encontrado.' });
    CreateConfig();
    retries+=1;
  }
  if (!fs.existsSync(configPath)) {
    logger.log({ level: 'error', message: 'Falha ao criar o arquivo de configuracao.' });
    return error;
  }
}
logger.log({ level: 'info', message: 'Detectando modelos...' });
loadModels();

logger.log({ level: 'info', message: `AIpomoea - V: ${  appVersion  }-${  microversion}` });
logger.log({ level: 'info', message: 'Executando...'})
if (fs.existsSync(path.join(__dirname, 'session.aipomoea'))) {
  logger.log({ level: 'info', message: 'Arquivo de sessao anterior encontrado.' });
  var firstSession = false
  CreateSessionFile();
} else {
  logger.log({ level: 'info', message: 'Arquivo de sessao anterior nao encontrado.' });
  var firstSession = true;
  CreateSessionFile();
}

app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('disable-web-security');
let mainWindow;

/**
 * Creates a new session file.
 * 
 * @function CreateSessionFile
 * @returns {void}
 */
function CreateSessionFile() {
  logger.log({ level: 'info', message: 'Criando novo arquivo de sessao.' });
  const sessionData = {
    session: Date.now(),
    version: `${appVersion}-${microversion}`
  };
  const sessionPath = path.join(__dirname, 'session.aipomoea');
  fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2), 'utf8');
  logger.log({ level: 'info', message: 'Arquivo de sessao criado com sucesso.' });
  logger.log({ level: 'debug', message: `Dados da sessao: ${  JSON.stringify(sessionData)}` });
}
/**
 * Creates a configuration file with default values.
 */
function CreateConfig() {
  const defaultConfig = {
    "OUTPUT_DIR": "results",
    "OUTPUT_STANDART": "standart",
    "NAMING_CONVENTION": "Matrix-Gen-Rep",
    "ENABLE_NAMING_SEPARATION": true,
    "ENABLE_DB": false,
    "FORCE_MAXPERFORMANCE": false,
    "DB_PATH": " ",
    "DB_NAME": "aipomoea"
  };
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
  logger.log({ level: 'info', message: 'Arquivo de configuracao criado com valores padrao.' });  
}

/**
 * Reads the configuration file and returns the parsed configuration object.
 * 
 * @param {boolean} [response=false] - Whether to return the configuration object or not.
 * @returns {Object|null} - The parsed configuration object if `response` is `true`, otherwise `null`.
 */
function readConfig(response=false) {
  try {
    logger.log({ level: 'info', message: 'Lendo arquivo de configuracao.' });
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    if (config) {
      const output_dir = config.OUTPUT_DIR;
      const output_standart = config.OUTPUT_STANDART;
      const naming_convention = config.NAMING_CONVENTION;
      const enable_naming_separation = config.ENABLE_NAMING_SEPARATION;
      const force_maxperfomance =  config.FORCE_MAXPERFORMANCE;
      const enable_db = config.ENABLE_DB;
      const db_path = config.DB_PATH;
      const db_name = config.DB_NAME;
      logger.log({ level: 'info', message: 'Arquivo de configuracao lido com sucesso.' });
      logger.log({ level: 'debug', message: `Configuracoes: ${  JSON.stringify(config)}` });
      if (response) {
        return config;
      }
    } else {
    logger.log({ level: 'error', message: 'Arquivo Config nao esta disponivel ou nao foi encontrado.' });
    return error;
    }
  } catch (error) {
    logger.log({ level: 'error', message: `Erro ao tentar ler o arquivo de configuracao: ${error}` });
    return null;
  }
}

/**
 * Loads models from the specified directory, gathers detailed info from each .exe,
 * and saves all in a single JSON file.
 */


function loadModels() {
  logger.log({ level: 'info', message: 'realizando models_check "MODELSINFO" ' });
  const MODELS_PATH = path.join(__dirname, 'models');
  const models = {
      root: [],
      leaves: [],
      details: {}
  };

  try {
      fs.readdir(MODELS_PATH, (err, files) => {
          if (err) {
              logger.log({ level: 'error', message: `Erro ao tentar ler o diretório de modelos: ${err}` });
              return;
          }

          // Processa arquivos .exe para classificação hierárquica e coleta de informações detalhadas
          const exeFiles = files.filter(file => file.endsWith('.exe'));

          exeFiles.forEach((file) => {
              const modelName = file.replace('.exe', '');
              if (modelName.startsWith('root_')) {
                  models.root.push(modelName);
              } else if (modelName.startsWith('leaves_')) {
                  models.leaves.push(modelName);
              }
          });

          // Salva hierarquia básica de modelos e, em seguida, adiciona detalhes específicos
          const modelsJsonPath = path.join(__dirname, 'models.json');
          fs.writeFileSync(modelsJsonPath, JSON.stringify(models, null, 2), 'utf8');
          logger.log({ level: 'info', message: 'Modelos carregados e indexados em models.json' });

          // Itera sobre cada arquivo .exe para coletar informações detalhadas
          exeFiles.forEach((file) => {
              const filePath = path.join(MODELS_PATH, file);
              const basename = path.basename(file, '.exe');

              execFile(filePath, ['--info'], (error, stdout) => {
                  if (error) {
                      logger.log({ level: 'error', message: `Erro ao processar ${basename}: ${error.message}` });
                      return;
                  }

              // Sanitização aprimorada do stdout
              const sanitizedOutput = stdout
                .split('*')                              // Divide pelo delimitador '*'
                .map(info => info.replace(/\*/g, '').trim()) // Remove todos os '*' e espaços
                .filter(info => info);  

              if (sanitizedOutput[0] === '') {
                    sanitizedOutput.shift();  // Remove o primeiro elemento
              }
                
              // Definimos variáveis apenas se houver um número esperado de campos
              if (sanitizedOutput.length >= 5) {
                  const [model_name, arc_name, arc_version, dataset, bin_eval_name] = sanitizedOutput;

                  models.details[basename] = {
                      model_name: model_name || "Desconhecido",
                      arc_name: arc_name || "N/D",
                      arc_version: arc_version || "N/D",
                      dataset: dataset || "N/D",
                      bin_eval_name: bin_eval_name || "N/D"
                  };


                  // Atualiza o arquivo JSON com os detalhes
                  try {
                      fs.writeFileSync(modelsJsonPath, JSON.stringify(models, null, 2), 'utf8');
                      logger.log({ level: 'info', message: `Detalhes de ${basename} adicionados ao models.json` });
                  } catch (writeErr) {
                      logger.log({ level: 'error', message: `Erro ao tentar atualizar models.json: ${writeErr}` });
                  }
              } else {
                  logger.log({ level: 'warn', message: `Formato de saída inesperado para ${basename}, dados ignorados.` });
              }
              });
          });
      });
  } catch (err) {
      logger.log({ level: 'error', message: `Erro inesperado: ${err}` });
  }
}

/**
 * Creates a window and loads the appropriate HTML file based on the firstSession flag.
 * @function createWindow
 * @returns {void}
 */
function createWindow () {
  logger.log({ level: 'info', message: 'Criando janela principal.' });
  mainWindow = new BrowserWindow({
    resizable: true,
    width: 1100,
    height: 700,
    icon: `${__dirname  }/icone.ico`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: false
    }
  })
  
  mainWindow.maximize();
  readConfig();
  if (firstSession) {
  mainWindow.loadFile('views/first_time.html')
  }
  else {
    mainWindow.loadFile('views/index.html')
  }
  logger.log({ level: 'info', message: 'Janela principal criada com sucesso.' });
  mainWindow.setMenuBarVisibility(false)
  if (DEBUG){ mainWindow.webContents.openDevTools(); mainWindow.setMenuBarVisibility(true)}

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow)

app.on('activate', () => {
  logger.log({ level: 'info', message: 'Ativando janela principal.' });
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  
app.on('window-all-closed', () => {
  logger.log({ level: 'info', message: 'Fechando janela principal.' });

  try {
    const recipeFilePath = path.join(__dirname, 'recipe.json');
    const customPreloadingFilePath = path.join(__dirname, 'custom_preloading.json');
    const modelsJsonPath = path.join(__dirname, 'models.json');

  [recipeFilePath, customPreloadingFilePath, modelsJsonPath].forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          logger.log({ level: 'error', message: `Erro ao excluir o arquivo: ${err}` });
          return;
        }
        logger.log({ level: 'info', message: `Arquivo excluido com sucesso: ${filePath}` });
      });
    } else {
      logger.log({ level: 'info', message: `Arquivo nao encontrado: ${filePath}` });
    }
  });

  fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
    if (err) {
      logger.log({ level: 'error', message: `Erro ao ler o diretorio: ${err}` });
      return;
    }

    files.forEach((file) => {
      const uploadFilePath = path.join(__dirname, 'uploads', file);
      if (fs.existsSync(uploadFilePath)) {
        fs.unlink(uploadFilePath, (err) => {
          if (err) {
            logger.log({ level: 'error', message: `Erro ao excluir o arquivo: ${err}` });
            return;
          }
          logger.log({ level: 'info', message: `Arquivo excluido com sucesso: ${uploadFilePath}` });
        });
      } else {
        logger.log({ level: 'info', message: `Arquivo nao encontrado: ${uploadFilePath}` });
      }
    });
  });
} catch (err) {
  logger.log({ level: 'error', message: `Erro inesperado: ${err}` });
}
app.quit();
});

function removeUploadedFiles() {
  fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
    if (err) {
      logger.log({ level: 'error', message: `Erro ao ler o diretorio: ${err}` });
      return;
    }

    files.forEach((file) => {
      const uploadFilePath = path.join(__dirname, 'uploads', file);
      if (fs.existsSync(uploadFilePath)) {
        fs.unlink(uploadFilePath, (err) => {
          if (err) {
            logger.log({ level: 'error', message: `Erro ao excluir o arquivo: ${err}` });
            return;
          }
          logger.log({ level: 'info', message: `Arquivo excluido com sucesso: ${uploadFilePath}` });
        });
      } else {
        logger.log({ level: 'info', message: `Arquivo nao encontrado: ${uploadFilePath}` });
      }
    });
  });
} 

// Configura um listener para o evento 'log-message' emitido do processo renderer.
ipcMain.on('log-message', (event, level, message) => {
    logger.log({ level, message });
});

// Configura um listener para o evento 'request-version' emitido do processo renderer.
ipcMain.on('request-version', (event) => {
  const version = `Versao: ${  appVersion  }-${  microversion}`;
  event.sender.send('version-response', version);
}),

// Configura um listener para o evento 'upload-image' emitido do processo renderer.
ipcMain.on('upload-image', (event, filePaths) => {
  // Registra uma mensagem de informaçao indicando que a imagem esta sendo recebida.
  logger.log({ level: 'info', message: 'Recebendo imagem.' });
  logger.log({ level: 'debug', message: `Caminhos dos arquivos: ${filePaths}` });
  if (filePaths.length === 0) {
    logger.log({ level: 'error', message: 'Nenhuma imagem selecionada.' });
    throw new Error('Nenhum caminho passado');
  }
  try {
    // Verifique se filePaths é um array e não está vazio
    if (Array.isArray(filePaths) && filePaths.length > 0) {
      // Itera sobre os caminhos dos arquivos fornecidos.
      filePaths.forEach((originalPath) => {
        // Verifique se originalPath é uma string
        if (typeof originalPath === 'string') {
          // Obtem o nome do arquivo a partir do caminho original.
          const filename = path.basename(originalPath);
          
          // Define o caminho onde a imagem sera salva.
          const savePath = path.join(__dirname, 'uploads', filename);
  
          // Copia o arquivo do caminho original para o caminho de salvamento.
          fs.copyFile(originalPath, savePath, (err) => {
            if (err) {
              // Registra uma mensagem de erro se a copia falhar.
              logger.log({ level: 'error', message: `Erro ao salvar a imagem: ${err}` });
              
              // Envia uma resposta de erro para o processo renderer.
              event.sender.send('upload-image-response', 'Erro ao fazer upload da imagem.');
              return;
            }
            
            // Registra uma mensagem de sucesso se a imagem for salva com sucesso.
            logger.log({ level: 'info', message: `Imagem salva com sucesso: ${savePath}` });
            
            // Envia uma resposta de sucesso para o processo renderer.
            event.sender.send('upload-image-response', 'Imagem enviada com sucesso!');
          });
        } else {
          // Registra uma mensagem de erro se originalPath não for uma string
          logger.log({ level: 'error', message: 'Caminho do arquivo inválido: não é uma string.' });
        }
      });
    } else {
      // Registra uma mensagem de erro se filePaths não for um array ou estiver vazio
      logger.log({ level: 'error', message: 'Nenhum caminho de arquivo fornecido ou caminho de arquivo inválido.' });
    }
  } catch (error) {
    // Registra uma mensagem de erro se ocorrer um erro inesperado.
    logger.log({ level: 'error', message: `Erro inesperado: ${error}` });
  }
});

// Configura um listener para o evento 'run-factory' emitido do processo renderer.
ipcMain.on('run-factory', (event, args) => {
  // Define o caminho para o executavel do Python e para o script Factory.
  const PY_PATH = path.join(__dirname, 'python', 'python.exe');
  const FAC_PATH = path.join(__dirname, 'tools', 'factory.py');

  // Registra uma mensagem de informaçao indicando que o script Factory esta sendo executado.
  logger.log({ level: 'info', message: 'Executando script Factory.' });
  logger.log({ level: 'info', message: `Caminho do script: ${FAC_PATH}` });
  logger.log({ level: 'info', message: 'Iniciando processo...' });

  try {
    // Inicia o processo Python com o script Factory como argumento.
    const pythonProcess = childProcess.spawn(PY_PATH, [FAC_PATH]);

    // Registra uma mensagem de sucesso indicando que o processo Python foi iniciado.
    logger.log({ level: 'info', message: 'Processo Python iniciado com sucesso.' });

    // Configura o listener para a saida padrao do processo Python.
    pythonProcess.stdout.on('data', (data) => {
      logger.log({ level: 'info', message: `Resposta do script Factory: ${data.toString()}` });

      // Verifica a resposta do script e envia uma resposta apropriada para o processo renderer.
      if (data.toString().includes('error')) {
        logger.log({ level: 'error', message: 'Erro ao finalizar processo Factory.' });
        mainWindow.webContents.send('factory-response', 'failure');
      } else if (data.toString().includes('done')) {
        logger.log({ level: 'info', message: 'Processo Factory finalizado com sucesso.' });
        mainWindow.webContents.send('factory-response', 'sucess');

      } else {
        logger.log({ level: 'error', message: 'Resposta inesperada do script Factory.' });
        mainWindow.webContents.send('factory-response', 'failure');
      }
      removeUploadedFiles();
    });

    // Configura o listener para a saida de erro do processo Python.
    pythonProcess.stderr.on('data', (data) => {
      logger.log({ level: 'error', message: `Erro do script Factory: ${data.toString()}` });
      mainWindow.webContents.send('factory-response', 'failure');
    });

    // Configura o listener para a saida do processo Python.
    pythonProcess.on('exit', (code) => {
      if (code !== 0) {
        logger.log({ level: 'error', message: `O processo Python encerrou com erro, codigo de saida ${code}` });
      } else {
        logger.log({ level: 'info', message: `O processo Python foi encerrado com sucesso, codigo de saida ${code}` });
      }
    });

    // Configura o listener para o fechamento do processo Python.
    pythonProcess.on('close', (code) => {
      logger.log({ level: 'debug', message: `cls: O processo Python foi encerrado com codigo de saida ${code}` });
    });

    // Configura o listener para erros ao iniciar o processo Python.
    pythonProcess.on('error', (error) => {
      logger.log({ level: 'error', message: `Falha ao iniciar o processo Python: ${error}` });
      mainWindow.webContents.send('factory-response', 'failure');
    });
  } catch (error) {
    // Envia uma resposta de falha e registra uma mensagem de erro se uma exceçao ocorrer.
    mainWindow.webContents.send('factory-response', 'failure');
    logger.log({ level: 'error', message: `Erro ao iniciar o processo Python: ${error}` });
  }
});

// Configura um listener para o evento 'receive_commands' emitido do processo renderer.
ipcMain.on('receive_commands', (event, { typemode, checkboxStates }) => {
  // Cria um objeto com os dados recebidos do evento.
  const data = {
    typemode,
    checkboxStates
  };
  
  // Registra uma mensagem de informaçao indicando que comandos estao sendo recebidos.
  logger.log({ level: 'info', message: 'Recebendo comandos.' });

  // Define o caminho do arquivo onde os dados serao salvos.
  const filePath = path.join(__dirname, 'recipe.json');

  // Escreve os dados no arquivo JSON especificado.
  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      // Registra uma mensagem de erro se ocorrer um problema ao salvar o arquivo JSON.
      logger.log({ level: 'error', message: `Erro ao salvar arquivo JSON: ${err}` });
      return;
    }
    
    // Registra uma mensagem de sucesso indicando que o arquivo JSON foi salvo com sucesso.
    logger.log({ level: 'info', message: 'Arquivo JSON salvo com sucesso.' });
    
    // Registra uma mensagem de depuraçao com o conteúdo dos comandos recebidos.
    logger.log({ level: 'debug', message: `COMANDOS: ${JSON.stringify(data)}` });
    
    // Emite o evento 'run-factory' para iniciar o processo de Factory.
    ipcMain.emit('run-factory');
  });
});

// Ouvinte do evento 'read-config' do ipcMain
ipcMain.on('read-config', () => {
  // Le a configuraçao chamando a funçao readConfig com o argumento true
  const config = readConfig(true);
  
  // Registra a configuraçao lida no logger com nivel de debug
  logger.log({ level: 'debug', message: `Configuracoes: ${JSON.stringify(config)}` });
  
  // Envia a configuraçao lida para o conteúdo da janela principal via IPC
  mainWindow.webContents.send('config-response', config);
});

// Ouvinte do evento 'write-config' do ipcMain
ipcMain.on('write-config', (event, newConfig) => {
  // Registra a nova configuração recebida no logger com nível de debug
  logger.log({ level: 'debug', message: `Nova configuração: ${JSON.stringify(newConfig)}` });

  try {
    // Lê o conteúdo do arquivo de configuração
    const configFileContent = fs.readFileSync(configPath, 'utf8');
    // Converte o conteúdo do arquivo de configuração de JSON para objeto
    const config = JSON.parse(configFileContent);

    // Atualiza o objeto de configuração com os novos valores
    Object.keys(newConfig).forEach(key => {
      config[key] = newConfig[key];
    });

    // Converte o objeto de configuração atualizado de volta para JSON
    const updatedConfigContent = JSON.stringify(config, null, 2);

    // Escreve o conteúdo atualizado de volta no arquivo de configuração
    fs.writeFileSync(configPath, updatedConfigContent, 'utf8');
    // Registra no logger que o arquivo de configuração foi atualizado com sucesso
    logger.log({ level: 'info', message: 'Arquivo config foi atualizado com sucesso.' });

    // Envia uma resposta de sucesso para o processo renderer
    event.sender.send('write-config-response', 'success');
  } catch (error) {
    // Registra no logger qualquer erro que ocorra durante a escrita do arquivo de configuração
    logger.log({ level: 'error', message: `Erro escrevendo o arquivo de configuração: ${error}` });
    // Envia uma resposta de erro para o processo renderer
    event.sender.send('write-config-response', 'failure');
  }
});

// Ouvinte do evento 'request-naming' do ipcMain
ipcMain.on('request-naming', (event) => {
  const config = readConfig(true);
  event.sender.send('naming-response', {
    enableNamingSeparation: config.ENABLE_NAMING_SEPARATION,
    namingConvention: config.NAMING_CONVENTION
  });
    logger.log({ level: 'debug', message: `Separacao de nomes ativada: ${config.ENABLE_NAMING_SEPARATION}` });
    logger.log({ level: 'debug', message: `Convencao de nomes: ${config.NAMING_CONVENTION}` });
});

// Ouvinte do evento 'request-phenotype' do ipcMain
ipcMain.on('receive-custom', (event, customData) => {
  logger.log({ level: 'debug', message: 'Recebendo dados personalizados.' });

  // Verifica se os dados personalizados foram fornecidos
  if (!customData) {
    logger.log({ level: 'error', message: 'Dados personalizados nao fornecidos.' });
    return;
} 
  // Registra os dados personalizados recebidos
  const customJson = JSON.stringify(customData, null, 2);
  logger.log({ level: 'info', message: `Dados personalizados: ${customJson}` });
  const customPath = path.join(__dirname, 'custom_preloading.json');

  fs.writeFile(customPath, customJson, (err) => {
      if (err) {
          logger.log({ level: 'error', message: `Erro ao salvar arquivo JSON personalizado: ${err}` });
          return;
      }
      logger.log({ level: 'info', message: 'Arquivo JSON personalizado salvo com sucesso.' });
  });
});

ipcMain.on('check-models-info', (event) => {
  const modelsJsonPath = path.join(__dirname, 'models.json');

  fs.readFile(modelsJsonPath, 'utf8', (err, data) => {
      if (err) {
          console.error(`Erro ao ler models.json: ${err}`);
          event.sender.send('models-info-response', { error: 'Erro ao ler models.json' });
          return;
      }

      try {
          const models = JSON.parse(data);
          event.sender.send('models-info-response', models);
      } catch (parseErr) {
          console.error(`Erro ao parsear JSON: ${parseErr}`);
          event.sender.send('models-info-response', { error: 'Erro ao parsear models.json' });
      }
  });
});

ipcMain.on('check-models', (event) => {
  const MODELS_PATH = path.join(__dirname, 'models');
  fs.readdir(MODELS_PATH, (err, files) => {
    if (err) {
      logger.log({ level: 'error', message: `Erro ao tentar ler o diretório de modelos: ${err}` });
      event.sender.send('models-check-response', { error: 'Erro ao tentar ler o diretório de modelos' });
      return;
    }

    const exeFiles = files.filter(file => file.endsWith('.exe'));
    const invalidExecutables = [];

    exeFiles.forEach((file, index) => {
      const filePath = path.join(MODELS_PATH, file);

      execFile(filePath, ['--info'], (error, stdout) => {
        if (error || !stdout.includes('*')) {
          invalidExecutables.push(file);
        }

        if (index === exeFiles.length - 1) {
          if (invalidExecutables.length > 0) {
            logger.log({ level: 'error', message: `Executaveis invalidos: ${invalidExecutables.join(', ')}` });
            event.sender.send('models-check-response', { status: 'error', invalidExecutables });
          } else {
            logger.log({ level: 'info', message: 'Todos os executáveis sao validos.' });
            event.sender.send('models-check-response', { status: 'good', message: 'Todos os executaveis sao validos.' });
        }
        }
      });
    });
  });
});

ipcMain.on('open-db-file-dialog', (event) => {
  logger.log({ level: 'debug', message: 'open-db-file-dialog event received' });

  dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
          { name: 'Databases', extensions: ['db'] }
      ]
  }).then(result => {
      if (!result.canceled) {
          logger.log({ level: 'debug', message: `File selected: ${result.filePaths[0]}` });
          event.sender.send('selected-db-file', result.filePaths[0]);
      } else {
          logger.log({ level: 'debug', message: 'File selection canceled' });
      }
  }).catch(err => {
      logger.log({ level: 'debug', message: `Error during file selection: ${err}` });
  });
});