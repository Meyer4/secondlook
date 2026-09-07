import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('light/dark switching preserves input and saves only display preferences',async({page})=>{
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-visuals-ready','true');
  await page.locator('#message-input').fill('A private example that should remain only in the field.');
  const initial=await page.locator('html').getAttribute('data-theme');await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',initial==='light'?'dark':'light');
  await expect(page.locator('#message-input')).toHaveValue('A private example that should remain only in the field.');
  const storage=await page.evaluate(()=>({...localStorage}));expect(Object.keys(storage)).toEqual(['secondlook:appearance:v1']);expect(JSON.stringify(storage)).not.toContain('private example');
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme',initial==='light'?'dark':'light');
});
test('motion toggle stops animation and reduced motion is respected',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-animating','true');await page.locator('#motion-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-animating','false');
  await page.locator('#motion-toggle').click();await expect(page.locator('html')).toHaveAttribute('data-animating','true');
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('html')).toHaveAttribute('data-animating','false');await expect(page.locator('#motion-toggle')).toBeDisabled();
});
for(const theme of ['light','dark'])for(const width of [390,1440]){
  test(`Prism ${theme} accessibility at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:950});await page.goto('/');
    if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme-toggle').click();
    for(const view of ['check','passwords','playbook']){
      await page.locator(`[data-nav="${view}"]`).click();
      const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
}
test('companion catalogue has the same working theme and no horizontal overflow',async({page})=>{
  await page.goto('/companions.html');await expect(page.locator('#theme-toggle')).toBeVisible();
  const first=await page.locator('html').getAttribute('data-theme');await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',first==='dark'?'light':'dark');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
});
