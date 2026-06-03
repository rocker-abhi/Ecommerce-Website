"""
Script to create a superuser admin.

Usage:
    python createSuperuserAdmin.py <username> <password>
    python createSuperuserAdmin.py abhishek admin@123

Environment:
    Set ENV environment variable to specify environment (development, production, staging)
    Default is 'development'
"""
import os
import sys
import io
import dotenv
from pathlib import Path
from sqlalchemy.orm import Session
from app.utils.database import Database
from app.models.user import UserModel, UserEnum

# Fix encoding for Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def load_environment():
    """Load environment variables from .env file."""
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

    dotenv.load_dotenv(str(env_file))
    print(f"✓ Loaded environment from: {env_file}")


def create_superuser(username, password):
    """Create a superuser admin in the database."""

    # Get database URL from environment
    database_url = os.getenv('DATABASE_URI')
    if not database_url:
        print("Error: DATABASE_URI environment variable not set")
        sys.exit(1)

    # Initialize database connection
    db = Database(database_url)
    session = db.session_factory()

    try:
        # Check if user already exists
        existing_user = session.query(UserModel).filter_by(email=username).first()
        if existing_user:
            print(f"Error: User with email '{username}' already exists")
            session.close()
            return False

        # Create new admin user
        admin_user = UserModel(
            name=username,
            email=username,
            password=password,  # Will be hashed by hash_password method
            userType=UserEnum.admin,
            is_active=True,
            age=25  # Default age for admin user
        )

        # Hash the password
        admin_user.hash_password(password)

        # Add to session and commit
        session.add(admin_user)
        session.commit()

        print(f"✓ Superuser admin created successfully!")
        print(f"  Email: {username}")
        print(f"  Type: admin")
        print(f"  Status: active")
        print(f"  ID: {admin_user.id}")

        session.close()
        return True

    except Exception as e:
        session.rollback()
        print(f"Error: Failed to create superuser - {str(e)}")
        session.close()
        return False


def main():
    """Main entry point."""

    # Validate command-line arguments
    if len(sys.argv) != 3:
        print("Usage: python createSuperuserAdmin.py <username> <password>")
        print("Example: python createSuperuserAdmin.py abhishek admin@123")
        sys.exit(1)

    username = sys.argv[1]
    password = sys.argv[2]

    # Validate inputs
    if not username or not password:
        print("Error: Username and password cannot be empty")
        sys.exit(1)

    if "@" not in username:
        print("Warning: Username should be a valid email address")

    if len(password) < 6:
        print("Warning: Password should be at least 6 characters long")

    # Load environment variables
    load_environment()

    # Create superuser
    success = create_superuser(username, password)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

