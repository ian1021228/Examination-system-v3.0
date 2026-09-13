import re

with open("src/features.tsx", "r") as f:
    content = f.read()

# Fix GamificationProfile
broken_end = """      </>
      )}</div>
  );
}"""
correct_end = """    </div>
  );
}"""
content = content.replace(broken_end, correct_end)

# Fix CourseMaterialsAdminTab
start_idx = content.find("export function CourseMaterialsAdminTab")
end_idx = content.find("export function CourseMaterialsStudentView", start_idx)

admin_tab_code = content[start_idx:end_idx]

# Find the last `</div>\n  );\n}` in admin_tab_code
last_div_idx = admin_tab_code.rfind("</div>\n  );\n}")

if last_div_idx != -1:
    admin_tab_code = admin_tab_code[:last_div_idx] + "      </>\n      )}\n" + admin_tab_code[last_div_idx:]
    
content = content[:start_idx] + admin_tab_code + content[end_idx:]

with open("src/features.tsx", "w") as f:
    f.write(content)
