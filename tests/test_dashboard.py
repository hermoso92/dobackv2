"""Dashboard access test module."""

def test_dashboard_access(client):
    """Test dashboard access."""
    response = client.get('/')
    assert response.status_code == 200
    assert b"Panel de Control" in response.data 