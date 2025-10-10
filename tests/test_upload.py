"""File upload test module."""

import io
import os
from werkzeug.datastructures import FileStorage

def test_upload_valid_file(client):
    """Test uploading a valid file."""
    # Crear un archivo CSV de prueba
    data = b'Fecha,Hora,Lat,Lon,Altitud,Velocidad,Fix,Satelites,timestamp\n'
    data += b'21/04/2025,10:02:24AM,37.9052739,-4.7242338,559.00,0.3,2,3,2025-04-21 10:02:24\n'
    
    # Crear un objeto FileStorage
    file = FileStorage(
        stream=io.BytesIO(data),
        filename='test_upload.csv',
        content_type='text/csv'
    )
    
    # Enviar la solicitud
    data = {
        'file': file,
        'type': 'gps'
    }
    response = client.post('/upload', data=data, content_type='multipart/form-data')
    
    # Verificar la respuesta
    assert response.status_code in [200, 302]
    
    # Si la carga fue exitosa, verificar que el archivo existe
    if response.status_code == 302:
        uploaded_file = os.path.join(client.application.config['UPLOAD_FOLDER'], 'test_upload.csv')
        assert os.path.exists(uploaded_file)
        
        # Limpiar el archivo de prueba
        os.remove(uploaded_file) 