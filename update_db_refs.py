#!/usr/bin/env python3
"""
Script to update database references in main.py from db_pool to db_manager
"""

import re


def update_db_references():
    """Update all db_pool.acquire() references to use db_manager.get_connection()"""

    file_path = "main.py"

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # Replace all instances of 'async with db_pool.acquire() as conn:'
        # with 'async with db_manager.get_connection() as conn:'
        updated_content = re.sub(
            r'async with db_pool\.acquire\(\) as conn:',
            'async with db_manager.get_connection() as conn:', content)

        # Also replace any remaining db_pool references in comments or other contexts
        updated_content = re.sub(r'db_pool', 'db_manager.pool',
                                 updated_content)

        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(updated_content)

        print(f"Successfully updated database references in {file_path}")
        return True

    except Exception as e:
        print(f"Error updating file: {e}")
        return False


if __name__ == "__main__":
    update_db_references()