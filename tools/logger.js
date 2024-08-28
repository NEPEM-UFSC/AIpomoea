const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

// Garantir que o diretório de logs exista

const logDirectory = path.join(__dirname,'..','logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
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
