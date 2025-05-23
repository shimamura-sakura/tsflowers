#!/bin/env python3
import os
import hashlib

def name_step1(s):
    return hashlib.md5(s.lower().encode('ascii')).hexdigest()[-12:][::-1]

def name_step2(s):
    chars = []
    for i, ch in enumerate(s):
        if '0' <= ch <= '9':
            chars.append(chr((ord(ch) + i + 1) %  9 + ord('0'))) # 10 -> 9
        if 'a' <= ch <= 'z':
            chars.append(chr((ord(ch) + i + 1) % 25 + ord('a'))) # 26 -> 25
    return ''.join(chars)

def encrypt_name(s):
    s = name_step1(s)
    s = name_step2(s)
    return s

pairs = []
def try_add_pair(efn, dfn):
    if os.access(efn, os.F_OK):
        pairs.append((efn, dfn))
        print(f'mv {efn} {dfn}')
        return True
    return False

print('#!/bin/sh\nset -ue\n')
for dirname, dataname in (
    ('fgimage', 'data01'),
    ('bgimage', 'data02'),
    ('system',  'data03'),
):
    dirfiles = os.listdir(dirname)
    for dec_fn in dirfiles:
        if try_add_pair(f'{dataname}/{encrypt_name(dec_fn)}', f'{dirname}/{dec_fn}'):
            continue
        if try_add_pair(f'{dataname}/{encrypt_name(dec_fn.lower())}', f'{dirname}/{dec_fn}'):
            continue