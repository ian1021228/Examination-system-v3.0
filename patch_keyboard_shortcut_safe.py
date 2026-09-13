import re

with open("src/App.tsx", "r") as f:
    content = f.read()

pattern = r"const handleKeyDown = \(e: KeyboardEvent\) => \{[\s\S]*?if \(keySequence === 'ian'\) \{[\s\S]*?navigate\('\/'\);[\s\S]*?\}[\s\S]*?\};"

replacement = """const handleKeyDown = (e: KeyboardEvent) => {
      // ignore if focus is in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      keySequence += e.key.toLowerCase();
      if (keySequence.length > 3) {
        keySequence = keySequence.slice(-3);
      }
      if (keySequence === 'ian') {
        navigate('/');
      }
    };"""

if re.search(pattern, content):
    new_content = re.sub(pattern, replacement, content)
    with open("src/App.tsx", "w") as f:
        f.write(new_content)
    print("Match found and replaced safe keyboard shortcut.")
else:
    print("No match found.")
