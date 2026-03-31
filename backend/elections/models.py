from django.db import models
from django.conf import settings


class Election(models.Model):
    """An election event (e.g., 2024 SUG Presidential Election)."""

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_elections')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def total_votes(self):
        return Vote.objects.filter(candidate__position__election=self).count()

    @property
    def total_eligible_voters(self):
        from accounts.models import User
        return User.objects.filter(role='student', is_verified=True).count()


class Position(models.Model):
    """A position being contested in an election (e.g., President, VP)."""

    title = models.CharField(max_length=200)
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='positions')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f'{self.title} ({self.election.title})'


class Candidate(models.Model):
    """A candidate running for a position."""

    name = models.CharField(max_length=200)
    party = models.CharField(max_length=100, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    photo_url = models.URLField(blank=True, default='')
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='candidates')
    is_disqualified = models.BooleanField(default=False)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.name} — {self.position.title}'

    @property
    def vote_count(self):
        return self.votes.count()


class Vote(models.Model):
    """A single vote cast by a student for a candidate."""

    voter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='votes')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='votes')
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='votes', null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['voter', 'position'],
                name='unique_vote_per_position',
            ),
        ]
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.voter.matric} → {self.candidate.name}'
