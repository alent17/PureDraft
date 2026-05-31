import { open } from '@tauri-apps/plugin-dialog';

export async function openImageDialog(): Promise<string | null> {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] },
      ],
    });
    if (!selected) return null;
    return selected as string;
  } catch {
    return null;
  }
}
