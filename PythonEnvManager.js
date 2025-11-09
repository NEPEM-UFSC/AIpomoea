const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const logger = require('./logger');

const isDev = !app.isPackaged;
const OS_PLATFORM = process.platform;
const VENV_DIR_NAME = 'aipomoea_venv';

class PythonEnvManager {
    constructor() {
        const appRoot = isDev ? process.cwd() : process.resourcesPath;
        
        this.srcPath = isDev 
            ? path.join(appRoot, 'src_python')
            : path.join(appRoot, 'backend', 'src');

        this.baseRuntimePath = isDev
            ? this.getDevRuntimePath()
            : path.join(appRoot, 'backend', 'runtime', OS_PLATFORM === 'win32' ? 'python.exe' : 'bin/python');

        this.venvPath = path.join(app.getPath('userData'), VENV_DIR_NAME);
        
        this.venvPythonPath = (OS_PLATFORM === 'win32')
            ? path.join(this.venvPath, 'Scripts', 'python.exe')
            : path.join(this.venvPath, 'bin', 'python');
            
        this.requirementsPath = path.join(this.srcPath, 'requirements.txt');
        
        this.lockFilePath = path.join(this.venvPath, '.setup-complete');
        
        // Log de debug dos caminhos configurados
        logger.log({ level: 'debug', message: `PythonEnvManager - isDev: ${isDev}` });
        logger.log({ level: 'debug', message: `PythonEnvManager - appRoot: ${appRoot}` });
        logger.log({ level: 'debug', message: `PythonEnvManager - baseRuntimePath: ${this.baseRuntimePath}` });
        logger.log({ level: 'debug', message: `PythonEnvManager - srcPath: ${this.srcPath}` });
        logger.log({ level: 'debug', message: `PythonEnvManager - venvPath: ${this.venvPath}` });
    }
    
    getDevRuntimePath() {
        const platformMap = { 'win32': 'win', 'darwin': 'mac', 'linux': 'linux' };
        const platformDir = platformMap[OS_PLATFORM];
        const pythonExe = OS_PLATFORM === 'win32' ? 'python.exe' : 'bin/python';
        const runtimePath = path.join(process.cwd(), 'runtimes', platformDir, 'python', pythonExe);
        
        // Se não existir o runtime standalone, usa o Python do sistema
        if (!fs.existsSync(runtimePath)) {
            logger.log({ level: 'warn', message: 'Runtime standalone não encontrado. Usando Python do sistema.' });
            return OS_PLATFORM === 'win32' ? 'python' : 'python3';
        }
        
        return runtimePath;
    }

    async checkAndSetupVenv() {
        if (fs.existsSync(this.lockFilePath)) {
            logger.log({ level: 'info', message: 'Venv já está configurado. Pulando setup.' });
            return true;
        }
        
        logger.log({ level: 'info', message: 'Iniciando setup do venv pela primeira vez...' });
        
        try {
            await this._runCommand(this.baseRuntimePath, ['-m', 'venv', this.venvPath]);
            logger.log({ level: 'info', message: `Venv criado em: ${this.venvPath}` });

            logger.log({ level: 'info', message: 'Instalando dependências do requirements.txt...' });
            await this._runCommand(this.venvPythonPath, ['-m', 'pip', 'install', '-r', this.requirementsPath]);
            logger.log({ level: 'info', message: 'Dependências instaladas.' });

            fs.writeFileSync(this.lockFilePath, new Date().toISOString());
            logger.log({ level: 'info', message: 'Setup do venv concluído.' });
            return true;
            
        } catch (error) {
            logger.log({ level: 'error', message: `Falha CRÍTICA no setup do venv: ${error}` });
            return false;
        }
    }

    _runCommand(executable, args) {
        return new Promise((resolve, reject) => {
            logger.log({ level: 'debug', message: `Executando: ${executable} ${args.join(' ')}` });
            
            const proc = childProcess.spawn(executable, args);
            
            proc.stdout.on('data', (data) => logger.log({ level: 'info', message: data.toString() }));
            proc.stderr.on('data', (data) => logger.log({ level: 'error', message: data.toString() }));
            
            proc.on('error', (error) => {
                logger.log({ level: 'error', message: `Erro ao spawn do processo: ${error.message}` });
                logger.log({ level: 'error', message: `Erro detalhado: ${JSON.stringify(error)}` });
                reject(error);
            });
            
            proc.on('close', (code) => {
                if (code === 0) {
                    logger.log({ level: 'debug', message: `Processo concluído com sucesso (code ${code})` });
                    resolve();
                } else {
                    logger.log({ level: 'error', message: `Processo falhou com código ${code}` });
                    reject(new Error(`Processo falhou com código ${code}`));
                }
            });
        });
    }

    async updatePackages() {
        logger.log({ level: 'info', message: 'Iniciando atualização de pacotes Python...' });
        try {
            await this._runCommand(
                this.venvPythonPath, 
                ['-m', 'pip', 'install', '--upgrade', '-r', this.requirementsPath]
            );
            logger.log({ level: 'info', message: 'Pacotes Python atualizados com sucesso.' });
            return { status: 'success' };
        } catch (error) {
            logger.log({ level: 'error', message: `Falha ao atualizar pacotes Python: ${error}` });
            return { status: 'error', message: error.message };
        }
    }
}

module.exports = PythonEnvManager;
