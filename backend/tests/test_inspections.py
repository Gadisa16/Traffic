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
    db_path = os.path.join(os.path.dirname(__file__), '..', 'test.db')
    # if another test already created DB we keep it; just ensure tables exist
    create_tables()

    db = SessionLocal()
    if not db.query(models.User).filter(models.User.username == 'admin').first():
        admin = models.User(
            username='admin', hashed_password=get_password_hash('secret'), role='admin')
        db.add(admin)
        db.commit()
    if not db.query(models.User).filter(models.User.username == 'insp').first():
        insp = models.User(
            username='insp', hashed_password=get_password_hash('secret'), role='inspector')
        db.add(insp)
        db.commit()

    # ensure we have at least one vehicle
    if not db.query(models.Vehicle).first():
        v = models.Vehicle(plate_number='TESTPLATE', side_number='0001')
        db.add(v)
        db.commit()
    db.close()

    global client
    client = TestClient(app)


def test_create_inspection_json():
    # login inspector
    resp = client.post('/auth/login', data={'username': 'insp', 'password': 'secret'})
    assert resp.status_code == 200
    token = resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    payload = {
        'code': 'TESTPLATE',
        'action': 'ok',
        'note': 'routine check',
        'payload': {'source': 'pytest'}
    }
    r = client.post('/inspections/', json=payload, headers=headers)
    if r.status_code != 200:
        print('POST /inspections/ error:', r.status_code, r.text)
    assert r.status_code == 200
    data = r.json()
    assert data['code'] == 'TESTPLATE'
    assert data['inspector_username'] == 'insp'
