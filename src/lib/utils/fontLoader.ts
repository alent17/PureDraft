import type { CustomFont } from '$lib/stores/ui';

declare global {
  interface Window {
    __puredraft_custom_fonts?: FontFace[];
  }
}

export async function loadCustomFonts(fonts: CustomFont[]): Promise<void> {
  removeCustomFonts();
  const loadedFonts: FontFace[] = [];
  for (const font of fonts) {
    try {
      const ff = new FontFace(font.name, `url(${font.dataUrl})`);
      await ff.load();
      document.fonts.add(ff);
      loadedFonts.push(ff);
    } catch (e) {
      console.warn(`[FontLoader] Failed to load font "${font.name}":`, e);
    }
  }
  window.__puredraft_custom_fonts = loadedFonts;
}

export function removeCustomFonts(): void {
  const fonts = window.__puredraft_custom_fonts;
  if (fonts) {
    for (const ff of fonts) {
      try {
        document.fonts.delete(ff);
      } catch {
        // silently fail
      }
    }
    window.__puredraft_custom_fonts = undefined;
  }
}

export function selectFontFile(): Promise<CustomFont | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ttf,.otf,.woff,.woff2';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'ttf';
        const mimeMap: Record<string, string> = {
          ttf: 'font/ttf',
          otf: 'font/otf',
          woff: 'font/woff',
          woff2: 'font/woff2',
        };
        const mime = mimeMap[ext] || 'font/ttf';
        const dataUrl = `data:${mime};base64,${base64}`;

        const ff = new FontFace(file.name.replace(/\.[^.]+$/, ''), `url(${dataUrl})`);
        await ff.load();

        resolve({
          name: ff.family || file.name.replace(/\.[^.]+$/, ''),
          dataUrl,
        });
      } catch (e) {
        console.warn('[FontLoader] Font validation failed:', e);
        resolve(null);
      }
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      resolve(null);
    };

    input.click();
  });
}
