from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.views import LoginView, LogoutView
from users.views import register_view
from boards.views import search_users_api
from .views import TermsView, PrivacyPolicyView, CookiesPolicyView, landing_page_view
from django.contrib.auth import views as auth_views
from django.views.decorators.cache import never_cache

urlpatterns = [
    path('admin/', admin.site.urls),

    path('i18n/', include('django.conf.urls.i18n')),
    
    # 1. RUTA RAÍZ: Únicamente la Landing Page para los no autenticados
    path('', landing_page_view, name='landing'),

    # 2. RUTAS DE AUTENTICACIÓN
    path('login/', never_cache(auth_views.LoginView.as_view(
        template_name='registration/login.html',
        redirect_authenticated_user=True
    )), name='login'),
    path('logout/', LogoutView.as_view(next_page='landing'), name='logout'),
    path('register/', register_view, name='register'),

    # 3. RUTAS DE APPS (Quitamos el include vacío de la raíz para que no pise la landing)
    path('tasks/', include('tasks.urls')),
    path('boards/', include('boards.urls')),
    path('users/', include('users.urls')),

    path('api/search-users/', search_users_api, name='search_users_api'),

    # 4. LEGAL
    path('terminos/', TermsView.as_view(), name='terms'),
    path('privacidad/', PrivacyPolicyView.as_view(), name='privacy_policy'),
    path('cookies/', CookiesPolicyView.as_view(), name='cookies_policy'),
]