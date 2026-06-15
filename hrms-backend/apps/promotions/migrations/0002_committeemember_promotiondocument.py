from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('promotions', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CommitteeMember',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('full_name', models.CharField(max_length=150)),
                ('role', models.CharField(max_length=100)),
                ('order', models.PositiveSmallIntegerField(default=1)),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='PromotionDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('doc_type', models.CharField(
                    choices=[
                        ('TABLEAU_ECHELON', 'Tableau Avancement (Echelon)'),
                        ('TABLEAU_GRADE', 'Tableau Avancement (Grade)'),
                        ('PV_COMITE', 'PV Comité Scientifique'),
                        ('PAGE_GARDE', 'Page de Garde (ورقة الإرسال)'),
                        ('FICHE_NOTATION', 'Fiche de Notation'),
                    ],
                    max_length=20,
                )),
                ('file', models.FileField(upload_to='promotions/documents/%Y/')),
                ('table_instance', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='generated_documents',
                    to='promotions.promotiontableinstance',
                )),
                ('generated_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
    ]
