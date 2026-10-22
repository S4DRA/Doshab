using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Imaging;
using System.Windows.Threading;

// A local-only presentation process. NSIS remains the sole installation engine.
// No browser, remote content, network, credentials, elevation or process killing.
internal sealed class ValSetup
{
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    private static extern uint GetPrivateProfileString(string section, string key, string fallback,
        StringBuilder value, uint size, string file);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool WritePrivateProfileString(string section, string key, string value, string file);
    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr window, int attribute, ref int value, int size);

    private readonly Window window;
    private readonly Grid root;
    private readonly string stateFile;
    private readonly bool preview;
    private readonly bool rendering;
    private readonly DispatcherTimer timer;
    private readonly Storyboard ambient;
    private readonly Storyboard working;
    private Process engine;
    private string stage = "welcome";
    private string lastEngineStage = "";
    private bool exiting;
    private bool animate;
    private DateTime previewStarted;

    private T Find<T>(string name) where T : class
    {
        var value = window.FindName(name) as T;
        if (value == null) throw new InvalidDataException("Missing VAL setup control: " + name);
        return value;
    }

    private string Read(string section, string key, string fallback)
    {
        if (preview || rendering) return fallback;
        var text = new StringBuilder(2048);
        GetPrivateProfileString(section, key, fallback, text, (uint)text.Capacity, stateFile);
        return text.ToString();
    }

    private void Write(string section, string key, string value)
    {
        if (preview || rendering) return;
        if (!WritePrivateProfileString(section, key, value, stateFile))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not communicate with VAL setup.");
    }

    private ValSetup(string file, bool isPreview, bool isRendering)
    {
        stateFile = file;
        preview = isPreview;
        rendering = isRendering;
        using (var xaml = Assembly.GetExecutingAssembly().GetManifestResourceStream("VAL.Setup.xaml"))
            window = (Window)XamlReader.Load(xaml);
        root = Find<Grid>("Root");
        using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("VAL.Logo.png"))
        {
            var logo = new BitmapImage();
            logo.BeginInit(); logo.CacheOption = BitmapCacheOption.OnLoad; logo.StreamSource = stream;
            logo.EndInit(); logo.Freeze();
            Find<Image>("HeaderLogo").Source = logo;
            Find<Image>("HeroLogo").Source = logo;
        }
        using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("VAL.Icon.ico"))
        {
            var decoder = new IconBitmapDecoder(stream, BitmapCreateOptions.PreservePixelFormat, BitmapCacheOption.OnLoad);
            window.Icon = decoder.Frames[decoder.Frames.Count - 1];
        }
        string defaultFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "VAL");
        Find<TextBlock>("PathText").Text = preview || rendering ? @"C:\Users\You\AppData\Local\Programs\VAL" : Read("Engine", "Folder", defaultFolder);
        Find<TextBlock>("PathText").ToolTip = Find<TextBlock>("PathText").Text;
        Find<TextBlock>("VersionText").Text = preview || rendering ? "DESIGN PREVIEW / NO INSTALLATION" :
            "VAL " + Read("Engine", "Version", "") + " / WINDOWS 64-BIT";
        animate = !rendering && SystemParameters.ClientAreaAnimation;
        ambient = (Storyboard)window.Resources["Ambient"];
        working = (Storyboard)window.Resources["Working"];
        timer = new DispatcherTimer(DispatcherPriority.Background);
        timer.Interval = TimeSpan.FromMilliseconds(350);
        timer.Tick += Poll;

        Find<Button>("InstallButton").Click += delegate { BeginInstall(); };
        Find<Button>("ChangeFolderButton").Click += delegate { ChooseFolder(); };
        Find<Button>("CloseButton").Click += delegate { window.Close(); };
        Find<Button>("MinimizeButton").Click += delegate { window.WindowState = WindowState.Minimized; };
        Find<Button>("LaunchButton").Click += delegate { Complete(true); };
        Find<Button>("FinishButton").Click += delegate { Complete(false); };
        Find<Button>("ErrorCloseButton").Click += delegate { window.Close(); };
        Find<Button>("InstallButton").IsDefault = true;
        Find<Grid>("WindowHeader").MouseLeftButtonDown += delegate(object sender, MouseButtonEventArgs e)
        {
            DependencyObject node = e.OriginalSource as DependencyObject;
            while (node != null)
            {
                if (node is ButtonBase) return;
                node = node is Visual ? VisualTreeHelper.GetParent(node) : LogicalTreeHelper.GetParent(node);
            }
            try { window.DragMove(); } catch (InvalidOperationException) { }
        };
        window.PreviewKeyDown += delegate(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape) { e.Handled = true; window.Close(); }
        };
        window.StateChanged += delegate
        {
            if (!animate) return;
            if (window.WindowState == WindowState.Minimized)
            { ambient.Pause(window); if (stage == "installing") working.Pause(window); }
            else { ambient.Resume(window); if (stage == "installing") working.Resume(window); }
        };
        window.Closing += Closing;
        window.Closed += delegate { timer.Stop(); if (animate) { ambient.Remove(window); working.Remove(window); } };
        window.SourceInitialized += delegate
        {
            try
            {
                IntPtr handle = new WindowInteropHelper(window).Handle;
                int roundCorners = 2, dark = 1;
                DwmSetWindowAttribute(handle, 33, ref roundCorners, sizeof(int));
                DwmSetWindowAttribute(handle, 20, ref dark, sizeof(int));
            }
            catch (DllNotFoundException) { }
            catch (EntryPointNotFoundException) { }
        };
        window.Loaded += delegate
        {
            if (animate)
            {
                ambient.Begin(window, true);
                var fade = new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(340));
                root.BeginAnimation(UIElement.OpacityProperty, fade);
            }
            if (!rendering) timer.Start();
            Find<Button>("InstallButton").Focus();
        };
        if (!preview && !rendering)
        {
            int pid;
            if (!int.TryParse(Read("Engine", "Pid", ""), out pid) || pid <= 0)
                throw new InvalidDataException("The VAL installer engine is unavailable.");
            engine = Process.GetProcessById(pid);
            Write("UI", "Pid", Process.GetCurrentProcess().Id.ToString());
            // Last handshake write: NSIS never proceeds before the interface is initialized.
            Write("UI", "Status", "ready");
        }
    }

    private void SetStage(string next)
    {
        stage = next;
        Find<StackPanel>("WelcomePanel").Visibility = next == "welcome" ? Visibility.Visible : Visibility.Collapsed;
        Find<StackPanel>("InstallingPanel").Visibility = next == "installing" ? Visibility.Visible : Visibility.Collapsed;
        Find<StackPanel>("ReadyPanel").Visibility = next == "ready" ? Visibility.Visible : Visibility.Collapsed;
        Find<StackPanel>("ErrorPanel").Visibility = next == "error" ? Visibility.Visible : Visibility.Collapsed;
        Find<Button>("CloseButton").IsEnabled = next != "installing";
        if (next == "ready") { Find<Button>("LaunchButton").IsDefault = true; Find<Button>("LaunchButton").Focus(); }
        if (next == "error") { Find<Button>("ErrorCloseButton").IsDefault = true; Find<Button>("ErrorCloseButton").Focus(); }
        if (animate)
        {
            working.Remove(window);
            if (next == "installing") working.Begin(window, true);
            var panel = next == "ready" ? (UIElement)Find<StackPanel>("ReadyPanel") :
                next == "installing" ? Find<StackPanel>("InstallingPanel") : Find<StackPanel>("ErrorPanel");
            panel.BeginAnimation(UIElement.OpacityProperty, new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(280)));
        }
    }

    private void ChooseFolder()
    {
        using (var picker = new System.Windows.Forms.FolderBrowserDialog())
        {
            picker.Description = "Choose a folder for VAL. A VAL subfolder will be created.";
            picker.SelectedPath = Path.GetDirectoryName(Find<TextBlock>("PathText").Text);
            if (picker.ShowDialog() != System.Windows.Forms.DialogResult.OK) return;
            string selected = Path.GetFullPath(picker.SelectedPath);
            if (!string.Equals(Path.GetFileName(selected.TrimEnd(Path.DirectorySeparatorChar)), "VAL", StringComparison.OrdinalIgnoreCase))
                selected = Path.Combine(selected, "VAL");
            Find<TextBlock>("PathText").Text = selected;
            Find<TextBlock>("PathText").ToolTip = selected;
        }
    }

    private void BeginInstall()
    {
        if (stage != "welcome") return;
        // Do not close calls or kill VAL from the new interactive setup.
        if (!preview) foreach (var process in Process.GetProcessesByName("VAL"))
        using (process)
        {
            try
            {
                if (process.SessionId != Process.GetCurrentProcess().SessionId) continue;
                Find<TextBlock>("WelcomeNotice").Text = "Quit VAL from its tray menu first, then choose Install VAL again. Your active calls will end when you quit.";
                Find<TextBlock>("WelcomeNotice").Visibility = Visibility.Visible;
                return;
            }
            catch (InvalidOperationException) { }
        }
        string selected = Path.GetFullPath(Find<TextBlock>("PathText").Text);
        if (!Path.IsPathRooted(selected) || selected.IndexOfAny(Path.GetInvalidPathChars()) >= 0 || selected.Length > 900)
            throw new InvalidDataException("Choose a valid installation folder.");
        PrepareInstall(selected);
    }

    private void PrepareInstall(string selected)
    {
        Write("Options", "Folder", selected);
        Write("Options", "DesktopShortcut", Find<CheckBox>("DesktopShortcut").IsChecked == true ? "1" : "0");
        SetStage("installing");
        previewStarted = DateTime.UtcNow;
        // Commit the request only after all selected options have been written.
        Write("UI", "Action", "install");
    }

    private void Poll(object sender, EventArgs e)
    {
        try
        {
            if (preview)
            {
                if (stage == "installing" && (DateTime.UtcNow - previewStarted).TotalSeconds > 4) SetStage("ready");
                return;
            }
            string value = Read("Engine", "State", "welcome");
            if (value != lastEngineStage)
            {
                lastEngineStage = value;
                if (value == "ready") { SetStage("ready"); timer.Stop(); }
                else if (value == "error") Fail("VAL could not finish installing. Close setup and try again. If VAL is running, quit it from the tray first.");
                else if (value == "waiting") Find<TextBlock>("ProgressText").Text = "Quit VAL from its tray menu to continue…";
                else if (value == "finalizing") Find<TextBlock>("ProgressText").Text = "Finishing your VAL shortcuts…";
                else if (value == "installing") Find<TextBlock>("ProgressText").Text = "Installing application files…";
            }
            if (engine != null && engine.HasExited && stage != "ready" && stage != "error")
                Fail("The installation stopped before VAL was ready. Close setup and run the installer again.");
        }
        catch (Exception error) { Fail(error.Message); }
    }

    private void Fail(string message)
    {
        timer.Stop();
        Find<TextBlock>("ErrorText").Text = message;
        SetStage("error");
    }

    private void Complete(bool launch)
    {
        Write("Options", "Launch", launch ? "1" : "0");
        Write("UI", "Action", "done");
        exiting = true;
        window.Close();
    }

    private void Closing(object sender, CancelEventArgs e)
    {
        if (stage == "installing")
        {
            e.Cancel = true;
            Find<TextBlock>("ProgressText").Text = "Please keep setup open until installation finishes.";
            return;
        }
        if (exiting || rendering) return;
        Write("Options", "Launch", "0");
        Write("UI", "Action", stage == "ready" ? "done" : "cancel");
        exiting = true;
    }

    private void Render(string filename, string state)
    {
        SetStage(state);
        var content = (Border)window.Content;
        content.Measure(new Size(1000, 660));
        content.Arrange(new Rect(0, 0, 1000, 660));
        content.UpdateLayout();
        var bitmap = new RenderTargetBitmap(1500, 990, 144, 144, PixelFormats.Pbgra32);
        bitmap.Render(content);
        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(bitmap));
        using (var output = File.Create(filename)) encoder.Save(output);
    }

    private static void Expect(bool condition, string description)
    {
        if (!condition) throw new InvalidDataException("Setup protocol check failed: " + description);
    }

    private static void SelfTest(string report)
    {
        // The caller provides a disposable path. This mode never runs NSIS,
        // launches VAL, creates a shortcut, or writes into an install directory.
        string file = report + ".ini";
        File.WriteAllText(file, "", Encoding.Unicode);
        WritePrivateProfileString("Engine", "Pid", Process.GetCurrentProcess().Id.ToString(), file);
        WritePrivateProfileString("Engine", "Folder", @"C:\Users\测试\VAL", file);
        WritePrivateProfileString("Engine", "Version", "0.0.0-test", file);
        var cancelled = new ValSetup(file, false, true);
        // Render-only instances must not write to any install protocol file.
        cancelled.Write("UI", "Action", "install");
        var untouched = new StringBuilder(32);
        GetPrivateProfileString("UI", "Action", "empty", untouched, 32, file);
        Expect(untouched.ToString() == "empty", "preview/render cannot request installation");

        var ui = new ValSetup(file, false, false);
        ui.animate = false;
        ui.ambient.Begin(ui.window, true);
        ui.ambient.SeekAlignedToLastTick(ui.window, TimeSpan.FromSeconds(9), TimeSeekOrigin.BeginTime);
        Expect(((RotateTransform)ui.Find<Canvas>("OrbitRotor").RenderTransform).Angle > 20, "signal orbit animation resolves its target and advances");
        ui.ambient.Remove(ui.window);
        ui.working.Begin(ui.window, true);
        ui.working.SeekAlignedToLastTick(ui.window, TimeSpan.FromMilliseconds(600), TimeSeekOrigin.BeginTime);
        Expect(((TranslateTransform)ui.Find<Border>("ProgressLight").RenderTransform).X > -50, "installation animation advances without fake percentages");
        ui.working.Remove(ui.window);
        Expect(ui.stage == "welcome", "starts before installation");
        Expect(ui.Read("UI", "Status", "") == "ready", "engine handshake is written");
        Expect(ui.Find<TextBlock>("PathText").Text == @"C:\Users\测试\VAL", "Unicode folder is retained");
        var closeBefore = new CancelEventArgs();
        ui.Closing(null, closeBefore);
        Expect(!closeBefore.Cancel && ui.Read("UI", "Action", "") == "cancel", "closing welcome cancels without install");
        ui.exiting = false;
        ui.Find<CheckBox>("DesktopShortcut").IsChecked = false;
        ui.PrepareInstall(@"C:\Users\测试\VAL");
        Expect(ui.Read("Options", "Folder", "") == @"C:\Users\测试\VAL", "selected path survives IPC");
        Expect(ui.Read("Options", "DesktopShortcut", "") == "0", "shortcut opt-out survives IPC");
        Expect(ui.Read("UI", "Action", "") == "install", "install request commits after options");
        var closeDuring = new CancelEventArgs();
        ui.Closing(null, closeDuring);
        Expect(closeDuring.Cancel, "copying files cannot be interrupted by closing presentation");
        ui.Poll(null, EventArgs.Empty);
        Expect(ui.stage == "installing", "elapsed UI time cannot mark installation successful");
        ui.Write("Engine", "State", "waiting"); ui.Poll(null, EventArgs.Empty);
        Expect(ui.stage == "installing", "waiting for VAL to close is not success");
        ui.Write("Engine", "State", "error"); ui.Poll(null, EventArgs.Empty);
        Expect(ui.stage == "error", "engine errors remain errors");
        ui.Write("Engine", "State", "ready"); ui.Poll(null, EventArgs.Empty);
        Expect(ui.stage == "ready", "only engine success opens completion screen");
        ui.Complete(true);
        Expect(ui.Read("Options", "Launch", "") == "1" && ui.Read("UI", "Action", "") == "done", "Open VAL commits launch to engine");
        File.WriteAllText(report, "{\"passed\":true,\"assertions\":16}");
    }

    [STAThread]
    public static int Main(string[] args)
    {
        try
        {
            bool render = args.Length >= 2 && args[0] == "--render";
            bool preview = args.Length == 1 && args[0] == "--preview";
            bool selfTest = args.Length == 2 && args[0] == "--self-test";
            if (!render && !preview && !selfTest && (args.Length != 2 || args[0] != "--state" || !File.Exists(args[1]))) return 2;
            var app = new Application();
            if (selfTest) { SelfTest(Path.GetFullPath(args[1])); return 0; }
            var ui = new ValSetup(render || preview ? null : Path.GetFullPath(args[1]), preview, render);
            app.DispatcherUnhandledException += delegate(object sender, DispatcherUnhandledExceptionEventArgs e)
            { e.Handled = true; ui.Fail("Setup could not continue. Close it and try again."); };
            if (render)
            {
                string state = args.Length > 2 ? args[2] : "welcome";
                ui.Render(Path.GetFullPath(args[1]), state);
                return 0;
            }
            ui.window.MinWidth = Math.Min(820, SystemParameters.WorkArea.Width - 24);
            ui.window.MinHeight = Math.Min(580, SystemParameters.WorkArea.Height - 24);
            ui.window.Width = Math.Min(1000, SystemParameters.WorkArea.Width - 24);
            ui.window.Height = Math.Min(660, SystemParameters.WorkArea.Height - 24);
            if (ui.window.Width < 820 || ui.window.Height < 580)
            {
                var content = (FrameworkElement)ui.window.Content;
                ui.window.Content = null;
                content.Width = 1000; content.Height = 660;
                ui.window.Content = new Viewbox { Stretch = Stretch.Uniform, Child = content };
            }
            app.Run(ui.window);
            return 0;
        }
        catch (Exception error)
        {
            // A build/render invocation must return failure without showing a window.
            if (args.Length > 1 && (args[0] == "--render" || args[0] == "--self-test"))
                File.WriteAllText(args[1] + ".error.txt", error.ToString());
            else MessageBox.Show("VAL setup could not start.\n\n" + error.Message, "VAL Setup", MessageBoxButton.OK, MessageBoxImage.Error);
            return 1;
        }
    }
}
