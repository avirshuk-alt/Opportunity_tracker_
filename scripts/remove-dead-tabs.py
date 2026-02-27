import os

# Try multiple path options
candidates = [
    "app/fact-base/page.tsx",
    "/vercel/share/v0-project/app/fact-base/page.tsx",
    os.path.join(os.getcwd(), "app", "fact-base", "page.tsx"),
]
print(f"cwd: {os.getcwd()}")
print(f"cwd contents: {os.listdir(os.getcwd())}")
file_path = None
for c in candidates:
    if os.path.exists(c):
        file_path = c
        print(f"Found file at: {c}")
        break
    else:
        print(f"Not found: {c}")

if file_path is None:
    print("ERROR: Could not find page.tsx")
    exit(1)

with open(file_path, "r") as f:
    lines = f.readlines()

print(f"Total lines before: {len(lines)}")

# Find the marker line
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if "BLOCK_REMOVAL_P2" in line:
        start_idx = i
    if start_idx is not None and "TAB 5: STAKEHOLDERS" in line:
        end_idx = i
        break

if start_idx is None or end_idx is None:
    print(f"Could not find boundaries: start={start_idx}, end={end_idx}")
    exit(1)

print(f"Removing lines {start_idx + 1} to {end_idx} (0-indexed: {start_idx} to {end_idx - 1})")
print(f"First removed line: {lines[start_idx].rstrip()}")
print(f"Last removed line: {lines[end_idx - 1].rstrip()}")
print(f"First kept line after: {lines[end_idx].rstrip()}")

# Remove lines from start_idx to end_idx (exclusive - keep end_idx which is the stakeholders comment)
new_lines = lines[:start_idx] + ["\n"] + lines[end_idx:]

print(f"Total lines after: {len(new_lines)}")

with open(file_path, "w") as f:
    f.writelines(new_lines)

print("Done!")
