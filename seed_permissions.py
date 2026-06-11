"""
Script to clean database, run migrations, seed permissions, groups, categories, subcategories, products, and inventory.

Usage:
    python seed_permissions.py

Environment:
    Set ENV environment variable to specify environment (development, production, staging)
    Default is 'development'
"""
import os
import sys
import uuid
import subprocess
import random
from datetime import datetime, timezone
import dotenv
from pathlib import Path
from sqlalchemy import create_engine, text

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


def get_python_executable():
    """Find the correct virtual environment python executable."""
    venv_python = "./.venv/bin/python"
    if os.path.exists(venv_python):
        return venv_python
    venv_python_win = ".venv\\Scripts\\python.exe"
    if os.path.exists(venv_python_win):
        return venv_python_win
    return sys.executable


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
    print(f"Executing: {python_exec} alembic_runner.py upgrade head")
    result = subprocess.run(
        [python_exec, "alembic_runner.py", "upgrade", "head"],
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


def create_superuser_admin():
    """Call createSuperuserAdmin script to register the superuser."""
    print("\n--- Creating Superuser Admin ---")
    python_exec = get_python_executable()
    print(f"Executing: {python_exec} createSuperuserAdmin.py abhiokoundal1019@gmail.com admin@123")
    result = subprocess.run(
        [python_exec, "createSuperuserAdmin.py", "abhiokoundal1019@gmail.com", "admin@123"],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("❌ Error: Failed to create superuser admin!")
        print("STDOUT:")
        print(result.stdout)
        print("STDERR:")
        print(result.stderr)
        sys.exit(1)
    print("✓ Superuser admin created successfully.")


def seed_database():
    load_environment()

    # Get database URL from environment
    database_url = os.getenv('DATABASE_URI')
    if not database_url:
        print("Error: DATABASE_URI environment variable not set")
        sys.exit(1)

    # 1. Clean the database
    clean_database(database_url)

    # 2. Run migrations
    run_migrations()

    print("Connecting to the database to seed data...")
    engine = create_engine(database_url, echo=False)
    
    # Check connection
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Connected successfully to the database.")
    except Exception as e:
        print(f"Error: Failed to connect to the database: {e}")
        sys.exit(1)

    now = datetime.now(timezone.utc)

    # Wrap the seeding process in a transaction
    with engine.begin() as conn:
        print("\nChecking if required tables exist...")
        try:
            conn.execute(text("SELECT 1 FROM permissions LIMIT 1"))
            conn.execute(text("SELECT 1 FROM groups LIMIT 1"))
            conn.execute(text("SELECT 1 FROM group_permissions LIMIT 1"))
            conn.execute(text("SELECT 1 FROM categories LIMIT 1"))
            conn.execute(text("SELECT 1 FROM subcategories LIMIT 1"))
            conn.execute(text("SELECT 1 FROM products LIMIT 1"))
            conn.execute(text("SELECT 1 FROM inventory LIMIT 1"))
        except Exception as e:
            print(f"❌ Error: Required tables do not exist in the database: {e}")
            sys.exit(1)

        print("✓ Necessary tables found.")

        # 3. Seed Permissions
        print("\n--- Seeding Permissions ---")
        permission_name_to_id = {}
        for perm_name in ALL_PERMISSIONS:
            perm_id = uuid.uuid4()
            print(f"SQL: Inserting permission '{perm_name}' (ID: {perm_id})")
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
        
        print(f"✓ Completed seeding permissions. Added {len(ALL_PERMISSIONS)} permissions.")

        # 4. Seed Groups
        print("\n--- Seeding Groups ---")
        group_name_to_id = {}
        for group_name in ROLE_PERMISSIONS.keys():
            group_id = uuid.uuid4()
            print(f"SQL: Inserting group '{group_name}' (ID: {group_id})")
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

        print(f"✓ Completed seeding groups. Added {len(ROLE_PERMISSIONS)} groups.")

        # 5. Seed Group-Permission Mappings
        print("\n--- Seeding Group-Permission Mappings ---")
        for group_name, permissions in ROLE_PERMISSIONS.items():
            group_id = group_name_to_id[group_name]
            print(f"Mapping permissions for group '{group_name}'...")
            
            mapped_count = 0
            for perm_name in permissions:
                perm_id = permission_name_to_id.get(perm_name)
                if not perm_id:
                    print(f"⚠️ Warning: Permission '{perm_name}' defined in group '{group_name}' not found!")
                    continue

                conn.execute(
                    text("INSERT INTO group_permissions (group_id, permission_id) VALUES (:group_id, :permission_id)"),
                    {"group_id": group_id, "permission_id": perm_id}
                )
                mapped_count += 1

            print(f"✓ Linked {mapped_count} permissions to group '{group_name}'.")

        # 6. Seed Categories and Subcategories
        print("\n--- Seeding Categories and Subcategories ---")
        category_name_to_id = {}
        subcategory_name_to_id = {}
        for parent_name, subcats in PRODUCT_CATEGORIES.items():
            parent_id = uuid.uuid4()
            print(f"SQL: Inserting category '{parent_name}' (ID: {parent_id})")
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
                sub_id = uuid.uuid4()
                key = f"{parent_name}|{sub_name}"
                print(f"SQL: Inserting subcategory '{sub_name}' under '{parent_name}' (ID: {sub_id})")
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

        print(f"✓ Completed seeding categories and subcategories.")

        # 7. Seed Products and Inventories
        print("\n--- Seeding Products and Inventories ---")
        product_count = 0
        for parent_name, subcats in PRODUCT_CATEGORIES.items():
            parent_id = category_name_to_id[parent_name]
            for sub_name in subcats:
                key = f"{parent_name}|{sub_name}"
                subcat_id = subcategory_name_to_id[key]

                # Generate mock product details
                product_id = uuid.uuid4()
                product_name = f"{parent_name} {sub_name} Standard"
                product_desc = f"High quality {sub_name.lower()} from the {parent_name.lower()} collection."
                price = round(random.uniform(9.99, 999.99), 2)
                mock_image = f"https://example.com/images/{parent_name.lower().replace(' ', '_')}_{sub_name.lower().replace(' ', '_')}.jpg"

                print(f"SQL: Inserting product '{product_name}' under '{parent_name} -> {sub_name}'")
                conn.execute(
                    text(
                        "INSERT INTO products (id, name, description, price, image_url, category_id, subcategory_id, created_at, update_at) "
                        "VALUES (:id, :name, :description, :price, :image_url, :category_id, :subcategory_id, :created_at, :update_at)"
                    ),
                    {
                        "id": product_id,
                        "name": product_name,
                        "description": product_desc,
                        "price": price,
                        "image_url": mock_image,
                        "category_id": parent_id,
                        "subcategory_id": subcat_id,
                        "created_at": now,
                        "update_at": now
                    }
                )

                # Seed Inventory for this product
                inventory_id = uuid.uuid4()
                sku = f"SKU-{parent_name[:3].upper()}-{sub_name[:3].upper()}-{random.randint(1000, 9999)}"
                quantity = random.randint(10, 100)

                print(f"SQL: Inserting inventory for product '{product_name}' (SKU: {sku}, Qty: {quantity})")
                conn.execute(
                    text(
                        "INSERT INTO inventory (id, product_id, quantity, sku, created_at, update_at) "
                        "VALUES (:id, :product_id, :quantity, :sku, :created_at, :update_at)"
                    ),
                    {
                        "id": inventory_id,
                        "product_id": product_id,
                        "quantity": quantity,
                        "sku": sku,
                        "created_at": now,
                        "update_at": now
                    }
                )
                product_count += 1

        print(f"✓ Completed seeding {product_count} products and inventories.")

    # 8. Create Superuser Admin
    create_superuser_admin()

    print("\n🎉 Seeding database roles, permissions, categories, subcategories, products, and admin completed successfully!")


if __name__ == "__main__":
    seed_database()
