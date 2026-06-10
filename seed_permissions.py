"""
Script to seed permissions, groups, and group-permission mappings into the database.

Usage:
    python seed_permissions.py

Environment:
    Set ENV environment variable to specify environment (development, production, staging)
    Default is 'development'
"""
import os
import sys
import uuid
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


def seed_database():
    load_environment()

    # Get database URL from environment
    database_url = os.getenv('DATABASE_URI')
    if not database_url:
        print("Error: DATABASE_URI environment variable not set")
        sys.exit(1)

    print("Connecting to the database...")
    engine = create_engine(database_url, echo=False)
    
    # Check connection and test tables existence
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
            # Quick check if tables exist
            conn.execute(text("SELECT 1 FROM permissions LIMIT 1"))
            conn.execute(text("SELECT 1 FROM groups LIMIT 1"))
            conn.execute(text("SELECT 1 FROM group_permissions LIMIT 1"))
        except Exception:
            print("❌ Error: One or more permissions/groups tables do not exist in the database.")
            print("Please run your Alembic migrations first before running this seeder script.")
            sys.exit(1)

        print("✓ Necessary tables found.")

        # 2. Seed Permissions
        print("\n--- Seeding Permissions ---")
        permission_name_to_id = {}
        
        # Check existing permissions
        existing_permissions_query = conn.execute(text("SELECT id, name FROM permissions"))
        for row in existing_permissions_query:
            permission_name_to_id[row[1]] = row[0]

        new_permission_count = 0
        for perm_name in ALL_PERMISSIONS:
            if perm_name not in permission_name_to_id:
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
                new_permission_count += 1
            else:
                print(f"info: Permission '{perm_name}' already exists (ID: {permission_name_to_id[perm_name]})")
        
        print(f"✓ Completed seeding permissions. Added {new_permission_count} new permissions.")

        # 3. Seed Groups
        print("\n--- Seeding Groups ---")
        group_name_to_id = {}
        
        # Check existing groups
        existing_groups_query = conn.execute(text("SELECT id, name FROM groups"))
        for row in existing_groups_query:
            group_name_to_id[row[1]] = row[0]

        new_group_count = 0
        for group_name in ROLE_PERMISSIONS.keys():
            if group_name not in group_name_to_id:
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
                new_group_count += 1
            else:
                print(f"info: Group '{group_name}' already exists (ID: {group_name_to_id[group_name]})")

        print(f"✓ Completed seeding groups. Added {new_group_count} new groups.")

        # 4. Seed Group-Permission Mappings
        print("\n--- Seeding Group-Permission Mappings ---")
        for group_name, permissions in ROLE_PERMISSIONS.items():
            group_id = group_name_to_id[group_name]
            print(f"\nMapping permissions for group '{group_name}'...")
            
            # Fetch existing mappings for this group to prevent duplication
            existing_mappings = set()
            existing_mappings_query = conn.execute(
                text("SELECT permission_id FROM group_permissions WHERE group_id = :group_id"),
                {"group_id": group_id}
            )
            for row in existing_mappings_query:
                existing_mappings.add(row[0])

            mapped_count = 0
            for perm_name in permissions:
                perm_id = permission_name_to_id.get(perm_name)
                if not perm_id:
                    print(f"⚠️ Warning: Permission '{perm_name}' defined in group '{group_name}' was not found in database permissions!")
                    continue

                if perm_id not in existing_mappings:
                    print(f"SQL: Linking group '{group_name}' to permission '{perm_name}'")
                    conn.execute(
                        text("INSERT INTO group_permissions (group_id, permission_id) VALUES (:group_id, :permission_id)"),
                        {"group_id": group_id, "permission_id": perm_id}
                    )
                    mapped_count += 1

            print(f"✓ Linked {mapped_count} new permissions to group '{group_name}'.")

    print("\n🎉 Seeding database roles and permissions completed successfully!")


if __name__ == "__main__":
    seed_database()
