from django.views.generic import TemplateView

from django.shortcuts import render, redirect



class TermsView(TemplateView):
    template_name = 'legal/terms.html'

class PrivacyPolicyView(TemplateView):
    template_name = 'legal/privacy.html'

class CookiesPolicyView(TemplateView):
    template_name = 'legal/cookies.html'


def landing_page_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')  # Redirige al tablero si ya está dentro
    
    context = {
        'is_landing': True,
    }
    return render(request, 'base/landing.html', context)