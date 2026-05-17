import { cmd, type AppError } from "./index";

export function minimizeWindow(): Promise<[AppError | null, null]> {
  return cmd<void>("minimize_window") as Promise<[AppError | null, null]>;
}

export function toggleMaximize(): Promise<[AppError | null, boolean | null]> {
  return cmd<boolean>("toggle_maximize");
}

export function closeWindow(): Promise<[AppError | null, null]> {
  return cmd<void>("close_window") as Promise<[AppError | null, null]>;
}

export function isMaximized(): Promise<[AppError | null, boolean | null]> {
  return cmd<boolean>("is_maximized");
}

export function setAcrylicEffect(enabled: boolean): Promise<[AppError | null, null]> {
  return cmd<void>("set_acrylic_effect", { enabled }) as Promise<[AppError | null, null]>;
}
