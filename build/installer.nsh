; Custom NSIS script para LouvorJA
; Documentação: https://www.electron.build/configuration/nsis
;
; Este script é incluído no processo de build do electron-builder
; (via nsis.include em electron-builder.yml).

!macro customInstall
  ; Registrar o protocolo louvorja:// no Windows.
  ; Permite que o app seja aberto via URLs do tipo louvorja://...
  ; (usado internamente para o protocolo customizado do Electron)
  WriteRegStr HKCR "louvorja" "" "URL:LouvorJA Protocol"
  WriteRegStr HKCR "louvorja" "URL Protocol" ""
  WriteRegStr HKCR "louvorja\DefaultIcon" "" "$INSTDIR\${PRODUCT_FILENAME}.exe,1"
  WriteRegStr HKCR "louvorja\shell\open\command" "" '"$INSTDIR\${PRODUCT_FILENAME}.exe" "%1"'
!macroend

!macro customUnInstall
  ; Remover o protocolo louvorja:// ao desinstalar
  DeleteRegKey HKCR "louvorja"
!macroend
