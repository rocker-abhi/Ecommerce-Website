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
from sqlalchemy import create_engine, text


def test_database_connection(database_url: str) -> bool:
    """Test database connection before running migrations.

    Args:
        database_url: Database connection URL

    Returns:
        True if connection successful, False otherwise
    """
    try:
        print("Testing database connection...")
        engine = create_engine(database_url, echo=False)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("✓ Database connection successful!")
        engine.dispose()
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


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

    # Test database connection before running migrations
    database_url = os.getenv('DATABASE_URI')
    if not database_url:
        print("Error: DATABASE_URI environment variable not set")
        sys.exit(1)

    if not test_database_connection(database_url):
        print("Error: Cannot proceed with migrations - database connection failed")
        sys.exit(1)

    # Run alembic with remaining command-line arguments
    alembic_args = [sys.executable, "-m", "alembic"] + sys.argv[1:]
    result = subprocess.run(alembic_args)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()

