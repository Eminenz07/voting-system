from rest_framework import serializers
from .models import Election, Position, Candidate, Vote


class CandidateSerializer(serializers.ModelSerializer):
    vote_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Candidate
        fields = ['id', 'name', 'party', 'bio', 'photo_url', 'vote_count', 'is_disqualified']                            


class PositionSerializer(serializers.ModelSerializer):
    candidates = CandidateSerializer(many=True, read_only=True)

    class Meta:
        model = Position
        fields = ['id', 'title', 'order', 'candidates']


class ElectionListSerializer(serializers.ModelSerializer):
    total_votes = serializers.SerializerMethodField()
    positions_count = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = [
            'id', 'title', 'description', 'start_date', 'end_date',
            'status', 'total_votes', 'positions_count', 'created_at',
        ]

    def get_total_votes(self, obj):
        """
        Read from the annotated field if the queryset was annotated by the view
        (via _elections_with_vote_count). Fall back to the model property only
        when the annotation is absent — e.g. when a single election is retrieved
        without annotation (detail view, results view).

        This avoids the N+1 in list views while remaining correct everywhere.
        """
        annotated = getattr(obj, 'annotated_total_votes', None)
        if annotated is not None:
            return annotated
        # Fallback — safe but issues one extra query
        return obj.total_votes

    def get_positions_count(self, obj):
        return obj.positions.count()


class ElectionDetailSerializer(serializers.ModelSerializer):
    positions = PositionSerializer(many=True, read_only=True)
    total_votes = serializers.IntegerField(read_only=True)
    total_eligible_voters = serializers.IntegerField(read_only=True)

    class Meta:
        model = Election
        fields = [
            'id', 'title', 'description', 'start_date', 'end_date',
            'status', 'positions', 'total_votes', 'total_eligible_voters', 'created_at',
        ]


class CreateElectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Election
        fields = ['title', 'description', 'start_date', 'end_date']

    def validate(self, data):
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError(
                    {'end_date': 'End date must be after start date.'}
                )
        return data


class CastVoteSerializer(serializers.Serializer):
    position_id = serializers.IntegerField()
    candidate_id = serializers.IntegerField()


class BulkVoteSerializer(serializers.Serializer):
    votes = CastVoteSerializer(many=True, min_length=1)