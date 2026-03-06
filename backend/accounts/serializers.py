from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['matric', 'first_name', 'last_name', 'department', 'faculty', 'password', 'confirm_password']

    def validate(self, data):
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        if User.objects.filter(matric=data['matric']).exists():
            raise serializers.ValidationError({'matric': 'This matric number is already registered.'})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['matric'],
            matric=validated_data['matric'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            department=validated_data.get('department', ''),
            faculty=validated_data.get('faculty', ''),
            password=validated_data['password'],
            role='student',
        )
        return user


class LoginSerializer(serializers.Serializer):
    matric = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['matric'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid matric number or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is deactivated.')
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'matric', 'name', 'first_name', 'last_name',
                  'department', 'faculty', 'role', 'is_verified']

    def get_name(self, obj):
        return obj.full_name


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'department', 'faculty']
