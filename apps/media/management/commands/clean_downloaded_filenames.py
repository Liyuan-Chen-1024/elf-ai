#!/usr/bin/env python
# -*- coding: utf-8 -*-

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import os

from apps.media.utils.tx import TXWrapper


class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    def handle(self, *args, **options):
        for storage in settings.STORAGE:
            rename(storage)


strip_list = ["eztv", "[.re]", "eztv.re", ".rip", ".ripp", "-gossip", "-ggez", "-game0ver", "-cakes", "-m0retv", "-strontium", "-ggwp", "_tvm", "afi-", "-kogi", "-xlf", "-minx",
              "-jebaited", "-casstudio", "-stigma", "-sigma", "-align", "-oath", "-btx", "-webtube", "-soaplove", "com -", "glhf", "-kompost", "comandos.com",
              "[web]", "[dual", "dual.", "andos.com", "acesse ]", "org  ", "org - ", "multi web", "-cielos", "final internal", "internal web", " h ", "-hybris",
              "-max", "maximersk", "-trump", "-xpoz", "(nitro)", "Tomas&minami", "www.Speed.cd", "-memento", "-metcon", "-rapta", "speed.cd", ".WEB", "WEB.",
              "[rarbg]", "reenc", "-deejayahmed", "ReEnc", "-DeeJayAhmed", "-river", "esub", "esubs", "-vlad", "-visum", "-mzabi", "-cravers", "-dl", "-cookiemonster",
              "repack", "hulu", "-cravers", "-gungrave", "-dhd", "[MPup]", "[MPup", "-webif", "-showscen", "dtv", "dd2", "-etrg", "bf1", "-it00nz", "-organic",
              "[exyu-subs]", "couch.net", "[769mb]", "4g", "769mb", "-eng", "-evo", ".dd", "-crimson", "-justiso", "swsub",  "-novarip", "-luci", ".h.", "-btn", "-bamboozle",
              "[1337x]", "[1337x", "[sn]", "[sn", "-tulio", "-yfn", "-dl", "-bamboozle",  "pcness", "-MeGusta", "[exyu-subs", "-sorny", "-yfn", "-ajp69", "-gungrave",
              "-ajp69", "cbs", "-2hd", "-byteshare", "[srigga]", "[srigga", "bluray", "brrip", "sujaidr",  "[www.newpct1.com]", "[cap.211]", "[cap.211",
              "[.newpct1.com]", "-cls", "[cap.103]", "[cap.102]", "[cap.110]", "[ Español ]", "[ Español", "from -", "-ism", "from [.me ]", "Uncensored", "cc 0",
              "snahp", "Day Com ]", "it]", "Ac3", "-mtb", "-heat", "www.urrelease.rg", "[vr56", "-2016", ".dl", "(1)", "d0ct0rlew", "shaanig", "-podo", "[publichd",
              "rcvr", "(  ape", "Castellano", "HDTV", "~arizone", "[kyle-e", "ac3", "-hatchetgear", "kyle-e", "-viethd", "spazio-tempo", "[ www.ing.me ]", "from -",
              "10bit", "-fmdab", "-evolve", "-immerse", "rmteam", "DD 5.1", "ddp5.1", "m2tv", "-nogrp", "rartv", "[rartv]", "X264-DIMENSION", "[rarbg]", "sharpysword",
              "chestnut", "hbo", "-monkee", "-alterego", "-tla", "syfy", "-krave", "bbc", "-fov", "[vr56]", "rmteam", "-lazy", "[rarbg", "-skgtv", "-donna",
              "-nada", "amzn", "-qoq", "-={sparrow}=", "10bit", "aac", "5.1", "[MPup]", "-sdi", "-yfn", "6ch", "-turbo", "-igm", "giuseppetnt",  "-strife",
              "-w4f", "hdrip", "-speranzah", "dlmux", "-crooks", "-aaf", "crazy4tv.com", "-yfn", "-batv", "[eztv]", "-snd", ".internal", "-doesntsuck",
              "-nby", "[moviezplanet.in]", "-ffn", "-klingon", ".proper", "-uav", "-psa", "2ch", "-qman", "[utr]", "-rnc", "-orenji", "-megusta", "-deflate",
              ".convert", "giuseppetnt", "-sneaky", "-convoy", "-plutonium", "dd5.1", '-avs', "[cttv]", "[cap.109]", "[subtitles included]", "[ethd]", "h264",
              "-fum", "-rarbg", "-jah", "-rtn", "-jitb", ".0.", "-bs", "-avs", "webrip", "aac2", "-btw", ".web", "[srigga]", "counter.co", "www.scenetime.com",
              "[utr]", "-qman", "[ www.day.com ]", "[no-rar]", "-momentum", "(eng sub)", "-kings", "temporada", "[publichd]", "www.Torrenting.com",
              "www.torrenting.com", "www.torrenting.me", "www.ing.com", "www.com", "www.SceneTime.com", "x265", "X265", "720p", "1080p", "2160p", "web-dl", "downloaded",
              "HEVC", "torrenting", "torrent", "[rarbg]", "hdtv", "pseudo", "265", ".0264", "x264", "h.264", "ettv", "\[prime\]", "[brassetv]", "-dimension", "-robots",
              "-killers", "-sva", "-tbs", "-brisk", "-morose", "-ntb", "-ntb", "-fleet", "-[]", "[]", '-()', '()', '{}', "[ ]", "( )", "{ }", "www", "glodls", ".hdr.", "-bae",
              "[Mulvacoded]", "[Mulvacoded", "complete", "[mulvacoded", "-got", "dd+", "-trollhd", "day.com ]", "thebiscuitman]", ".ita", ".eng", "-linkle",
              ".mux", "[www.ourrelease.org]", "www.ourrelease.org]", "ourrelease.org]", "[i_c", "dd51", "bluury", "~{king}", "~{king", "2160p.h", "web 2.0", "- ime",
              "[cap", "couch.com]", "[n1c]", "[n1c", "-sfm", "[tgx", "-300mb", "-smurf", "-wiki", ".hmax", "- web", "-roccat", "-MeGust", "-ion10", "-ctrlhd",
              "ita eng spa subs", "( )", "byme7alh", ".atmos", "-nixon", "-afg", "tv2nite", "/screens", "- AMZN", "Web-DL", "-ftp", "-sdcc", "-hillary", "-darkflix",
              "-starz", "-afi", "-dexterous", "-failed", "-ligate", "-amcon", "-ntg", "-mrn", "[SEV]", "-worldmkv", "psyz", " -eccentricone", "-skedaddle", 
              "e goki", "- goki", "[taoe]", "2.0 phun", "-spamtv", "-tommy", "-nyh", "-tepes", "web qman", "web e 2.0", "-esc", "vyndros", "-ghosts", "-tdr", "p264", " multi w",
              "-peculate", "-videohole", "-oldseasons", "web dl", "dsnyp e", "2160p joy", "-plzproper", "-walt", "-dimepiece", "-b2b", "-walmart", "-dvsux", 
              "e--", "e-+", "e++", "-syncopy", "-ctrlhd", "web -t", "-cryptic", "-playweb", ".2-.", "-insidious", "-inspirit", "-tvslices", "-clockwork", ".dcuripp",
              "-blutonium", "8bit", "s95 joy", "rippx", "riphlgp-bl", "burntodisc", "( web", "-doosh", "2-doosh", " - ", "multi-sh0w", "-sh0w", "(.web", "(.yogi", 
              "-met", "crazzyboy", ".stan.", ".ainz", "an0mal1", "rzerox", ".nf.", "-stb", "375mb", "350mb", "-coo7", "-t6d", "e-subs", "multisub", "[.io]",
              'COMANDOTORRENTS', 'p-cmrg', "-greenblade", ".anoxmous", ".tigole", "Featurettes", "-truffle", "-daa", "-teneighty", "dts-jyk", "-jyk", ".idx", "..joy",
              "(.silence", "[7.1]", ".7.1", "yts.mx", "-hazmatt", ".ch.", ".ch", "[4k]", "[4k", "-rovers", "usabit.com", "en-sub", "rissy.teigen", ".4k.",
              "iprip", "2-dri", "bdrip", "dts-hd", "yify", "subidn_crew", "bitita", "-nahom", "dvdrip", "xvid", "-lena", "yts.lt", "-legi0n", "etrg", 
              "truehd", "1920x792", "1920x1080", "1920x802", "1920x798", "1920x800", "animatix", "-kg.", ".ma.", "-ika",  ".[.hdr", "multi.", "uhd.", "-ddr",
              "wman-lord", "hdr", "c4k", "-aoc", "uhd", ".udun", "HEVC", "-CMRG", "HMAX", "Atmos", "WEB-DL", "DDP5.1", ".p.", "atvpp", "nfripp", "hd4u", "9.cz", 
              "hindi", "-lishlian", "multi-subs", "-mp4", ".mp4.", "highcode", "dts", "1920x1036", "-mrcs", "mkvcage", ".hc.", "moviesbyrizzo", "divx", 
              "[mw]", "hindi.2.0english", "[mw", "(-)", ".audio.", ".nvenc", "-girays", ".french.", "1920x1040", "uniongang", ".d.", "-fgt", "20x816.", ".c.",
              "2audio", "-sparks", ".20.", ".[7.1", "playnow-", ".-1.", ".ee.", ".bg.", ".ltt.", ".br.", ".vfq.", ".vff.", ".t0m.", ".s.", "mp4cc", "-galaxyrg", 
              "1400mb", ".norwegian", "f21.", ".720.", ".public.", ".(2020", ]

