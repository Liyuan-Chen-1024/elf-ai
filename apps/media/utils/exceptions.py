class EpguidesException(Exception):
    pass

class ShowNotFoundException(EpguidesException):
    pass

class EpisodeNotFoundException(EpguidesException):
    pass

class SeasonNotFoundException(EpguidesException):
    pass
