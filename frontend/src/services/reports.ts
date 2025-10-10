const API_URL = '/api/reports';

export async function generateReport(params: any, token: string) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Error al generar informe');
    return res.json();
}

export async function downloadReport(reportId: string, token: string) {
    const res = await fetch(`${API_URL}/${reportId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al descargar informe');
    return res.blob();
} 