#!/bin/sh

# Check if MAILLE_API_URL environment variable is set
if [ -z "$MAILLE_API_URL" ]; then
  echo "Error: MAILLE_API_URL environment variable is not set."
  exit 1
fi

# Define the replacement string
REPLACEMENT="window.__CONFIG__ = {apiUrl: \"$MAILLE_API_URL\"};"

# Use sed to replace the string in the file
sed "s|window.__CONFIG__ = undefined;|$REPLACEMENT|" /usr/share/nginx/html/index.template.html > /usr/share/nginx/html/index.html

# Start nginx
nginx -g "daemon off;"
