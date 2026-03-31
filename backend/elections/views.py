from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Count
from django.utils import timezone

from accounts.models import User
from .models import Election, Position, Candidate, Vote
from .serializers import (
    ElectionListSerializer, ElectionDetailSerializer,
    CreateElectionSerializer, BulkVoteSerializer,
    PositionSerializer, CandidateSerializer,
)


# ─── Student Endpoints ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def election_list(request):
    """List all active/completed elections for students."""
    elections = Election.objects.filter(status__in=['active', 'completed'])
    return Response(ElectionListSerializer(elections, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def election_ballot(request, election_id):
    """Get ballot (positions + candidates) for an election."""
    try:
        election = Election.objects.get(id=election_id)
    except Election.DoesNotExist:
        return Response({'error': 'Election not found.'}, status=status.HTTP_404_NOT_FOUND)

    has_voted = Vote.objects.filter(
        voter=request.user,
        candidate__position__election=election
    ).exists()

    data = ElectionDetailSerializer(election).data
    data['has_voted'] = has_voted
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cast_vote(request, election_id):
    """Cast votes for an election."""
    user = request.user

    if user.role != 'student':
        return Response({'error': 'Only students can vote.'}, status=status.HTTP_403_FORBIDDEN)
    if not user.is_verified:
        return Response({'error': 'You must verify your ID before voting.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        election = Election.objects.get(id=election_id, status='active')
    except Election.DoesNotExist:
        return Response({'error': 'Election not found or not active.'}, status=status.HTTP_404_NOT_FOUND)

    if Vote.objects.filter(voter=user, candidate__position__election=election).exists():
        return Response({'error': 'You have already voted in this election.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = BulkVoteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    votes_data = serializer.validated_data['votes']
    created_votes = []
    voted_positions = set()

    for vote_item in votes_data:
        try:
            candidate = Candidate.objects.get(
                id=vote_item['candidate_id'],
                position_id=vote_item['position_id'],
                position__election=election,
            )
        except Candidate.DoesNotExist:
            return Response({'error': 'Invalid candidate for position.'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent duplicate votes for the same position within this request
        if candidate.position_id in voted_positions:
            return Response({'error': f'Duplicate vote for position: {candidate.position.title}'},
                            status=status.HTTP_400_BAD_REQUEST)
        voted_positions.add(candidate.position_id)

        # Check if already voted for this position in DB
        if Vote.objects.filter(voter=user, candidate__position=candidate.position).exists():
            return Response({'error': f'Duplicate vote for position: {candidate.position.title}'},
                            status=status.HTTP_400_BAD_REQUEST)

        created_votes.append(Vote(voter=user, candidate=candidate))

    Vote.objects.bulk_create(created_votes)
    return Response(
        {'message': 'Your votes have been submitted successfully!', 'votes_count': len(created_votes)},
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def election_results(request, election_id):
    """Get election results with vote tallies.
    
    Returns positions keyed as 'positions' (not 'results') so the frontend
    can reference data.positions consistently across all pages.
    """
    try:
        election = Election.objects.get(id=election_id)
    except Election.DoesNotExist:
        return Response({'error': 'Election not found.'}, status=status.HTTP_404_NOT_FOUND)

    positions_qs = election.positions.all()
    positions_data = []

    for position in positions_qs:
        candidates = position.candidates.annotate(
            votes=Count('votes')
        ).order_by('-votes')

        total_position_votes = sum(c.votes for c in candidates)

        positions_data.append({
            'title': position.title,           # 'title' not 'position' — matches frontend
            'position_id': position.id,
            'total_votes': total_position_votes,
            'candidates': [
                {
                    'id': c.id,
                    'name': c.name,
                    'party': c.party,
                    'photo_url': c.photo_url,
                    'votes': c.votes,
                    'percentage': round((c.votes / total_position_votes * 100), 1) if total_position_votes > 0 else 0,
                }
                for c in candidates
            ],
        })

    total_votes = election.total_votes
    eligible_voters = election.total_eligible_voters
    turnout = round((total_votes / max(eligible_voters, 1)) * 100, 1)

    return Response({
        'election': ElectionListSerializer(election).data,
        'positions': positions_data,           # was 'results' — now matches frontend
        'total_votes': total_votes,
        'eligible_voters': eligible_voters,    # was 'total_eligible' — now matches frontend
        'turnout': turnout,
    })


# ─── Admin Endpoints ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    """Admin dashboard KPIs."""
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    total_students = User.objects.filter(role='student').count()
    verified_students = User.objects.filter(role='student', is_verified=True).count()
    total_elections = Election.objects.count()
    active_elections = Election.objects.filter(status='active').count()
    total_votes = Vote.objects.count()

    recent_elections = ElectionListSerializer(
        Election.objects.all()[:5], many=True
    ).data

    return Response({
        'total_students': total_students,
        'verified_students': verified_students,
        'total_elections': total_elections,
        'active_elections': active_elections,
        'total_votes': total_votes,
        'recent_elections': recent_elections,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_election(request):
    """Admin: Create a new election."""
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = CreateElectionSerializer(data=request.data)
    if serializer.is_valid():
        election = serializer.save(created_by=request.user, status='active')

        positions_data = request.data.get('positions', [])
        for pos_data in positions_data:
            position = Position.objects.create(
                election=election,
                title=pos_data.get('title', ''),
                order=pos_data.get('order', 0),
            )
            for cand_data in pos_data.get('candidates', []):
                Candidate.objects.create(
                    position=position,
                    name=cand_data.get('name', ''),
                    party=cand_data.get('party', ''),
                    bio=cand_data.get('bio', ''),
                    photo_url=cand_data.get('photo_url', ''),
                )

        return Response(ElectionDetailSerializer(election).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)