const { app, BrowserWindow, ipcRenderer, dialog, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs');
const { execFile } = require('child_process');
const { ipcMain } = require('electron');
const childProcess = require('child_process');
const PythonEnvManager = require('./PythonEnvManager');
const logger = require('./logger');
const sqlite3 = require('sqlite3').verbose();

// ============================================================================
// SPEC 1 & 3: Configuração de Caminhos de Dados do Usuário
// ============================================================================

const isDev = !app.isPackaged;

const MODELS_PATH = isDev
  ? path.join(__dirname, 'models')
  : path.join(process.resourcesPath, 'models');

const USER_DATA_PATH = app.getPath('userData');


// ============================================================================
// Database Initialization
// ============================================================================
let db;

function initializeDatabase() {
  db.serialize(() => {
    // Tabela de Projetos
    db.run(`
            CREATE TABLE IF NOT EXISTS projetos (
                id_projeto INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                dimensoes_json TEXT NOT NULL,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Tabela de Amostras
    db.run(`
            CREATE TABLE IF NOT EXISTS amostras (
                id_amostra INTEGER PRIMARY KEY AUTOINCREMENT,
                id_projeto INTEGER NOT NULL,
                tipo_analise TEXT NOT NULL,
                caminho_absoluto TEXT NOT NULL,
                caminho_thumbnail TEXT,
                metadados_json TEXT,
                resultados_json TEXT,
                FOREIGN KEY (id_projeto) REFERENCES projetos(id_projeto) ON DELETE CASCADE
            )
        `);

    // Index para performance em grandes volumes
    db.run(`CREATE INDEX IF NOT EXISTS idx_amostras_projeto ON amostras(id_projeto)`);
  });
}

function startDatabase() {
    const dbPath = path.join(USER_DATA_PATH, 'alpomoea_data.sqlite');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            logger.log({ level: 'error', message: `Erro ao abrir banco de dados: ${err.message}` });
        } else {
            logger.log({ level: 'info', message: 'Conectado ao banco de dados SQLite.' });
            initializeDatabase();
        }
    });
}


let envManager;

const PATHS = {
  UPLOADS_DIR: path.join(USER_DATA_PATH, 'uploads'),
  RESULTS_DIR: path.join(USER_DATA_PATH, 'results'),
  LOGS_DIR: path.join(USER_DATA_PATH, 'logs'),
  SESSION_FILE: path.join(USER_DATA_PATH, 'session.json'),
  CONFIG_FILE: path.join(USER_DATA_PATH, 'config.json'),
  RECIPE_FILE: path.join(USER_DATA_PATH, 'recipe.json'),
  CUSTOM_PRELOADING_FILE: path.join(USER_DATA_PATH, 'custom_preloading.json'),
  MODELS_JSON_FILE: path.join(USER_DATA_PATH, 'models.json'),
  OLD_SESSION_FILE: path.join(USER_DATA_PATH, 'session.aipomoea')
};

const configPath = PATHS.CONFIG_FILE;
const sessionPath = PATHS.SESSION_FILE;
const uploadsPath = PATHS.UPLOADS_DIR;
const modelsPath = MODELS_PATH;

/**
 * Garante que todos os diretórios de dados do usuário existam
 */
function ensureUserDataDirsExist() {
  try {
    fs.mkdirSync(PATHS.UPLOADS_DIR, { recursive: true });
    fs.mkdirSync(PATHS.RESULTS_DIR, { recursive: true });
    fs.mkdirSync(PATHS.LOGS_DIR, { recursive: true });
    logger.log({ level: 'info', message: 'Diretórios de dados do usuário criados com sucesso.' });
  } catch (error) {
    logger.log({ level: 'error', message: `Erro ao criar diretórios de dados: ${error}` });
    throw error;
  }
}

logger.level = 'info';

// Corrigir verificação de debug - verificar múltiplas variáveis e flags parciais
const DEBUG = process.env.DEBUG === 'true' ||
  process.env.debug === 'true' ||
  process.argv.some(arg => arg.includes('--debug') || arg.includes('--inspect'));

const UI_ONLY = process.env.UI_ONLY === 'true' ||
  process.argv.includes('--ui-only');

if (DEBUG) {
  logger.level = 'debug';
  logger.log({ level: 'debug', message: 'Modo de depuracao ativado.' });
  console.log('🔧 Debug mode enabled');
} else {
  console.log('▶️ Starting AIpomoea in production mode');
}

if (UI_ONLY) {
  console.log('🎨 UI-ONLY mode enabled: Skipping backend initialization');
  logger.log({ level: 'info', message: 'Modo UI-ONLY ativado. Pulando inicialização do backend.' });
}

const appVersion = app.getVersion();
const microversion = "";

const { log, error } = require('node:console');
const { Logger } = require('winston');
var firstSession = false;

logger.log({ level: 'info', message: 'Iniciando app.' });

// Garantir que os diretórios de dados do usuário existam
ensureUserDataDirsExist();

// Iniciar Banco de Dados após garantir diretórios e caminhos
startDatabase();

if (fs.existsSync(configPath)) {
  logger.log({ level: 'info', message: 'Dir de configuracao:', path: configPath });
} else {
  let retries = 0;
  const maxRetries = 3;
  while (!fs.existsSync(configPath) && retries < maxRetries) {
    logger.log({ level: 'error', message: 'Arquivo de configuracao nao encontrado.' });
    CreateConfig();
    retries += 1;
  }
  if (!fs.existsSync(configPath)) {
    logger.log({ level: 'error', message: 'Falha ao criar o arquivo de configuracao.' });
    return error;
  }
}
if (!UI_ONLY) {
  logger.log({ level: 'info', message: 'Detectando modelos...' });
  loadModels();
}

logger.log({ level: 'info', message: `AIpomoea - V: ${appVersion}-${microversion}` });
logger.log({ level: 'info', message: 'Executando...' })
if (fs.existsSync(PATHS.OLD_SESSION_FILE)) {
  logger.log({ level: 'info', message: 'Arquivo de sessao anterior encontrado.' });
  var firstSession = false
  CreateSessionFile();
} else {
  logger.log({ level: 'info', message: 'Arquivo de sessao anterior nao encontrado.' });
  var firstSession = true;
  CreateSessionFile();
  // Criar arquivo de marcação de primeira sessão concluída
  fs.writeFileSync(PATHS.OLD_SESSION_FILE, JSON.stringify({ firstRun: Date.now() }, null, 2), 'utf8');
  logger.log({ level: 'info', message: 'Marcador de primeira sessao criado.' });
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

  // Garantir que o diretório userData existe
  const userDataDir = path.dirname(sessionPath);
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2), 'utf8');
  logger.log({ level: 'info', message: 'Arquivo de sessao criado com sucesso.' });
  logger.log({ level: 'debug', message: `Dados da sessao: ${JSON.stringify(sessionData)}` });
}
/**
 * Creates a configuration file with default values.
 */
function CreateConfig() {
  const defaultConfig = {
    "OUTPUT_DIR": PATHS.RESULTS_DIR,
    "OUTPUT_STANDART": "standart",
    "NAMING_CONVENTION": "Matrix-Gen-Rep",
    "ENABLE_NAMING_SEPARATION": true,
    "FORCE_MAXPERFORMANCE": false,
    "ENABLE_DB": false,
    "DB_PATH": "",
    "DB_NAME": "aipomoea"
  };

  // Garantir que o diretório userData existe
  const userDataDir = path.dirname(configPath);
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
  logger.log({ level: 'info', message: 'Arquivo de configuracao criado com valores padrao.' });
}

/**
 * Reads the configuration file and returns the parsed configuration object.
 * 
 * @param {boolean} [response=false] - Whether to return the configuration object or not.
 * @returns {Object|null} - The parsed configuration object if `response` is `true`, otherwise `null`.
 */
function readConfig(response = false) {
  try {
    logger.log({ level: 'info', message: 'Lendo arquivo de configuracao.' });
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    if (config) {
      const output_dir = config.OUTPUT_DIR;
      const output_standart = config.OUTPUT_STANDART;
      const naming_convention = config.NAMING_CONVENTION;
      const enable_naming_separation = config.ENABLE_NAMING_SEPARATION;
      const force_maxperfomance = config.FORCE_MAXPERFORMANCE;
      const enable_db = config.ENABLE_DB;
      const db_path = config.DB_PATH;
      const db_name = config.DB_NAME;
      logger.log({ level: 'info', message: 'Arquivo de configuracao lido com sucesso.' });
      logger.log({ level: 'debug', message: `Configuracoes: ${JSON.stringify(config)}` });
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
      const exeFiles = files.filter(file => file.endsWith('.exe'));

      exeFiles.forEach((file) => {
        const modelName = file.replace('.exe', '');
        if (modelName.startsWith('root_')) {
          models.root.push(modelName);
        } else if (modelName.startsWith('leaves_')) {
          models.leaves.push(modelName);
        }
      });

      const modelsJsonPath = path.join(USER_DATA_PATH, 'models.json');
      fs.writeFileSync(modelsJsonPath, JSON.stringify(models, null, 2), 'utf8');
      logger.log({ level: 'info', message: 'Modelos carregados e indexados em models.json' });

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
function createWindow() {
  logger.log({ level: 'info', message: 'Criando janela principal.' });
  console.log('🪟 Creating main window...');

  mainWindow = new BrowserWindow({
    resizable: true,
    width: 1100,
    height: 700,
    icon: path.join(__dirname, 'icone.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  })

  mainWindow.maximize();
  readConfig();

  if (firstSession) {
    console.log('👋 First session detected, loading welcome screen');
    mainWindow.loadFile('views/first_time.html')
  } else {
    console.log('🏠 Loading main interface');
    mainWindow.loadFile('views/index.html')
  }

  logger.log({ level: 'info', message: 'Janela principal criada com sucesso.' });
  mainWindow.setMenuBarVisibility(false)

  if (DEBUG) {
    console.log('🔍 Opening DevTools in debug mode');
    mainWindow.webContents.openDevTools();
    mainWindow.setMenuBarVisibility(true);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Adicionar log quando a janela estiver pronta
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('✅ Application window loaded successfully');
    logger.log({ level: 'info', message: 'Interface carregada com sucesso.' });
  });

  // Adicionar tratamento de erros de carregamento
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load window:', errorDescription);
    logger.log({ level: 'error', message: `Falha ao carregar janela: ${errorDescription}` });
  });
}

app.whenReady().then(async () => {
  if (UI_ONLY) {
    createWindow();
    return;
  }

  envManager = new PythonEnvManager();
  const setupSuccess = await envManager.checkAndSetupVenv();

  if (!setupSuccess) {
    dialog.showErrorBox(
      'Erro Crítico',
      'Falha ao configurar o ambiente Python. O aplicativo não pode continuar.'
    );
    app.quit();
    return;
  }

  createWindow();
});

app.on('activate', () => {
  logger.log({ level: 'info', message: 'Ativando janela principal.' });
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  logger.log({ level: 'info', message: 'Fechando janela principal.' });

  try {
    const recipeFilePath = PATHS.RECIPE_FILE;
    const customPreloadingFilePath = PATHS.CUSTOM_PRELOADING_FILE;
    const modelsJsonPath = PATHS.MODELS_JSON_FILE;

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

    fs.readdir(PATHS.UPLOADS_DIR, (err, files) => {
      if (err) {
        logger.log({ level: 'error', message: `Erro ao ler o diretorio: ${err}` });
        return;
      }

      files.forEach((file) => {
        const uploadFilePath = path.join(PATHS.UPLOADS_DIR, file);
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

/**
 * Removes all uploaded files from the 'uploads' directory.
 *
 * This function reads the 'uploads' directory and attempts to delete each file found.
 * It logs errors if it encounters issues reading the directory or deleting files,
 * and logs success messages when files are successfully deleted.
 *
 * @returns {void}
 */
function removeUploadedFiles() {
  fs.readdir(PATHS.UPLOADS_DIR, (err, files) => {
    if (err) {
      logger.log({ level: 'error', message: `Erro ao ler o diretorio: ${err}` });
      return;
    }

    files.forEach((file) => {
      const uploadFilePath = path.join(PATHS.UPLOADS_DIR, file);
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
  const version = microversion ? `Versao: ${appVersion}-${microversion}` : `Versao: ${appVersion}`;
  event.sender.send('version-response', version);
});

// ============================================================================
// SPEC 4: Handler de Upload de Imagens (Refatorado)
// ============================================================================
ipcMain.handle('upload-images', async (event, filePaths) => {
  logger.log({ level: 'info', message: 'Recebendo imagens.' });
  logger.log({ level: 'debug', message: `Caminhos dos arquivos: ${filePaths}` });

  const copiedFiles = [];

  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    logger.log({ level: 'error', message: 'Nenhuma imagem selecionada.' });
    throw new Error('Nenhum caminho de arquivo fornecido');
  }

  try {
    for (const originalPath of filePaths) {
      if (typeof originalPath === 'string') {
        const filename = path.basename(originalPath);
        const savePath = path.join(PATHS.UPLOADS_DIR, filename);

        await fs.promises.copyFile(originalPath, savePath);
        copiedFiles.push(filename);

        logger.log({ level: 'info', message: `Imagem salva com sucesso: ${savePath}` });
      } else {
        logger.log({ level: 'error', message: 'Caminho do arquivo inválido: não é uma string.' });
      }
    }

    return { success: true, files: copiedFiles };
  } catch (error) {
    logger.log({ level: 'error', message: `Erro ao fazer upload de imagens: ${error}` });
    throw error;
  }
});

// Handler legado mantido para compatibilidade (será removido após atualização do frontend)
ipcMain.on('upload-image', (event, filePaths) => {
  logger.log({ level: 'info', message: 'Recebendo imagem.' });
  logger.log({ level: 'debug', message: `Caminhos dos arquivos: ${filePaths}` });

  const uploadDir = uploadsPath;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  if (filePaths.length === 0) {
    logger.log({ level: 'error', message: 'Nenhuma imagem selecionada.' });
    throw new Error('Nenhum caminho passado');
  }
  try {
    if (Array.isArray(filePaths) && filePaths.length > 0) {
      filePaths.forEach((originalPath) => {
        if (typeof originalPath === 'string') {
          const filename = path.basename(originalPath);
          const savePath = path.join(PATHS.UPLOADS_DIR, filename);

          fs.copyFile(originalPath, savePath, (err) => {
            if (err) {
              logger.log({ level: 'error', message: `Erro ao salvar a imagem: ${err}` });

              event.sender.send('upload-image-response', 'Erro ao fazer upload da imagem.');
              return;
            }

            logger.log({ level: 'info', message: `Imagem salva com sucesso: ${savePath}` });

            event.sender.send('upload-image-response', 'Imagem enviada com sucesso!');
          });
        } else {
          logger.log({ level: 'error', message: 'Caminho do arquivo inválido: não é uma string.' });
        }
      });
    } else {
      logger.log({ level: 'error', message: 'Nenhum caminho de arquivo fornecido ou caminho de arquivo inválido.' });
    }
  } catch (error) {
    logger.log({ level: 'error', message: `Erro inesperado: ${error}` });
  }
});

ipcMain.handle('execute-pipeline', async (event, { typemode, checkboxStates, uploadedFileNames }) => {
  logger.log({ level: 'info', message: 'Executando pipeline...' });

  try {
    const commandPayload = {
      typemode: typemode,
      commands: checkboxStates,

      config: readConfig(true),

      files_to_process: uploadedFileNames,

      paths: {
        models_dir: MODELS_PATH,
        uploads_dir: PATHS.UPLOADS_DIR,
        results_dir: PATHS.RESULTS_DIR
      }
    };

    const commandString = JSON.stringify(commandPayload);

    logger.log({ level: 'debug', message: `Comando serializado: ${commandString}` });

    return new Promise((resolve, reject) => {
      const pythonProcess = childProcess.spawn(envManager.venvPythonPath, [path.join(envManager.srcPath, 'main.py')]);

      let stdoutBuffer = '';
      pythonProcess.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
        let boundary = stdoutBuffer.indexOf('\n');

        while (boundary !== -1) {
          const jsonLine = stdoutBuffer.substring(0, boundary);
          stdoutBuffer = stdoutBuffer.substring(boundary + 1);

          try {
            const message = JSON.parse(jsonLine);
            if (mainWindow && mainWindow.webContents) {
              mainWindow.webContents.send('python-message', message);
            }
            logger.log({ level: 'debug', message: `Mensagem do Python: ${JSON.stringify(message)}` });
          } catch (e) {
            logger.log({ level: 'debug', message: `Linha não-JSON ignorada: ${jsonLine}` });
          }
          boundary = stdoutBuffer.indexOf('\n');
        }
      });

      let stderrBuffer = '';
      pythonProcess.stderr.on('data', (data) => {
        stderrBuffer += data.toString();
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('python-message', {
            type: 'log',
            level: 'error',
            message: data.toString()
          });
        }
        logger.log({ level: 'error', message: `Stderr do Python: ${data.toString()}` });
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          logger.log({ level: 'info', message: 'Processo Python finalizado com sucesso.' });
          resolve({ status: 'success' });
        } else {
          const errorMsg = `Python process exited with code ${code}. Stderr: ${stderrBuffer}`;
          logger.log({ level: 'error', message: errorMsg });
          reject(new Error(errorMsg));
        }
      });

      pythonProcess.stdin.write(commandString);
      pythonProcess.stdin.end();

      logger.log({ level: 'info', message: 'Comando enviado para o processo Python.' });
    });
  } catch (error) {
    logger.log({ level: 'error', message: `Erro ao executar pipeline: ${error}` });
    throw error;
  }
});

ipcMain.on('run-factory', (event, args) => {
  logger.log({ level: 'info', message: 'Executando script Factory.' });
  logger.log({ level: 'info', message: `Caminho do script: ${path.join(envManager.srcPath, 'main.py')}` });
  logger.log({ level: 'info', message: 'Iniciando processo...' });

  try {
    const pythonProcess = childProcess.spawn(envManager.venvPythonPath, [path.join(envManager.srcPath, 'main.py')]);
    logger.log({ level: 'info', message: 'Processo Python iniciado com sucesso.' });
    pythonProcess.stdout.on('data', (data) => {
      logger.log({ level: 'info', message: `Resposta do script Factory: ${data.toString()}` });

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

    pythonProcess.stderr.on('data', (data) => {
      logger.log({ level: 'error', message: `Erro do script Factory: ${data.toString()}` });
      mainWindow.webContents.send('factory-response', 'failure');
    });

    pythonProcess.on('exit', (code) => {
      if (code !== 0) {
        logger.log({ level: 'error', message: `O processo Python encerrou com erro, codigo de saida ${code}` });
      } else {
        logger.log({ level: 'info', message: `O processo Python foi encerrado com sucesso, codigo de saida ${code}` });
      }
    });

    pythonProcess.on('close', (code) => {
      logger.log({ level: 'debug', message: `cls: O processo Python foi encerrado com codigo de saida ${code}` });
    });

    pythonProcess.on('error', (error) => {
      logger.log({ level: 'error', message: `Falha ao iniciar o processo Python: ${error}` });
      mainWindow.webContents.send('factory-response', 'failure');
    });
  } catch (error) {
    mainWindow.webContents.send('factory-response', 'failure');
    logger.log({ level: 'error', message: `Erro ao iniciar o processo Python: ${error}` });
  }
});

// Configura um listener para o evento 'receive_commands' emitido do processo renderer.
ipcMain.on('receive_commands', (event, { typemode, checkboxStates }) => {
  const data = {
    typemode,
    checkboxStates
  };

  logger.log({ level: 'info', message: 'Recebendo comandos.' });
  const filePath = PATHS.RECIPE_FILE;
  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      logger.log({ level: 'error', message: `Erro ao salvar arquivo JSON: ${err}` });
      return;
    }

    logger.log({ level: 'info', message: 'Arquivo JSON salvo com sucesso.' });
    logger.log({ level: 'debug', message: `COMANDOS: ${JSON.stringify(data)}` });
    ipcMain.emit('run-factory');
  });
});

// Ouvinte do evento 'read-config' do ipcMain
ipcMain.on('read-config', () => {
  const config = readConfig(true);
  logger.log({ level: 'debug', message: `Configuracoes: ${JSON.stringify(config)}` });

  mainWindow.webContents.send('config-response', config);
});

// Ouvinte do evento 'write-config' do ipcMain
ipcMain.on('write-config', (event, newConfig) => {
  logger.log({ level: 'debug', message: `Nova configuração: ${JSON.stringify(newConfig)}` });

  try {
    const configFileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFileContent);

    Object.keys(newConfig).forEach(key => {
      config[key] = newConfig[key];
    });

    const updatedConfigContent = JSON.stringify(config, null, 2);

    fs.writeFileSync(configPath, updatedConfigContent, 'utf8');
    logger.log({ level: 'info', message: 'Arquivo config foi atualizado com sucesso.' });

    event.sender.send('write-config-response', 'success');
  } catch (error) {
    logger.log({ level: 'error', message: `Erro escrevendo o arquivo de configuração: ${error}` });
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

  if (!customData) {
    logger.log({ level: 'error', message: 'Dados personalizados nao fornecidos.' });
    return;
  }
  const customJson = JSON.stringify(customData, null, 2);
  logger.log({ level: 'info', message: `Dados personalizados: ${customJson}` });
  const customPath = PATHS.CUSTOM_PRELOADING_FILE;

  fs.writeFile(customPath, customJson, (err) => {
    if (err) {
      logger.log({ level: 'error', message: `Erro ao salvar arquivo JSON personalizado: ${err}` });
      return;
    }
    logger.log({ level: 'info', message: 'Arquivo JSON personalizado salvo com sucesso.' });
  });
});

// ============================================================================
// Project Management IPC Handlers
// ============================================================================
ipcMain.handle('create-project', async (event, projectData) => {
  const { nome, dimensoes } = projectData;
  const dimensoesJson = JSON.stringify(dimensoes);

  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO projetos (nome, dimensoes_json) VALUES (?, ?)`;
    db.run(sql, [nome, dimensoesJson], function (err) {
      if (err) {
        logger.log({ level: 'error', message: `Erro ao criar projeto: ${err.message}` });
        reject(err);
      } else {
        logger.log({ level: 'info', message: `Projeto criado com sucesso. ID: ${this.lastID}` });
        resolve({ success: true, id: this.lastID });
      }
    });
  });
});

ipcMain.handle('get-projects', async (event) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM projetos ORDER BY data_criacao DESC", [], (err, rows) => {
      if (err) {
        logger.log({ level: 'error', message: `Erro ao buscar projetos: ${err.message}` });
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('import-files', async (event, { idProjeto, filePaths, estrategia, dimensoes, modoCofre }) => {
  const thumbsDir = path.join(USER_DATA_PATH, 'thumbnails');
  const projectImagesDir = modoCofre ? path.join(USER_DATA_PATH, 'projects', idProjeto.toString(), 'images') : null;

  if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });
  if (modoCofre && !fs.existsSync(projectImagesDir)) fs.mkdirSync(projectImagesDir, { recursive: true });

  let previewData = [];
  const CHUNK_SIZE = 10;

  // Função auxiliar para processar um único arquivo
  const processFile = async (filePath) => {
    try {
      const image = nativeImage.createFromPath(filePath);
      if (image.isEmpty()) return null;

      // 1. Gerar Thumbnail
      const thumbnail = image.resize({ width: 300 });
      const thumbName = `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${path.basename(filePath)}`;
      const thumbPath = path.join(thumbsDir, thumbName);
      fs.writeFileSync(thumbPath, thumbnail.toJPEG(80));

      // 2. Modo Cofre: Copiar arquivo original
      let finalPath = filePath;
      if (modoCofre) {
        const destPath = path.join(projectImagesDir, path.basename(filePath));
        await fs.promises.copyFile(filePath, destPath);
        finalPath = destPath;
      }

      // 3. Extração de Metadados
      let metadados = {};
      if (estrategia === 'pastas') {
        const partes = filePath.split(path.sep);
        const dimInvertidas = [...dimensoes].reverse();
        dimInvertidas.forEach((dim, index) => {
          metadados[dim] = partes[partes.length - 2 - index] || 'N/A';
        });
      }

      return {
        caminhoAbsoluto: finalPath,
        caminhoThumbnail: thumbPath,
        nomeArquivo: path.basename(filePath),
        metadados: metadados
      };
    } catch (err) {
      logger.log({ level: 'error', message: `Erro ao processar arquivo ${filePath}: ${err.message}` });
      return null;
    }
  };

  // Processamento em Chunks para evitar estouro de memória
  for (let i = 0; i < filePaths.length; i += CHUNK_SIZE) {
    const chunk = filePaths.slice(i, i + CHUNK_SIZE);
    const results = await Promise.all(chunk.map(processFile));
    previewData.push(...results.filter(r => r !== null));

    // Notificar progresso para a UI (opcional, mas bom para UX)
    if (event.sender) {
      event.sender.send('import-progress', {
        current: Math.min(i + CHUNK_SIZE, filePaths.length),
        total: filePaths.length
      });
    }
  }

  return previewData;
});

ipcMain.handle('finalize-ingestion', async (event, { idProjeto, tipoAnalise, amostras }) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
            INSERT INTO amostras (id_projeto, tipo_analise, caminho_absoluto, caminho_thumbnail, metadados_json)
            VALUES (?, ?, ?, ?, ?)
        `);

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      amostras.forEach(amostra => {
        stmt.run(
          idProjeto,
          tipoAnalise,
          amostra.caminhoAbsoluto,
          amostra.caminhoThumbnail,
          JSON.stringify(amostra.metadados)
        );
      });
      db.run("COMMIT", (err) => {
        if (err) {
          logger.log({ level: 'error', message: `Erro ao finalizar ingestão: ${err.message}` });
          reject(err);
        } else {
          logger.log({ level: 'info', message: `${amostras.length} amostras ingeridas para o projeto ${idProjeto}` });
          resolve({ success: true, count: amostras.length });
        }
      });
    });
    stmt.finalize();
  });
});

ipcMain.handle('get-project-samples', async (event, idProjeto) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM amostras WHERE id_projeto = ?", [idProjeto], (err, rows) => {
      if (err) {
        logger.log({ level: 'error', message: `Erro ao buscar amostras: ${err.message}` });
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('start-processing', async (event, { idProjeto, amostrasIds }) => {
  return new Promise((resolve, reject) => {
    // 1. Buscar caminhos reais das amostras selecionadas
    const placeholders = amostrasIds.map(() => '?').join(',');
    db.all(`SELECT id_amostra, caminho_absoluto FROM amostras WHERE id_amostra IN (${placeholders})`, amostrasIds, (err, rows) => {
      if (err) {
        logger.log({ level: 'error', message: `Erro ao buscar caminhos para processamento: ${err.message}` });
        return reject(err);
      }

      // 2. Criar arquivo de lote temporário
      const tempPath = path.join(USER_DATA_PATH, `batch_${idProjeto}_${Date.now()}.json`);
      const batchData = rows.map(r => ({ id: r.id_amostra, caminho: r.caminho_absoluto }));
      fs.writeFileSync(tempPath, JSON.stringify(batchData));

      // 3. Invocar Python
      const scriptPath = path.join(__dirname, 'motor_ia.py');
      // Usar o ambiente Python configurado pelo envManager
      const pythonProcess = childProcess.spawn(envManager.venvPythonPath, [scriptPath, tempPath]);

      pythonProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          if (!line.trim()) return;
          try {
            const resultado = JSON.parse(line);

            // Salvar no Banco
            db.run('UPDATE amostras SET resultados_json = ? WHERE id_amostra = ?',
              [JSON.stringify(resultado.dados), resultado.id], (updErr) => {
                if (updErr) logger.log({ level: 'error', message: `Erro ao salvar resultado da amostra ${resultado.id}: ${updErr.message}` });
              });

            // Notificar UI
            if (event.sender) {
              event.sender.send('atualizacao-progresso', resultado);
            }
          } catch (e) {
            logger.log({ level: 'debug', message: `Python log: ${line}` });
          }
        });
      });

      pythonProcess.stderr.on('data', (data) => {
        logger.log({ level: 'error', message: `Python Error: ${data.toString()}` });
      });

      pythonProcess.on('close', (code) => {
        fs.unlinkSync(tempPath);
        if (code === 0) {
          resolve({ success: true });
        } else {
          reject(new Error(`Python finalizou com código ${code}`));
        }
      });
    });
  });
});

ipcMain.handle('export-project', async (event, idProjeto) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id_amostra, tipo_analise, caminho_absoluto, metadados_json, resultados_json 
      FROM amostras 
      WHERE id_projeto = ? AND resultados_json IS NOT NULL`, 
    [idProjeto], async (err, rows) => {
      if (err) return resolve({ success: false, error: err.message });
      if (rows.length === 0) return resolve({ success: false, error: "Nenhuma amostra processada encontrada para este projeto." });

      let headersMeta = new Set();
      let headersResult = new Set();
      
      const dados = rows.map(row => {
        const meta = JSON.parse(row.metadados_json || '{}');
        const res = JSON.parse(row.resultados_json || '{}');
        Object.keys(meta).forEach(k => headersMeta.add(k));
        Object.keys(res).forEach(k => headersResult.add(k));
        return { ID: row.id_amostra, Tipo: row.tipo_analise, Caminho: row.caminho_absoluto, meta, res };
      });

      const headers = ['ID', 'Tipo_Analise', 'Caminho_Arquivo', ...Array.from(headersMeta), ...Array.from(headersResult)];
      let csv = '\uFEFF'; 
      csv += headers.join(';') + '\n';

      dados.forEach(d => {
        const row = [d.ID, d.Tipo, d.Caminho, ...Array.from(headersMeta).map(h => d.meta[h] || ''), ...Array.from(headersResult).map(h => d.res[h] || '')];
        csv += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';') + '\n';
      });

      const { filePath } = await dialog.showSaveDialog({
        title: 'Salvar Relatório AIpomoea',
        defaultPath: `Relatorio_AIpomoea_Projeto_${idProjeto}.csv`,
        filters: [{ name: 'Planilha CSV', extensions: ['csv'] }]
      });

      if (filePath) {
        try {
          fs.writeFileSync(filePath, csv, 'utf8');
          resolve({ success: true, path: filePath });
        } catch (fsErr) {
          resolve({ success: false, error: fsErr.message });
        }
      } else {
        resolve({ success: false, error: "Operação cancelada pelo usuário." });
      }
    });
  });
});

// Ouvidor do evento 'check-models-info' do ipcMain
ipcMain.on('check-models-info', (event) => {
  const modelsJsonPath = PATHS.MODELS_JSON_FILE;

  fs.readFile(modelsJsonPath, 'utf8', (err, data) => {
    if (err) {
      logger.log({ level: 'error', message: `Erro ao ler models.json: ${err}` });
      event.sender.send('models-info-response', { error: 'Erro ao ler models.json' });
      return;
    }

    try {
      const models = JSON.parse(data);
      event.sender.send('models-info-response', models);
    } catch (parseErr) {
      logger.log({ level: 'error', message: `Erro ao analisar models.json: ${parseErr}` });
      event.sender.send('models-info-response', { error: 'Erro ao analisar models.json' });
    }
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
    logger.log({ level: 'error', message: `Error during file selection: ${err}` });
  });
});

ipcMain.handle('update-python-packages', async () => {
  logger.log({ level: 'info', message: 'Iniciando atualização de pacotes Python...' });
  try {
    const result = await envManager.updatePackages();
    return result;
  } catch (error) {
    logger.log({ level: 'error', message: `Erro ao atualizar pacotes Python: ${error}` });
    return { status: 'error', message: error.message };
  }
});