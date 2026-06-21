from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('promotions', '0002_committeemember_promotiondocument'),
    ]

    operations = [
        migrations.AlterField(
            model_name='promotiontableinstance',
            name='table_type',
            field=models.CharField(
                choices=[
                    ('ECHELON',        'جدول اقتراح الترقية في الرتبة'),
                    ('GRADE_TITLE',    'جدول اقتراح التسمية في إطار أستاذ محاضر مؤهل'),
                    ('TITULARISATION', 'جدول اقتراح الترسيم'),
                    ('GRADE_ADMIN',    'جدول الترقية في الدرجة (الأطر الإدارية والتقنية)'),
                ],
                max_length=20,
            ),
        ),
    ]
