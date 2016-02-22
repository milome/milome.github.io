#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

AUTHOR = u'Hualin'
SITENAME = u"Hualin's Geek way"
SITEURL = 'http://www.hualinluan.com'
SITESUBTITLE = 'Keep Going, Keep Shark.'

# can be useful in development, but set to False when you're ready to publish
RELATIVE_URLS = False 

REVERSE_CATEGORY_ORDER = True

TRANSLATION_FEED_ATOM = 'feeds/all-%s.atom.xml'

PATH = 'content'

TIMEZONE = 'Asia/Shanghai'

DEFAULT_LANG = u'zh'
DEFAULT_DATE_FORMAT = '%Y-%m-%d'

LANDING_PAGE_ABOUT = {
'details': """Welcom to my blog! You can find information about me <a href="http://hualinluan.com/pages/about">here</a>."""}


#INDEX_SAVE_AS = 'blog_index.html'

DEFAULT_PAGINATION = 5


THEME = 'pelican-themes/pelican-elegant-master'
DISQUS_SITENAME = 'hualinsgeekway'

# add for pelican-twitchy theme
RECENT_POST_COUNT = 5
# Must be commented for elegant theme, otherwise will report error "We were unable to load Disqus."
#DISQUS_LOAD_LATER = True
SHARE = True
#menu
DISPLAY_RECENT_POSTS_ON_MENU = True
DISPLAY_CATEGORIES_ON_MENU = False 
DISPLAY_PAGES_ON_MENU = True
DISPLAY_TAGS_ON_MENU = True
EXPAND_LATEST_ON_INDEX = True

#tag cloud
TAG_CLOUD_STEPS = 3
TAG_CLOUD_MAX_ITEMS = 20
# End of pelican-twitchy

# add for four theme
FOUNDATION_ALTERNATE_FONTS = True
ARTICLE_URL = 'articles/{date:%Y}/{date:%m}/{date:%d}/{slug}/'
ARTICLE_SAVE_AS = 'articles/{date:%Y}/{date:%m}/{date:%d}/{slug}/index.html'

CATEGORIES_URL = 'categories.html'
CATEGORIES_SAVE_AS = 'categories.html'

TAGS_URL = 'tags.html'
TAGS_SAVE_AS = 'tags.html'

ARCHIVES_URL = 'archives.html'
ARCHIVES_SAVE_AS = 'archives.html'
YEAR_ARCHIVE_SAVE_AS = 'posts/{date:%Y}/index.html'
MONTH_ARCHIVE_SAVE_AS = 'posts/{date:%Y}/{date:%b}/index.html'

AUTHORS_URL = 'functions/authors.html'
AUTHORS_SAVE_AS = 'functions/authors.html'

PAGE_URL = 'pages/{slug}/'
PAGE_SAVE_AS = 'pages/{slug}/index.html'

STATIC_PATHS = [
	'images', 
	'extra/CNAME',
	'extra/robots.txt',
	]
EXTRA_PATH_METADATA = {
	'extra/CNAME': {'path': 'CNAME'},
	'extra/robots.txt': {'path': 'robots.txt'},
	}

DIRECT_TEMPLATES = (('index','tags', 'categories', 'archives','search'))
#DELETE_OUTPUT_DIRECTORY = False

#DISPLAY_CATEGORIES_ON_MENU = False 

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = 'feeds/all.atom.xml'
FEED_ATOM = 'feeds/atom.xml'
FEED_RSS = 'feeds/rss.xml'
FEED_ALL_RSS = 'feeds/all.rss.xml'
CATEGORY_FEED_RSS = 'feeds/%s.rss.xml'
TAG_FEED_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None

MENUITEMS = (
    ('About', '/pages/About/about.html'),
    ('RSS', '/feeds/rss.xml'),    
   # ('Search','/search.html'),
   # ('Archives', '/archives.html'),    
)

# MarkDown extension for code highlight
MD_EXTENSIONS = [
        "extra",
        "toc",
        "headerid",
        "meta",
        "sane_lists",
        "smarty",
        "wikilinks",
        "admonition",
        "codehilite(guess_lang=False,pygments_style=emacs,noclasses=True)"]

# plugins
PLUGIN_PATHS = ["pelican-plugins"]
PLUGINS = ['summary','sitemap','random_article','neighbors','global_license','tag_cloud','footer_insert','liquid_tags','tipue_search']
# configure the sitemap
SITEMAP = {
    'format': 'xml',
    'priorities': {
        'articles': 0.7,
        'indexes': 0.5,
        'pages': 0.5
    },
    'changefreqs': {
        'articles': 'monthly',
        'indexes': 'daily',
        'pages': 'monthly'
    }
}


# Blogroll
LINKS = (('Pelican', 'http://getpelican.com/'),
         ('Python.org', 'http://python.org/'),
         ('Jinja2', 'http://jinja.pocoo.org/'),
         ('You can modify those links in your config file', '#'),)

# Social widget
SOCIAL = (('GitHub', 'https://github.com/milome'),
          ('Twitter', 'https://twitter.com/hualinlu'),)

RANDOM = 'functions/random.html'
SITE_LICENSE = 'Hualin\'s Geek way© hualinluan 2016'
# foobar will not be used, because it's not in caps. All configuration keys
# have to be in caps
