import { invoke } from "@tauri-apps/api/core";

export class AppError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export async function cmd<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<[AppError | null, T | null]> {
  try {
    const data = await invoke<T>(command, args);
    return [null, data];
  } catch (err) {
    const e = err as { code: number; message: string };
    return [new AppError(e.code, e.message), null];
  }
}
