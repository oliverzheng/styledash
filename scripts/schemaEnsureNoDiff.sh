#!/bin/bash

my_dir="$(dirname "$0")"
source $my_dir/schemaDBParams.sh
source $my_dir/schemaSetupSkeema.sh

cd src/schemas
$skeema_bin diff -H "echo $param_host" -u $param_user --password=$param_pass
