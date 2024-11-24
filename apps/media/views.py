from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import TVShow
from .serializers import TVShowSerializer


@api_view(["GET", "POST"])
def tvshows_list(request):
    if request.method == "GET":
        tvshows = TVShow.objects.all()
        serializer = TVShowSerializer(tvshows, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = TVShowSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["GET", "PUT", "DELETE"])
def tvshows_detail(request, pk):
    try:
        tvshow = TVShow.objects.get(pk=pk)
    except TVShow.DoesNotExist:
        return Response({"error": "TVShow not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = TVShowSerializer(tvshow)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = TVShowSerializer(tvshow, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        tvshow.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["GET"])
def tvshows_download_current_episode(request, pk):
    try:
        tvshow = TVShow.objects.get(pk=pk)
    except TVShow.DoesNotExist:
        return Response({"error": "TVShow not found"}, status=status.HTTP_404_NOT_FOUND)

    result = tvshow.download_current_episode()

    print(result)

    return Response("OK")
