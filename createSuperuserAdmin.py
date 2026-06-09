"""
Script to create a superuser admin.

Usage:
    python createSuperuserAdmin.py <email> <password>
    python createSuperuserAdmin.py admin@example.com admin@123

Environment:
    Set ENV environment variable to specify environment (development, production, staging)
    Default is 'development'
"""
import os
import sys
import io
import re
import dotenv
from pathlib import Path
from app.utils.database import DatabaseHelper
from app.models.user import UserModel

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


def create_superuser(email, password):
    """Create a superuser admin in the database."""

    # Get database URL from environment
    database_url = os.getenv('DATABASE_URI')
    if not database_url:
        print("Error: DATABASE_URI environment variable not set")
        sys.exit(1)

    # Initialize database connection if not already done
    try:
        DatabaseHelper.init_database(database_url)
    except Exception:
        # If init fails, it might already be initialized, which is fine
        pass

    try:
        # Get a session
        SessionFactory = DatabaseHelper.get_db_session()
        session = SessionFactory()

        # Check if user already exists
        existing_user = session.query(UserModel).filter_by(email=email).first()
        if existing_user:
            print(f"Error: User with email '{email}' already exists")
            session.close()
            return False

        # Create new admin user
        admin_user = UserModel(
            name=email.split('@')[0],  # Use email prefix as name
            email=email,
            is_active=True,
            is_admin=True,
            age=25  # Default age for admin user
        )

        # Hash/set the password
        admin_user.set_password(password)

        # Link to the admin group in the database
        from app.models.group import GroupModel
        admin_group = session.query(GroupModel).filter_by(name="admin").first()
        if admin_group:
            admin_user.groups.append(admin_group)
        else:
            print("Warning: 'admin' group not found in database. User created without group link.")

        # Add to session and commit
        session.add(admin_user)
        session.commit()

        print(f"✓ Superuser admin created successfully!")
        print(f"  Email: {email}")
        print(f"  Type: admin")
        print(f"  Status: active")
        print(f"  ID: {admin_user.id}")

        session.close()
        return True

    except Exception as e:
        print(f"Error: Failed to create superuser - {str(e)}")
        try:
            session.rollback()
            session.close()
        except Exception:
            pass
        return False


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def main():
    """Main entry point."""

    # Validate command-line arguments
    if len(sys.argv) != 3:
        print("Usage: python createSuperuserAdmin.py <email> <password>")
        print("Example: python createSuperuserAdmin.py admin@example.com admin@123")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]

    # Validate inputs
    if not email or not password:
        print("Error: Email and password cannot be empty")
        sys.exit(1)

    if email == "admin":
        email = "admin@example.com"

    if not validate_email(email):
        print("Error: Invalid email format")
        sys.exit(1)

    if len(password) < 6:
        print("Error: Password must be at least 6 characters long")
        sys.exit(1)

    if len(password) > 10:
        print("Error: Password must not exceed 10 characters long")
        sys.exit(1)

    # Load environment variables
    load_environment()

    # Create superuser
    success = create_superuser(email, password)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

