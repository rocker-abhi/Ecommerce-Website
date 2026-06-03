"""
Helper script to run Alembic commands with environment variables loaded.

This script is necessary because Alembic's env.py needs DATABASE_URI from
environment variables. This wrapper ensures .env files are loaded before
Alembic runs.

Usage:
    python alembic_runner.py revision --autogenerate -m "create user table"
    python alembic_runner.py upgrade head
    python alembic_runner.py downgrade -1
    python alembic_runner.py current
"""
import os
import sys
import subprocess
from pathlib import Path
import dotenv


def main():
    """Load environment variables and run alembic command."""
    # Get the environment name from ENV variable (default: development)
    env = os.getenv("ENV", "development").lower()

    env_map = {
        "development": ".env.dev",
        "production": ".env.prod",
        "staging": ".env.stage",
    }

    if env not in env_map:
        print(f"Error: Unknown environment '{env}'")
        sys.exit(1)

    env_file = Path(__file__).parent / env_map[env]
    if not env_file.exists():
        print(f"Error: Environment file not found: {env_file}")
        sys.exit(1)

    # Load environment variables from .env file
    print(f"Loading environment from: {env_file}")
    dotenv.load_dotenv(str(env_file))

    # Run alembic with remaining command-line arguments
    alembic_args = [sys.executable, "-m", "alembic"] + sys.argv[1:]
    result = subprocess.run(alembic_args)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()

