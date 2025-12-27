from app.api.deps import get_password_hash
from app import models
from fastapi.testclient import TestClient
from app.main import app
from app.db import create_tables, SessionLocal
import os
import json

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
    if not db.query(models.User).filter(models.User.username == 'insp').first():
        insp = models.User(
            username='insp', hashed_password=get_password_hash('secret'), role='inspector', status='active')
        db.add(insp)
        db.commit()
    # ensure no leftover vehicles from previous runs
    try:
        db.query(models.Vehicle).delete()
        db.commit()
    except Exception:
        db.rollback()
    db.close()
    # create TestClient after tables exist
    global client
    client = TestClient(app)


def test_health():
    r = client.get('/')
    assert r.status_code == 200
    assert r.json() == {'status': 'ok'}


def test_create_and_list_vehicle():
    import time
    plate = f"TEST{int(time.time() * 1000) % 1000000}"
    payload = {
        'plate_number': plate,
        'status': 'active',
        'owner': {'full_name': 'Alice', 'phone': '555-1234'}
    }

    # login to obtain token
    resp = client.post(
        '/auth/login', data={'username': 'admin', 'password': 'secret'})
    assert resp.status_code == 200
    token = resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    r = client.post('/vehicles/', json=payload, headers=headers)
    if r.status_code not in (200, 201):
        print("POST /vehicles/ error:", r.status_code, r.text)
    assert r.status_code in (200, 201)
    data = r.json()
    assert data['plate_number'] == plate
    vehicle_id = data['id']

    r2 = client.get('/vehicles/', headers=headers)
    if r2.status_code != 200:
        print('GET /vehicles/ error:', r2.status_code, r2.text)
    assert r2.status_code == 200
    lst = r2.json()
    assert isinstance(lst, list)
    assert any(v['plate_number'] == plate for v in lst)

    # generate a QR code for the vehicle
    r3 = client.post(f'/vehicles/{vehicle_id}/qr', headers=headers)
    if r3.status_code != 200:
        print('POST /vehicles/{id}/qr error:', r3.status_code, r3.text)
    assert r3.status_code == 200
    qr = r3.json()
    assert qr['vehicle_id'] == vehicle_id
    assert isinstance(qr['qr_value'], str) and len(qr['qr_value']) > 0
    assert isinstance(qr['qr_png_url'], str) and len(qr['qr_png_url']) > 0

    # verify is public-safe (anonymous)
    r4 = client.get(f"/vehicles/verify?code={qr['qr_value']}")
    if r4.status_code != 200:
        print('GET /vehicles/verify error:', r4.status_code, r4.text)
    assert r4.status_code == 200
    v = r4.json()
    assert v['plate_number'] == plate
    assert v.get('owner') in (None, {})
