#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.schemas import UserCreate

try:
    user = UserCreate(username='newuser',
                      email='test@test.com',
                      password='test123',
                      confirm_password='test123')
    print('✅ UserCreate validation passed:', user)
except Exception as e:
    print('❌ UserCreate validation failed:', e)