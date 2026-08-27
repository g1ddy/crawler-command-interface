#!/bin/bash
set -e

npm install
npx playwright install --with-deps chromium
