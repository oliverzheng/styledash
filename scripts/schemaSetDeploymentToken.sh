#!/bin/bash

GIT_REV="$(git rev-parse HEAD)"

curl -sS -X POST -X POST -d "commitHash=$GIT_REV-$PUSH_TYPE" http://deploy.styledash.io/schema/setDeployCommit
