with open("src/features.tsx", "r") as f:
    content = f.read()

start_idx = content.find("export function CourseMaterialsAdminTab")
end_idx = content.find("export function CourseMaterialsStudentView", start_idx)

admin_tab_code = content[start_idx:end_idx]

import re
admin_tab_code = re.sub(r'      \)}\n    </div>\n  \);\n}\n$', '      )}\n      </>\n      )}\n    </div>\n  );\n}\n', admin_tab_code)

content = content[:start_idx] + admin_tab_code + content[end_idx:]

with open("src/features.tsx", "w") as f:
    f.write(content)
