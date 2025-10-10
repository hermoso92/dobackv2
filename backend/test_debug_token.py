import requests
import jwt
import json

# Login
response = requests.post('http://localhost:9998/auth/login', json={
    'email': 'admin@cmadrid.com', 
    'password': '123456'
})

if response.status_code == 200:
    token = response.json()['data']['access_token']
    print('✅ Login exitoso')
    print(f'Token: {token[:50]}...')
    
    # Decode token without verification to see contents
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        print(f'📋 Token decoded: {json.dumps(decoded, indent=2, default=str)}')
    except Exception as e:
        print(f'❌ Error decoding token: {e}')
    
    # Test with verbose headers to see what's being sent
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test sessions endpoint 
    response = requests.get(
        'http://localhost:9998/api/telemetry/e2d7d36b-bd18-4a9e-897d-18d664769da2/sessions',
        headers=headers
    )
    
    print(f'📊 Status: {response.status_code}')
    print(f'📝 Response: {response.text}')
    
    # Test auth/me endpoint to see what user info we get
    response_me = requests.get('http://localhost:9998/auth/me', headers=headers)
    print(f'👤 Auth/me status: {response_me.status_code}')
    if response_me.status_code == 200:
        print(f'👤 User info: {response_me.text}')
    else:
        print(f'👤 Auth/me error: {response_me.text}')
        
else:
    print(f'❌ Login falló: {response.status_code} - {response.text}') 