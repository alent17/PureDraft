export interface ImagePasteResult {
  success: boolean;
  markdown?: string;
  error?: string;
}

export async function pasteImageFromClipboard(): Promise<ImagePasteResult> {
  try {
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      const imageTypes = item.types.filter(t => t.startsWith('image/'));
      if (imageTypes.length === 0) continue;

      for (const type of imageTypes) {
        const blob = await item.getType(type);
        const ext = type.split('/')[1] === 'jpeg' ? 'jpg' : type.split('/')[1];
        const filename = `image-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

        return await blobToBase64Image(blob, filename);
      }
    }

    return { success: false, error: '剪贴板中没有图片' };
  } catch (e) {
    return { success: false, error: `读取剪贴板失败: ${e}` };
  }
}

function blobToBase64Image(blob: Blob, filename: string): Promise<ImagePasteResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve({ success: true, markdown: `![${filename}](${base64})` });
    };
    reader.onerror = () => {
      resolve({ success: false, error: '读取图片数据失败' });
    };
    reader.readAsDataURL(blob);
  });
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function getImageMime(ext: string): string {
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
  };
  return mimeMap[ext.toLowerCase()] || 'image/png';
}

export function hasImageInClipboard(): boolean {
  return false;
}
