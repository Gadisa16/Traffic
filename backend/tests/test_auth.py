from app.api.deps import get_password_hash
from app import models
from fastapi.testclient import TestClient
from app.main import app
from app.db import create_tables, SessionLocal
import os

# Use a file-backed sqlite DB for tests to avoid in-memory connection isolation
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'


client = None


def setup_module(module):
    # ensure fresh sqlite file DB for tests
    db_path = os.path.join(os.path.dirname(__file__), '..', 'test.db')
    try:
        if os.path.exists(db_path):
            os.remove(db_path)
    except Exception:
        pass
    # create tables in the test DB
    create_tables()
    # create an initial admin user for tests
    db = SessionLocal()
    if not db.query(models.User).filter(models.User.username == 'admin').first():
        admin = models.User(
            username='admin', hashed_password=get_password_hash('secret'), role='admin', status='active')
        db.add(admin)
        db.commit()
    db.close()
    # create TestClient after tables exist
    global client
    client = TestClient(app)


def test_me_requires_auth():
    r = client.get('/auth/me')
    assert r.status_code == 401


def test_me_returns_user():
    # login to obtain token
    resp = client.post(
        '/auth/login', data={'username': 'admin', 'password': 'secret'})
    assert resp.status_code == 200
    token = resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    r = client.get('/auth/me', headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data['username'] == 'admin'
    assert data['role'] == 'admin'


def test_me_invalid_token():
    headers = {'Authorization': 'Bearer bad.token.here'}
    r = client.get('/auth/me', headers=headers)
    assert r.status_code == 401
