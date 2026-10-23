VAL for Windows 0.1.7 checks for stable desktop updates before opening the platform. A newer version is downloaded, installed and reopened automatically. Update failures offer Retry or Quit. Sign-in persistence and inactivity expiry remain intact, and tray navigation cannot bypass the startup check.

Updates discovered while VAL is already running do not force a restart or interrupt a call. Web platform improvements continue to arrive from the hosted site. The website download route follows the latest complete stable installer and update metadata.

The new startup gate applies after this seed version is installed. Earlier update-enabled versions receive it through their existing update-on-full-quit behavior; versions without an updater need the installer once.

Previous 0.1.6 presentation changes:

VAL for Windows 0.1.6 introduced the animated Windows setup interface with the supplied transparent Echo Sonar logo, moving signal graphics, folder and shortcut choices, installation status and a completion screen. It respects reduced motion and pauses animations when minimized.

The app, taskbar, tray and installer now use transparent icons rendered from the supplied high-resolution artwork, with ten dedicated Windows sizes. Scrollbars are hidden while normal scrolling remains available. The soft-white window controls and draggable header remain integrated into VAL.

VAL reopens the dashboard, retains sign-in across restarts, and clears local authentication after 30 days without desktop use. Activity and cookie data are flushed on a full app quit. The associated website session-lifetime change must be deployed for legacy logins.

The desktop client checks GitHub Releases for updates, downloads published stable versions in the background and installs them on a full app quit. Closing VAL to the tray keeps it running. Restarting immediately is optional and confirms that active calls will end.

Existing 0.1.3 and earlier clients need this installer once to receive the desktop updater. Future desktop versions must publish the installer, its blockmap and latest.yml together.
