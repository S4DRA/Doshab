VAL for Windows 0.1.6 introduces an entirely new animated Windows setup interface with a transparent Echo Sonar logo, moving signal graphics, folder and shortcut choices, installation status and a completion screen. It respects reduced motion and pauses animations when minimized. Published background updates continue through the existing installer engine.

The app, taskbar, tray and installer now use transparent icons rendered from the supplied high-resolution artwork, with ten dedicated Windows sizes. Scrollbars are hidden while normal scrolling remains available. The soft-white window controls and draggable header remain integrated into VAL.

VAL reopens the dashboard, retains sign-in across restarts, and clears local authentication after 30 days without desktop use. Activity and cookie data are flushed on a full app quit. The associated website session-lifetime change must be deployed for legacy logins.

The desktop client checks GitHub Releases for updates, downloads published stable versions in the background and installs them on a full app quit. Closing VAL to the tray keeps it running. Restarting immediately is optional and confirms that active calls will end.

Existing 0.1.3 and earlier clients need this installer once to receive the desktop updater. Future desktop versions must publish the installer, its blockmap and latest.yml together.
