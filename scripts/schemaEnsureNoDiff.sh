#!/bin/bash

my_dir="$(dirname "$0")"
source $my_dir/schemaDBParams.sh

cd src/schemas
skeema diff -H "echo $param_host" -u $param_user --password=$param_pass
