#!/bin/bash

SRC="./test.js"

function block {
    inotifywait -q -r -e modify,move,create,delete $SRC
}

function stop_process {
    for pid in $(ps -ef | awk '/node test.js/{print $2}'); do  
        echo -e "Killing nodejs process: $pid"
        sudo kill -9 $pid
    done
}

function start_process {
    node test.js &
}

function main {
    stop_process
    start_process
}

main

while block; do
    main
done
