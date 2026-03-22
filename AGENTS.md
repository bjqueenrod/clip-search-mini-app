# Agent Instructions

- After any code change, run `git status -sb`, then `git add`, `git commit -m "<message>"`, and `git push`.
- If there are unrelated changes, ask before committing.
- If there is no `.git/`, ask to initialize a repository and set a remote before committing or pushing.
- Keep edits minimal and focused; do not reformat unless asked.
- Prefer `rg` for search; avoid destructive git commands unless explicitly requested.
- If a task is unclear, ask a brief clarification before proceeding.
- If we changed any .js file or .css file ensure it has a cache-buster and the cache-buster value is changed
## Python test environment

- Always run tests from the project virtualenv (`.venv`), never system Python.
- Before running tests, ensure deps are installed with:
  - `source .venv/bin/activate && python -m pip install -r requirements.txt`
- If `.venv` does not exist, create it first with:
  - `python3 -m venv .venv`
- Run tests with:
  - `source .venv/bin/activate && python -m pytest ...`
- Do not use bare `pytest` or `python3 -m pytest` outside `.venv`.
