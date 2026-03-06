from rest_framework import serializers
from .models import Election, Position, Candidate, Vote


class CandidateSerializer(serializers.ModelSerializer):
    vote_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Candidate
        fields = ['id', 'name', 'party', 'bio', 'photo_url', 'vote_count']


class PositionSerializer(serializers.ModelSerializer):
    candidates = CandidateSerializer(many=True, read_only=True)

    class Meta:
        model = Position
        fields = ['id', 'title', 'order', 'candidates']


class ElectionListSerializer(serializers.ModelSerializer):
    total_votes = serializers.IntegerField(read_only=True)
    positions_count = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = ['id', 'title', 'description', 'start_date', 'end_date',
                  'status', 'total_votes', 'positions_count', 'created_at']

    def get_positions_count(self, obj):
        return obj.positions.count()


class ElectionDetailSerializer(serializers.ModelSerializer):
    positions = PositionSerializer(many=True, read_only=True)
    total_votes = serializers.IntegerField(read_only=True)
    total_eligible_voters = serializers.IntegerField(read_only=True)

    class Meta:
        model = Election
        fields = ['id', 'title', 'description', 'start_date', 'end_date',
                  'status', 'positions', 'total_votes', 'total_eligible_voters', 'created_at']


class CreateElectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Election
        fields = ['title', 'description', 'start_date', 'end_date']


class CastVoteSerializer(serializers.Serializer):
    """Expects: { votes: [{position_id: 1, candidate_id: 5}, ...] }"""
    position_id = serializers.IntegerField()
    candidate_id = serializers.IntegerField()


class BulkVoteSerializer(serializers.Serializer):
    votes = CastVoteSerializer(many=True)
