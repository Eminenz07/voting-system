from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model for AU Voting System."""

    ROLE_CHOICES = [
        ('student', 'Student'),
        ('admin', 'Admin'),
    ]

    matric = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    department = models.CharField(max_length=100, blank=True, default='')
    faculty = models.CharField(max_length=100, blank=True, default='')
    is_verified = models.BooleanField(default=False)

    USERNAME_FIELD = 'matric'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'accounts_user'

    def __str__(self):
        return f'{self.get_full_name()} ({self.matric})'

    @property
    def full_name(self):
        return self.get_full_name() or self.matric
