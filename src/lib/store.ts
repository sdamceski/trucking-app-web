import fs from 'node:fs/promises';
import path from 'node:path';
import { DataFile, Load, Trucker } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'data.json');

async function readFile(): Promise<DataFile> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DataFile>;
    return {
      truckers: Array.isArray(parsed.truckers) ? parsed.truckers : [],
      loads: Array.isArray(parsed.loads) ? parsed.loads : [],
    };
  } catch {
    return { truckers: [], loads: [] };
  }
}

async function writeFile(data: DataFile): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getTruckers(): Promise<Trucker[]> {
  const data = await readFile();
  return data.truckers;
}

export async function getLoads(): Promise<Load[]> {
  const data = await readFile();
  return data.loads;
}

export async function getData(): Promise<DataFile> {
  return readFile();
}

export async function saveData(data: DataFile): Promise<void> {
  await writeFile(data);
}
