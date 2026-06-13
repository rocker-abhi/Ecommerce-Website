"""
Database setup and seeding script.
Checks connection, checks version match, recreates database on mismatch, runs migrations, and seeds permissions & default superuser admin.

Usage:
    python seed_script.py
"""
import os
import sys
import uuid
import subprocess
import random
from datetime import datetime, timezone
from pathlib import Path
import dotenv
from sqlalchemy import create_engine, text, inspect

# Ensure root directory is in PYTHONPATH so app module can be imported
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# 1. Permission and Role definitions
ALL_PERMISSIONS = [
    # Dashboard
    "dashboard:view",
    # User
    "user:view", "user:create", "user:update", "user:delete",
    # Group
    "group:view", "group:create", "group:update", "group:delete",
    # Permission
    "permission:view", "permission:create", "permission:update", "permission:delete",
    # Category
    "category:view", "category:create", "category:update", "category:delete",
    # Product
    "product:view", "product:create", "product:update", "product:delete",
    # Product Image
    "product_image:view", "product_image:create", "product_image:update", "product_image:delete",
    # Inventory
    "inventory:view", "inventory:update",
    # Cart
    "cart:view", "cart:update",
    # Order
    "order:view", "order:create", "order:update", "order:cancel",
    # Payment
    "payment:view", "payment:update",
    # Address
    "address:view", "address:create", "address:update", "address:delete",
    # Review
    "review:view", "review:create", "review:update", "review:delete",
    # Wishlist
    "wishlist:view", "wishlist:update"
]

ROLE_PERMISSIONS = {
    "admin": [
        "dashboard:view",
        "user:view", "user:create", "user:update", "user:delete",
        "group:view", "group:create", "group:update", "group:delete",
        "permission:view", "permission:create", "permission:update", "permission:delete",
        "category:view", "category:create", "category:update", "category:delete",
        "product:view", "product:create", "product:update", "product:delete",
        "product_image:view", "product_image:create", "product_image:update", "product_image:delete",
        "inventory:view", "inventory:update",
        "cart:view",
        "order:view", "order:create", "order:update", "order:cancel",
        "payment:view", "payment:update",
        "address:view", "address:create", "address:update", "address:delete",
        "review:view", "review:create", "review:update", "review:delete",
        "wishlist:view", "wishlist:update"
    ],
    "seller": [
        "category:view",
        "product:view", "product:create", "product:update", "product:delete",
        "product_image:view", "product_image:create", "product_image:update", "product_image:delete",
        "inventory:view", "inventory:update",
        "order:view", "order:update",
        "review:view"
    ],
    "customer": [
        "category:view",
        "product:view",
        "cart:view", "cart:update",
        "order:create", "order:view", "order:cancel",
        "payment:view",
        "address:view", "address:create", "address:update", "address:delete",
        "review:view", "review:create", "review:update", "review:delete",
        "wishlist:view", "wishlist:update"
    ]
}

# 2. Product Categories and Subcategories
PRODUCT_CATEGORIES = {
    "Electronics": ["Laptops", "Mobile Phones", "Tablets", "Monitors", "Printers", "Accessories"],
    "Computers": ["CPU", "Motherboard", "RAM", "SSD", "HDD", "Graphics Card"],
    "Office Supplies": ["Pens", "Notebooks", "Paper", "Files & Folders", "Calculators"],
    "Furniture": ["Chairs", "Tables", "Desks", "Cabinets", "Shelves"],
    "Home Appliances": ["Refrigerator", "Washing Machine", "Microwave", "Air Conditioner", "Water Purifier"],
    "Clothing": ["Men", "Women", "Kids", "Footwear", "Accessories"],
    "Books": ["Technical", "Educational", "Fiction", "Non-Fiction", "Magazines"],
    "Food & Beverages": ["Snacks", "Soft Drinks", "Dairy Products", "Groceries", "Frozen Foods"],
    "Medical Supplies": ["Medicines", "First Aid", "Surgical Equipment", "Medical Consumables"],
    "Automotive": ["Spare Parts", "Tires", "Batteries", "Oils", "Accessories"],
    "Sports & Fitness": ["Gym Equipment", "Sports Gear", "Cycling", "Outdoor Equipment"],
    "Beauty & Personal Care": ["Skin Care", "Hair Care", "Cosmetics", "Fragrances"]
}


