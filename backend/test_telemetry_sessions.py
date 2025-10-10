import requests

# Login
response = requests.post('http://localhost:9998/auth/login', json={
    'email': 'admin@cmadrid.com', 
    'password': '123456'
})

if response.status_code == 200:
    token = response.json()['data']['access_token']
    print('✅ Login exitoso')
    
    # Test sessions endpoint without parameters
    response = requests.get(
        'http://localhost:9998/api/telemetry/e2d7d36b-bd18-4a9e-897d-18d664769da2/sessions',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    print(f'📊 Sessions endpoint status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'✅ Éxito! Sessions encontradas: {len(data) if isinstance(data, list) else "response object"}')
        print(f'Response keys: {list(data.keys()) if isinstance(data, dict) else "N/A"}')
    else:
        print(f'❌ Error: {response.text[:200]}')
        
    # Test with query parameters (empty)
    response2 = requests.get(
        'http://localhost:9998/api/telemetry/e2d7d36b-bd18-4a9e-897d-18d664769da2/sessions?',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    print(f'📊 Sessions endpoint con query vacía status: {response2.status_code}')
    if response2.status_code == 200:
        print('✅ Query vacía funciona correctamente')
    else:
        print(f'❌ Error con query vacía: {response2.text[:200]}')
        
else:
    print(f'❌ Login falló: {response.status_code} - {response.text}') 