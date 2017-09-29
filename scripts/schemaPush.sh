#!/bin/bash

my_dir="$(dirname "$0")"
source $my_dir/schemaDBParams.sh

cd src/schemas

skeema diff -H "echo $param_host" -u $param_user --password=$param_pass
diffResult=$?
if [ $diffResult -eq 0 ]; then
  echo "No diff in schema - not pushing anything";
  exit 0;
fi

echo "Detected schema diff. Starting schema migration process."

if [ "$NODE_ENV" == "production" ]; then
  if [ -z "$GIT_REV" ]; then
    echo "Error: Need GIT_REV to verify schema deployment";
    exit 1;
  fi
else
  GIT_REV="$(git rev-parse HEAD)"
fi

# Ideally, this would just be a interactive user response. But the combinatin of
# git push and dokku doesn't support having a /dev/tty terminal (any way that
# I can see at least). So a stateful site is used here to set a token of the
# current commit that is allowed to modify the schema, which upon checking is
# immediately invalidated. There may be some security problems here, but the
# commit hash is hard to guess, and even if the git repo access is leaked,
# the only damage this could do is schema on prod is updated ahead of time and
# only when the git repo is pushed. That sounds probably fine.

msg="Checking deploy.styledash.io to see if this commit can change schema..."
if [ $diffResult -eq 1 ]; then
  token="$GIT_REV-push"
  pushFlag=""
elif [ $diffResult -eq 2 ]; then
  token="$GIT_REV-push-unsafe"
  # Only adding it for this in case there's a bug in this script. Don't want to
  # accidentally push unsafe changes.
  pushFlag="--allow-unsafe"
else
  echo "Error: skeema diff returned unexpected return code $diffResult.";
  exit 1;
fi

fetchedToken="$(curl -sS -X POST http://deploy.styledash.io/schema/getAndResetDeployCommit)"
if [ "$token" != "$fetchedToken" ]; then
  echo "Error: mismatch in deployment token.";
  echo "  Expected: $token";
  echo "  Fetched: $fetchedToken";
  echo "Aborting schema deployment";
  exit 1;
fi

skeema push $pushFlag -H "echo $param_host" -u $param_user --password=$param_pass
