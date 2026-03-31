"""
Migration 0002: Vote model — add `position` FK + replace uniqueness constraint

Changes:
  1. Add Vote.position FK (nullable initially so existing rows don't break)
  2. Data migration: populate position from candidate.position for all existing votes
  3. Remove old unique_vote_per_candidate constraint on (voter, candidate)
  4. Add new unique_vote_per_position constraint on (voter, position)

Why this matters:
  The old constraint only blocked a voter from casting the exact same ballot
  twice (same voter + same candidate). It did NOT prevent a voter from voting
  for *two different candidates* in the same position, which is a valid attack
  vector under concurrent requests (race condition between the view-layer check
  and the actual INSERT).

  The new constraint is enforced by the database engine, making the race
  condition impossible regardless of request concurrency.
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def populate_position_from_candidate(apps, schema_editor):
    """Fill Vote.position from Vote.candidate.position for all existing rows."""
    Vote = apps.get_model('elections', 'Vote')
    for vote in Vote.objects.select_related('candidate__position').all():
        vote.position = vote.candidate.position
        vote.save(update_fields=['position'])


def reverse_populate(apps, schema_editor):
    """Reverse: clear position FK (we're going back to not having it)."""
    Vote = apps.get_model('elections', 'Vote')
    Vote.objects.all().update(position=None)


class Migration(migrations.Migration):

    dependencies = [
        ('elections', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Step 1: Add the position FK, nullable so existing rows are valid
        migrations.AddField(
            model_name='vote',
            name='position',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='votes',
                to='elections.position',
            ),
        ),

        # Step 2: Backfill position for existing votes
        migrations.RunPython(populate_position_from_candidate, reverse_populate),

        # Step 3: Drop the old (voter, candidate) constraint
        migrations.RemoveConstraint(
            model_name='vote',
            name='unique_vote_per_candidate',
        ),

        # Step 4: Add the new (voter, position) constraint — DB-level race protection
        migrations.AddConstraint(
            model_name='vote',
            constraint=models.UniqueConstraint(
                fields=['voter', 'position'],
                name='unique_vote_per_position',
            ),
        ),
    ]
