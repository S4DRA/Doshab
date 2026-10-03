type ViewportBaseline = { width: number; height: number };

export function resolveViewport({ width, layoutHeight, visibleHeight, offsetTop, scale, editing, baseline }: {
  width: number;
  layoutHeight: number;
  visibleHeight: number;
  offsetTop: number;
  scale: number;
  editing: boolean;
  baseline: ViewportBaseline | null;
}) {
  // A user zoom gesture must not shrink or reposition the application shell.
  if (Math.abs(scale - 1) > 0.01) return null;
  const rotated = baseline && Math.abs(width - baseline.width) > 80;
  const nextBaseline = !editing || !baseline || rotated ? { width, height: layoutHeight } : baseline;
  // Android can resize both viewports; iOS typically resizes only the visual one.
  const keyboard = editing && Math.max(layoutHeight - visibleHeight - offsetTop, nextBaseline.height - visibleHeight) > 100;
  return { height: visibleHeight, top: keyboard ? offsetTop : 0, keyboard, baseline: nextBaseline };
}
