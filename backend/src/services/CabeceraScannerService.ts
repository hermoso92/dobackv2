import * as fs from 'fs';
import * as path from 'path';

export class CabeceraScannerService {
    static scanHeaders(dataFolderPath?: string) {
        const basePath = path.resolve(__dirname, '../../data/datosDoback');
        const folderPath = dataFolderPath ? path.resolve(dataFolderPath) : basePath;
        const result: Record<string, Record<string, Record<string, Array<any>>>> = {};
        const tipos = ['estabilidad', 'CAN', 'GPS', 'ROTATIVO'];

        const orgDirs = fs
            .readdirSync(folderPath, { withFileTypes: true })
            .filter((d) => d.isDirectory());
        for (const orgDir of orgDirs) {
            const orgPath = path.join(folderPath, orgDir.name);
            result[orgDir.name] = {};
            const vehDirs = fs
                .readdirSync(orgPath, { withFileTypes: true })
                .filter((d) => d.isDirectory());
            for (const vehDir of vehDirs) {
                const vehPath = path.join(orgPath, vehDir.name);
                result[orgDir.name][vehDir.name] = {};
                for (const tipo of tipos) {
                    const tipoPath = path.join(vehPath, tipo);
                    if (fs.existsSync(tipoPath) && fs.statSync(tipoPath).isDirectory()) {
                        const files = fs
                            .readdirSync(tipoPath, { withFileTypes: true })
                            .filter(
                                (f) =>
                                    f.isFile() &&
                                    (f.name.endsWith('.txt') || f.name.endsWith('.csv'))
                            )
                            .map((f) => path.join(tipoPath, f.name));
                        result[orgDir.name][vehDir.name][tipo] = [];
                        for (const file of files) {
                            let cabecera = '';
                            try {
                                const fd = fs.openSync(file, 'r');
                                const buffer = Buffer.alloc(512);
                                const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
                                fs.closeSync(fd);
                                const contenido = buffer.toString('utf-8', 0, bytesRead);
                                cabecera = contenido.split(/\r?\n/)[0] || '';
                            } catch (e) {
                                cabecera = '[ERROR LEYENDO CABECERA]';
                            }
                            // Extraer campos clave si es posible
                            let fecha_base = '',
                                sesion = '',
                                otros = '';
                            const partes = cabecera.split(';');
                            if (partes.length >= 3) {
                                fecha_base = partes[1]?.trim() || '';
                                sesion = partes[3]?.trim() || '';
                                otros = partes[4]?.trim() || '';
                            }
                            result[orgDir.name][vehDir.name][tipo].push({
                                archivo: path.basename(file),
                                cabecera,
                                fecha_base,
                                sesion,
                                otros
                            });
                        }
                    }
                }
            }
        }
        return result;
    }
}
