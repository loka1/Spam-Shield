"""
Routes configuration for the application.
This file defines all the routes used in the application.
"""

# Frontend routes
ROUTE_INDEX = '/app'
ROUTE_CHECK = '/check'
ROUTE_LOGIN = '/login'
ROUTE_REGISTER = '/register'
ROUTE_HISTORY = '/history'

# API routes
API_CHECK_SPAM = '/api/check-spam'
API_HISTORY = '/api/history'
API_EXAMPLE_SPAM = '/api/example/spam'
API_EXAMPLE_HAM = '/api/example/ham'

# Auth routes
AUTH_REGISTER = '/auth/register'
AUTH_LOGIN = '/auth/login'
AUTH_REFRESH = '/auth/refresh'
AUTH_PROFILE = '/auth/profile'
AUTH_DEMO_TOKEN = '/auth/demo-token'

# Admin routes
ROUTE_ADMIN = '/admin'
ROUTE_ADMIN_DASHBOARD = '/admin/dashboard'
ROUTE_ADMIN_USERS = '/admin/users'
ROUTE_ADMIN_REQUESTS = '/admin/requests'
ROUTE_ADMIN_STATS = '/admin/stats' 