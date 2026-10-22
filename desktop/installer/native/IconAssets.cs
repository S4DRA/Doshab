// Technical Windows icon conversion from VAL's supplied high-resolution artwork.
// No geometry is redrawn. RGB black-matte coverage is converted to straight alpha.
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

internal static class IconAssets
{
    private static void Label(Graphics g, string text, int size, bool bold, Color color, int x, int y)
    {
        using (var font = new Font("Segoe UI", size, bold ? FontStyle.Bold : FontStyle.Regular, GraphicsUnit.Pixel))
        using (var brush = new SolidBrush(color)) g.DrawString(text, font, brush, x, y);
    }

    private static void LegacyArtwork(Bitmap logo, string folder)
    {
        Color bg = Color.FromArgb(11, 14, 18), ink = Color.FromArgb(212, 215, 221),
            muted = Color.FromArgb(144, 153, 166), orange = Color.FromArgb(245, 81, 5);
        Directory.CreateDirectory(folder);
        using (var sidebar = new Bitmap(164, 314, PixelFormat.Format24bppRgb))
        using (var g = Graphics.FromImage(sidebar))
        {
            g.Clear(bg); g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            using (var brush = new SolidBrush(orange)) { g.FillRectangle(brush, 0, 0, 164, 3); g.FillRectangle(brush, 19, 259, 24, 2); }
            Label(g, "VAL", 26, true, ink, 18, 25);
            Label(g, "FOR WINDOWS", 8, false, muted, 19, 63);
            g.DrawImage(logo, new Rectangle(12, 96, 140, 140));
            Label(g, "STAY CONNECTED.", 8, true, ink, 19, 273);
            Label(g, "YOUR SPACE, TOGETHER.", 7, false, muted, 19, 289);
            sidebar.Save(Path.Combine(folder, "sidebar.bmp"), ImageFormat.Bmp);
        }
        using (var header = new Bitmap(150, 57, PixelFormat.Format24bppRgb))
        using (var g = Graphics.FromImage(header))
        {
            g.Clear(bg); g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.DrawImage(logo, new Rectangle(2, 4, 49, 49));
            Label(g, "VAL", 20, true, ink, 60, 8);
            Label(g, "WINDOWS", 7, false, muted, 61, 36);
            using (var brush = new SolidBrush(orange)) g.FillRectangle(brush, 145, 10, 2, 37);
            header.Save(Path.Combine(folder, "header.bmp"), ImageFormat.Bmp);
        }
    }

    private static Bitmap Resize(Bitmap source, int size)
    {
        var result = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(result))
        {
            g.Clear(Color.Transparent);
            g.CompositingMode = CompositingMode.SourceCopy;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.DrawImage(source, new Rectangle(0, 0, size, size), 0, 0,
                source.Width, source.Height, GraphicsUnit.Pixel);
        }
        return result;
    }

    public static int Main(string[] args)
    {
        if (args.Length != 2) return 2;
        Directory.CreateDirectory(args[1]);
        using (var input = new Bitmap(args[0]))
        using (var alpha = new Bitmap(input.Width, input.Height, PixelFormat.Format32bppArgb))
        {
            int left = input.Width, top = input.Height, right = 0, bottom = 0;
            for (int y = 0; y < input.Height; y++)
            for (int x = 0; x < input.Width; x++)
            {
                Color c = input.GetPixel(x, y);
                int maximum = Math.Max(c.R, Math.Max(c.G, c.B));
                if (maximum < 16) continue;
                double coverage = Math.Min(1, maximum / (c.R > c.G * 1.35 ? 255.0 : 248.0));
                int a = (int)Math.Round(255 * coverage);
                alpha.SetPixel(x, y, Color.FromArgb(a,
                    Math.Min(255, (int)Math.Round(c.R / coverage)),
                    Math.Min(255, (int)Math.Round(c.G / coverage)),
                    Math.Min(255, (int)Math.Round(c.B / coverage))));
                if (a > 80) { left = Math.Min(left, x); right = Math.Max(right, x);
                    top = Math.Min(top, y); bottom = Math.Max(bottom, y); }
            }
            if (right <= left || bottom <= top) throw new InvalidDataException("VAL logo has no visible mark.");
            // Small optical padding: the old file wasted much of the icon on its black plate.
            int markWidth = right - left + 1, markHeight = bottom - top + 1;
            int canvasSize = (int)Math.Ceiling(Math.Max(markWidth, markHeight) / 0.91);
            using (var master = new Bitmap(canvasSize, canvasSize, PixelFormat.Format32bppArgb))
            {
                using (var g = Graphics.FromImage(master))
                {
                    g.Clear(Color.Transparent);
                    g.CompositingMode = CompositingMode.SourceCopy;
                    g.DrawImageUnscaled(alpha, (canvasSize - markWidth) / 2 - left,
                        (canvasSize - markHeight) / 2 - top);
                }
                using (var png = Resize(master, 1024)) png.Save(Path.Combine(args[1], "val-master.png"), ImageFormat.Png);
                using (var png = Resize(master, 512)) png.Save(Path.Combine(args[1], "val.png"), ImageFormat.Png);
                LegacyArtwork(master, Path.Combine(Path.GetDirectoryName(Path.GetFullPath(args[1])), "installer"));
                int[] sizes = { 16, 20, 24, 32, 40, 48, 64, 96, 128, 256 };
                var frames = new byte[sizes.Length][];
                for (int i = 0; i < sizes.Length; i++)
                using (var frame = Resize(master, sizes[i]))
                using (var stream = new MemoryStream())
                {
                    frame.Save(stream, ImageFormat.Png);
                    frames[i] = stream.ToArray();
                }
                using (var writer = new BinaryWriter(File.Create(Path.Combine(args[1], "val.ico"))))
                {
                    writer.Write((ushort)0); writer.Write((ushort)1); writer.Write((ushort)sizes.Length);
                    int offset = 6 + sizes.Length * 16;
                    for (int i = 0; i < sizes.Length; i++)
                    {
                        writer.Write((byte)(sizes[i] == 256 ? 0 : sizes[i]));
                        writer.Write((byte)(sizes[i] == 256 ? 0 : sizes[i]));
                        writer.Write((byte)0); writer.Write((byte)0);
                        writer.Write((ushort)1); writer.Write((ushort)32);
                        writer.Write(frames[i].Length); writer.Write(offset);
                        offset += frames[i].Length;
                    }
                    foreach (var frame in frames) writer.Write(frame);
                }
            }
        }
        Console.WriteLine("VAL: transparent 1024px master, 512px PNG and ten native Windows icon sizes generated.");
        return 0;
    }
}
