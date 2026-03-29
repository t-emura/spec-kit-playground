#!/usr/bin/env bash
set -euo pipefail

curl -LsSf https://astral.sh/uv/install.sh | sh
uv tool install specify-cli --from "git+https://github.com/github/spec-kit.git@${SPECIFY_CLI_VERSION:-v0.4.3}"

npm install
npx playwright install --with-deps chromium
npm run db:migrate
