# Development Scripts

This folder contains utility scripts for development and maintenance tasks.

## Scripts

### `run_migration.py`

Database migration runner for manual schema updates.

**Usage:**

```bash
# Set DATABASE_URL in .env file or environment
export DATABASE_URL='postgresql://user:pass@localhost:5432/focusguard_db'

# Run migration
python scripts/run_migration.py
```

**Note:** For production, use the automated migration system in `serv/database/init/`.

### `remove_background.py`

Image processing utility to remove white backgrounds from garden plant images.

**Usage:**

```bash
python scripts/remove_background.py
```

## Security Note

⚠️ Never commit credentials or API keys. All scripts use environment variables for sensitive data.
