#!/bin/bash

set -e

# Go through the release steps for zotero-multi-2

### Define a cleanup function and lay a trap
function cleanup () {
  trap "" ERR
  trap "" EXIT
  trap "" SIGINT
  reset -I
  cp install.rdf install.bak
  hg revert install.rdf
  cp update.rdf update.bak
  hg revert update.rdf
  exit 0
}
trap cleanup SIGINT
trap cleanup ERR
### Allow for non-destructive exit
function finish () {
  trap "" ERR
  trap "" EXIT
  trap "" SIGINT
  reset -I
  cp install.rdf install.bak
  cp update.rdf update.bak
  exit 0
}
trap finish EXIT

### Define a function to ask if ok to proceed
function askifok () {
  if [ "$1" == "" ]; then
    echo "Okay to proceed? "
  else
    echo "$1"
  fi
  ans="continue"
  while [ "$ans" == "continue" ]; do
    read -n 1 -s ans
    case $ans in
    y|Y) 
      ans="break"
    ;;
    n|N)
	  echo "Okay. Aborting."
      exit 0
    ;;
    *)
      ans="continue"
    ;;
    esac
  done
}


### Define a function to use vars with line endings
function showlines () {
  OLDIFS=${IFS}
  IFS=" "
  $1
  IFS=${OLDIFS}
}

### Visit the release directory
cd $(dirname $0)
### Check for changes not yet checked in
set +e
trap "" ERR
CHANGE_COUNT=$(hg status | grep -c '^[[:space:]]*[MCA]')
trap cleanup ERR
set -e
if [ "${CHANGE_COUNT}" != "0" ]; then
	echo "Warning: Found ${CHANGE_COUNT} changes not yet checked in."
else
    ALL_CHECKED_IN="1"
fi

### Copy the template files into place
cp install.tmpl install.rdf
cp update.tmpl update.rdf
cp updateInfo.tmpl updateInfo.xhtml

### Edit the description

if [ "${ALL_CHECKED_IN}" == "1" ]; then
  ## Get a formatted list of changes since the last update
  if [ "$1" == "" ]; then
      RAWCOMMENTS=$(hg log -rtip)
  else
      RAWCOMMENTS=$(svn log -rtip:$1)
  fi
  OLDIFS=$IFS
  IFS=" "
  COMMENTS=$(echo ${RAWCOMMENTS} | hg log -r10:tip | sed -e "s~changeset:[[:space:]]*\([0-9]*\).*~\\\</li\\\>\\\<li\\\>\\\<b\\\>Revision \1: \\\</b\\\>~;s~[a-z]\+:.*~~;1,1s~^.....~~;\$,\$s~\(.*\)~\1\\\</li\\\>~")
  IFS=$OLDIFS

  ### Get the current revision number
  REVISION=$(hg log -rtip | grep changeset: | sed -e "s/changeset:[[:space:]]*\([0-9]*\).*/\1/")

  ## Show the changes
  showlines "echo ${RAWCOMMENTS}"
else
  REVISION="local"
fi

askifok

### Write formatted comments into updateInfo file
OLDIFS=$IFS
IFS=" "
echo OK11: %%$COMMENTS%%
sed -si "/##CHANGES##/{i $COMMENTS

;d;}" updateInfo.xhtml
echo OK22
IFS=$OLDIFS

### Write release number into install, update, and updateInfo
sed -si "s/##REVISION##/$REVISION/g" install.rdf
sed -si "s/##REVISION##/$REVISION/g" update.rdf
sed -si "s/##REVISION##/$REVISION/g" updateInfo.xhtml

### Build the xpi
echo -n "Building zotero-multi-2.xpi ... "
. ./build.sh > /dev/null
echo done

if [ "${ALL_CHECKED_IN}" == "1" ]; then
  ### Get the SHA1 hash of the xpi
  SHA1=$(openssl sha1 zotero-item-history.xpi | sed -e 's/.*=[[:space:]]*\([^ ]\+\).*/\1/')
  echo "SHA1 checksum: ${SHA1}"

  ### Write the hash value into update
  sed -si "s/##SHA1HASH##/${SHA1}/g" update.rdf

  ### Run McCoy to set the key in install and sign the update
  /home/bennett/src/mccoy/mccoy /home/bennett/src/zotero-item-history/

  askifok "Upload newly built xpi?"
else
  echo "Some changes were not checked in, not uploading finished xpi"
  exit 0
fi

### Send the new xpi to the distro site
cp update.rdf zotero-item-history.rdf
cp updateInfo.xhtml zotero-item-history.xhtml
scp zotero-item-history.rdf zotero-item-history.xhtml zotero-item-history.xpi gsl-nagoya-u.net:/http/pub

### If that all come off okay, update the svn
hg update

echo Done
