export type EditorColorKey = "primary" | "secondary";

interface ColorPaletteOptions {
  initialPrimary?: string;
  initialSecondary?: string;
}

export class ColorPalette {
  private iv_colors: Record<EditorColorKey, string>;
  private readonly iv_forceRender?: () => void;

  constructor(forceRender?: () => void, options?: ColorPaletteOptions) {
    this.iv_forceRender = forceRender;
    this.iv_colors = {
      primary: this.im_formatColor(options?.initialPrimary ?? "#ffffff"),
      secondary: this.im_formatColor(options?.initialSecondary ?? "#ff6b6b"),
    };
  }

  public get pt_primaryColor() {
    return this.iv_colors.primary;
  }

  public get pt_secondaryColor() {
    return this.iv_colors.secondary;
  }

  public pt_getColor(key: EditorColorKey) {
    return this.iv_colors[key];
  }

  public im_setPrimary(color: string) {
    this.im_setColor("primary", color);
  }

  public im_setSecondary(color: string) {
    this.im_setColor("secondary", color);
  }

  public im_setColor(key: EditorColorKey, color: string) {
    const formatted = this.im_formatColor(color);
    if (this.iv_colors[key] === formatted) {
      return;
    }
    this.iv_colors = {
      ...this.iv_colors,
      [key]: formatted,
    };
    this.iv_forceRender?.();
  }

  private im_formatColor(color: string): string {
    if (!color) {
      return "#FFFFFF";
    }
    const trimmed = color.trim();
    const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    return withHash.toUpperCase();
  }
}
