import { EditorView, Decoration, type DecorationSet } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";

export const setSearchResults = StateEffect.define<{
  results: { from: number; to: number }[];
  currentIndex: number;
}>();

export const searchField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const e of tr.effects) {
      if (e.is(setSearchResults)) {
        const { results, currentIndex } = e.value;
        const builder: any[] = [];

        results.forEach((result, index) => {
          const className =
            index === currentIndex
              ? "cm-searchMatch-selected"
              : "cm-searchMatch";
          builder.push(
            Decoration.mark({ class: className }).range(result.from, result.to),
          );
        });

        return Decoration.set(builder.sort((a, b) => a.from - b.from));
      }
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

export function createSearchHighlightExtension() {
  return searchField;
}

export const searchTheme = EditorView.baseTheme({
  ".cm-searchMatch": {
    backgroundColor: "rgba(240, 185, 11, 0.2)",
    borderRadius: "2px",
  },
  ".cm-searchMatch-selected": {
    backgroundColor: "rgba(240, 185, 11, 0.4)",
    borderRadius: "2px",
  },
});

export async function searchContent(
  view: EditorView,
  query: string,
): Promise<any[]> {
  if (!query) return [];

  const results: any[] = [];
  const doc = view.state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;
    let pos = 0;
    let idx = text.indexOf(query, pos);

    while (idx !== -1) {
      results.push({
        from: line.from + idx,
        to: line.from + idx + query.length,
        line: i,
      });
      pos = idx + 1;
      idx = text.indexOf(query, pos);
    }
  }

  return results;
}
