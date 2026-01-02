from __future__ import with_statement
import os
import sys
from logging.config import fileConfig
from dotenv import load_dotenv

from alembic import context
from sqlalchemy import engine_from_config, pool

# ensure backend package is importable
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

# Load .env from backend so DATABASE_URL is available to Alembic when run via Poetry
load_dotenv(os.path.join(base_dir, '.env'))

from app.models import Base  # noqa: E402

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# set target metadata for 'autogenerate'
target_metadata = Base.metadata


def get_url():
    return os.getenv('DATABASE_URL') or config.get_main_option('sqlalchemy.url')


def run_migrations_offline():
    url = get_url()
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    configuration['sqlalchemy.url'] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection,
                          target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
