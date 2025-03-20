# User Management

## Initial Admin User

An initial admin user is automatically created through a database migration when you first set up the project. The credentials are:

- Username: `admin`
- Email: `admin@example.com`
- Password: `admin`

This is handled by the migration `0001_create_initial_user.py`.

## Creating Additional Users

You can create additional users through:

1. Django admin interface
2. Using Django shell:

```python
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()
user = User.objects.create_user(
    username='username',
    email='email@example.com',
    password='password'
)
token = Token.objects.create(user=user)
print(f"User created with token: {token.key}")
```

3. Using the `create_test_user` management command:

```bash
python manage.py create_test_user
```

This command will create a user with:
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin`

Note: This command will only run in development environments (when DEBUG=True) and will not create a user if one with the same username already exists. 