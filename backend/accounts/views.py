from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.utils import timezone

from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, ProfileSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new student account."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login and receive auth token."""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })
    return Response({'error': serializer.errors.get('non_field_errors', ['Login failed'])[0]},
                    status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout (delete token)."""
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current user profile."""
    return Response(UserSerializer(request.user).data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """View or update profile."""
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)
    serializer = ProfileSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_id(request):
    """Mark student as ID-verified (simulated biometric check)."""
    user = request.user
    if user.role != 'student':
        return Response({'error': 'Only students can verify ID.'}, status=status.HTTP_403_FORBIDDEN)
    user.is_verified = True
    user.save()
    return Response({
        'message': 'Identity verified successfully.',
        'user': UserSerializer(user).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unverify(request):
    """Reset verification status (for testing only)."""
    user = request.user
    user.is_verified = False
    user.save()
    return Response({
        'message': 'Verification reset successfully.',
        'user': UserSerializer(user).data,
    })
