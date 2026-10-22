; Custom animated Windows presentation around electron-builder's NSIS engine.
; /S and --updated never launch this presentation or change updater arguments.
!ifndef BUILD_UNINSTALLER
  !include "getProcessInfo.nsh"
  Var pid ; normally declared by the default CHECK_APP_RUNNING implementation
  Var VALSetupActive
  Var VALStateFile
  Var VALUIHandle
  Var VALPolls
  Var VALChoice

  !macro customInit
    StrCpy $VALSetupActive "0"
    ${IfNot} ${Silent}
    ${AndIf} $installMode == "CurrentUser"
    ${AndIfNot} ${UAC_IsInnerInstance}
    ${AndIfNot} ${isUpdated}
    ${AndIfNot} ${isForAllUsers}
      InitPluginsDir
      StrCpy $VALStateFile "$PLUGINSDIR\val-setup.ini"
      FileOpen $0 "$VALStateFile" w
      FileWriteUTF16LE /BOM $0 "[Engine]$\r$\n"
      FileClose $0
      File "/oname=$PLUGINSDIR\VAL-Setup-UI.exe" "${PROJECT_DIR}\installer\bin\VAL-Setup-UI.exe"
      System::Call 'kernel32::GetCurrentProcessId()i.r0'
      WriteINIStr "$VALStateFile" "Engine" "Pid" "$0"
      WriteINIStr "$VALStateFile" "Engine" "Version" "${VERSION}"
      WriteINIStr "$VALStateFile" "Engine" "Folder" "$INSTDIR"
      WriteINIStr "$VALStateFile" "Engine" "State" "welcome"
      ClearErrors
      Exec '"$PLUGINSDIR\VAL-Setup-UI.exe" --state "$VALStateFile"'
      IfErrors val_ui_failed
      StrCpy $VALPolls 0
      val_ui_handshake:
        ReadINIStr $0 "$VALStateFile" "UI" "Status"
        StrCmp $0 "ready" val_ui_connected
        IntOp $VALPolls $VALPolls + 1
        IntCmp $VALPolls 200 val_ui_failed
        Sleep 150
        Goto val_ui_handshake
      val_ui_connected:
        ReadINIStr $0 "$VALStateFile" "UI" "Pid"
        System::Call 'kernel32::OpenProcess(i 0x100000, i 0, i r0)p.r1'
        StrCpy $VALUIHandle $1
        StrCmp $VALUIHandle 0 val_ui_failed
        StrCpy $VALSetupActive "1"
      val_ui_choice:
        ReadINIStr $VALChoice "$VALStateFile" "UI" "Action"
        StrCmp $VALChoice "cancel" val_ui_cancel
        StrCmp $VALChoice "install" val_ui_install
        System::Call 'kernel32::WaitForSingleObject(p $VALUIHandle, i 0)i.r0'
        IntCmp $0 258 0 val_ui_cancel val_ui_cancel
        Sleep 120
        Goto val_ui_choice
      val_ui_install:
        ReadINIStr $0 "$VALStateFile" "Options" "Folder"
        StrCmp $0 "" val_ui_cancel
        ; Match the normal wizard's protection against installing in a bare root.
        ${GetFileName} "$0" $1
        StrCmp $1 "" val_ui_cancel
        StrCpy $INSTDIR "$0"
        WriteINIStr "$VALStateFile" "Engine" "State" "installing"
        ; Only the presentation is replaced. The normal NSIS section still owns
        ; extraction, registry, shortcuts, old-version removal and uninstaller.
        SetSilent silent
        Goto val_ui_initialized
      val_ui_cancel:
        System::Call 'kernel32::CloseHandle(p $VALUIHandle)'
        SetErrorLevel 1
        Quit
      val_ui_failed:
        MessageBox MB_OK|MB_ICONSTOP "VAL Setup could not start its interface. Please run the installer again."
        SetErrorLevel 1
        Quit
      val_ui_initialized:
    ${EndIf}
  !macroend

  !macro customCheckAppRunning
    ${If} $VALSetupActive == "1"
      ; A manual install never terminates VAL or an active call silently.
      ; Background updates keep the original electron-builder behavior below.
      val_wait_for_app:
        System::Call 'kernel32::WaitForSingleObject(p $VALUIHandle, i 0)i.r0'
        IntCmp $0 258 0 val_app_ui_closed val_app_ui_closed
        nsProcess::_FindProcess "${APP_EXECUTABLE_FILENAME}"
        Pop $R0
        ${If} $R0 == 0
          WriteINIStr "$VALStateFile" "Engine" "State" "waiting"
          Sleep 350
          Goto val_wait_for_app
        ${EndIf}
        WriteINIStr "$VALStateFile" "Engine" "State" "installing"
        Goto val_app_check_done
      val_app_ui_closed:
        SetErrorLevel 1
        Quit
      val_app_check_done:
    ${Else}
      !insertmacro IS_POWERSHELL_AVAILABLE
      !insertmacro _CHECK_APP_RUNNING
    ${EndIf}
  !macroend

  !macro customInstall
    ${If} $VALSetupActive == "1"
      WriteINIStr "$VALStateFile" "Engine" "State" "finalizing"
      ReadINIStr $0 "$VALStateFile" "Options" "DesktopShortcut"
      ${If} $0 == "0"
        Delete "$newDesktopLink"
      ${EndIf}
    ${EndIf}
  !macroend

  !macro VAL_SIGNAL_FUNCTIONS
    Function VALWaitForInterface
      val_wait_for_finish:
        ReadINIStr $0 "$VALStateFile" "UI" "Action"
        StrCmp $0 "done" val_finished_interface
        StrCmp $0 "cancel" val_finished_interface
        System::Call 'kernel32::WaitForSingleObject(p $VALUIHandle, i 0)i.r0'
        IntCmp $0 258 0 val_finished_interface val_finished_interface
        Sleep 120
        Goto val_wait_for_finish
      val_finished_interface:
        System::Call 'kernel32::CloseHandle(p $VALUIHandle)'
    FunctionEnd

    Function .onInstSuccess
      ${If} $VALSetupActive == "1"
        ; Success is emitted by NSIS, never by a timer or by the UI itself.
        WriteINIStr "$VALStateFile" "Engine" "State" "ready"
        Call VALWaitForInterface
        ReadINIStr $0 "$VALStateFile" "Options" "Launch"
        ${If} $0 == "1"
          ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" ""
        ${EndIf}
      ${EndIf}
    FunctionEnd

    Function .onInstFailed
      ${If} $VALSetupActive == "1"
        WriteINIStr "$VALStateFile" "Engine" "State" "error"
        Call VALWaitForInterface
      ${EndIf}
    FunctionEnd
  !macroend
!endif
