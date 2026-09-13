import re

with open("src/App.tsx", "r") as f:
    content = f.read()

pattern = r"const handleKeyDown = \(e: KeyboardEvent\) => \{[\s\S]*?navigate\('\/'\);\s*\}\s*\};\s*window\.addEventListener\('keydown', handleKeyDown\);\s*return \(\) => window\.removeEventListener\('keydown', handleKeyDown\);"

replacement = """const keys = new Set<string>();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      keys.add(e.key.toLowerCase());
      if (keys.has('i') && keys.has('a') && keys.has('n')) {
        navigate('/');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };"""

if re.search(pattern, content):
    new_content = re.sub(pattern, replacement, content)
    with open("src/App.tsx", "w") as f:
        f.write(new_content)
    print("Match found and replaced simultaneous keyboard shortcut.")
else:
    print("No match found.")
