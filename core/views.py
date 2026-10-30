from django.views.generic import TemplateView

class TermsView(TemplateView):
    template_name = 'legal/terms.html'

class PrivacyPolicyView(TemplateView):
    template_name = 'legal/privacy.html'

class CookiesPolicyView(TemplateView):
    template_name = 'legal/cookies.html'