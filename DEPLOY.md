# Publish SecondLook on GitHub + GitHub Pages

This project is ready to publish. It is not automatically connected to your GitHub account.

**Keep passwords, personal access tokens, private keys, and recovery codes out of chat, source files, commits, and screenshots.** Authenticate only through GitHub’s official browser flow or a trusted local credential manager.

## Choose what becomes public

For the simplest GitHub Pages setup, create a **public** repository named `secondlook`. This makes the project’s source code public. The code includes no user messages, generated passwords, or API secrets.

If you prefer another name, the app supports a project subpath without changing asset URLs. Private repository Pages availability depends on the account’s GitHub plan and settings.

## Option A — use GitHub in your browser

1. Download `SecondLook-github-ready.zip` and **extract it** on your computer.
2. Sign in at [github.com](https://github.com), then open [github.com/new](https://github.com/new).
3. Name the repository **secondlook**, choose **Public**, and create it. Do not add a starter README or licence; the project already has these.
4. Choose **uploading an existing file** / **Add file → Upload files**.
5. Upload the files and folders **inside** the extracted `secondlook` folder. Do **not** upload the ZIP as the website, and do not add an extra outer `secondlook/` directory.
6. Commit the upload to the **main** branch.
7. Confirm these exact paths exist in the repository:
   - `site/index.html`
   - `package.json`
   - `tests/scanner.test.js`
   - `.github/workflows/deploy.yml`
8. Hidden folders may be omitted by a file picker. If `.github/workflows/deploy.yml` is missing, choose **Add file → Create new file**, enter that exact filename, and paste the contents from the included workflow file. Commit it to `main`.
9. Open **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.
10. Open **Actions → Test and deploy SecondLook → Run workflow**. Choose `main`.
11. Wait for both jobs to turn green. The deployment job and **Settings → Pages** will show the actual live URL.

With that repository name it is normally:

```text
https://YOUR-GITHUB-USERNAME.github.io/secondlook/
```

Replace the placeholder with your actual username. It is not live until the workflow succeeds.

## Option B — use Git and the GitHub CLI on your own computer

Install Git, Node.js 20+, and the GitHub CLI (`gh`). Open a terminal inside the extracted project folder.

Authenticate using GitHub’s official web flow. The `workflow` scope is needed to push the Actions workflow with an OAuth-backed HTTPS credential:

```bash
gh auth login --web --git-protocol https --scopes workflow
gh auth setup-git
```

If this is your first time using Git, configure your commit name and a verified or GitHub-provided private commit email in your own local Git settings. Do not put a password or token in either field.

Then:

```bash
npm test
git init -b main
git add .
git commit -m "Build SecondLook digital safety toolkit"
gh repo create secondlook --public --source=. --remote=origin --push
```

If a repository with that name already exists, stop and choose a different name or explicitly decide to use the existing one. Do not overwrite unrelated work or force-push.

Finish in your browser:

1. Repository **Settings → Pages → Source → GitHub Actions**.
2. **Actions → Test and deploy SecondLook → Run workflow**.
3. Wait for success and open the deployed URL.

## Troubleshooting

- **Workflow fails at “Configure GitHub Pages”:** confirm that Pages is enabled with the **GitHub Actions** source, then rerun the workflow.
- **The workflow never appears:** check that `.github/workflows/deploy.yml` was uploaded, is on `main`, and Actions is allowed by repository/account settings.
- **A Pages 404:** wait until deployment succeeds. Check the username, repository spelling, trailing slash, and Pages URL in the repository settings.
- **Bare/un-styled page:** do not move only `index.html`. Publish the whole `site/` directory. All assets use relative paths.
- **An empty repository or a visible ZIP download instead of the app:** extract the ZIP and upload its source files, not just the archive.
- **Old content offline:** reconnect and reload. The worker uses a network-first policy. In an unusual broken-cache situation, remove this app’s site data and reload online.
- **Cannot install the app:** installation UI varies by browser. Use the browser’s “Install app” or “Add to Home Screen” option on the hosted HTTPS site.

## Updating the site

Edit the source, run `npm test`, and push to `main`. The workflow redeploys the `site/` directory. Use browser tests (`npm run test:browser`) for interface changes. Do not add analytics, remote scanning, or hosted fonts without revisiting the privacy disclosure and Content Security Policy.
