from django.db import models 

# Create your models here.
class TVShow(models.Model):
    epguide_name = models.CharField(max_length=250)
    full_name = models.CharField(max_length=250)
    current_season = models.IntegerField()
    current_episode = models.IntegerField()
