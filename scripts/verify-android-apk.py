#!/usr/bin/env python3
"""Inspect the built distributable, not just its Gradle configuration."""
from pathlib import Path
import os, re, subprocess, sys
root=Path(__file__).resolve().parent.parent
apk=Path(sys.argv[1]) if len(sys.argv)>1 else root/'companions/android/app/build/outputs/apk/preview/app-preview.apk'
sdk=Path(os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT') or '')
versions=sorted((sdk/'build-tools').glob('*'),key=lambda p:tuple(int(x) if x.isdigit() else 0 for x in p.name.split('.')))
if not versions:raise SystemExit('Set ANDROID_HOME to an installed Android SDK.')
tools=versions[-1]
badging=subprocess.check_output([str(tools/'aapt'),'dump','badging',str(apk)],text=True)
permissions=subprocess.check_output([str(tools/'aapt'),'dump','permissions',str(apk)],text=True)
if 'application-debuggable' in badging:raise SystemExit('Refusing a debuggable distributable.')
if "name='io.github.meyer4.secondlook.preview'" not in badging:raise SystemExit('Unexpected preview package identity.')
found=re.findall(r"uses-permission: name='([^']+)'",permissions)
if found!=['android.permission.POST_NOTIFICATIONS']:raise SystemExit('Unexpected runtime permission set: '+repr(found))
subprocess.run([str(tools/'apksigner'),'verify',str(apk)],check=True)
print('APK verified: non-debuggable, separate preview identity, notification-posting permission only, valid APK signature.')
print('This verifies these properties only, not overall security or production signing ownership.')
