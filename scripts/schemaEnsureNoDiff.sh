#!/bin/bash

my_dir="$(dirname "$0")"

source $my_dir/schemaDBParams.sh

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

cd src/schemas
skeema diff -H "echo $param_host" -u $param_user --password=$param_pass
