import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const text = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');

test('Android declares only posting notifications, not network, SMS, contacts or accessibility access',()=>{
  const xml=text('companions/android/app/src/main/AndroidManifest.xml');
  const permissions=[...xml.matchAll(/<uses-permission\b[^>]*android:name="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(permissions,['android.permission.POST_NOTIFICATIONS']);
  assert.match(xml,/<activity[^>]*android:name="\.AlertActivity"[^>]*android:exported="false"/);
  assert.match(xml,/android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"/);
  assert.match(xml,/android:allowBackup="false"/);
});
test('distributed Android preview uses a non-debuggable release-derived build and separate preview identity',()=>{
  const gradle=text('companions/android/app/build.gradle');
  assert.match(gradle,/release\s*\{\s*debuggable false/);
  assert.match(gradle,/preview\s*\{\s*initWith release/);
  assert.match(gradle,/applicationIdSuffix '\.preview'/);
});
test('production web CSP blocks connections, objects and inline scripts',()=>{
  const html=text('site/index.html');
  const csp=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.match(csp,/connect-src 'none'/);assert.match(csp,/object-src 'none'/);assert.match(csp,/form-action 'none'/);
  assert.match(csp,/script-src 'self'/);assert.doesNotMatch(csp,/'unsafe-eval'|'unsafe-inline'/);
  assert.match(html,/name="referrer" content="no-referrer"/);
});
test('extension host access and OS warnings remain optional, without external messaging or remote code',()=>{
  const manifest=JSON.parse(text('companions/browser/extension/manifest.json'));
  assert.equal(manifest.host_permissions,undefined);assert.equal(manifest.externally_connectable,undefined);
  assert.deepEqual(manifest.optional_host_permissions,['http://*/*','https://*/*']);
  assert.ok(manifest.optional_permissions.includes('notifications'));
  assert.match(manifest.content_security_policy.extension_pages,/connect-src 'none'/);
});
test('page-synthetic events cannot trigger automatic warning overlays',()=>{
  assert.match(text('companions/browser/src/content-guard.js'),/!event\.isTrusted/);
});
test('generated and private signing material is excluded from distributable source packages',()=>{
  for(const name of ['scripts/bundle.py','scripts/package-companions.py']){
    const script=text(name);for(const suffix of ['.keystore','.jks','.p12','.mobileprovision'])assert.ok(script.includes(suffix),name+' '+suffix);
  }
});
