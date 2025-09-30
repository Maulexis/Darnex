#!/usr/bin/env python3
"""
DARNEX RAILWAY AI - DATABASE CONFIGURATION MODULE
================================================
Database connection management and configuration
"""

import psycopg2
import os
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

# ====================================================================
# DATABASE CONNECTION CONFIGURATION
# ====================================================================

DB_PARAMS = {
    'dbname': 'railway_ai',
    'user': 'postgres',
    'password': 'pj925fhpp5',
    'host': 'localhost',
    'port': '5432'
}

def establish_database_connection():
    """Establish connection to PostgreSQL railway database"""
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        print("✓ Database connection successful")
        return conn
    except psycopg2.OperationalError as e:
        print(f"✗ Database connection failed: {e}")
        exit(1)

def get_db_params():
    """Get database parameters"""
    return DB_PARAMS.copy()

def test_connection():
    """Test database connection"""
    try:
        conn = establish_database_connection()
        conn.close()
        return True
    except Exception as e:
        print(f"Connection test failed: {e}")
        return False