#!/bin/bash

if [ -z "$NODE_ENV" ]; then
  echo "Error: need NODE_ENV environment"
  exit 1;
fi

if [ $NODE_ENV = "production" ]; then
  if [ -z "$DATABASE_URL" ]; then
    echo "Error: need DATABASE_URL for production"
    exit 1;
  fi
elif [ $NODE_ENV = "development" ]; then
  if [ -z "$DEV_ENV_CONFIG_PATH" ]; then
    echo "Error: need DEV_ENV_CONFIG_PATH for development"
    exit 1;
  fi
  DATABASE_URL="$(cat $DEV_ENV_CONFIG_PATH | command grep dbURL | cut -d\" -f4)"
else
  echo "Error: Unknown NODE_ENV value: $NODE_ENV"
  exit 1;
fi

# extract the protocol
param_proto="$(echo $DATABASE_URL | grep :// | sed -e's,^\(.*://\).*,\1,g')"
# remove the protocol
param_url="$(echo ${DATABASE_URL/$param_proto/})"
# extract the user (if any)
param_userAndPass="$(echo $param_url | grep @ | cut -d@ -f1)"
param_user="$(echo $param_userAndPass | grep : | cut -d: -f1)"
param_pass="$(echo ${param_userAndPass/$param_user:/} | cut -d@ -f1)"
# extract the host
param_hostAndPort="$(echo ${param_url/$param_userAndPass@/} | cut -d/ -f1)"
# by request - try to extract the port
param_host="$(echo $param_hostAndPort | grep : | cut -d: -f1)"
param_port="$(echo $param_hostAndPort | sed -e 's,^.*:,:,g' -e 's,.*:\([0-9]*\).*,\1,g' -e 's,[^0-9],,g')"
# extract the path (if any)
param_db="$(echo $param_url | grep / | cut -d/ -f2-)"

if [ -z "$param_user" ]; then
  echo "Error: missing database user"
  exit 1
fi
if [ -z "$param_pass" ]; then
  echo "Error: missing database password"
  exit 1
fi
if [ -z "$param_host" ]; then
  echo "Error: missing database host"
  exit 1
fi
if [ -z "$param_port" ]; then
  echo "Error: missing database port"
  exit 1
fi
