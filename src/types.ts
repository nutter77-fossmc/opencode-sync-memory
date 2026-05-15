export type Shell = ($: TemplateStringsArray, ...values: unknown[]) => {
  text(): Promise<string>;
  json(): Promise<unknown>;
  bytes(): Promise<Uint8Array>;
  readonly exitCode: Promise<number>;
};
