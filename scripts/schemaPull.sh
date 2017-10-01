#!/bin/bash

if [ $NODE_ENV != "development" ]; then
  echo "Error: can only pull schema for dev environment"
  exit 1;
fi

my_dir="$(dirname "$0")"
source $my_dir/schemaDBParams.sh
source $my_dir/schemaSetupSkeema.sh

cd src/schemas

$skeema_bin pull -H "echo $param_host" -u $param_user --password=$param_pass

# Skeema pulls in auto-inc IDs for some reason even when not specified to do so
sed -i'' -E 's/AUTO_INCREMENT\=[0-9]* //' styledash-database/*.sql
