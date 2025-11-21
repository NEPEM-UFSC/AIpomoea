const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const { app } = require('electron');

const isDev = !app.isPackaged;
let logDirectory;

// Tenta usar a pasta resources/logs em produção para fácil acesso
// Em desenvolvimento, usa a pasta logs na raiz do projeto
if (isDev) {
    logDirectory = path.join(process.cwd(), 'logs');
} else {
    logDirectory = path.join(process.resourcesPath, 'logs');
}

// Tenta criar o diretório e verifica permissão de escrita
try {
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }
    // Teste simples de permissão de escrita
    const testFile = path.join(logDirectory, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
} catch (error) {
    console.error(`Erro ao acessar diretório de logs preferencial (${logDirectory}):`, error);
    // Fallback para userData se não tiver permissão (comum em Program Files)
    logDirectory = path.join(app.getPath('userData'), 'logs');
    console.log(`Usando diretório de fallback: ${logDirectory}`);
    
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }
}

// Formatação personalizada para os logs
const myFormat = format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

// Gerar timestamp para o nome do arquivo de log
const logFilename = `client_${new Date().toISOString().replace(/:/g, '-')}.log`;

// Definir níveis e cores personalizados para os logs
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5
  },
  colors: {
    fatal: 'red',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'magenta'
  }
};

// Configurando o logger
const logger = createLogger({
  levels: customLevels.levels,
  level: 'trace',
  format: format.combine(
    format.timestamp(),
    myFormat
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        myFormat
      )
    }),
    new transports.File({ filename: path.join(logDirectory, logFilename) })
  ]
});

// Adicionar cores personalizadas aos níveis
winston.addColors(customLevels.colors);

module.exports = logger;
