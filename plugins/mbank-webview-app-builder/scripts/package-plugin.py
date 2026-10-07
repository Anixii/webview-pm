#!/usr/bin/env python3
"""Validate and create one portable plugin ZIP using only standard libraries."""

import argparse
import json
from pathlib import Path
import subprocess
import zipfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    output = args.output.expanduser().resolve()
    if output.is_relative_to(root):
        parser.error("Write the archive outside the plugin folder.")
    if output.exists():
        parser.error("Output already exists; choose a fresh archive path.")
    subprocess.run(["node", str(root / "scripts/validate-plugin.mjs")], check=True)
    files = sorted(p for p in root.rglob("*") if p.is_file())
    if any(p.is_symlink() for p in root.rglob("*")):
        parser.error("Plugin resources must be regular files, not symlinks.")
    files = [p for p in files if "__pycache__" not in p.parts and p.suffix != ".pyc"]
    output.parent.mkdir(parents=True, exist_ok=True)
    try:
        with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED) as archive:
            for source in files:
                archive.write(source, str(Path(root.name) / source.relative_to(root)))
        with zipfile.ZipFile(output) as archive:
            bad_member = archive.testzip()
            if bad_member:
                raise RuntimeError(f"Archive CRC failure: {bad_member}")
            manifest = json.loads(archive.read(f"{root.name}/plugin.json"))
            if manifest["name"] != root.name:
                raise RuntimeError("Archive manifest does not match the package root")
    except BaseException:
        output.unlink(missing_ok=True)
        raise
    print(f"Packaged {len(files)} files: {output}")


if __name__ == "__main__":
    main()
