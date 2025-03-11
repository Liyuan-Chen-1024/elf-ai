import requests


def extract_title_and_season_episode(text: str) -> str:
    url = "http://llm.frecar.no/api/generate"

    payload = {
        "model": "qwen2.5:7b",  # Change to your preferred model, e.g., "llama3"
        "prompt": """
        Transform the following input to match the pattern 'Title SXXEYY'. Capitalize the first letter of each word in the title.
        
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


def extract_movie_title(text: str) -> str:
    url = "http://llm.frecar.no/api/generate"

    payload = {
        "model": "qwen2.5:7b",  # Change to your preferred model, e.g., "llama3"
        "prompt": """
        Transform the following input to match the pattern 'Title'. Capitalize the first letter of each word in the title.
        
        Examples (input => output)
        1. tom.cruise.movies/a.few.good.men.19.mkv => A Few Good Men
        2. star.wars.episode.09the.rise.of.skywalker.mkv => Star Wars: Episode IX - The Rise of Skywalker
        3. tropic.thunder.1920x822.mkv => Topic Thunder  
        4. star.wars.episode.06return.of.jedi.(1983).mkv => Star Wars: Episode VI - Return of Jedi
        5. harry.potter.and.theamber.of.secrets.mkv => Harry Potter and the Chamber of Secrets
        6. joker.2019.mkv => Joker
        7. harry.potter.and.the.half-blood.prince.mkv => Harry Potter and the Half-Blood Prince
        8. batman.v.superman.dawn.of.justice.mkv => Batman v Superman: Dawn of Justice
        9. transformers.the.last.knight.(2017).imax.(.dolby.vision.).light].mkv => Transformers: The Last Knight
        10. the.lord.of.the.rings.the.return.of.the.king.(2003).extended.edition.1080p.bluray.x264.mkv => The Lord of the Rings: The Return of the King
        
        Input: '{0}'
        Output: Only the new transformed string
        """.format(
            text
        ),
        "stream": False,  # Set to True if you want streaming responses
    }
    response = requests.post(url, json=payload)
    return str(response.json()["response"])
