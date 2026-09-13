with open("src/features.tsx", "r") as f:
    content = f.read()

import re
content = re.sub(r'          </>\n      \)}\n</div>\n  \);\n}', r'    </div>\n  );\n}', content)
content = re.sub(r'          </>\n      \)}</div>\n  \);\n}', r'    </div>\n  );\n}', content)

with open("src/features.tsx", "w") as f:
    f.write(content)
