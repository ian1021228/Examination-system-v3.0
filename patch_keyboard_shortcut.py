import re

with open("src/App.tsx", "r") as f:
    content = f.read()

pattern = r"const location = useLocation\(\);"

replacement = """const location = useLocation();

  useEffect(() => {
    let keySequence = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      keySequence += e.key.toLowerCase();
      if (keySequence.length > 3) {
        keySequence = keySequence.slice(-3);
      }
      if (keySequence === 'ian') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);"""

if re.search(pattern, content):
    new_content = re.sub(pattern, replacement, content)
    with open("src/App.tsx", "w") as f:
        f.write(new_content)
    print("Match found and replaced keyboard shortcut.")
else:
    print("No match found.")
