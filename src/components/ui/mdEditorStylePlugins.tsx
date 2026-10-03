import React from 'react';
import MdEditor, { PluginComponent, DropList } from 'react-markdown-editor-lite';
import {
  DeleteOutline,
  FormatColorText,
  HelpOutline,
  HighlightAlt,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { confirmService } from '../../services/confirmService';
import { store } from '../../store';
import { HIGHLIGHT_COLOR_PRESETS } from '../../utils/mdHighlightStyle';
import {
  findEnclosingStyleWrap,
  formatStyleWrap,
  parseExactStyleWrap,
  type MdInlineStyleAttrs,
} from '../../utils/mdInlineStyleSyntax';
import { t } from '../../utils/translations';

/** Markdown sözdizimi rehberi */
const MARKDOWN_HELP_URL = 'https://www.markdownguide.org/basic-syntax/';

const TEXT_COLOR_PRESETS = [
  '#E53935',
  '#FB8C00',
  '#F9A825',
  '#43A047',
  '#1E88E5',
  '#8E24AA',
  '#6D4C41',
  '#212121',
  '#FFFFFF',
] as const;

/** Markdown yardım sitesine yönlendir (2. toolbar butonu). */
class MarkdownHelp extends PluginComponent {
  static pluginName = 'markdown-help';
  static align = 'left';

  handleClick = () => {
    window.open(MARKDOWN_HELP_URL, '_blank', 'noopener,noreferrer');
  };

  render() {
    return (
      <span
        className="button button-type-markdown-help"
        title="Markdown rehberi / Markdown guide"
        onClick={this.handleClick}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <HelpOutline sx={{ fontSize: 18 }} />
      </span>
    );
  }
}

/** İçeriği temizle — sistem confirmation (window.confirm değil). */
class ClearContent extends PluginComponent {
  static pluginName = 'clear-content';
  static align = 'left';

  handleClick = async () => {
    if (this.editor.getMdValue() === '') return;
    const lang = store.getState().language?.currentLanguage || 'tr';
    const confirmed = await confirmService.show({
      message: t('md_editor_clear_confirm', lang),
      type: 'warning',
      confirmText: t('clear', lang),
      cancelText: t('cancel', lang),
      confirmColor: 'warning',
      variant: 'outlined',
    });
    if (confirmed) this.editor.setText('');
  };

  render() {
    const lang = store.getState().language?.currentLanguage || 'tr';
    return (
      <span
        className="button button-type-clear"
        title={t('md_editor_clear_title', lang)}
        onClick={this.handleClick}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <DeleteOutline sx={{ fontSize: 18 }} />
      </span>
    );
  }
}

/** Canlı önizleme aç/kapa (ilk toolbar butonu). */
class PreviewToggle extends PluginComponent<{ active: boolean }> {
  static pluginName = 'preview-toggle';
  static align = 'left';

  state = { active: false };

  handleClick = () => {
    const onToggle = this.getConfig('onToggle') as (() => void) | undefined;
    onToggle?.();
    this.setState((s) => ({ active: !s.active }));
  };

  render() {
    const active = this.state.active;
    return (
      <span
        className={`button button-type-preview${active ? ' active' : ''}`}
        title={active ? 'Önizlemeyi kapat / Hide preview' : 'Önizleme / Preview'}
        onClick={this.handleClick}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {active ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
      </span>
    );
  }
}

type StyleEditor = {
  getSelection: () => { start: number; end: number };
  getMdValue: () => string;
  setText: (value?: string) => void;
  setSelection: (selection: { start: number; end: number }) => void;
};

/** Apply or merge color/bg on selection (supports both at once). */
function applyInlineStyle(
  editor: StyleEditor,
  kind: keyof MdInlineStyleAttrs,
  value: string,
  placeholder: string,
) {
  const selection = editor.getSelection();
  const md = editor.getMdValue();
  let rangeStart = selection.start;
  let rangeEnd = selection.end;
  let attrs: MdInlineStyleAttrs = {};
  let inner = md.slice(selection.start, selection.end);

  if (inner) {
    const exact = parseExactStyleWrap(inner);
    if (exact) {
      attrs = { ...exact.attrs };
      inner = exact.inner;
    } else {
      const enclosing = findEnclosingStyleWrap(md, selection.start, selection.end);
      if (enclosing) {
        rangeStart = enclosing.start;
        rangeEnd = enclosing.end;
        attrs = { ...enclosing.attrs };
        inner = enclosing.inner;
      }
    }
  } else {
    const enclosing = findEnclosingStyleWrap(md, selection.start, selection.end);
    if (enclosing) {
      rangeStart = enclosing.start;
      rangeEnd = enclosing.end;
      attrs = { ...enclosing.attrs };
      inner = enclosing.inner;
    } else {
      inner = placeholder;
    }
  }

  attrs[kind] = value;
  const text = formatStyleWrap(attrs, inner);
  editor.setText(md.slice(0, rangeStart) + text + md.slice(rangeEnd));

  const innerStart = rangeStart + text.indexOf('(') + 1;
  setTimeout(() => {
    editor.setSelection({ start: innerStart, end: innerStart + inner.length });
  }, 0);
}

function ColorSwatchGrid({
  colors,
  onPick,
  outlinedLight,
}: {
  colors: readonly string[];
  onPick: (color: string) => void;
  outlinedLight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 28px)',
        gap: 6,
        padding: 8,
        minWidth: 108,
      }}
    >
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          title={color}
          onClick={() => onPick(color)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            border:
              outlinedLight && color.toLowerCase() === '#ffffff'
                ? '1px solid #bbb'
                : '1px solid rgba(0,0,0,0.12)',
            backgroundColor: color,
            cursor: 'pointer',
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

/** Vurgu: {bg:#hex}(metin) */
class FontHighlight extends PluginComponent {
  static pluginName = 'font-highlight';
  static align = 'left';

  state = { show: false };

  show = () => this.setState({ show: true });
  hide = () => this.setState({ show: false });

  applyHighlight = (color: string) => {
    applyInlineStyle(this.editor as StyleEditor, 'bg', color, 'vurgu');
    this.hide();
  };

  render() {
    return (
      <span
        className="button button-type-highlight"
        title="Vurgu rengi / Highlight color"
        onMouseEnter={this.show}
        onMouseLeave={this.hide}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
      >
        <HighlightAlt sx={{ fontSize: 18 }} />
        <DropList show={this.state.show} onClose={this.hide}>
          <ColorSwatchGrid colors={HIGHLIGHT_COLOR_PRESETS} onPick={this.applyHighlight} />
        </DropList>
      </span>
    );
  }
}

/** Renk: {color:#hex}(metin) */
class FontColor extends PluginComponent {
  static pluginName = 'font-color';
  static align = 'left';

  state = { show: false };

  show = () => this.setState({ show: true });
  hide = () => this.setState({ show: false });

  applyColor = (color: string) => {
    applyInlineStyle(this.editor as StyleEditor, 'color', color, 'metin');
    this.hide();
  };

  render() {
    return (
      <span
        className="button button-type-color"
        title="Metin rengi / Text color"
        onMouseEnter={this.show}
        onMouseLeave={this.hide}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
      >
        <FormatColorText sx={{ fontSize: 18 }} />
        <DropList show={this.state.show} onClose={this.hide}>
          <ColorSwatchGrid colors={TEXT_COLOR_PRESETS} onPick={this.applyColor} outlinedLight />
        </DropList>
      </span>
    );
  }
}

let registered = false;

/** Plugin'leri bir kez kaydet (modül yüklenince). */
export function registerMdEditorStylePlugins() {
  if (registered) return;
  MdEditor.use(PreviewToggle);
  MdEditor.use(MarkdownHelp);
  MdEditor.use(FontHighlight);
  MdEditor.use(FontColor);
  MdEditor.use(ClearContent);
  registered = true;
}

/** Varsayılan toolbar + önizleme / yardım / renk / vurgu. */
export const MD_EDITOR_PLUGINS_WITH_STYLES = [
  'preview-toggle',
  'markdown-help',
  'header',
  'font-bold',
  'font-italic',
  'font-underline',
  'font-strikethrough',
  'font-highlight',
  'font-color',
  'list-unordered',
  'list-ordered',
  'block-quote',
  'block-wrap',
  'block-code-inline',
  'block-code-block',
  'table',
  'image',
  'link',
  'clear-content',
  'logger',
  'full-screen',
];

export {
  PreviewToggle,
  MarkdownHelp,
  ClearContent,
  FontHighlight,
  FontColor,
  TEXT_COLOR_PRESETS,
  HIGHLIGHT_COLOR_PRESETS,
  MARKDOWN_HELP_URL,
};
