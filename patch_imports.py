import re

with open("src/App.tsx", "r") as f:
    content = f.read()

import_target = """import { LandingPage, AnnouncementsAdminTab, CourseMaterialsAdminTab, DiscussionBoard, CourseMaterialsStudentView, GamificationProfile } from './features';"""
new_import = """import { LandingPage, AnnouncementsAdminTab, CourseMaterialsAdminTab, DiscussionBoard, CourseMaterialsStudentView, GamificationProfile, Leaderboard, XPShop } from './features';"""

content = content.replace(import_target, new_import)

with open("src/App.tsx", "w") as f:
    f.write(content)
