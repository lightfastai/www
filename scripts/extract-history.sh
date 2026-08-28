#!/usr/bin/env bash
set -euo pipefail

SOURCE_COMMIT="5e1ff6b0d798b31d95d35ca69ca5240400a2074f"

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <source-repository> <destination-directory>" >&2
  exit 64
fi

source_repository="$1"
destination_directory="$2"

if [[ -e "$destination_directory" ]]; then
  echo "destination already exists: $destination_directory" >&2
  exit 73
fi

git clone --no-local --no-checkout "$source_repository" "$destination_directory"
git -C "$destination_directory" switch --create main "$SOURCE_COMMIT"
git -C "$destination_directory" filter-repo \
  --force \
  --refs main \
  --path apps/www/ \
  --path packages/ui-v2/