char_excl = ['.', ',', ':', ';', '-', '[', ']', '(', ')', '{', '}', '+']


def ensure_file_extension(name):
    extensions = ['mkv', 'avi', 'mp4',' nfo', 'srt']
    renamed_name = name
    for ext in extensions:
        if renamed_name[len(renamed_name)-3:] == ext and not renamed_name[len(renamed_name)-4] == '.':
            renamed_name = renamed_name.replace(ext, ".{0}".format(ext))
    return renamed_name


def replace_words(name):
    renamed_name = name
    for el in strip_list:
        el = el.lower()
        while el in renamed_name.lower():
            renamed_name = renamed_name.lower().replace(el, '')
    return renamed_name


def replace_chars(name):
    renamed_name = name.replace('..', '.').replace("'s", "s").replace(
        '  ', ' ').replace(".-.", ".").replace(".+.", ".").replace(" ", ".")
    if len(renamed_name) == 0:
        return name
    while len(renamed_name) > 4 and renamed_name[0] in char_excl:
        renamed_name = renamed_name[1:]
    while len(renamed_name) > 4 and renamed_name[len(renamed_name)-1] in char_excl:
        renamed_name = renamed_name[0:len(renamed_name)-1]
    return renamed_name

def rename_files(path):
    for root, dirs, files in os.walk(path, topdown=True):
        for name in files:
            path_name = os.path.join(root, name)
            if ".txt" in path_name:
                continue
            if '.part' in path_name:
                continue

            renamed_name = name.lower()
            renamed_name = replace_words(renamed_name)
            renamed_name = replace_chars(renamed_name)
            renamed_name = ensure_file_extension(renamed_name)
            if len(renamed_name) > 4 and renamed_name != name and renamed_name[len(renamed_name)-2] != '~':
                try:
                    print("moving file", path_name, " to ",
                          os.path.join(root, renamed_name))
                    os.rename(path_name, os.path.join(root, renamed_name))
                except Exception as e:
                    print("failed moving file", path_name)
                    print(e)

def rename_dirs(path):
    for root, dirs, files in os.walk(path, topdown=True):
        for name in dirs:
            path_name = os.path.join(root, name)

            if ".txt" in path_name:
                continue
            if '.part' in path_name:
                continue

            if not os.path.isdir(path_name):
                continue

            inner_files = os.listdir(path_name)

            skip_dir = False
            for inner_file in inner_files:
                if '.part' in inner_file:
                    skip_dir = True
                if skip_dir:
                    continue

            renamed_name = name.lower()
            renamed_name = replace_words(renamed_name)
            renamed_name = replace_chars(renamed_name)

            if len(renamed_name) > 4 and renamed_name != name and renamed_name[len(renamed_name)-2] != '~':
                try:
                    print("moving dir", path_name, " to ",
                          os.path.join(root, renamed_name))
                    os.rename(path_name, os.path.join(root, renamed_name))
                except Exception as e:
                    print("failed moving", path_name)
                    print(e)


def rename(path):
    rename_dirs(path)
    rename_files(path)
