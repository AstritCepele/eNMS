from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore


class Config(object):
    # SQL Alchemy
    SQLALCHEMY_DATABASE_URI = 'sqlite:///database.db?check_same_thread=False'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # AP Scheduler
    JOBS = []
    SCHEDULER_JOBSTORES = {
        'default': SQLAlchemyJobStore(url='sqlite:///flask_context.db')
    }
    SCHEDULER_API_ENABLED = True
    SCHEDULER_EXECUTORS = {
        'default': {
            'type': 'threadpool',
            'max_workers': 500
        }
    }


class ProductionConfig(Config):
    DEBUG = False
    SECRET_KEY = 'change-me'


class DebugConfig(Config):
    DEBUG = True
    SECRET_KEY = 'key'


class SeleniumConfig(Config):
    DEBUG = True
    TESTING = True
    LOGIN_DISABLED = True
    SECRET_KEY = 'key'


config_dict = {
    'Production': ProductionConfig,
    'Debug': DebugConfig,
    'Selenium': SeleniumConfig
}
