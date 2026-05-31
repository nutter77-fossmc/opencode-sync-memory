import { mkdir as fsMkdir, readFile as fsReadFile, writeFile as fsWriteFile } from "fs/promises";
export declare const mkdir: typeof fsMkdir;
export declare const readFile: typeof fsReadFile;
export declare const writeFile: typeof fsWriteFile;
export declare const exists: (p: string) => Promise<boolean>;
//# sourceMappingURL=fs.d.ts.map