"""
Seed the database with demo data for the AU Voting System.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from elections.models import Election, Position, Candidate


class Command(BaseCommand):
    help = 'Seed the database with demo election data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # ── Create Admin User ──
        admin, created = User.objects.get_or_create(
            matric='admin',
            defaults={
                'username': 'admin',
                'first_name': 'Dr.',
                'last_name': 'Adebayo',
                'role': 'admin',
                'department': 'Administration',
                'faculty': 'Administration',
                'is_verified': True,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('  ✓ Admin user created (admin / admin123)'))
        else:
            self.stdout.write('  – Admin user already exists')

        # ── Create Demo Students ──
        students_data = [
            {'matric': '19/0874', 'first_name': 'Oluwaseun', 'last_name': 'Adeleke', 'department': 'Computer Science', 'faculty': 'Science'},
            {'matric': '20/1234', 'first_name': 'Aisha', 'last_name': 'Mohammed', 'department': 'Law', 'faculty': 'Law'},
            {'matric': '21/5678', 'first_name': 'Chinedu', 'last_name': 'Okafor', 'department': 'Mass Communication', 'faculty': 'Arts'},
            {'matric': '22/9012', 'first_name': 'Fatima', 'last_name': 'Ibrahim', 'department': 'Accounting', 'faculty': 'Management Sciences'},
            {'matric': '20/3456', 'first_name': 'Emeka', 'last_name': 'Nwosu', 'department': 'Computer Science', 'faculty': 'Science'},
        ]

        for sdata in students_data:
            student, created = User.objects.get_or_create(
                matric=sdata['matric'],
                defaults={
                    'username': sdata['matric'].replace('/', '_'),
                    'first_name': sdata['first_name'],
                    'last_name': sdata['last_name'],
                    'role': 'student',
                    'department': sdata['department'],
                    'faculty': sdata['faculty'],
                    'is_verified': True,
                }
            )
            if created:
                student.set_password('student123')
                student.save()
                self.stdout.write(self.style.SUCCESS(f'  ✓ Student: {sdata["first_name"]} {sdata["last_name"]} ({sdata["matric"]})'))

        # ── Create Demo Election ──
        now = timezone.now()
        election, created = Election.objects.get_or_create(
            title='2024 SUG Presidential Election',
            defaults={
                'description': 'Adeleke University Student Union Government Presidential Election for the 2024 academic session.',
                'start_date': now - timedelta(days=1),
                'end_date': now + timedelta(days=6),
                'status': 'active',
                'created_by': admin,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('  ✓ Election created: 2024 SUG Presidential Election'))

            # ── Positions & Candidates ──
            president = Position.objects.create(election=election, title='President', order=1)
            vp = Position.objects.create(election=election, title='Vice President', order=2)
            sec_gen = Position.objects.create(election=election, title='Secretary General', order=3)

            # President candidates
            Candidate.objects.create(position=president, name='David Okonkwo', party='Progressive Alliance',
                photo_url='https://lh3.googleusercontent.com/aida-public/AB6AXuDohbK4rKIU3a6oQgdfT9ehGjFQTpolT_NzAFEWiNjqPbYrjyC7OpQwbIWI4VyutZ74eeBfXyaEGXde3B-_jxCELpSxuiK3buRJMEAEzVUIZm07GMppAF6kkNj9VZpqEnbgotlr_TcYWwufOa3tvuFMQEAnTWz8Y32zd3MyGCiXjGGBuxUuyg5NO5mpwbD6am1X4d-9gDL9oPJ1F6dAK8jCkooS2O2tB2rgbzLlZmAsMv5jTQEte0pgDROR0nUlhqR6-JRLlf8CMd_R',
                bio='300-level Law student with a vision for campus transformation.')
            Candidate.objects.create(position=president, name='Sarah Mensah', party='Student Voice',
                photo_url='https://lh3.googleusercontent.com/aida-public/AB6AXuCSN1GYmK8jyjNPrhfwpWozRNSsqns63v0OG6xS7EuEsFMbx2rmaEup0ZZHGGCGNfG5qlQmZVRYQ1JthkIJ1n-Fa30A_fFpiK1bhjBmI61D9IFf72NcNmzUS6GgrexbFNibKxs0WdNzBoTM1VrGUfTdc3Ep9DoYk8rsObcvgciQ6MwKpMEfc0GPKOzBUzvW0oPvn0x3HiFJy8yyOo2a2pjrOp2iZyNyAtPz5UJOsxExnJjQ8ZyEV3DAqwLdbv-iuGRrwsqbbDdW5BJ3',
                bio='400-level Computer Science student focused on digital innovation.')
            Candidate.objects.create(position=president, name='Emmanuel Kalu', party='Unity Front',
                photo_url='https://lh3.googleusercontent.com/aida-public/AB6AXuAeKv-FnrXYISinC1OtLva5YRObY4cTWC6EbzXvsXSN0BUK8gz-l9HwF560-BS3iIItGyI-TZ8N_R0mQ3cHakMGe-R3C2Advj2NxKzDak6_I4LKzpEX5_LT6TDwd7JbH-h7iLEmWLh9tWqr1O_hr0VGcAgoa_bR3WbcdWaNU_50xs_h2oAVGXVrGuvT2mpu0OkfUq56xHBMRgS-zSQUq6hUVewlKV3P6HYLLF_sXfdGqWff_gFWhEJsJjepd_8LDWW_ezuy0sb1oUG1',
                bio='300-level Accounting student passionate about financial transparency.')

            # VP candidates
            Candidate.objects.create(position=vp, name='Grace Adeyemi', party='Progressive Alliance',
                bio='200-level Mass Communication student with leadership experience.')
            Candidate.objects.create(position=vp, name='Usman Bello', party='Student Voice',
                bio='300-level Engineering student committed to welfare reform.')

            # Secretary General candidates
            Candidate.objects.create(position=sec_gen, name='Chioma Eze', party='Unity Front',
                bio='300-level English student experienced in student governance.')
            Candidate.objects.create(position=sec_gen, name='Tunde Bakare', party='Progressive Alliance',
                bio='200-level Computer Science student with organizational skills.')

            self.stdout.write(self.style.SUCCESS('  ✓ 3 positions and 7 candidates created'))
        else:
            self.stdout.write('  – Election already exists')

        self.stdout.write(self.style.SUCCESS('\n✅ Seed data complete!'))
        self.stdout.write(f'\n  Admin login:   matric=admin, password=admin123')
        self.stdout.write(f'  Student login: matric=19/0874, password=student123')
