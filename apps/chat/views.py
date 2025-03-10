import json
import os
import time

import requests
from django.http import HttpResponse
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)


@api_view(["GET", "POST"])
@authentication_classes([])
@permission_classes([])
def rename_filenames(request):

    # Define the URL for the Ollama API
    url = "http://llm.frecar.no/api/generate"

    # Define the payload
    payload = {
        "model": "qwen2.5:7b",  # Change to your preferred model, e.g., "llama3"
        "prompt": """
        Transform the following input to match the pattern 'Title SXXEYY.<file_extension>'. Capitalize the first letter of each word in the title and keep the original file extension if present.
        
        Examples:
        1. Shark.Tank.S11E12.1080p.AMZN.WEB-DL.DDP5.1.H.264-FLUX[EZTVx.to].mkv => Shark Tank S11E12.mkv
        2. How.I.Met.Your.Mother.S10E02.720p.mkv => How I Met Your Mother S10E02.mkv
        3. Friends.S02.E01.AMAZON.mkv => Friends S02E01.mkv
        4. daredevil.again.s05e02.1080p.web.h264-successfulcrab[EZTVx.to].mkv => Daredevil S05E02.mkv
        5. The.Office.US.S05E14.1080p.BluRay.x264.mkv => The Office US S05E14.mkv
        6. Game.of.Thrones.S08E03.720p.HDTV.x264.mkv => Game of Thrones S08E03.mkv
        7. Breaking.Bad.S03E07.1080p.WEB-DL.DD5.1.H.264.mp4 => Breaking Bad S03E07.mp4
        8. Stranger.Things.S02E09.1080p.NF.WEB-DL.DDP5.1.H.264-NTG.mkv => Stranger Things S02E09.mkv
        
        Special case, some shows are using dates instead of season and episode, in that case the format should be 'Title <date>.<file_extension>', e.g:
        9. seth.meyers.2025.02.03.james.marsden.[x.to].mkv => Seth Meyers 2025.02.03.mkv
        
        Input: 'last.week.tonight.with.john.oliver.s12e03.-successfulcrab[x.to].mkv'
        Output: Only the new transformed string, keeping the original file extension
        """,
        "stream": False,  # Set to True if you want streaming responses
    }

    # Make the POST request
    response = requests.post(url, json=payload)

    # Parse and print the response
    if response.status_code == 200:
        response_data = response.json()
        print(response_data.get("response", "No response received"))
    else:
        print(f"Error: {response.status_code}, {response.text}")

    print(response_data.get("response"))
    return HttpResponse("OK")




@api_view(["GET", "POST"])
@authentication_classes([])
@permission_classes([])
def rename_dirs(request):

    # Define the URL for the Ollama API
    url = "http://llm.frecar.no/api/generate"

    # Define the payload
    payload = {
        "model": "qwen2.5:7b",  # Change to your preferred model, e.g., "llama3"
        "prompt": """
        Transform the following input to match the pattern 'Title SXXEYY' for directories. Capitalize the first letter of each word in the title.
        
        Examples (input => output)
        1. Shark.Tank.S11E12.1080p.AMZN.WEB-DL.DDP5.1.H.264-FLUX[EZTVx.to] => Shark Tank S11E12
        2. How.I.Met.Your.Mother.S10E02.720p => How I Met Your Mother S10E02
        3. Friends.S02.E01.AMAZON => Friends S02E01
        4. daredevil.again.s05e02.1080p.web.h264-successfulcrab[EZTVx.to] => Daredevil S05E02
        5. The.Office.US.S05E14.1080p.BluRay.x264 => The Office US S05E14
        6. Game.of.Thrones.S08E03.720p.HDTV.x264 => Game of Thrones S08E03
        7. Breaking.Bad.S03E07.1080p.WEB-DL.DD5.1.H.264 => Breaking Bad S03E07
        8. Stranger.Things.S02E09.1080p.NF.WEB-DL.DDP5.1.H.264-NTG => Stranger Things S02E09
        
        Special case, some shows are using dates instead of season and episode, in that case the format should be 'Title <date>', e.g:
        9. seth.m.2025.02.03.james.marsden.[x.to] => Seth Meyers 2025.02.03
        
        Note, if no tv show with the title exists, correct the title to a real show title, examples:
        10. seth.bayer.2025.02.03.james.marsden.[x.to] => Seth Meyers 2025.02.03
        11. Game.Thrones.S08E03.720p.HDTV.x264 => Game of Thrones S08E03

        Input: 'last.week.tonight.with.j.oliver 1080p.BluRay.x264 S02E04'
        Output: Only the new transformed string
        """,
        "stream": False,  # Set to True if you want streaming responses
    }

    # Make the POST request
    response = requests.post(url, json=payload)

    # Parse and print the response
    if response.status_code == 200:
        response_data = response.json()
        print(response_data.get("response", "No response received"))
    else:
        print(f"Error: {response.status_code}, {response.text}")

    print(response_data.get("response"))
    return HttpResponse("OK dirs")
