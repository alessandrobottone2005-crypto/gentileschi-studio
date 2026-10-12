// Explicit, one-off cleanup of the three approved test projects; no media deletion.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
const env = {};
for (const line of (await fs.readFile('.env', 'utf8')).split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
}
const expectedUrl = 'https://aukspzeknnbhvdhpntiu.supabase.co';
if (env.VITE_SUPABASE_URL !== expectedUrl) throw new Error('Unexpected database; cleanup aborted.');
const client = createClient(expectedUrl, env.SUPABASE_SERVER_KEY || env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const ids = ['proj-1791753089818', 'proj-1b34c99b-7242-4a12-9610-cafc15b8d102', 'proj-1791754462999'];
const { data, error } = await client.from('projects').select('*').in('id', ids);
if (error) throw error;
if (!data.length) { console.log('Approved test projects already removed; nothing to delete.'); process.exit(0); }
const backup = path.join('.vercel', 'diagnostic', `test-projects-backup-${Date.now()}.json`);
await fs.mkdir(path.dirname(backup), { recursive: true });
await fs.writeFile(backup, JSON.stringify(data, null, 2), { mode: 0o600 });
const deletion = await client.from('projects').delete().in('id', ids).select('id');
if (deletion.error) throw deletion.error;
const remaining = await client.from('projects').select('id');
if (remaining.error) throw remaining.error;
if (remaining.data.some(row => ids.includes(row.id))) throw new Error('Cleanup incomplete.');
const media = await client.storage.from('gentileschi-media').list('', { limit: 100 });
if (media.error) throw media.error;
console.log(JSON.stringify({ removed: deletion.data.map(row => row.id), remainingProjects: remaining.data.length, preservedPhotographs: media.data.filter(row => row.id).length, privateBackup: backup }));
