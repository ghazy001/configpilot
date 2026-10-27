"""Capture real ConfigPilot PTY output using disposable synthetic projects only.

Usage: python3 scripts/capture-cli-design.py /absolute/path/to/capture-directory
The output directory must not exist. No user project/env files are read or written.
"""
import errno
import fcntl
import hashlib
import json
import os
from pathlib import Path
import pty
import select
import shutil
import struct
import subprocess
import sys
import tempfile
import termios
import time

CLI = Path(__file__).resolve().parents[1] / "bin/configpilot.js"
NODE = shutil.which("node")


def capture(root, args, columns, destination):
    master, slave = pty.openpty()
    fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", 200, columns, 0, 0))
    env = {"PATH": os.environ.get("PATH", ""), "LANG": "en_US.UTF-8", "TERM": "xterm-256color", "TERM_PROGRAM": "xterm.js"}
    process = subprocess.Popen([NODE, str(CLI), *args], cwd=root, env=env, stdin=slave, stdout=slave, stderr=slave)
    os.close(slave)
    output = bytearray()
    deadline = time.monotonic() + 20
    try:
        while True:
            if time.monotonic() > deadline:
                raise RuntimeError("CLI capture exceeded deadline")
            ready, _, _ = select.select([master], [], [], 0.1)
            if not ready:
                if process.poll() is not None:
                    break
                continue
            try:
                chunk = os.read(master, 65536)
            except OSError as error:
                if error.errno == errno.EIO:
                    break
                raise
            if not chunk:
                break
            output.extend(chunk)
        status = process.wait(timeout=2)
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()
        os.close(master)
    destination.write_bytes(output)
    return {"command": ["configpilot", *args], "columns": columns, "exitCode": status, "sha256": hashlib.sha256(output).hexdigest(), "bytes": len(output), "transcript": destination.name}


def fixture(path, config=False):
    path.mkdir()
    (path / "src").mkdir()
    for name, line, source in [
        ("server.js", 8, "const port = process.env.PORT ?? 3000;"),
        ("database.ts", 12, "export const url = process.env.DATABASE_URL;"),
        ("ai.ts", 6, "export const key = process.env.OPENAI_API_KEY;"),
    ]:
        (path / "src" / name).write_text("\n" * (line - 1) + source + "\n")
    if config:
        (path / ".env.example").write_text("PORT=\nDATABASE_URL=\nOPENAI_API_KEY=\n")
        (path / ".env").write_text("PORT=SYNTHETIC_CAPTURE_VALUE\n")


def main():
    destination = Path(sys.argv[1]).resolve()
    destination.mkdir(parents=True, exist_ok=False)
    records = []
    with tempfile.TemporaryDirectory(prefix="configpilot-design-") as directory:
        base = Path(directory)
        fixture(base / "review", True)
        fixture(base / "initialize")
        (base / "empty").mkdir()
        (base / "empty" / ".env.example").write_text("")
        (base / "empty" / ".env").write_text("")
        (base / "review" / "invalid.txt").write_text("BROKEN\n")
        cases = [
            ("scan", "review", ["scan"], 0),
            ("init", "initialize", ["init", "--template", "--dry-run"], 0),
            ("check", "review", ["check"], 1),
            ("check-success", "review", ["check", "--env", ".env.example"], 0),
            ("check-error", "review", ["check", "--env", "invalid.txt"], 1),
            ("check-missing", "initialize", ["check"], 2),
            ("scan-empty", "empty", ["scan"], 0),
            ("init-empty", "empty", ["init", "--dry-run"], 0),
            ("check-empty", "empty", ["check"], 0),
        ]
        for name, project, args, expected in cases:
            for width in ([80, 40] if name in ("scan", "init", "check") else [80]):
                record = capture(base / project, args, width, destination / f"{name}-{width}.ansi")
                assert record["exitCode"] == expected, record
                assert b"SYNTHETIC_CAPTURE_VALUE" not in (destination / record["transcript"]).read_bytes()
                records.append(record)
        record = capture(base / "initialize", ["init", "--template", "--yes"], 80, destination / "init-created-80.ansi")
        assert record["exitCode"] == 0
        assert (base / "initialize" / ".env.example").exists()
        assert not (base / "initialize" / ".env").exists()
        records.append(record)
    (destination / "manifest.json").write_text(json.dumps({"method": "Unmodified output bytes captured from real Node CLI processes in POSIX PTYs. Disposable synthetic inputs only; captures are replayed in xterm.js for screenshots, not hand-drawn HTML output.", "platform": sys.platform, "records": records}, indent=2) + "\n")
    print(f"Captured {len(records)} real CLI PTY transcripts; fixtures removed.")


if __name__ == "__main__":
    main()
