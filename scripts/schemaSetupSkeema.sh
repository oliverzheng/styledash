command_exists() {
  type "$1" &> /dev/null;
}

if command_exists skeema; then
  echo "Using built-in skeema."
  skeema_bin="skeema"
elif [ -z "$SKEEMA_PATH" ]; then
  echo "No built-in skeema. Need to set SKEEMA_PATH."
  exit 1;
else
  echo "Using skeema at $SKEEMA_PATH."
  skeema_bin=$SKEEMA_PATH

  echo "Setting permissions on skeema."
  chmod 755 $skeema_bin
fi

# Skeema requires the ability to create/drop a tmp database. Dokku's mysql
# doesn't support this. So to setup, you'll need to connect to mysql as root and
# grant privileges to the user.
#   GRANT ALL PRIVILEGES ON _skeema_tmp . * to mysql@'%';
# The root password is at /var/lib/dokku/services/mysql/<service-name>
