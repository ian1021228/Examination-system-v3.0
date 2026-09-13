with open("src/features.tsx", "r") as f:
    content = f.read()

content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, useRef } from 'react';")

with open("src/features.tsx", "w") as f:
    f.write(content)
