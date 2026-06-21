# URL routing for messaging system endpoints
from django.urls import path
from . import views

app_name = 'messaging'

urlpatterns = [
    path('conversations/',                              views.ConversationListCreateView.as_view(),  name='conversations'),
    path('conversations/<uuid:pk>/',                    views.ConversationDetailView.as_view(),      name='conversation-detail'),
    path('conversations/<uuid:conv_id>/messages/',      views.MessageListCreateView.as_view(),       name='messages'),
    path('messages/<uuid:pk>/',                         views.MessageDeleteView.as_view(),           name='message-delete'),
    path('messages/<uuid:pk>/react/',                   views.MessageReactionView.as_view(),         name='message-react'),
    path('unread/',                                     views.UnreadCountView.as_view(),             name='unread'),
    path('users/',                                      views.UserSearchView.as_view(),              name='user-search'),
    path('users/all/',                                  views.UserListView.as_view(),                name='user-list'),
    path('direct/',                                     views.FindOrCreateDirectView.as_view(),      name='direct'),
]
