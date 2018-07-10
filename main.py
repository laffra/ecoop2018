# Copyright 2016 Chris Laffa
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import jinja2
import logging
import os
import webapp2

from google.appengine.api import urlfetch
from google.appengine.ext import ndb

ICAL_URL = "https://conf.researchr.org/iCalService/ecoop-issta-2018/890fcfe3-0ead-4b86-954d-8950a325bd27/event-calendar.ics?nocache"

EVENTS = []
LAST_CHECK = 0

class MainPage(webapp2.RequestHandler):
    def get(self):
        template = jinja_environment.get_template('index.html')
        self.response.out.write(template.render({'url': ICAL_URL}));

class FetchPage(webapp2.RequestHandler):
    def get(self):
        try:
            result = urlfetch.fetch(self.request.get("url"))
            if result.status_code == 200:
                self.response.write(result.content)
            else:
                self.response.status_code = result.status_code
        except urlfetch.Error:
            logging.exception('Caught exception fetching url')


jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))


app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/ical', FetchPage),
], debug=True)
