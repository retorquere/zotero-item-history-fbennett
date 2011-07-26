#!/bin/bash

find . -name '.hg' -prune -o \
       -name '.hgignore' -prune -o \
       -name '*~' -prune -o \
       -print | xargs zip zotero-item-history.xpi
