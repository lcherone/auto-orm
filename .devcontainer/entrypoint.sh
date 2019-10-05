#!/bin/bash

#
# Entrypoint script
#  - Its job is to setup the container and/or project
#  - Its run within the container but needs executable bit set

#
##
setup_database() {
    echo >&2 "Entrypoint: [database] - pausing 10s for database server to finish installing"
    sleep 10

    while ! mysqladmin ping --silent -h mysql -u"root" -p"$DB_ROOTPASS"; do
        echo >&2 "Entrypoint: [database] - waiting for database server to start +5s"
        sleep 5
    done

     echo >&2 "Entrypoint: [database] - database is up and running"
    sleep 1

    # setup users and database
    echo >&2 "Entrypoint: [database] - setup users and database"
    mysql -h mysql -u"root" -p"$DB_ROOTPASS" -e "CREATE DATABASE IF NOT EXISTS \`$DB_DATABASE\` /*\!40100 DEFAULT CHARACTER SET utf8mb4 */;"
    mysql -h mysql -u"root" -p"$DB_ROOTPASS" -e "CREATE USER IF NOT EXISTS $DB_USERNAME@'%' IDENTIFIED BY '$DB_PASSWORD';"
    mysql -h mysql -u"root" -p"$DB_ROOTPASS" -e "GRANT ALL PRIVILEGES ON \`$DB_DATABASE\`.* TO '$DB_USERNAME'@'%';"
    mysql -h mysql -u"root" -p"$DB_ROOTPASS" -e "GRANT ALL PRIVILEGES on *.* to 'root'@'localhost' IDENTIFIED BY '$DB_ROOTPASS';"
    mysql -h mysql -u"root" -p"$DB_ROOTPASS" -e "FLUSH PRIVILEGES;"

    # import database if exsits
    if [ -f $APP_WEBROOT/test/seed.sql ]; then
        echo >&2 "Entrypoint: [database] - import database file: test/seed.sql"
        cat $APP_WEBROOT/test/seed.sql | mysql -h mysql -u"root" -p"$DB_ROOTPASS" $DB_DATABASE
    fi
}

#
##
install_npm_packages() {
    if [ ! -f $APP_WEBROOT/package-lock.json ]; then
        echo >&2 "Entrypoint: [npm install]"
        cd $APP_WEBROOT && npm install
    else
        echo >&2 "Entrypoint: [npm install] - packages already installed and setup. To reinstall, remove: ./package-lock.json"
    fi
}

#
##
main() {
    echo >&2 "Entrypoint: [OS] $(uname -a)"
    echo >&2 "Entrypoint: [PWD] $APP_WEBROOT"

    #
    install_npm_packages

    #
    setup_database

    #
    echo >&2 "Entrypoint: [end build]"
    echo >&2 ""
    echo >&2 " Services:"
    echo >&2 " - App:        http://127.0.0.1:8080"
    echo >&2 " - Adminer:    http://127.0.0.1:8888 - Manage the database"
}

set -eu

main

cd $APP_WEBROOT

echo >&2 "[exec] - $@"
exec "$@"
