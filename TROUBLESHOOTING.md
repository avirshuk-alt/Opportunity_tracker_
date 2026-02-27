# Troubleshooting

## Prisma: "self-signed certificate in certificate chain"

If you see this when running `npm run dev` or `prisma generate`:

```text
Error: request to https://binaries.prisma.sh/... failed, reason: self-signed certificate in certificate chain
```

Your network (e.g. corporate proxy/firewall) is doing SSL inspection with a self-signed certificate. The project is already set up to work around this:

- The **dev**, **build**, and **db:generate** scripts run Prisma with `NODE_TLS_REJECT_UNAUTHORIZED=0` so the engine download can succeed.
- Install the new dependency and run again:
  ```powershell
  npm install
  npm run dev
  ```

If you still get the error, set the variable yourself before running:

**PowerShell:**
```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED=0; npm run dev
```

**Command Prompt:**
```cmd
set NODE_TLS_REJECT_UNAUTHORIZED=0 && npm run dev
```

Use this only in a development environment. Do not disable TLS verification in production.

---

## "localhost refused to connect"

## 1. Make sure the dev server is running

The app only responds when the dev server is **running in a terminal**. If you closed the terminal or never ran it, the connection will be refused.

**Do this:**

1. Open **PowerShell** or **Command Prompt**.
2. Go to the project folder:
   ```powershell
   cd C:\Users\ashukla086\Downloads\opportunity-tracker-module
   ```
3. Start the server (keep this window open):
   ```powershell
   npm run dev
   ```
4. Wait until you see something like:
   ```text
   ▲ Next.js 16.x.x
   - Local:        http://localhost:3000
   ```
5. **Leave that terminal open.** Then in your browser go to: **http://localhost:3000**

If you close the terminal, the server stops and you’ll get “refused to connect” again.

---

## 2. Use the correct URL

- Use **http://** (not https://):  
  **http://localhost:3000**
- Try **127.0.0.1** if “localhost” doesn’t work:  
  **http://127.0.0.1:3000**

---

## 3. Check the port in the terminal

If port 3000 is already in use, Next.js may use another port (e.g. 3001). Look at the line that says “Local:” in the terminal and open that URL in the browser.

---

## 4. If the server exits with an error

- If the terminal shows a **red error** and the process exits, the server didn’t start. Copy the error message and fix that first (e.g. run `npm install` again, fix the error, then run `npm run dev` again).
- Make sure dependencies are installed:
  ```powershell
  npm install
  npm run dev
  ```

---

## Quick checklist

| Check | Action |
|-------|--------|
| Server running? | Run `npm run dev` (or `.\use-local-node.ps1`) and **keep the terminal open**. |
| Correct URL? | Open **http://localhost:3000** (not https). |
| Right port? | Use the “Local:” URL shown in the terminal (e.g. 3000 or 3001). |
