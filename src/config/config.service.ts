import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import { IDiscordConfig } from './interfaces/discord-config.interface';
import { IEnvConfig } from './interfaces/env-config.interface';
dotenv.config({path: '/.env'});
dotenv.load();

/**
 * Config Service
 */

export class ConfigService {
  public get env(): string {
    return this.envConfig.NODE_ENV;
  }

  public get discord(): IDiscordConfig {
    return {
      token: this.envConfig.DISCORD_BOT_TOKEN,
    };
	}

  private readonly envConfig: IEnvConfig;

  constructor() {
    const envConfig: IEnvConfig = process.env as IEnvConfig;
    this.envConfig = this.validateInput(envConfig);
  }

  /**
   * Ensures all needed variables are set and returns the process environment
   */
  private validateInput(envConfig: IEnvConfig): IEnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      // General
      NODE_ENV: Joi.string()
        .valid(['development', 'development-verbose', 'production', 'test', 'provision'])
        .default('development'),

      // Discord
			DISCORD_BOT_TOKEN: Joi.string().required()

    }).unknown();

    const { error, value: validatedEnvConfig } = Joi.validate(envConfig, envVarsSchema);
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }

    return validatedEnvConfig;
  }
}
