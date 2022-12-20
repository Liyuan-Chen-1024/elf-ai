from django.db import models 

# Create your models here.
class TVShow(models.Model):
    epguide_name = models.CharField(max_length=250)
    full_name = models.CharField(max_length=250)
    current_season = models.IntegerField()
    current_episode = models.IntegerField()
    active = models.BooleanField(default=False)
    keep = models.BooleanField(default=False)
    datetime_edited = models.DateTimeField()
    datetime_added = models.DateTimeField()
    downloaded_current_episode = models.BooleanField()
    episode_lookup_type = models.CharField(default="number", max_length=255)
