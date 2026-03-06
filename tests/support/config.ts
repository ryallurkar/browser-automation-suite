import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface AppConfig {
  baseUrl: string;
}

export function loadAppConfig(): AppConfig {
  const configPath = path.resolve(process.cwd(), 'config/config.yaml');
  const raw = yaml.load(fs.readFileSync(configPath, 'utf8')) as Partial<AppConfig>;

  if (!raw?.baseUrl) {
    throw new Error('config/config.yaml is missing baseUrl');
  }

  return {
    baseUrl: raw.baseUrl,
  };
}
