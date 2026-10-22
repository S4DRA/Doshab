; Keep electron-builder's install, upgrade, silent-update and uninstall engine.
; Only the presentation is customized here; do not replace installer.nsi.
!include LogicLib.nsh
!include "${PROJECT_DIR}\installer\signal-ui.nsh"

!define VAL_BG "0B0E12"
!define VAL_FG "D4D7DD"
!define VAL_MUTED "A0A7B2"

!define MUI_BGCOLOR "${VAL_BG}"
!define MUI_TEXTCOLOR "${VAL_FG}"
!define MUI_INSTFILESPAGE_COLORS "${VAL_FG} ${VAL_BG}"
!define MUI_INSTFILESPAGE_PROGRESSBAR "colored"
!define MUI_DIRECTORYPAGE_BGCOLOR "171C23"
!define MUI_DIRECTORYPAGE_TEXTCOLOR "${VAL_FG}"
!define MUI_DIRECTORYPAGE_TEXT_TOP "Choose where VAL lives on your PC. Your desktop shortcut will open your existing VAL account, spaces and conversations."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "VAL installation folder"
!ifndef BUILD_UNINSTALLER
  !define MUI_FINISHPAGE_TITLE "VAL is ready."
  !define MUI_FINISHPAGE_TEXT "Your people. Your spaces. Your desktop.$\r$\n$\r$\nSign in to your VAL account to get started. An internet connection is required.$\r$\n$\r$\nYour spaces are waiting. Open VAL when you are ready."
  !define MUI_FINISHPAGE_RUN_TEXT "Open VAL now"
!endif
!define MUI_CUSTOMFUNCTION_GUIINIT VALGuiInit
!define MUI_CUSTOMFUNCTION_UNGUIINIT un.VALGuiInit

!macro customWelcomePage
  !insertmacro skipPageIfUpdated
  !define MUI_WELCOMEPAGE_TITLE "Your space.$\r$\nOn your desktop."
  !define MUI_WELCOMEPAGE_TEXT "Welcome to VAL for Windows.$\r$\n$\r$\nVoice, messages and your private spaces, together in one focused app.$\r$\n$\r$\n01   Install VAL on this PC$\r$\n02   Sign in to your account$\r$\n03   Pick up where you left off$\r$\n$\r$\nChoose Next to set up VAL."
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW VALWelcomeShow
  !insertmacro MUI_PAGE_WELCOME
!macroend

; Skip the unnecessary all-users question on new personal installations.
; Existing machine-wide installations retain their original upgrade path.
!macro customInstallMode
  ${If} $hasPerMachineInstallation == "0"
    StrCpy $isForceCurrentInstall "1"
  ${EndIf}
!macroend

!macro customPageAfterChangeDir
  !define MUI_PAGE_HEADER_TEXT "Bringing VAL to your desktop"
  !define MUI_PAGE_HEADER_SUBTEXT "Setting up the app and your VAL shortcuts."
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW VALProgressShow
!macroend

!macro customUnWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Remove VAL"
  !define MUI_WELCOMEPAGE_TEXT "This removes the VAL desktop app from this PC.$\r$\n$\r$\nYour VAL account, spaces and messages remain available on the platform.$\r$\n$\r$\nChoose Next to continue."
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW un.VALWelcomeShow
  !insertmacro MUI_UNPAGE_WELCOME
!macroend

; Shared native frame styling. Keep the standard keyboard-accessible buttons,
; focus behavior and accessibility semantics.
!macro VAL_FRAME
  SetCtlColors $HWNDPARENT "${VAL_FG}" "${VAL_BG}"
  SetCtlColors $mui.Branding.Background "${VAL_MUTED}" "${VAL_BG}"
  SetCtlColors $mui.Branding.Text "${VAL_MUTED}" "${VAL_BG}"
  SetCtlColors $mui.Header.Text "${VAL_FG}" "${VAL_BG}"
  SetCtlColors $mui.Header.SubText "${VAL_MUTED}" "${VAL_BG}"
!macroend

!macro customHeader
  SetFont "Segoe UI" 9
  InstallColors ${VAL_FG} ${VAL_BG}
  BrandingText "VAL / WINDOWS ${VERSION}"
  Caption "VAL - Setup"

  ; MUI always emits the installer GUI callback, including the silent program
  ; that writes the uninstaller. This function must exist in both compilations.
  Function VALGuiInit
    !insertmacro VAL_FRAME
  FunctionEnd

  !ifndef BUILD_UNINSTALLER
    !insertmacro VAL_SIGNAL_FUNCTIONS
    Function VALWelcomeShow
      SetCtlColors $mui.WelcomePage.Title "${VAL_FG}" "${VAL_BG}"
      SetCtlColors $mui.WelcomePage.Text "${VAL_MUTED}" "${VAL_BG}"
    FunctionEnd

    Function VALProgressShow
      SetCtlColors $mui.InstFilesPage "${VAL_FG}" "${VAL_BG}"
      SetCtlColors $mui.InstFilesPage.Text "${VAL_MUTED}" "${VAL_BG}"
      StrCpy $1 $mui.InstFilesPage.ProgressBar
      ; Disable the Windows progress theme so VAL's accent can be drawn.
      System::Call 'uxtheme::SetWindowTheme(p r1, w "", w "")'
      SendMessage $1 0x2001 0 0x12100B ; PBM_SETBKCOLOR = CCM_SETBKCOLOR
      SendMessage $1 0x409 0 0x0551F5 ; PBM_SETBARCOLOR
    FunctionEnd
  !else
    Function un.VALGuiInit
      !insertmacro VAL_FRAME
    FunctionEnd

    Function un.VALWelcomeShow
      SetCtlColors $mui.WelcomePage.Title "${VAL_FG}" "${VAL_BG}"
      SetCtlColors $mui.WelcomePage.Text "${VAL_MUTED}" "${VAL_BG}"
    FunctionEnd
  !endif
!macroend
