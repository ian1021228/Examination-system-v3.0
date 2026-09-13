with open("src/features.tsx", "r") as f:
    content = f.read()

start_idx = content.find("export function CourseMaterialsAdminTab")
end_idx = content.find("export function CourseMaterialsStudentView", start_idx)

admin_tab_code = content[start_idx:end_idx]
print(admin_tab_code[-50:])
