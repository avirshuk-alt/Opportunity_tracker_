# Windows setup: "npm is not recognized"

That message means **Node.js** (which includes `npm`) is either not installed or not on your PATH.

## Option 1: Install Node.js (recommended)

1. **Download Node.js (LTS)**  
   https://nodejs.org/  
   Choose the **LTS** Windows installer (`.msi`).

2. **Run the installer**  
   - Accept the license.  
   - Leave the default install path (e.g. `C:\Program Files\nodejs\`).  
   - **Important:** enable **“Add to PATH”** (usually on by default).  
   - Finish the install.

3. **Restart your terminal**  
   Close PowerShell/Command Prompt (and Cursor’s terminal if you use it), then open a **new** window.

4. **Check it works**
   ```powershell
   node -v
   npm -v
   ```
   You should see version numbers.

5. **Install and run the app**
   ```powershell
   cd C:\Users\ashukla086\Downloads\opportunity-tracker-module
   npm install
   npm run dev
   ```
   Then open http://localhost:3000 in your browser.

---

## Option 2: Install via Winget (if you use it)

```powershell
winget install OpenJS.NodeJS.LTS
```

Then **close and reopen** your terminal and run `npm install` and `npm run dev` in the project folder.

---

## Option 3: Node is installed but npm still not found

If you already installed Node.js:

1. **Restart Cursor** (or at least close all terminals and open a new one).  
2. Or open a **new PowerShell** from the Start menu and run `npm -v` there.  
3. If it works there but not in Cursor, Cursor may be using an old PATH. Try:  
   - **Cursor menu → Terminal → New Terminal**  
   - Or **View → Command Palette → “Developer: Reload Window”**

---

## Summary

| Step | Action |
|------|--------|
| 1 | Install Node.js LTS from https://nodejs.org (and add to PATH). |
| 2 | Close and reopen your terminal (or Cursor). |
| 3 | In the project folder: `npm install` then `npm run dev`. |
| 4 | Open http://localhost:3000 in your browser. |
