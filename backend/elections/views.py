from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import IntegrityError
from django.db.models import Count
from django.utils import timezone

from accounts.models import User
from .models import Election, Position, Candidate, Vote
from .serializers import (
    ElectionListSerializer, ElectionDetailSerializer,
    CreateElectionSerializer, BulkVoteSerializer,
    PositionSerializer, CandidateSerializer,
)


# ─── Shared queryset helper ───────────────────────────────────────────────────

def _elections_with_vote_count(qs):
    """
    Annotate a queryset of Elections with `annotated_total_votes` so the
    serializer can read it without issuing one extra query per election.

    ElectionListSerializer checks for the annotated field first; if absent it
    falls back to the model property (which still works but causes N+1).
    """
    return qs.annotate(annotated_total_votes=Count('positions__candidates__votes'))


# ─── Student Endpoints ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def election_list(request):
    """List all active/completed elections for students."""
    elections = _elections_with_vote_count(
        Election.objects.filter(status__in=['active', 'completed'])
    )
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
    """
    Cast votes for an election.

    Expects: { "votes": [{"position_id": 1, "candidate_id": 5}, ...] }

    Race-condition safety:
      The view does an early duplicate check for a fast error message, but the
      real protection is the DB-level UniqueConstraint on (voter, position).
      If two concurrent requests slip past the view check simultaneously, the
      second INSERT will raise IntegrityError which we catch and return a 409.
    """
    user = request.user

    if user.role != 'student':
        return Response({'error': 'Only students can vote.'}, status=status.HTTP_403_FORBIDDEN)
    if not user.is_verified:
        return Response(
            {'error': 'You must verify your ID before voting.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        election = Election.objects.get(id=election_id, status='active')
    except Election.DoesNotExist:
        return Response(
            {'error': 'Election not found or not active.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Fast early check — the real guard is the DB constraint below
    if Vote.objects.filter(voter=user, candidate__position__election=election).exists():
        return Response(
            {'error': 'You have already voted in this election.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = BulkVoteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    votes_data = serializer.validated_data['votes']
    seen_positions = set()
    votes_to_create = []

    for vote_item in votes_data:
        # Validate candidate belongs to the right position + election
        try:
            candidate = Candidate.objects.select_related('position').get(
                id=vote_item['candidate_id'],
                position_id=vote_item['position_id'],
                position__election=election,
            )
        except Candidate.DoesNotExist:
            return Response(
                {'error': 'Invalid candidate or position in this election.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reject duplicate positions within the same request payload
        if candidate.position_id in seen_positions:
            return Response(
                {'error': f'Duplicate vote for position: {candidate.position.title}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        seen_positions.add(candidate.position_id)

        # Build Vote with position explicitly set — required for the DB constraint
        votes_to_create.append(
            Vote(voter=user, candidate=candidate, position=candidate.position)
        )

    try:
        Vote.objects.bulk_create(votes_to_create)
    except IntegrityError:
        # DB constraint fired — concurrent duplicate request
        return Response(
            {'error': 'You have already voted in this election (concurrent request detected).'},
            status=status.HTTP_409_CONFLICT
        )

    return Response(
        {'message': 'Your votes have been submitted successfully!', 'votes_count': len(votes_to_create)},
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def election_results(request, election_id):
    """
    Get election results with vote tallies.

    Returns `positions` (not `results`) so all frontend pages can use
    data.positions consistently, and `eligible_voters` (not `total_eligible`).
    """
    try:
        election = Election.objects.get(id=election_id)
    except Election.DoesNotExist:
        return Response({'error': 'Election not found.'}, status=status.HTTP_404_NOT_FOUND)

    positions_data = []

    for position in election.positions.all():
        candidates = position.candidates.annotate(
            votes=Count('votes')
        ).order_by('-votes')

        total_position_votes = sum(c.votes for c in candidates)

        positions_data.append({
            'title': position.title,
            'position_id': position.id,
            'total_votes': total_position_votes,
            'candidates': [
                {
                    'id': c.id,
                    'name': c.name,
                    'party': c.party,
                    'photo_url': c.photo_url,
                    'votes': c.votes,
                    'percentage': (
                        round(c.votes / total_position_votes * 100, 1)
                        if total_position_votes > 0 else 0
                    ),
                }
                for c in candidates
            ],
        })

    total_votes = election.total_votes
    eligible_voters = election.total_eligible_voters
    turnout = round(total_votes / max(eligible_voters, 1) * 100, 1)

    return Response({
        'election': ElectionListSerializer(election).data,
        'positions': positions_data,
        'total_votes': total_votes,
        'eligible_voters': eligible_voters,
        'turnout': turnout,
    })


# ─── Admin Endpoints ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    """
    Admin dashboard KPIs.

    FIXED N+1: recent_elections queryset is annotated with vote counts before
    being passed to the serializer, so no extra query fires per election.
    Previously each election called election.total_votes → separate COUNT query.
    """
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    total_students = User.objects.filter(role='student').count()
    verified_students = User.objects.filter(role='student', is_verified=True).count()
    total_elections = Election.objects.count()
    active_elections = Election.objects.filter(status='active').count()
    total_votes = Vote.objects.count()

    # ── FIXED: annotate before serializing to eliminate N+1 ──────────────────
    # Without annotation: ElectionListSerializer calls election.total_votes
    # (a property) which issues 1 COUNT query per election → 5 extra queries.
    # With annotation: a single JOIN computes all counts in one query.
    recent_elections_qs = _elections_with_vote_count(Election.objects.all()[:5])
    recent_elections = ElectionListSerializer(recent_elections_qs, many=True).data

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
    """Admin: Create a new election with positions and candidates."""
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = CreateElectionSerializer(data=request.data)
    if serializer.is_valid():
        election = serializer.save(created_by=request.user, status='active')

        positions_data = request.data.get('positions', [])
        for pos_data in positions_data:
            position = Position.objects.create(
                election=election,
                title=pos_data.get('title', '').strip(),
                order=pos_data.get('order', 0),
            )
            for cand_data in pos_data.get('candidates', []):
                Candidate.objects.create(
                    position=position,
                    name=cand_data.get('name', '').strip(),
                    party=cand_data.get('party', '').strip(),
                    bio=cand_data.get('bio', '').strip(),
                    photo_url=cand_data.get('photo_url', '').strip(),
                )

        return Response(ElectionDetailSerializer(election).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def edit_election(request, election_id):
    """
    Admin: View or edit a published election.

    GET  → returns full election detail (positions + candidates)
    PATCH → limited editing:
      - start_date, end_date (timeline adjustment)
      - candidates[].is_disqualified (disqualify/reinstate a candidate)
    """
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        election = Election.objects.get(id=election_id)
    except Election.DoesNotExist:
        return Response({'error': 'Election not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ElectionDetailSerializer(election).data)

    # PATCH — apply limited edits
    updated = []

    # Timeline edits
    if 'start_date' in request.data:
        election.start_date = request.data['start_date']
        updated.append('start_date')
    if 'end_date' in request.data:
        election.end_date = request.data['end_date']
        updated.append('end_date')
    if 'status' in request.data and request.data['status'] in ['active', 'completed', 'cancelled']:
        election.status = request.data['status']
        updated.append('status')

    if updated:
        election.save(update_fields=updated)

    # Candidate disqualification edits
    candidates_data = request.data.get('candidates', [])
    for cand_update in candidates_data:
        cand_id = cand_update.get('id')
        disqualified = cand_update.get('is_disqualified')
        if cand_id is not None and disqualified is not None:
            Candidate.objects.filter(
                id=cand_id,
                position__election=election,
            ).update(is_disqualified=disqualified)

    # Add new candidates to existing positions
    add_candidates = request.data.get('add_candidates', [])
    for cand_data in add_candidates:
        position_id = cand_data.get('position_id')
        name = cand_data.get('name', '').strip()
        if not position_id or not name:
            continue
        try:
            position = Position.objects.get(id=position_id, election=election)
        except Position.DoesNotExist:
            continue
        Candidate.objects.create(
            position=position,
            name=name,
            party=cand_data.get('party', '').strip(),
            bio=cand_data.get('bio', '').strip(),
            photo_url=cand_data.get('photo_url', '').strip(),
        )

    # Refresh and return updated data
    election.refresh_from_db()
    return Response(ElectionDetailSerializer(election).data)