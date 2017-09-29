command_exists() {
  type "$1" &> /dev/null;
}

if command_exists skeema; then
  echo "Using built-in skeema."
  skeema_bin="skeema"
elif [ -z "$SKEEMA_PATH"]; then
  echo "No built-in skeema. Need to set SKEEMA_PATH."
  exit 1;
else
  echo "Using skeema at $SKEEMA_PATH."
  skeema_bin=$SKEEMA_PATH

  echo "Setting permissions on skeema."
  chmod 755 $skeema_bin
fi
