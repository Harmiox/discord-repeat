import * as path from 'path';
import { createLogger, format, Logger, transports } from 'winston';
const { combine, timestamp, label, json } = format;

export class AppLogger {
	public context: string;
	private readonly logger: Logger;

  constructor(context: string) {
		this.context = context;
    this.logger = createLogger({
      exitOnError: true,
      transports: [
        new transports.Console({
          format: combine(label({ label: context }), timestamp(), json())
				}),
				new transports.File({ filename: path.join('logs/error.log'), level: 'error' }),
				new transports.File({ filename: path.join('logs/info.log'), level: 'info' }),
				new transports.File({ filename: path.join('logs/debug.log'), level: 'debug' }),
    		new transports.File({ filename: path.join('logs/combined.log') })
      ]
    });
	}
	
  public log(message: string, trace?: {}): void {
    this.logger.log('info', message, trace);
  }

  public warn(message: string, trace?: {}): void {
    this.logger.warn(message, trace);
  }

  public info(message: string, trace?: {}): void {
    this.logger.info(message, trace);
  }

  public error(message: string, trace?: {} | string): void {
    this.logger.error(message, trace);
	}
	
	public debug(message: string, trace?: {} | string): void {
    this.logger.debug(message, trace);
	}
	
}
