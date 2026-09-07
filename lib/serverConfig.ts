import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export interface ServerConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey: string;
}

export function getServerConfig(): ServerConfig {
  const urlKey = 'NEXT_PUBLIC_SUPABASE_URL';
  const anonKey = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
  const geminiKey = 'GEMINI_API_KEY';

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      const parsed = JSON.parse(data);
      return {
        supabaseUrl: parsed.supabaseUrl || process.env[urlKey] || '',
        supabaseAnonKey: parsed.supabaseAnonKey || process.env[anonKey] || '',
        geminiApiKey: parsed.geminiApiKey || process.env[geminiKey] || ''
      };
    }
  } catch (err) {
    console.error("Failed to read server config:", err);
  }

  return {
    supabaseUrl: process.env[urlKey] || '',
    supabaseAnonKey: process.env[anonKey] || '',
    geminiApiKey: process.env[geminiKey] || ''
  };
}

export function saveServerConfig(config: Partial<ServerConfig>): boolean {
  const urlKey = 'NEXT_PUBLIC_SUPABASE_URL';
  const anonKey = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
  const geminiKey = 'GEMINI_API_KEY';

  try {
    const current = getServerConfig();
    const updated = { ...current, ...config };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf8');
    
    // Set in process.env so they are available immediately
    // Using dynamic string variables completely defeats Next.js static string replacement in production compilation!
    if (updated.supabaseUrl) process.env[urlKey] = updated.supabaseUrl;
    if (updated.supabaseAnonKey) process.env[anonKey] = updated.supabaseAnonKey;
    if (updated.geminiApiKey) process.env[geminiKey] = updated.geminiApiKey;
    
    return true;
  } catch (err) {
    console.error("Failed to write server config:", err);
    return false;
  }
}
