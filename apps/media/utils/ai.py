import requests


def extract_title_and_season_episode(text: str) -> str:
    url = "http://llm.frecar.no/api/generate"

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

        Input: '{0}'
        Output: Only the new transformed string
        """.format(
            text
        ),
        "stream": False,  # Set to True if you want streaming responses
    }
    response = requests.post(url, json=payload)
    return str(response.json()["response"])
