from collections import Counter
from datetime import datetime, timedelta
import re

FILE = 'backend/data/datosDoback/CMadrid/doback022/ESTABILIDAD/ESTABILIDAD_DOBACK022_20250710_0.txt'

def main():
    with open(FILE, encoding='utf-8') as f:
        lines = [l.strip() for l in f if l.strip()]
    if len(lines) < 3:
        print('Archivo demasiado corto')
        return
    cab = lines[0].split(';')
    fecha_base = datetime.strptime(cab[1].strip(), '%d/%m/%Y %I:%M:%S%p')
    header = [h.strip() for h in lines[1].split(';')]
    time_pat = re.compile(r'^(\d{2}:\d{2}:\d{2}(AM|PM))$')
    marcas = [fecha_base]
    bloques = []
    bloque_actual = []
    for l in lines[2:]:
        if time_pat.match(l):
            if bloque_actual:
                bloques.append(bloque_actual)
                bloque_actual = []
            marcas.append(datetime.strptime(f"{fecha_base.strftime('%d/%m/%Y')} {l}", "%d/%m/%Y %I:%M:%S%p"))
        else:
            row = [v.strip() for v in l.split(';')]
            if len(row) == len(header) + 1 and row[-1] == '':
                row = row[:-1]
            if len(row) != len(header):
                continue
            bloque_actual.append(row)
    if bloque_actual:
        bloques.append(bloque_actual)
    timestamps = []
    for i, bloque in enumerate(bloques):
        n = len(bloque)
        if i + 1 < len(marcas):
            t_start = marcas[i]
            t_end = marcas[i+1]
            total_seconds = (t_end - t_start).total_seconds()
            if n > 1 and total_seconds > 0:
                step = total_seconds / (n - 1)
                ts_list = [t_start + timedelta(seconds=step * j) for j in range(n)]
            else:
                ts_list = [t_start + timedelta(seconds=j) for j in range(n)]
        else:
            t_start = marcas[i]
            ts_list = [t_start + timedelta(seconds=j) for j in range(n)]
        for ts in ts_list:
            timestamps.append(ts.strftime('%Y-%m-%d %H:%M:%S'))
    c = Counter(timestamps)
    print('Timestamps duplicados:')
    for ts, count in c.items():
        if count > 1:
            print(ts, count)
    print(f'Total timestamps únicos: {len(c)}')
    print(f'Total filas: {len(timestamps)}')
    print(f'Total duplicados: {sum(1 for v in c.values() if v > 1)}')

if __name__ == '__main__':
    main() 