def load_environment():
    """Load environment variables from .env.dev file."""
    env_file = Path(__file__).parent / ".env.dev"
    if not env_file.exists():
        print(f"Error: Environment file not found: {env_file}")
        sys.exit(1)

    dotenv.load_dotenv(str(env_file))
    print(f"✓ Loaded environment from: {env_file}")


def get_python_executable():
    """Find the correct virtual environment python executable."""
    venv_python = "./.venv/bin/python"
    if os.path.exists(venv_python):
        return venv_python
    venv_python_win = ".venv\\Scripts\\python.exe"
    if os.path.exists(venv_python_win):
        return venv_python_win
    return sys.executable


def test_connection(database_url):
    """Test connection to the database."""
    print("Testing connection to database...")
    engine = create_engine(database_url, echo=False)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Connected successfully to the database.")
        return True
    except Exception as e:
        print(f"❌ Error: Database connection failed: {e}")
        return False
    finally:
        engine.dispose()


def check_schema_matches(database_url):
    """
    Check if the database version matches the current Alembic schema head and required tables exist.
    """
    try:
        from alembic.config import Config
        from alembic.script import ScriptDirectory

        config = Config("alembic.ini")
        script = ScriptDirectory.from_config(config)
        heads = script.get_heads()
        
        # Consolidate multiple heads if found
        if len(heads) > 1:
            print(f"⚠️ Multiple Alembic migration heads found: {heads}")
            print("Running 'alembic merge heads -m \"merge multiple heads\"' to linearize...")
            python_exec = get_python_executable()
            result = subprocess.run(
                [python_exec, "-m", "alembic", "merge", "heads", "-m", "merge multiple heads"],
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                print(f"❌ Failed to merge multiple heads:\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}")
                return False
            # Re-fetch heads
            script = ScriptDirectory.from_config(config)
            heads = script.get_heads()
            print(f"✓ Heads merged successfully. New head: {heads}")
        
        if not heads:
            print("⚠️ No migration heads found in alembic configuration.")
            return False
            
        target_head = heads[0]
        print(f"Target Alembic head: {target_head}")
    except Exception as e:
        print(f"⚠️ Failed to parse Alembic migrations configuration: {e}")
        return False

    engine = create_engine(database_url, echo=False)
    current_db_version = None
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            row = result.fetchone()
            if row:
                current_db_version = row[0]
        print(f"Current DB version in 'alembic_version': {current_db_version}")
    except Exception:
        print("⚠️ 'alembic_version' table not found or query failed. Assuming unmigrated database.")
        engine.dispose()
        return False

    # Check if required tables exist
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    required_tables = ["users", "permissions", "groups", "categories", "subcategories", "products"]
    
    missing_tables = [table for table in required_tables if table not in existing_tables]
    engine.dispose()

    if missing_tables:
        print(f"⚠️ Missing required tables in database: {missing_tables}")
        return False

    if current_db_version != target_head:
        print(f"⚠️ Database version mismatch (DB version: {current_db_version} vs Target: {target_head})")
        return False

    print("✓ Schema matches target Alembic migration head.")
    return True


def clean_database(database_url):
    """Drop the public schema and recreate it to completely clean the database."""
    print("\n--- Cleaning Database (Dropping all tables/schemas) ---")
    engine = create_engine(database_url, echo=False)
    try:
        with engine.begin() as conn:
            conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        print("✓ Database cleaned successfully (schema 'public' recreated).")
    except Exception as e:
        print(f"Error: Failed to clean database: {e}")
        sys.exit(1)
    finally:
        engine.dispose()


def run_migrations():
    """Run Alembic migrations to recreate all database tables."""
    print("\n--- Running Alembic Migrations ---")
    python_exec = get_python_executable()
    print(f"Executing: {python_exec} -m alembic upgrade head")
    result = subprocess.run(
        [python_exec, "-m", "alembic", "upgrade", "head"],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("❌ Error: Alembic migrations failed!")
        print("STDOUT:")
        print(result.stdout)
        print("STDERR:")
        print(result.stderr)
        sys.exit(1)
    print("✓ Alembic migrations completed successfully.")


def seed_permissions_and_groups(engine, now):
    """Seed permissions and groups, mapping them, avoiding duplicates."""
    print("\n--- Seeding Permissions & Groups ---")
    permission_name_to_id = {}
    with engine.begin() as conn:
        # Seed Permissions
        for perm_name in ALL_PERMISSIONS:
            row = conn.execute(text("SELECT id FROM permissions WHERE name = :name"), {"name": perm_name}).first()
            if row:
                perm_id = row[0]
            else:
                perm_id = uuid.uuid4()
                conn.execute(
                    text(
                        "INSERT INTO permissions (id, name, description, created_at, update_at) "
                        "VALUES (:id, :name, :description, :created_at, :update_at)"
                    ),
                    {
                        "id": perm_id,
                        "name": perm_name,
                        "description": f"Permission to {perm_name.replace(':', ' ')}",
                        "created_at": now,
                        "update_at": now
                    }
                )
            permission_name_to_id[perm_name] = perm_id
            
        # Seed Groups
        group_name_to_id = {}
        for group_name in ROLE_PERMISSIONS.keys():
            row = conn.execute(text("SELECT id FROM groups WHERE name = :name"), {"name": group_name}).first()
            if row:
                group_id = row[0]
            else:
                group_id = uuid.uuid4()
                conn.execute(
                    text(
                        "INSERT INTO groups (id, name, description, created_at, update_at) "
                        "VALUES (:id, :name, :description, :created_at, :update_at)"
                    ),
                    {
                        "id": group_id,
                        "name": group_name,
                        "description": f"Standard group role for {group_name} users",
                        "created_at": now,
                        "update_at": now
                    }
                )
            group_name_to_id[group_name] = group_id

        # Seed mappings
        for group_name, permissions in ROLE_PERMISSIONS.items():
            group_id = group_name_to_id[group_name]
            for perm_name in permissions:
                perm_id = permission_name_to_id.get(perm_name)
                if not perm_id:
                    continue
                
                # Check if group-permission mapping already exists
                row = conn.execute(
                    text("SELECT 1 FROM group_permissions WHERE group_id = :group_id AND permission_id = :permission_id"),
                    {"group_id": group_id, "permission_id": perm_id}
                ).first()
                if not row:
                    conn.execute(
                        text("INSERT INTO group_permissions (group_id, permission_id) VALUES (:group_id, :permission_id)"),
                        {"group_id": group_id, "permission_id": perm_id}
                    )
    print("✓ Permissions and groups seeded/verified.")


def create_superuser_admin(database_url, email, password):
    """Create superuser admin using Flask models & DatabaseHelper."""
    print("\n--- Creating Superuser Admin ---")
    from app.utils.database import DatabaseHelper
    from app.models.user import UserModel
    from app.models.group import GroupModel

    try:
        DatabaseHelper.init_database(database_url)
    except Exception:
        pass

    SessionFactory = DatabaseHelper.get_db_session()
    session = SessionFactory()

    try:
        # Check if user already exists
        admin_user = session.query(UserModel).filter_by(email=email).first()
        if admin_user:
            print(f"✓ Superuser admin '{email}' already exists.")
            return

        # Create new admin user
        admin_user = UserModel(
            name=email.split('@')[0],  # Use email prefix as name
            email=email,
            is_active=True,
            is_admin=True,
            age=25
        )
        admin_user.set_password(password)

        # Link to the admin group
        admin_group = session.query(GroupModel).filter_by(name="admin").first()
        if admin_group:
            admin_user.groups.append(admin_group)
            print("✓ Linked superuser to 'admin' group.")
        else:
            print("⚠️ Warning: 'admin' group not found in database.")

        session.add(admin_user)
        session.commit()
        print(f"✓ Superuser admin created successfully! Email: {email}")
    except Exception as e:
        session.rollback()
        print(f"❌ Error: Failed to create superuser admin: {e}")
        sys.exit(1)
    finally:
        session.close()


def seed_categories_and_products(engine, database_url, now):
    """Seed categories, subcategories, products and inventory."""
    from app.utils.database import DatabaseHelper
    from app.models.user import UserModel
    
    try:
        DatabaseHelper.init_database(database_url)
    except Exception:
        pass
    
    SessionFactory = DatabaseHelper.get_db_session()
    session = SessionFactory()
    admin_user = session.query(UserModel).filter_by(email="admin@gmail.com").first()
    if not admin_user:
        # Fallback to the other email configured in clone
        admin_user = session.query(UserModel).filter_by(email="abhikoundal1019@gmail.com").first()
    
    if not admin_user:
        print("❌ Error: Superuser admin user not found in database before seeding products!")
        session.close()
        sys.exit(1)
    admin_user_id = admin_user.id
    session.close()

    print("\n--- Seeding Categories, Subcategories, and Products ---")
    category_name_to_id = {}
    subcategory_name_to_id = {}
    
    with engine.begin() as conn:
        # Seed Categories & Subcategories
        for parent_name, subcats in PRODUCT_CATEGORIES.items():
            row = conn.execute(text("SELECT id FROM categories WHERE name = :name"), {"name": parent_name}).first()
            if row:
                parent_id = row[0]
            else:
                parent_id = uuid.uuid4()
                conn.execute(
                    text(
                        "INSERT INTO categories (id, name, description, created_at, update_at) "
                        "VALUES (:id, :name, :description, :created_at, :update_at)"
                    ),
                    {
                        "id": parent_id,
                        "name": parent_name,
                        "description": f"{parent_name} category",
                        "created_at": now,
                        "update_at": now
                    }
                )
            category_name_to_id[parent_name] = parent_id

            for sub_name in subcats:
                key = f"{parent_name}|{sub_name}"
                row = conn.execute(text("SELECT id FROM subcategories WHERE name = :name AND category_id = :category_id"),
                                   {"name": sub_name, "category_id": parent_id}).first()
                if row:
                    sub_id = row[0]
                else:
                    sub_id = uuid.uuid4()
                    conn.execute(
                        text(
                            "INSERT INTO subcategories (id, name, description, category_id, created_at, update_at) "
                            "VALUES (:id, :name, :description, :category_id, :created_at, :update_at)"
                        ),
                        {
                            "id": sub_id,
                            "name": sub_name,
                            "description": f"{sub_name} subcategory under {parent_name}",
                            "category_id": parent_id,
                            "created_at": now,
                            "update_at": now
                        }
                    )
                subcategory_name_to_id[key] = sub_id

        # Seed Products (Skipped as per user request)
        print("✓ Skipping product seeding as requested.")
        product_count = 0

    if product_count > 0:
        print(f"✓ Completed seeding {product_count} new products.")
    else:
        print("✓ All product data is up-to-date.")


def main():
    load_environment()
    database_url = os.getenv('DATABASE_URI')
    if not database_url:
        print("❌ Error: DATABASE_URI environment variable not set in .env.dev")
        sys.exit(1)

    # 1. Test database connection first
    if not test_connection(database_url):
        sys.exit(1)

    # 2. Check if database matches the current schema version
    schema_matches = check_schema_matches(database_url)

    engine = create_engine(database_url, echo=False)
    now = datetime.now(timezone.utc)

    if not schema_matches:
        print("\n⚠️ Schema version mismatch or tables are missing. Starting clean setup...")
        # A. Clean database by dropping all tables
        clean_database(database_url)
        # B. Run migrations
        run_migrations()
    else:
        print("\n✓ Database matches current schema version. Skipping database clean and migration.")

    # 3. Always ensure permissions and default groups exist
    seed_permissions_and_groups(engine, now)

    # 4. Always ensure superuser admin exists
    create_superuser_admin(database_url, "admin@gmail.com", "admin@123")

    # 5. Seed categories, subcategories, products and inventory
    seed_categories_and_products(engine, database_url, now)

    print("\n🎉 Setup and seeding successfully completed!")


if __name__ == "__main__":
    main()
