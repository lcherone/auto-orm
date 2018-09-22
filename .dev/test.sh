#!/bin/bash

DB_USER="app"
DB_PASS="MjRmNmQ3YzlmY2Q2YmNlNGI1NDI3YTVh"
DB_BASE="app"

DUMP=$(mysqldump --add-drop-table --user="$DB_USER" --password="$DB_PASS" $DB_BASE)

echo "${DUMP/olddomain.com/newdomain.com}" | mysql --user="$DB_USER" --password="$DB_PASS" $DB_BASE
