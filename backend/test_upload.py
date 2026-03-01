from app import create_app
from flask_jwt_extended import create_access_token
from io import BytesIO

app = create_app('development')

with app.app_context():
    token = create_access_token(identity='test@example.com')

    client = app.test_client()
    csv_content = 'date,store_id,item_id,sales\n2023-01-01,store_1,item_1,10\n2023-01-02,store_1,item_1,5\n'
    data = {
        'file': (BytesIO(csv_content.encode('utf-8-sig')), 'test.csv')
    }
    headers = {
        'Authorization': f'Bearer {token}'
    }
    resp = client.post('/api/items/upload', data=data, headers=headers, content_type='multipart/form-data')
    print('status_code:', resp.status_code)
    try:
        print('json:', resp.get_json())
    except Exception:
        print('response data:', resp.data)
