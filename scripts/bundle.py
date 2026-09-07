#!/usr/bin/env python3
"""Build a portable, network-free preview and a clean GitHub-ready source ZIP."""
from pathlib import Path
import argparse
import base64
import html
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output-dir', type=Path, default=ROOT.parent)
args = parser.parse_args()
output = args.output_dir.resolve()
output.mkdir(parents=True, exist_ok=True)

page = (SITE / 'index.html').read_text()
page = page.replace('href="./companions.html"', 'href="https://meyer4.github.io/secondlook/companions.html" target="_blank" rel="noopener noreferrer"')
page = page.replace('<html lang="en">', '<html lang="en" data-standalone="true">')
page = re.sub(r'\s*<link\b[^>]*>', '', page)
page = re.sub(r'\s*<script type="module" src="\./app\.js"></script>', '', page)
page = re.sub(
    r'<meta http-equiv="Content-Security-Policy" content="[^"]*">',
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">',
    page,
)
font = base64.b64encode((SITE / 'assets/manrope-variable.ttf').read_bytes()).decode()
css = (SITE / 'styles.css').read_text().replace('./assets/manrope-variable.ttf', 'data:font/ttf;base64,' + font)
favicon = base64.b64encode((SITE / 'assets/favicon.svg').read_bytes()).decode()
page = page.replace('</head>', '<link rel="icon" href="data:image/svg+xml;base64,' + favicon + '">\n<style>\n' + css + '\n</style>\n</head>')

sources = []
for relative in ['lib/scanner.js', 'lib/passwords.js', 'lib/playbook.js', 'app.js']:
    source = (SITE / relative).read_text()
    source = re.sub(r'^import\s+.*?;\s*$', '', source, flags=re.MULTILINE)
    source = re.sub(r'^export\s+', '', source, flags=re.MULTILINE)
    sources.append('// ' + relative + '\n' + source)
script = '\n\n'.join(sources).replace('</script', '<\\/script')
notices = html.escape((ROOT / 'LICENSE').read_text() + '\n\n--- Manrope font ---\n\n' + (SITE / 'assets/Manrope-OFL.txt').read_text())
page = page.replace('</body>', '<template id="licence-notices"><pre>' + notices + '</pre></template>\n<script type="module">\n' + script + '\n</script>\n</body>')
preview = output / 'SecondLook-preview.html'
preview.write_text(page)

excluded_dirs = {'.git', 'node_modules', '.cache', '.arena', '__pycache__', 'artifacts', 'test-results', 'playwright-report', 'coverage', 'dist', 'build', '.gradle', 'DerivedData', 'releases'}
excluded_names = {'SecondLook-preview.html', 'SecondLook-github-ready.zip', '.DS_Store', 'Thumbs.db'}
archive = output / 'SecondLook-github-ready.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
    for file in sorted(ROOT.rglob('*')):
        relative = file.relative_to(ROOT)
        if any(part in excluded_dirs for part in relative.parts):
            continue
        if not file.is_file() or file.name in excluded_names or file.name.startswith('.env') or file.suffix in {'.log', '.keystore', '.jks', '.p12', '.mobileprovision'}:
            continue
        package.write(file, Path('secondlook') / relative)
print(f'Portable app: {preview} ({preview.stat().st_size:,} bytes)')
print(f'GitHub-ready project: {archive} ({archive.stat().st_size:,} bytes)')
