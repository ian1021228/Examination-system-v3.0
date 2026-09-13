with open("src/features.tsx", "rb") as f:
    content = f.read()

content = content.replace(b"\x01", b"export function CourseMaterialsAdminTab({ subjectId }: { subjectId: string }) {")

with open("src/features.tsx", "wb") as f:
    f.write(content)
