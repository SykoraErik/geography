# -*- coding: utf-8 -*-
from django.utils.translation import ugettext as _
from django.utils import simplejson
from geography.utils import JsonResponse
from logging import getLogger
from django.core.mail import send_mail


LOGGER = getLogger(__name__)


def feedback(request):
    if request.body:
        feedback = simplejson.loads(request.body)
        mail_text = ('## This email is sent from the feedback form on the site. ##\n\n' +
                     feedback['text'] + '\n' +
                     '\n\n## end of user message ##\n' +
                     '\nemail: ' + feedback['email'] +
                     '\nuser_id: ' + str(request.user.id) +
                     '\nusername: ' + request.user.username +
                     '\npage: ' + feedback['page'] +
                     '\nuser agent: ' + feedback['user_agent'])
        send_mail('slepemapy.cz feedback',
                  mail_text,
                  'feedback@slepemapy.cz',
                  ['slepemapy@googlegroups.com'],
                  fail_silently=False)
        LOGGER.debug("email sent %s\n", mail_text)
        response = {
            'type': 'success',
            'msg': _('Feedback confirmed'),
        }
    return JsonResponse(response)