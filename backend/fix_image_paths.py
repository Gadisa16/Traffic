#!/usr/bin/env python3
"""
Fix existing image paths in the database by sanitizing filenames.
This script updates file_path values to remove spaces and special characters.
"""
import os
import sys
import re

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

print("Connecting to database...")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to remove spaces and special characters."""
    name_parts = filename.rsplit('.', 1)
    if len(name_parts) == 2:
        name, ext = name_parts
        # Replace spaces and special chars with underscores
        name = re.sub(r'[^\w\-]', '_', name)
        # Remove consecutive underscores
        name = re.sub(r'_+', '_', name)
        # Remove leading/trailing underscores
        name = name.strip('_')
        return f"{name}.{ext}" if name else filename
    else:
        return re.sub(r'[^\w\-\.]', '_', filename)

def sanitize_path(path: str) -> str:
    """Sanitize a full path by sanitizing the filename part."""
    parts = path.split('/')
    if len(parts) > 1:
        # Last part is filename
        parts[-1] = sanitize_filename(parts[-1])
        return '/'.join(parts)
    else:
        return sanitize_filename(path)

try:
    print("\nFetching vehicle photos with problematic paths...")
    photos = db.query(models.VehiclePhoto).all()
    
    updated_count = 0
    for photo in photos:
        old_path = photo.file_path
        new_path = sanitize_path(old_path)
        
        if old_path != new_path:
            print(f"\nPhoto ID {photo.id}:")
            print(f"  Old path: {old_path}")
            print(f"  New path: {new_path}")
            
            photo.file_path = new_path
            # Clear the old URL so it gets regenerated
            photo.file_url = ''
            updated_count += 1
    
    if updated_count > 0:
        print(f"\n{updated_count} photo paths updated.")
        confirm = input("Commit changes to database? (yes/no): ")
        if confirm.lower() == 'yes':
            db.commit()
            print("✅ Changes committed successfully!")
            print("\nNOTE: The actual files in Supabase storage still have old names.")
            print("You have two options:")
            print("1. Delete old images and re-upload them (recommended)")
            print("2. Manually rename files in Supabase Storage dashboard")
        else:
            db.rollback()
            print("❌ Changes rolled back.")
    else:
        print("\n✅ No problematic paths found. All paths are clean!")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    db.rollback()
finally:
    db.close()
    print("\nDone.")
