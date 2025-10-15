#!/bin/bash
cd /home/kavia/workspace/code-generation/copy-of-ekyc-application-149502-149525/EKYCBackendService
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

