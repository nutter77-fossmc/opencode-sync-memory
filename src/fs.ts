import { mkdir as fsMkdir, readFile as fsReadFile, writeFile as fsWriteFile } from "fs/promises";
import { existsSync } from "fs";

export const mkdir = fsMkdir;
export const readFile = fsReadFile;
export const writeFile = fsWriteFile;
export const exists = (p: string) => Promise.resolve(existsSync(p));
