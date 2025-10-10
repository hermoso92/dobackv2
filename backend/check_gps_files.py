#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from complete_processor import DobackProcessor

def check_gps_files():
    p = DobackProcessor()
    p.scan_files_and_find_sessions()
    
    gps_files = [f for f in p.all_files if f['vehicle'] == 'doback022' and f['type'] == 'GPS']
    
    print('Archivos GPS para doback022:')
    for f in sorted(gps_files, key=lambda x: x['start_time']):
        print(f"  {f['name']}: {f['start_time']} - {f['end_time']}")

if __name__ == "__main__":
    check_gps_files() 