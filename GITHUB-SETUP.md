# Push to GitHub and share with your team

## Prerequisites

- **Git** installed: https://git-scm.com/download/win  
  After installing, restart your terminal.

---

## Option A: Use the setup script (easiest)

1. Open PowerShell in this folder.
2. Run:
   ```powershell
   .\push-to-github.ps1
   ```
3. When prompted, paste your GitHub repo URL (e.g. `https://github.com/your-username/opportunity-tracker.git`).
4. After it finishes, your repo URL is the link to share (e.g. `https://github.com/your-username/opportunity-tracker`).

---

## Option B: Run commands manually

### Step 1: Create a new repo on GitHub

1. Go to **https://github.com/new**
2. Name it (e.g. `opportunity-tracker`)
3. Choose **Private** or **Public**
4. Do **not** add README, .gitignore, or license
5. Click **Create repository**
6. Copy the repo URL (e.g. `https://github.com/YOUR_USERNAME/opportunity-tracker.git`)

### Step 2: Push this project

In PowerShell, from this project folder:

```powershell
cd C:\Users\ashukla086\Downloads\opportunity-tracker-module

git init
git add .
git commit -m "Initial commit: Opportunity Tracker"
git branch -M main
git remote add origin YOUR_REPO_URL_HERE
git push -u origin main
```

Replace `YOUR_REPO_URL_HERE` with the URL from Step 1.

### Step 3: Share the link

Share this URL with your team:

```
https://github.com/YOUR_USERNAME/REPO_NAME
```

Example: `https://github.com/ashukla086/opportunity-tracker`

---

## Add collaborators

1. Open the repo on GitHub.
2. **Settings** → **Collaborators** (or **Manage access**).
3. **Add people** → enter GitHub username or email.
4. Choose **Write** access so they can push and open pull requests.

---

## Team clone URL

Anyone with access can clone with:

```
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
```
