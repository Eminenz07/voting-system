from django.urls import path
from . import views

urlpatterns = [
    # Student endpoints
    path('elections/', views.election_list, name='election-list'),
    path('elections/<int:election_id>/ballot/', views.election_ballot, name='election-ballot'),
    path('elections/<int:election_id>/vote/', views.cast_vote, name='cast-vote'),
    path('elections/<int:election_id>/results/', views.election_results, name='election-results'),
    # Admin endpoints
    path('admin/dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('admin/elections/', views.create_election, name='create-election'),
]
