import { EditorSelection, type SelectionRange } from '@codemirror/state';
import type { EditorView } from 'codemirror';

export function selectAllOccurrences(view: EditorView) {
  const { state } = view;
  const selection = state.selection.main;
  if (selection.empty) return;

  const selectedText = state.sliceDoc(selection.from, selection.to);
  if (!selectedText) return;

  const ranges: SelectionRange[] = [];
  const doc = state.doc;
  let pos = 0;

  while (pos <= doc.length - selectedText.length) {
    const found = doc.sliceString(pos, pos + selectedText.length);
    if (found === selectedText) {
      ranges.push(EditorSelection.range(pos, pos + selectedText.length));
      pos += selectedText.length;
    } else {
      pos++;
    }
  }

  if (ranges.length > 1) {
    view.dispatch({
      selection: EditorSelection.create(ranges, ranges.length - 1),
    });
  }
}
