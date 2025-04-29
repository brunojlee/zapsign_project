from django.core.management.base import BaseCommand
from core.models import Company

class Command(BaseCommand):
    help = 'Cria ou atualiza uma Company com o API token'

    def handle(self, *args, **kwargs):
        token = "b9aad663-563f-4222-91e1-b0b7fe334e5dae77c333-7c69-40fd-959f-23e030ef0a11"
        company, created = Company.objects.get_or_create(
            name="Minha Empresa",
            defaults={'api_token': token}
        )
        if not created:
            company.api_token = token
            company.save()
        self.stdout.write(self.style.SUCCESS("Company atualizada com sucesso."))
