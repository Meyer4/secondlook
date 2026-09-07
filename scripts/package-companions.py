#!/usr/bin/env python3
"""Package source companions and an already-built non-debuggable Android preview. Never package signing keys."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil
import hashlib
import argparse
ROOT=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--skip-android',action='store_true')
args=parser.parse_args()
output=ROOT/'site/downloads';output.mkdir(parents=True,exist_ok=True)
excluded={'.git','.gradle','build','DerivedData','node_modules','__pycache__','test-results'}
def package(directory, destination, prefix=''):
    with ZipFile(destination,'w',ZIP_DEFLATED,compresslevel=9) as archive:
        for file in sorted(directory.rglob('*')):
            relative=file.relative_to(directory)
            if any(part in excluded or part.endswith('.xcodeproj') for part in relative.parts):continue
            if not file.is_file() or file.name=='local.properties' or file.suffix in {'.keystore','.jks','.p12','.mobileprovision'} or file.name.startswith('.env'):continue
            archive.write(file,Path(prefix)/relative)
        archive.write(ROOT/'LICENSE',Path(prefix)/'LICENSE.txt')
        archive.write(ROOT/'companions/README.md',Path(prefix)/'COMPANION-GUIDE.md')
package(ROOT/'companions/browser/extension',output/'secondlook-browser-extension.zip')
package(ROOT/'companions/ios',output/'secondlook-ios-project.zip','SecondLook-iPhone')
package(ROOT/'companions/ios/SafariExtension/Resources',output/'secondlook-safari-extension.zip')
apk=ROOT/'companions/android/app/build/outputs/apk/preview/app-preview.apk'
if apk.exists():shutil.copyfile(apk,output/'secondlook-android-preview.apk')
elif not args.skip_android:raise SystemExit('Build the Android APK first. Nothing was labelled as an APK without a build.')
files=sorted([*output.glob('*.zip'),*output.glob('*.apk')])
(output/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(file.read_bytes()).hexdigest()+'  '+file.name+'\n' for file in files))
for file in files:print(file.relative_to(ROOT),f'{file.stat().st_size:,} bytes')
print('Signing material and generated dependency/build directories were excluded.')
